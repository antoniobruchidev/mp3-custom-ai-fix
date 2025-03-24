## Celery and background tasks
Using 1% of celery capabilities, needed to let the user have a quick response when adding a source to a collection.
It uses Redis as a key-value pair server to share tasks between the main app and the workers set.
I have shared only two methods between the apps and the worker.
The retry method from worker.tasks
```python
@celery.task
def retry(task_id):
    result_id = None
    while result_id is None:
        time.sleep(1200)
        result = proprietary_hardware_data_ingestion(task_id)
        if result["status"] == 200:
            result_id = result["result_id"]
    return {
        "task_id": task_id,
        "started_at": datetime.datetime.now().isoformat(),
        "job_id": result_id
    }
```
Responsibile for retrying to contact the proprietary hardware server to pass the data which it needs to ingest.
The ingest method from proprietary_hardware.tasks
```python
@proprietary_celery.task
def ingest_data(collection_id, source_id, user_id):
    return ingest(collection_id, source_id, user_id)
```
Which will be called directly when the server is up, from the retry method when it goes down.

Depending on how big the PDF is, it could take more than a couple of minutes. A 195 page PDF size, 15Mb, took about 20 minutes using only cpu, about 4 using gpu. Deployed on a free tier huggingface spaces it took almost 5 hours...
It was necessary to give the user a response well before the minimum of 4 minutes. From there the idea to start a new thread and notify the user with an email when the file is ingested.

## PDF extraction
```python
with app.app_context():
        try:
            collection = db.session.get(Collection, int(collection_id))
            source = db.session.get(Source, int(source_id))
            response = download_file(source.aws_key)
            filename = f"{LOCAL_PREFIX}/{collection.user_id}/{source.filename}"
            file_name = source.filename
        except OperationalError as e:
            db.session.rollback()
            db.session.close()
            collection = db.session.get(Collection, int(collection_id))
            source = db.session.get(Source, int(source_id))
            response = download_file(source.aws_key)
            filename = f"{LOCAL_PREFIX}/{collection.user_id}/{source.filename}"
            file_name = source.filename
        except PendingRollbackError as e:
            db.session.rollback()
            collection = db.session.get(Collection, int(collection_id))
            source = db.session.get(Source, int(source_id))
            response = download_file(source.aws_key)
            filename = f"{LOCAL_PREFIX}/{collection.user_id}/{source.filename}"
            file_name = source.filename
        db.session.close()
    docs = []
    documents = []
    ids = []
    raw_pdf_elements = partition_pdf(
        filename=filename,
        extract_images_in_pdf=True,
        extract_image_block_types=["Table", "Image"],
        extract_image_block_to_payload=True,
        infer_table_structure=True,
        max_characters=512,
        new_after_n_chars=384,
        combine_text_under_n_chars=256,
    )
```
Responsible of retrieving the data needed from the database, and extracting the data in chunks.

```python
    image_counter = 0
    table_counter = 0
    for counter, el in enumerate(raw_pdf_elements):
        metadata = el.metadata.to_dict()
        del metadata["languages"]
        del metadata["coordinates"]
        metadata["source"] = metadata["filename"]
        del metadata["filename"]
        page_number = metadata["page_number"]
        id = f"{counter}-{file_name}"
        if el.category == "Image":
            image_bytes = metadata["image_base64"]
            image_name = f"{source_id}-{page_number}-{image_counter}.jpg"
            aws_path = f"{user_id}/{source_id}/images"
            local_path = f"{LOCAL_PREFIX}/{aws_path}"
            key = f"{aws_path}/{image_name}"
            if not os.path.exists(local_path):
                os.makedirs(local_path)
            local_key = f"{local_path}/{image_name}"
            with open(local_key, "w") as f:
                f.write(image_bytes)
            del metadata["image_base64"]
            image_counter += 1
            upload_file_no_overwrite(key)
        elif el.category == "Table":
            image_bytes = metadata["image_base64"]
            table_name = f"{source_id}-{page_number}-{image_counter}.jpg"
            aws_path = f"{user_id}/{source_id}/tables"
            local_path = f"{LOCAL_PREFIX}/{aws_path}"
            key = f"{aws_path}/{table_name}"
            if not os.path.exists(local_path):
                os.makedirs(local_path)
            local_key = f"{local_path}/{table_name}"
            with open(local_key, "w") as f:
                f.write(image_bytes)
            del metadata["image_base64"]
            table_counter += 1
            upload_file_no_overwrite(key)
            text = el.text
        else:
            text = el.text
        documents.append(Document(page_content=text, metadata=metadata))
        ids.append(id)
```
Responsible to modify the metadata for each element extracted, save the images and tables extracted in local temp directory (proprietary server), upload tables and images to aws bucket and append each document text and metadatas to a Document list together with a list of unique ids.

```python
    client, error = download_client(user_id)

    vector_store = Chroma(
        collection_name=collection.collection_name,
        embedding_function=init_embedding_model(),
        client=client,
    )

    counter = 0
    while len(documents) > 500:
        counter += 1
        docs = documents[:500]
        _ids = ids[:500]
        vector_store.add_documents(documents=docs, ids=_ids)
        documents = documents[500:]
        ids = ids[500:]

    vector_store.add_documents(
        documents=documents,
        ids=ids,
    )
```
Responsible for downloading the user vectorstore from aws bucket, initializi it with the embedding function and finally passing the lists of documents and ids in batches, too many will fail.

```python
    timestamp = datetime.datetime.now().timestamp()
    assert update_collection_and_task(collection_id, source_id, timestamp)
    assert upload_directory(f"{user_id}/chroma_db")
    return True
```
Finally create a timestamp to update the user table as a last updated (not useful at the moment but it will be), update the database (method will also send an email to the user notifying him/her of the ended task), and most important upload the vectorstore to the aws client ready to be retrieved when necessary.