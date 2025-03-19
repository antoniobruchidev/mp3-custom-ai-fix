import datetime
from proprietary_hardware import app, db
from proprietary_hardware.models import Collection, Source
from proprietary_hardware.storage import upload_directory, get_files, upload_file_no_overwrite, download_file
from proprietary_hardware.utils import init_embedding_model, update_collection_and_task
from proprietary_hardware.storage import BASE_PREFIX, LOCAL_PREFIX
from botocore.exceptions import ClientError
from langchain_chroma.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.documents import Document
from unstructured.partition.pdf import partition_pdf
import chromadb
import os
from langchain_ollama import ChatOllama
from sqlalchemy.exc import OperationalError



def get_client(user_id):
    """Method that get the chroma_db for the given user_id

    Args:
        user_id (int): the user id

    Returns:
        chromadb.PersistentClient: a ChromaDb client instance for the given user
    """
    return chromadb.PersistentClient(
        path=f"{LOCAL_PREFIX}/{user_id}/chroma_db"
        )


def download_client(user_id):
    """Method to download the chroma.sqlite3 vector database for the given user

    Args:
        user_id (int): the user id

    Returns:
        chromadb.PersistentClient, string[optional]: the vs client and an optional error
    """
    error = None
    if not os.path.exists(f"{LOCAL_PREFIX}/{user_id}/chroma_db"):
        os.makedirs(f"{LOCAL_PREFIX}/{user_id}/chroma_db")
    user_db = f"{LOCAL_PREFIX}/{user_id}/chroma_db/chroma.sqlite3"
    if not os.path.isfile(user_db):
        try:
            keys = get_files(f"{user_id}/chroma_db")
            for key in keys:
                aws_key = key.replace(f"{BASE_PREFIX}/", "")
                assert download_file(aws_key)
            print(f"Downloaded vectorstore for user id: {user_id}")
        except TypeError:
            print(f"No existing vectorstore for user id: {user_id}")
        except ClientError as e:
            error = f"Error Downloading files from AWS S3 Bucket - {e} - Retrying"
            try:
                aws_key = key.replace(f"{BASE_PREFIX}/", "")
                assert download_file(aws_key)
            except Exception as e:
                error = f"Error Downloading files from AWS S3 Bucket - {e} - Retrying"
                try:
                    aws_key = key.replace(f"{BASE_PREFIX}/", "")
                    assert download_file(aws_key)
                except Exception as e:
                    error = f"Error Downloading files from AWS S3 Bucket - {e} - Stop"
    return get_client(user_id), error


