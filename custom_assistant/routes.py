from flask import request
from celery.result import AsyncResult
from custom_assistant import app
from custom_assistant.inference import chat
from custom_assistant.tasks import celery, add

# Test routes

@app.get("/result/<id>")
def task_result(id: str) -> dict[str, object]:
    result = AsyncResult(id, app=celery)
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


@app.get("/chat")
def bot_answer() -> dict[str, str]:
    return {"message": chat()}


@app.errorhandler(404)
def page_not_found(e):
    return {
        "page": "not found",
        "status": "404"
    }