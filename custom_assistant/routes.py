from flask import make_response, request
from celery.result import AsyncResult
from custom_assistant import app, db
from custom_assistant.inference import chat
from custom_assistant.models import User
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

@app.post("/create_user")
def create_user():
    """Route to create a user

    Returns:
        json: user id if successfull, missing data if not
    """
    google_id = request.form.get("google-id", None)
    email = request.form.get("email", None)
    missing_google_id = True
    missing_password = True
    missing_email = True
    user = None
    if google_id is not None:
        user = User(google_id=google_id).sign_up_with_google(
            request.form.get("password", None), email=email
        )
        missing_google_id = False
    else:
        if email is not None:
            missing_email = False
            user = User(email=email).sign_up_with_email(
                request.form.get("password", None)
            )
    if request.form.get("password", None) is not None:
        missing_password = False
    if user is not None:
        db.session.add(user)
        db.session.commit()
        return {"user_id": user.id, "status": 200}
    else:
        return {
            "status": 400,
            "google_id": not missing_google_id,
            "password": not missing_password,
            "email": not missing_email
            }