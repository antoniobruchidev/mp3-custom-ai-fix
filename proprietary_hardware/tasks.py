from celery import Celery
from dotenv import load_dotenv
from proprietary_hardware.vectorstore import ingest

load_dotenv()

proprietary_celery = Celery("tasks")
proprietary_celery.config_from_object(
    "proprietary_hardware.celeryconfig", namespace="CELERY"
)


@proprietary_celery.task
def add(a, b):
    return a + b


@proprietary_celery.task
def ingest_data(collection_id, source_id, user_id):
    return ingest(collection_id, source_id, user_id)
