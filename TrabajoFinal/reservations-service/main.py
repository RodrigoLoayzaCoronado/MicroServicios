from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import psycopg2
import jwt
import requests
import pika
from datetime import datetime
import logging
from logging.config import dictConfig
import json

# Configuración avanzada de logging
dictConfig({
    "version": 1,
    "formatters": {
        "json": {
            "format": "%(asctime)s %(levelname)s %(message)s",
            "class": "pythonjsonlogger.jsonlogger.JsonFormatter"
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
            "stream": "ext://sys.stdout"
        }
    },
    "root": {
        "level": "INFO",
        "handlers": ["console"]
    }
})

logger = logging.getLogger(__name__)
load_dotenv()

app = FastAPI()

# Configuración de la base de datos
def get_db_connection():
    conn = psycopg2.connect(
        host=os.getenv("POSTGRES_HOST"),
        database=os.getenv("POSTGRES_DB"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD")
    )
    return conn

# Configuración de autenticación
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL")

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, os.getenv("JWT_SECRET"), algorithms=["HS256"])
        response = requests.get(f"{AUTH_SERVICE_URL}/auth/profile", headers={"Authorization": f"Bearer {token}"})
        if response.status_code != 200:
            logger.warning("Token inválido - Fallo al validar perfil")
            raise HTTPException(status_code=401, detail="Invalid token")
        return payload
    except Exception as e:
        logger.error(f"Error validando token: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")

# Modelos
class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    date: str  # YYYY-MM-DD
    time: str  # HH:MM

class Appointment(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    date: str
    time: str
    status: str

class NotificationMessage(BaseModel):
    user_id: int
    message_type: str  # APPOINTMENT_CREATED, APPOINTMENT_CANCELLED
    content: str
    appointment_id: int
    timestamp: str = None

# Configuración de RabbitMQ
def get_rabbitmq_channel():
    try:
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(
                host=os.getenv("RABBITMQ_HOST"),
                heartbeat=600,
                blocked_connection_timeout=300
            )
        )
        channel = connection.channel()
        channel.queue_declare(queue='notifications', durable=True)
        return channel, connection
    except Exception as e:
        logger.error(f"Error conectando a RabbitMQ: {str(e)}")
        raise

def send_notification(channel, notification: NotificationMessage):
    try:
        notification.timestamp = datetime.utcnow().isoformat()
        channel.basic_publish(
            exchange='',
            routing_key='notifications',
            body=notification.json().encode('utf-8'),
            properties=pika.BasicProperties(
                delivery_mode=2,  # Make message persistent
                content_type='application/json'
            )
        )
        logger.info(f"Notificación enviada: {notification.json()}")
    except Exception as e:
        logger.error(f"Error enviando notificación: {str(e)}")
        raise

# Endpoints
@app.get("/")
async def read_root():
    return {"message": "Reservations Service is running"}

@app.post("/appointments", response_model=Appointment)
async def create_appointment(appointment: AppointmentCreate, user: dict = Depends(get_current_user)):
    if user.get("role") not in ["paciente", "admin"]:
        logger.warning(f"Intento de creación de cita no autorizado por usuario {user.get('id')}")
        raise HTTPException(status_code=403, detail="Permission denied")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Verificar disponibilidad del médico (implementar según necesidades)
        cursor.execute(
            "INSERT INTO appointments (patient_id, doctor_id, date, time, status) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (appointment.patient_id, appointment.doctor_id, appointment.date, appointment.time, "confirmed")
        )
        appointment_id = cursor.fetchone()[0]
        conn.commit()

        # Notificación al paciente
        patient_notification = NotificationMessage(
            user_id=appointment.patient_id,
            message_type="APPOINTMENT_CREATED",
            content=f"Cita confirmada con el médico para el {appointment.date} a las {appointment.time}",
            appointment_id=appointment_id
        )

        # Notificación al médico
        doctor_notification = NotificationMessage(
            user_id=appointment.doctor_id,
            message_type="APPOINTMENT_CREATED",
            content=f"Nueva cita con paciente para el {appointment.date} a las {appointment.time}",
            appointment_id=appointment_id
        )

        # Enviar notificaciones
        channel, connection = get_rabbitmq_channel()
        send_notification(channel, patient_notification)
        send_notification(channel, doctor_notification)
        connection.close()

        logger.info(f"Cita creada exitosamente: {appointment_id}")
        return Appointment(id=appointment_id, **appointment.dict(), status="confirmed")
    except Exception as e:
        conn.rollback()
        logger.error(f"Error creando cita: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/appointments/patient/{patient_id}", response_model=list[Appointment])
