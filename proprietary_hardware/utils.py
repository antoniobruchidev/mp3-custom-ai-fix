from typing import List
import os
from langchain.embeddings.base import Embeddings
from langchain_ollama import ChatOllama
from langchain_core.messages import AIMessage, SystemMessage, HumanMessage
from sqlalchemy.exc import OperationalError, PendingRollbackError
import requests
from sentence_transformers import SentenceTransformer
import torch
import torch.multiprocessing as mp
from werkzeug.utils import secure_filename
from proprietary_hardware import ALLOWED_EXTENSIONS, UPLOAD_FOLDER, app, db, mail
from proprietary_hardware.models import BackgroundIngestionTask, Collection, Source, User
from flask_mail import Message



def get_proprietary_hardware_status() -> bool:
    """Method to get the chat server status

    Returns:
        bool: the chat server status
    """
    url = os.getenv("OPENAI_COMPATIBLE_SERVER")
    try:
        response = requests.request("GET", url.split("/v1")[0])
        if response.text == "Ollama is running":
            status = True
        else:
            status = False
    except:
        status = False
    return status


# set embedding function for text embeddings
class SentenceTransformersEmbeddingFunction(Embeddings):
    def __init__(self, embedding_model):
        self.model = embedding_model

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self.model.encode(d).tolist() for d in texts]

    def embed_query(self, query: str) -> List[float]:
        return self.model.encode([query])[0].tolist()


def get_embedding_model(use_gpu):
    """Method to get the embedding function

    Args:
        use_gpu (bool): bool to use gpu

    Returns:
        SentencTransformersEmbeddingFunction: initialized function for gpu or cpu
    """
    if use_gpu and bool(int(os.getenv("USE_PROPRIETARY_HARDWARE"))):
        return SentenceTransformersEmbeddingFunction(SentenceTransformer(
            model_name_or_path="intfloat/multilingual-e5-large",
            device="cuda"
        ))
    else:
        return SentenceTransformersEmbeddingFunction(SentenceTransformer(
            model_name_or_path="intfloat/multilingual-e5-large",
            device="cpu"
        ))


def is_gpu_embedding_model_available():
    """Method to check wether gpu is available to use for torch

    Returns:
        bool: true if gpu is available
    """
    with torch.no_grad():
        if torch.cuda.is_available() and bool(int(os.getenv("USE_GPU"))):
            try:
                mp.set_start_method("spawn")
            except:
                pass
            return True
        else:
            return False


def init_embedding_model():
    """Method to initialize the embedding function

    Returns:
        _type_: _description_
    """
    use_gpu = is_gpu_embedding_model_available()
    return get_embedding_model(use_gpu)


def update_collection_and_task(collection_id, source_id, timestamp):
    """Method to update collection user and task

    Args:
        collection_id (int): the collection id
        source_id (int): the source id
        timestamp (float): timestamp of the last version of the 
        vectorstore database uploaded to aws.

    Returns:
        bool: success or not
    """
    with app.app_context():
        try:
            collection = db.session.get(Collection, collection_id)
            user = db.session.get(User, collection.user_id)
            source = db.session.get(Source, source_id)
            task = db.session.query(BackgroundIngestionTask).filter(
                BackgroundIngestionTask.collection_id==collection_id,
                BackgroundIngestionTask.source_id==source_id
            ).first()
            task.result = True
            task.ended = True
            db.session.add(task)
            user.vectorstore_date_updated = timestamp
            db.session.add(user)
            collection.sources.append(source)
            db.session.add(collection)
            db.session.commit()
            ended_ingestion_email(collection.user_id, collection.id, source.id)
            db.session.close()
        except PendingRollbackError as e:
            db.session.rollback()
            try:
                collection = db.session.get(Collection, collection_id)
                user = db.session.get(User, collection.user_id)
                source = db.session.get(Source, source_id)
                task = db.session.query(BackgroundIngestionTask).filter(
                    BackgroundIngestionTask.collection_id==collection_id,
                    BackgroundIngestionTask.source_id==source_id
                ).first()
                task.result = True
                task.ended = True
                db.session.add(task)
                user.vectorstore_date_updated = timestamp
                db.session.add(user)
                collection.sources.append(source)
                db.session.add(collection)
                db.session.commit()
            except OperationalError:
                db.session.rollback()
                db.session.close()
                return False
        except OperationalError:
            db.session.rollback()
            db.session.close()
            try:
                collection = db.session.get(Collection, collection_id)
                user = db.session.get(User, collection.user_id)
                source = db.session.get(Source, source_id)
                task = db.session.query(BackgroundIngestionTask).filter(
                    BackgroundIngestionTask.collection_id==collection_id,
                    BackgroundIngestionTask.source_id==source_id
                ).first()
                task.result = True
                task.ended = True
                db.session.add(task)
                user.vectorstore_date_updated = timestamp
                db.session.add(user)
                collection.sources.append(source)
                db.session.add(collection)
                db.session.commit()
            except OperationalError:
                db.session.rollback()
                db.session.close()
                return False
        return True
    

def ended_ingestion_email(user_id, collection_id, source_id):
    with app.app_context():
        try:
            user = db.session.get(User, user_id)
            collection = db.session.get(Collection, collection_id)
            source = db.session.get(Source, source_id)
            msg = Message(
                "The Custom Assistant - Background ingestion task ended",
                sender=os.environ.get("MAIL_USERNAME"),
                recipients=[user.email],
            )
            msg.body = (
                f"Hello {user.email},\n\n"
                f"Your document {source.filename} has been ingested in your collection {collection.collection_name}"
                "Thanks."
            )
            mail.send(msg)
            return hash
        except OperationalError as e:
            try:
                user = db.session.get(User, user_id)
                collection = db.session.get(Collection, collection_id)
                source = db.session.get(Source, source_id)
                msg = Message(
                    "The Custom Assistant - Background ingestion task ended",
                    sender=os.environ.get("MAIL_USERNAME"),
                    recipients=[user.email],
                )
                msg.body = (
                    f"Hello {user.email},\n\n"
                    f"Your document {source.filename} has been ingested in your collection {collection.collection_name}"
                    "Thanks."
                )
                mail.send(msg)
                return hash
            except OperationalError:
                db.session.close()
        except Exception as e:
            db.session.close()


def history_chat(chat_history):
    llm = ChatOllama(
        model=os.getenv("QWEN_MODEL"),
        temperature=0.8,
        disable_streaming=True
    )
    messages = []
    for message in chat_history:
        if message['role'] == "system":
            messages.append(SystemMessage(content=message['content']))
        elif message['role'] == "human":
            messages.append(HumanMessage(content=message['content']))
        else:
            messages.append(AIMessage(content=message['content']))
    
    answer = llm.invoke(messages)
    return {
        "answer": answer.content,
        "prompt_tokens": answer.usage_metadata['input_tokens'],
        "comp_tokens": answer.usage_metadata['output_tokens']
    }