web: gunicorn app:app
worker: celery -A custom_assistant.tasks worker --loglevel=INFO