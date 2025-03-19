import os
from flask import request
from celery.result import AsyncResult
from sqlalchemy.exc import OperationalError
from proprietary_hardware.utils import get_proprietary_hardware_status
from proprietary_hardware import app, db
from proprietary_hardware.tasks import ingest_data, proprietary_celery, add
from proprietary_hardware.models import (
    BackgroundIngestionTask,
     Collection
)
from proprietary_hardware.utils import is_gpu_embedding_model_available
from proprietary_hardware.vectorstore import query_with_retriever


# Test routes

@app.get("/result/<id>")
def task_result(id: str) -> dict[str, object]:
    result = AsyncResult(id, app=proprietary_celery)
    return {
        "ready": result.ready(),
        "successful": result.successful(),
        "value": result.result if result.ready() else None,
    }


@app.post("/add")
def start_add() -> dict[str, object]:
    a = request.form.get("a", type=int)
    b = request.form.get("b", type=int)
    try:
        result = add.delay(a, b)
    except:
        return {"error": "ERROR!"}
    return {"result_id": result.id}


@app.errorhandler(404)
def page_not_found(e):
    return {
        "page": "not found",
        "status": "404"
    }


# WEB API


@app.get("/inference_server_status")
def status():
    """Route to get the inference server status

    Returns:
        dict: the status of the server
    """
    embedding_server = False
    chat_server = False
    try:
        gpu_status = is_gpu_embedding_model_available()
        embedding_server = True
        status = 200
    except:
        gpu_status = False
        status = 500
    chat_server = get_proprietary_hardware_status()
        
    return {
        "status": status,
        "gpu_status": gpu_status,
        "embedding_server": embedding_server,
        "chat_server": chat_server
    }


@app.post("/ingest_data")
def ingest():
    """Route to ingest a document into a chroma db collection

    Returns:
        dict: status and message/error
    """
    print(request.json)
    if request.json.get("secret_key") == os.getenv("APP_SECRET_KEY"):
        task_id = request.json.get("task_id")
        try:
            task = db.session.get(BackgroundIngestionTask, task_id)
            collection = db.session.get(Collection, task.collection_id)
            result = ingest_data.delay(
                task.collection_id,
                task.source_id,
                collection.user_id
            )
            task.proprietary_task_id = result.id
            db.session.add(task)
            db.session.commit()
        except OperationalError as e:
            print(f"Operational error: {e} - Retrying...")
            try:
                task = db.session.get(BackgroundIngestionTask, task_id)
                collection = db.session.get(Collection, task.collection_id)
                result = ingest_data.delay(
                    task.collection_id,
                    task.source_id,
                    collection.user_id
                )
                task.proprietary_task_id = result.id
                db.session.add(task)
                db.session.commit()
            except Exception as e:
                {"status": 500, "error": e}
        return {
            "status": 200,
            "message" : f"Started job {result.id} for task {task.id}"}
    else:
        return {"status": 403}
    

@app.post("/query")
def query():
    """Method to query the documents ingested in a collection with a question

    Returns:
        _type_: _description_
    """
    try:
        collection = db.session.get(
            Collection, request.form.get("collection_id")
        )
    except OperationalError as e:
        print(f"Operational error: {e} - Retrying")
        try:
            collection = db.session.get(
                Collection, request.form.get("collection_id")
            )
        except OperationalError as e:
            return {
                "status": 500,
                "error": e
            }
    return {
        "status": 200,
        "message": query_with_retriever(
            question=request.form.get("question"),
            collection=collection.collection_name,
            user_id=collection.user_id
        )
    }
    
    
        