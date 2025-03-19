import os

name = 'tasks'
broker_url = os.getenv("REDIS_HEROKU")
result_backend = os.getenv("REDIS_HEROKU")
task_serializer = 'json'
result_serializer = 'json'
accept_content = ['json']