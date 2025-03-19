import os
import requests
from werkzeug.utils import secure_filename
from custom_assistant import ALLOWED_EXTENSIONS, UPLOAD_FOLDER, app, db
from custom_assistant.models import BackgroundIngestionTask


def get_proprietary_hardware_status() -> bool:
    """Utility method toi check the proprietary hardware status

    Returns:
        bool, bool: chat server status and embedding server status
    """
    url = f'{os.getenv("PROPRIETARY_HARDWARE_URL")}/inference_server_status'
    chat_server = False
    embedding_server = False
    try:
        response = requests.get(url)
        res = response.json()
        return res["chat_server"], res["embedding_server"]
    except:
        return chat_server, embedding_server


def allowed_file(filename):
    """Method to check if a file can be uploaded

    Args:
        filename (str): the fhe name of the file

    Returns:
        bool: true or false
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def save_file(request, user_id):
    """Method to save the file the user is uploading

    Args:
        request (flask.request): the flask request
        user_id (int): the user id

    Returns:
        bool, str | None: True and the filename if successfull
        False and None if not
    """
    # check if the post request has the file part
    if 'file_input' not in request.files:
        print('No file part')
        return False, None
    file = request.files['file_input']
    # If the user does not select a file, the browser submits an
    # empty file without a filename.
    if file.filename == '':
        print('No selected file')
        return False, None
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        print(filename)
        save_path = f"{UPLOAD_FOLDER}/{user_id}"
        if not os.path.exists(save_path):
            os.makedirs(save_path)
        file.save(f"{save_path}/{filename}")
        return True, filename
    else:
        return False, None


def proprietary_hardware_data_ingestion(task_id):
    chat_server, embedding_server = get_proprietary_hardware_status()
    result_id = None
    if not embedding_server:
        return {
            "status": 500,
            "result_id": result_id
        }
    url = f"{os.getenv('PROPRIETARY_HARDWARE_URL')}/ingest_data"
    response = requests.post(url=url, json={
        "task_id": task_id,
        "secret_key": os.getenv("PROPRIETARY_HARDWARE_SECRET_KEY")
    })
    data = response.json()
    print(f"--------------- {data}")
    if data['status'] == 200:
        result_id = data["result_id"]
        return {
            "status": data["status"],
            "result_id": result_id
            }
    else:
        return {
            "status": data["status"],
            "error": data["error"]
        }