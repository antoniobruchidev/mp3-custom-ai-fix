import os
import requests


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