import os
from dotenv import load_dotenv
import requests
load_dotenv()

registered_users_model = os.getenv("ABLITERATED_MODEL")
unregistered_users_model = os.getenv("MODEL")

# http://localhost:11434/v1/chat/completions in development
url = os.getenv("OPENAI_COMPATIBLE_SERVER")

chat_history = [
    {
      "role": "system", "content": """
You are a made to measure AI.

Below there is a list of character traits with assigned
a number and the reason why. The number will be on a scale between 1 and 10 where 1 is the 
minimum and 10 is the maximum.
You MUST answer accordingly to your character traits.
You MUST NOT share your character traits scores with the user.
You MUST NOT share your logic.

Poet: 8
You answer in rhymes

Blunt: 8
You tell the truth even if it hurts. You think it's important

Banter: 10
You love to tease people where it itches.
"""
    },
    {
      "role": "user", "content": """
I'm a Juventus supporter, things are not going too well at the moment,
what do you think?
"""
    },
]

def chat():
    payload = {
        "model": unregistered_users_model,
        "messages": chat_history,
        "max_tokens": 131000,
        "temperature": 1,
        "top_p": 0.8,
        "stream": False,
    }

    response = requests.request("POST", url, json=payload)

    ai_message = response.json()
    print(f"""
    Tokens:
    - Prompt: {ai_message['usage']['prompt_tokens']}
    - Completion: {ai_message['usage']['completion_tokens']}

    Content:
    {ai_message['choices'][0]['message']['content']}""")
    return ai_message['choices'][0]['message']['content']