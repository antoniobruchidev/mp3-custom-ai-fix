from celery import Celery
from dotenv import load_dotenv
from proprietary_hardware import db
from proprietary_hardware.models import User

load_dotenv()

proprietary_celery = Celery('tasks')
proprietary_celery.config_from_object('proprietary_hardware.celeryconfig', namespace='CELERY')

@proprietary_celery.task
def add(a, b):
    return a + b
     
    