async def get_patient_appointments(patient_id: int, user: dict = Depends(get_current_user)):
    if user.get("role") not in ["paciente", "admin"] or user.get("id") != patient_id:
        logger.warning(f"Intento de acceso no autorizado a citas del paciente {patient_id}")
        raise HTTPException(status_code=403, detail="Permission denied")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT id, patient_id, doctor_id, date, time, status FROM appointments WHERE patient_id = %s",
            (patient_id,)
        )
        rows = cursor.fetchall()
        appointments = [
            Appointment(
                id=row[0],
                patient_id=row[1],
                doctor_id=row[2],
                date=row[3].isoformat(),
                time=row[4].isoformat(),
                status=row[5]
            ) for row in rows
        ]
        logger.info(f"Consultadas {len(appointments)} citas para paciente {patient_id}")
        return appointments
    except Exception as e:
        logger.error(f"Error obteniendo citas del paciente: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/appointments/doctor/{doctor_id}", response_model=list[Appointment])
async def get_doctor_appointments(doctor_id: int, user: dict = Depends(get_current_user)):
    if user.get("role") not in ["medico", "admin"] or (user.get("role") == "medico" and user.get("id") != doctor_id):
        logger.warning(f"Intento de acceso no autorizado a citas del médico {doctor_id}")
        raise HTTPException(status_code=403, detail="Permission denied")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT id, patient_id, doctor_id, date, time, status FROM appointments WHERE doctor_id = %s",
            (doctor_id,)
        )
        rows = cursor.fetchall()
        appointments = [
            Appointment(
                id=row[0],
                patient_id=row[1],
                doctor_id=row[2],
                date=row[3].isoformat(),
                time=row[4].isoformat(),
                status=row[5]
            ) for row in rows
        ]
        logger.info(f"Consultadas {len(appointments)} citas para médico {doctor_id}")
        return appointments
    except Exception as e:
        logger.error(f"Error obteniendo citas del médico: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.delete("/appointments/{appointment_id}")
async def cancel_appointment(appointment_id: int, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT patient_id, doctor_id, date, time FROM appointments WHERE id = %s",
            (appointment_id,)
        )
        appointment = cursor.fetchone()
        if not appointment:
            logger.warning(f"Intento de cancelar cita inexistente: {appointment_id}")
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        patient_id, doctor_id, date, time = appointment

        # Verificar permisos
        if user.get("role") not in ["paciente", "medico", "admin"] or \
           (user.get("role") == "paciente" and user.get("id") != patient_id) or \
           (user.get("role") == "medico" and user.get("id") != doctor_id):
            logger.warning(f"Intento de cancelación no autorizada de cita {appointment_id}")
            raise HTTPException(status_code=403, detail="Permission denied")

        cursor.execute(
            "UPDATE appointments SET status = %s WHERE id = %s",
            ("cancelled", appointment_id)
        )
        conn.commit()

        # Determinar quién cancela
        cancelled_by = "paciente" if user.get("role") == "paciente" else "médico"

        # Notificación al paciente
        patient_notification = NotificationMessage(
            user_id=patient_id,
            message_type="APPOINTMENT_CANCELLED",
            content=f"Su cita para el {date} a las {time} ha sido cancelada por el {cancelled_by}",
            appointment_id=appointment_id
        )

        # Notificación al médico
        doctor_notification = NotificationMessage(
            user_id=doctor_id,
            message_type="APPOINTMENT_CANCELLED",
            content=f"Cita del {date} a las {time} cancelada por {cancelled_by}",
            appointment_id=appointment_id
        )

        # Enviar notificaciones
        channel, connection = get_rabbitmq_channel()
        send_notification(channel, patient_notification)
        send_notification(channel, doctor_notification)
        connection.close()

        logger.info(f"Cita {appointment_id} cancelada exitosamente por {user.get('id')}")
        return {"message": "Appointment cancelled successfully"}
    except Exception as e:
        conn.rollback()
        logger.error(f"Error cancelando cita: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# Health check endpoint
@app.get("/health")
async def health_check():
    try:
        # Verificar conexión a PostgreSQL
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()
        
        # Verificar conexión a RabbitMQ
        channel, connection = get_rabbitmq_channel()
        connection.close()
        
        return {"status": "OK", "database": "connected", "rabbitmq": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail=str(e))