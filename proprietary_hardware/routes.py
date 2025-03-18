import os
from flask import request
from celery.result import AsyncResult
from proprietary_hardware.utils import get_proprietary_hardware_status
from proprietary_hardware import app, db
from proprietary_hardware.tasks import proprietary_celery, add
from proprietary_hardware.models import (
    User,
)
from proprietary_hardware.utils import is_gpu_embedding_model_available


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
    
    
        