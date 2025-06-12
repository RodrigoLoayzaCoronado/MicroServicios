from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import psycopg2
import jwt
import requests
import pika

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
            raise HTTPException(status_code=401, detail="Invalid token")
        return payload
    except Exception as e:
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

# Configuración de RabbitMQ
def get_rabbitmq_channel():
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=os.getenv("RABBITMQ_HOST")))
    channel = connection.channel()
    channel.queue_declare(queue='notifications')
    return channel, connection

# Ruta de prueba
@app.get("/")
async def read_root():
    return {"message": "Reservations Service is running"}

@app.post("/appointments", response_model=Appointment)
async def create_appointment(appointment: AppointmentCreate, user: dict = Depends(get_current_user)):
    if user.get("role") not in ["paciente", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO appointments (patient_id, doctor_id, date, time, status) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (appointment.patient_id, appointment.doctor_id, appointment.date, appointment.time, "confirmed")
        )
        id = cursor.fetchone()[0]
        conn.commit()

        # Enviar notificación vía RabbitMQ
        channel, connection = get_rabbitmq_channel()
        channel.basic_publish(
            exchange='',
            routing_key='notifications',
            body=f"New appointment for patient {appointment.patient_id} with doctor {appointment.doctor_id} at {appointment.date} {appointment.time}".encode()
        )
        connection.close()

        return Appointment(id=id, **appointment.dict(), status="confirmed")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/appointments/patient/{patient_id}", response_model=list[Appointment])
async def get_patient_appointments(patient_id: int, user: dict = Depends(get_current_user)):
    if user.get("role") not in ["paciente", "admin"] or user.get("id") != patient_id:
        raise HTTPException(status_code=403, detail="Permission denied")
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, patient_id, doctor_id, date, time, status FROM appointments WHERE patient_id = %s", (patient_id,))
        rows = cursor.fetchall()
        return [Appointment(id=row[0], patient_id=row[1], doctor_id=row[2], date=row[3].isoformat(), time=row[4].isoformat(), status=row[5]) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/appointments/doctor/{doctor_id}", response_model=list[Appointment])
async def get_doctor_appointments(doctor_id: int, user: dict = Depends(get_current_user)):
    if user.get("role") not in ["medico", "admin"] or (user.get("role") == "medico" and user.get("id") != doctor_id):
        raise HTTPException(status_code=403, detail="Permission denied")
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, patient_id, doctor_id, date, time, status FROM appointments WHERE doctor_id = %s", (doctor_id,))
        rows = cursor.fetchall()
        return [Appointment(id=row[0], patient_id=row[1], doctor_id=row[2], date=row[3].isoformat(), time=row[4].isoformat(), status=row[5]) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.delete("/appointments/{appointment_id}")
async def cancel_appointment(appointment_id: int, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT patient_id, doctor_id FROM appointments WHERE id = %s", (appointment_id,))
        appointment = cursor.fetchone()
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        patient_id, doctor_id = appointment

        if user.get("role") not in ["paciente", "medico", "admin"] or (user.get("role") == "paciente" and user.get("id") != patient_id) or (user.get("role") == "medico" and user.get("id") != doctor_id):
            raise HTTPException(status_code=403, detail="Permission denied")

        cursor.execute("UPDATE appointments SET status = %s WHERE id = %s", ("cancelled", appointment_id))
        conn.commit()

        # Enviar notificación vía RabbitMQ
        channel, connection = get_rabbitmq_channel()
        channel.basic_publish(
            exchange='',
            routing_key='notifications',
            body=f"Appointment {appointment_id} cancelled for patient {patient_id}".encode()
        )
        connection.close()

        return {"message": "Appointment cancelled"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()