## Celery and background tasks - [DOCS](https://docs.celeryq.dev/en/stable/)
Using 1% of celery capabilities, needed to let the user have a quick response when adding a source to a collection.
It uses Redis as a key-value pair server to share tasks between the main app and the workers set.
[Official documentation Celery with Redis](https://docs.celeryq.dev/en/stable/getting-started/backends-and-brokers/redis.html#broker-redis)
I have shared only two methods between the apps and the worker.


### The retry method from worker.tasks
```python
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
```
Responsibile for retrying to contact the proprietary hardware server to pass the data which it needs to ingest.

### The ingest method from proprietary_hardware.tasks
```python
@proprietary_celery.task
def ingest_data(collection_id, source_id, user_id):
    return ingest(collection_id, source_id, user_id)
```
Which will be called directly when the server is up, from the retry method when it goes down.

Depending on how big the PDF is, it could take more than a couple of minutes. A 195 page PDF size, 15Mb, took about 20 minutes using only cpu, about 4 using gpu. Deployed on a free tier huggingface spaces it took almost 5 hours...
It was necessary to give the user a response well before the minimum of 4 minutes. From there the idea to start a new thread and notify the user with an email when the file is ingested.
