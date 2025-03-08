from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv()

celery = Celery('tasks')
celery.config_from_object('custom_assistant.celeryconfig', namespace='CELERY')

@celery.task
def add(a, b):
    return a + b