def ingest(collection_id, source_id, user_id):
    """Method to ingest a pdf into a vectorstore collection

    Args:
        collection_id (int): the collection id
        source_id (int): the source id
        user_id (int): the user id

    Returns:
        bool: true if everything successfull, or false
    """
    with app.app_context():
        try:
            collection = db.session.get(Collection, int(collection_id))
            source = db.session.get(Source, int(source_id))
        except OperationalError as e:
            print(f"{datetime.datetime.now().isoformat()} - Operational error: {e}")
            print(f"{datetime.datetime.now().isoformat()} - Retrying")
            collection = db.session.get(Collection, int(collection_id))
            source = db.session.get(Source, int(source_id))
    response = download_file(source.aws_key)
    print(f"{datetime.datetime.now().isoformat()} - response: {response}")
    filename = f"{LOCAL_PREFIX}/{collection.user_id}/{source.filename}"
    docs = []
    documents = []
    ids = []
    print("Start PDF extraction")
    raw_pdf_elements = partition_pdf(
        filename=filename,
        extract_images_in_pdf=True,
        extract_image_block_types=['Table', 'Image'],
        extract_image_block_to_payload=True,
        infer_table_structure=True,
        max_characters=512,
        new_after_n_chars=384,
        combine_text_under_n_chars=256,
    )
    print("PDF extraction complete")
    image_counter = 0
    table_counter = 0
    for counter, el in enumerate(raw_pdf_elements):
        metadata = el.metadata.to_dict()
        del metadata["languages"]
        del metadata["coordinates"]
        metadata["source"] = metadata["filename"]
        del metadata["filename"]
        page_number = metadata['page_number']
        id = f"{counter}-{source.filename}"
        if el.category == 'Image':
            image_bytes = metadata['image_base64']
            image_name = f"{source.id}-{page_number}-{image_counter}.jpg"
            aws_path = f"{collection.user_id}/{source.id}/images"
            local_path = f"{LOCAL_PREFIX}/{aws_path}"
            key = f"{aws_path}/{image_name}"
            if not os.path.exists(local_path):
                os.makedirs(local_path)
            local_key = f"{local_path}/{image_name}"
            with open(local_key, 'w') as f:
                f.write(image_bytes)
            del metadata['image_base64']
            image_counter += 1
            upload_file_no_overwrite(key)
        elif el.category == 'Table':
            image_bytes = metadata['image_base64']
            table_name = f"{source.id}-{page_number}-{image_counter}.jpg"
            aws_path = f"{collection.user_id}/{source.id}/tables"
            local_path = f"{LOCAL_PREFIX}/{aws_path}"
            key = f"{aws_path}/{table_name}"
            if not os.path.exists(local_path):
                os.makedirs(local_path)
            local_key = f"{local_path}/{table_name}"
            with open(local_key, 'w') as f:
                f.write(image_bytes)
                print(f.name)
            del metadata['image_base64']
            table_counter += 1
            upload_file_no_overwrite(key)
            text = el.text
        else:
            text = el.text
        documents.append(Document(page_content=text, metadata=metadata))
        ids.append(id)
        
    client, error = download_client(collection.user_id)
    
    vector_store = Chroma(
        collection_name=collection.collection_name,
        embedding_function=init_embedding_model(),
        client=client
    )
    print(f"{datetime.datetime.now().isoformat()} - Start ingesting chunks into {vector_store._collection_name}")

    counter = 0
    while len(documents) > 500:
        counter += 1
        docs = documents[:500]
        _ids = ids[:500]
        vector_store.add_documents(
            documents=docs,
            ids=_ids)
        documents = documents[500:]
        ids = ids[500:]
        print(f"{datetime.datetime.now().isoformat()} - Ingested batch {counter}")
    
    vector_store.add_documents(
        documents=documents,
        ids=ids,
    )
    print(f"{datetime.datetime.now().isoformat()} - Ingested final batch")
    timestamp = datetime.datetime.now().timestamp()
    assert update_collection_and_task(collection_id, source_id, timestamp)
    assert upload_directory(f"{user_id}/chroma_db")
    print(f"{datetime.datetime.now().isoformat()} - Collection and User Updated.")
    return True
    

def query_with_retriever(question, collection, user_id):
    """Method to query a vectore with a retriever

    Args:
        question (str): tthe question tthe user is asking
        collection (str): the collection name
        user_id (int): the user id

    Returns:
        bool: true if everything successfull, or false
    """
    client, error = download_client(user_id)
    vector_store = Chroma(
    client=client,
    embedding_function=init_embedding_model(),
    collection_name=collection
    )
    retriever = vector_store.as_retriever(
        search_type="similarity_score_threshold",
        search_kwargs={
            "k": 10,
            "score_threshold": 0.5,
        },
    )
    
    template = """You are an amazing multilingual assistant.
    You MUST answer in the language used by the user.
    Answer the question based ONLY on the following context:

    Context: {context}
    
    Question: {question}
    
    Answer:"""
    
    prompt = ChatPromptTemplate.from_template(template)
    model = ChatOllama(
        model=os.getenv("MISTRAL_MODEL"),
        temperature=0
    )

    def format_docs(docs):
        return "\n\n".join([d.page_content for d in docs])

    chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | model
        | StrOutputParser()
    )

    return chain.invoke(question)