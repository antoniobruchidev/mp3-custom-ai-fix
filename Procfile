web: gunicorn app:app
worker: celery -A worker.tasks worker --loglevel=INFO