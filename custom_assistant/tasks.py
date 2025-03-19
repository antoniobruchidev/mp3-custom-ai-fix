import datetime
import time
from celery import Celery
import os
from dotenv import load_dotenv

from custom_assistant.utils import proprietary_hardware_data_ingestion

load_dotenv()

celery = Celery('tasks')
celery.config_from_object('custom_assistant.celeryconfig', namespace='CELERY')

@celery.task
def add(a, b):
    return a + b

@celery.task
def retry(task_id):
    result_id = None
    while result_id is None:
        time.sleep(1200)
        result = proprietary_hardware_data_ingestion(task_id)
        if result["status"] == 200:
            result_id = result["result_id"]
    return {
        "task_id": task_id,
        "started_at": datetime.datetime.now().isoformat(),
        "job_id": result_id
    }