import datetime
import json
import os
from dotenv import load_dotenv
import requests
from custom_assistant import app
from worker.utils import get_proprietary_hardware_status
from openai import OpenAI

load_dotenv()

client = OpenAI(
		base_url = "https://yhdmpvwfk16e3ory.eu-west-1.aws.endpoints.huggingface.cloud/v1/",
		api_key = os.getenv("HUGGINGFACE_INFERENCE_KEY")
	)

def query_hf_inference_endpoint(message):
    print(message)
    try:
        chat_completion = client.chat.completions.create(
            model="bartowski/Qwen2.5-7B-Instruct-1M-GGUF",
            messages=[
            {
                "role": "user",
                "content": message
            }
        ],
            top_p=None,
            temperature=None,
            max_tokens=150,
            stream=False,
            seed=None,
            stop=None,
            frequency_penalty=None,
            presence_penalty=None
        )
        print(chat_completion.choices[0].message.content)
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(e)
        return None

registered_users_model = os.getenv("QWEN_MODEL")
# http://localhost:11434/v1/chat/completions in development
url = os.getenv("OPENAI_COMPATIBLE_SERVER")

# setting a base system prompt to format later
system_prompt = """
{prompt}

Below there is a list of character traits with assigned
a number and the reason why. The number will be on a scale between 1 and 10 where 1 is the 
minimum and 10 is the maximum.
You MUST answer accordingly to your character traits.
You MUST NOT share your character traits scores with the user.
You MUST NOT share your logic.

{traits}
"""


def chat(
    prompt=None,
    message=None,
    traits="",
    chat_history=None,
    question=None,
    collection_id=None,
):
    """Method to create

    Args:
        prompt (_type_): _description_
        traits (_type_): _description_
        message (_type_): _description_
    """
    response = None
    # redirecting to proprietary query route
    if question is not None and collection_id is not None:
        payload = {"question": question, "collection_id": collection_id}
        retriever_url = f"{url.split('11434')[0]}5001/query"
        response = requests.request("POST", retriever_url, json=payload)
        data = response.json()
        if data["status"] == 200:
            return {"status": 200, "message": data["message"]}
        else:
            return {"status": 400, "error": data["error"]}
    # redirectirect to proprietary chat with history route
    if chat_history is not None:
        payload = {"chat_history": json.dumps(chat_history)}
        ollama_url = f"{url.split('11434')[0]}5001/chat_with_history"
        response = requests.request("POST", ollama_url, json=payload)
        if response.status_code == 200:
            data = response.json()
            return data["message"], data["prompt_tokens"], data["comp_tokens"]
    if prompt is not None and traits != "":
        messages = [
            {
                "role": "system",
                "content": system_prompt.format(prompt=prompt, traits=traits),
            },
            {"role": "user", "content": message},
        ]
    elif prompt is not None and traits == "":
        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": message},
        ]
    payload = {
        "model": registered_users_model,
        "messages": messages,
        "max_tokens": 131000,
        "temperature": 1,
        "top_p": 0.8,
        "stream": False,
    }

    response = requests.request("POST", url, json=payload)
    ai_message = response.json()
    prompt_tokens = ai_message["usage"]["prompt_tokens"]
    completion_tokens = ai_message["usage"]["completion_tokens"]
    answer = ai_message["choices"][0]["message"]["content"]

    return answer, prompt_tokens, completion_tokens


def backup_server_switch():
    timestamp = app.config["PROPRIETARY_HARDWARE_DOWN"]
    chat_server, embedding_server = get_proprietary_hardware_status()
    backup_server_up = True
    if not embedding_server:
        inference_backup_server = query_hf_inference_endpoint("Who are you?")
        backup_server_up = True if inference_backup_server is not None else False
        print(backup_server_up)
        if timestamp == 0:
            app.config["PROPRIETARY_HARDWARE_DOWN"] = (
                datetime.datetime.now().timestamp()
            )
        timestamp = datetime.datetime.fromtimestamp(
            app.config["PROPRIETARY_HARDWARE_DOWN"]
        ).isoformat()
    else:
        app.config["PROPRIETARY_HARDWARE_DOWN"] = 0
    return timestamp, backup_server_up
