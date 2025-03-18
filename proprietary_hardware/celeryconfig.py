import os

name = 'tasks'
broker_url = os.getenv("REDIS_URL")
result_backend = os.getenv("REDIS_URL")
task_serializer = 'json'
result_serializer = 'json'
accept_content = ['json']