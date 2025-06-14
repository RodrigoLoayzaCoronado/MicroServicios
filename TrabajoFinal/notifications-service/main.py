import pika
import os
import requests
from dotenv import load_dotenv
import logging
from datetime import datetime

load_dotenv()

# Configuración de logging
logger = logging.getLogger("notifications-service")
logger.setLevel(logging.INFO)

formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')

file_handler = logging.FileHandler("notifications.log")
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

class LokiHandler(logging.Handler):
    def __init__(self, loki_url='http://loki:3100/loki/api/v1/push'):
        super().__init__()
        self.loki_url = loki_url

    def emit(self, record):
        payload = {
            "streams": [{
                "stream": {"app": "notifications-service", "level": record.levelname},
                "values": [[str(int(datetime.now().timestamp() * 1000000000)), self.format(record)]]
            }]
        }
        try:
            response = requests.post(self.loki_url, json=payload, headers={'Content-Type': 'application/json'})
            response.raise_for_status()
        except Exception as e:
            print(f"Failed to send log to Loki: {e}")

loki_handler = LokiHandler()
logger.addHandler(loki_handler)

# Configuración de RabbitMQ
def callback(ch, method, properties, body):
    message = body.decode()
    logger.info(f"Received notification: {message}")
    try:
        # Simular envío de notificación (reemplaza con una API real si es necesario)
        notification_api_url = os.getenv("NOTIFICATION_API_URL")
        response = requests.post(notification_api_url, json={"message": message})
        if response.status_code == 200:
            logger.info(f"Notification sent successfully: {message}")
        else:
            logger.error(f"Failed to send notification: {response.status_code} - {response.text}")
    except Exception as e:
        logger.error(f"Error processing notification: {str(e)}")
    ch.basic_ack(delivery_tag=method.delivery_tag)

def start_consumer():
    credentials = pika.PlainCredentials('guest', 'guest')
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=os.getenv("RABBITMQ_HOST"), credentials=credentials))
    channel = connection.channel()
    channel.queue_declare(queue='notifications')
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='notifications', on_message_callback=callback)
    logger.info("Waiting for notifications...")
    channel.start_consuming()

if __name__ == "__main__":
    try:
        start_consumer()
    except KeyboardInterrupt:
        logger.info("Shutting down consumer...")
        exit(0)
    except Exception as e:
        logger.error(f"Consumer failed: {str(e)}")
        exit(1)