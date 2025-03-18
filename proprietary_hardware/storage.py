import datetime
import os
import time
import boto3
from dotenv import load_dotenv
from botocore.exceptions import NoCredentialsError

from proprietary_hardware import ALLOWED_EXTENSIONS

load_dotenv()

AWS_BUCKET_NAME = os.getenv('AWS_BUCKET_NAME')
BASE_PREFIX = "the_custom_assistant_data"
LOCAL_PREFIX = "data/tmp"

def get_client():
    return boto3.client(
        "s3",
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )


def get_files(path=None):
    s3 = get_client()
    if path:
        path = f"{BASE_PREFIX}/{path}"
    else:
        path = BASE_PREFIX
    response = s3.list_objects_v2(Bucket=AWS_BUCKET_NAME, Prefix=path)
    keys = [obj['Key'] for obj in response.get('Contents')]
    return keys


def download_file(key):
    s3 = get_client()
    local_key = f"{LOCAL_PREFIX}/{key}"
    filename = local_key.split("/")[-1]
    local_path = local_key.replace(f"/{filename}", "")
    if not os.path.exists(local_path):
        os.makedirs(local_path)
    aws_key = f"{BASE_PREFIX}/{key}"
    print(f"aws key {aws_key}")
    print(f"local key {local_key}")
    s3.download_file(Bucket=AWS_BUCKET_NAME, Key=aws_key, Filename=local_key)
    return True


def upload_file(key):
    s3 = get_client()
    local_key = f'{LOCAL_PREFIX}/{key}'
    try:
        s3.upload_file(local_key, AWS_BUCKET_NAME, f"{BASE_PREFIX}/{key}")
        print(f"File {key} uploaded to S3 successfully.")
    except:
        print(f"{datetime.datetime.now().isoformat()} - Unknown error \n\n----- {key} not uploaded\n\n")
        return False
    return True


def upload_file_no_overwrite(key): 
    aws_key = f'{BASE_PREFIX}/{key}'
    keys = get_files()
    if aws_key not in keys and aws_key.split(".")[1] not in ALLOWED_EXTENSIONS:
        upload_file(key)
    else:
        print(f"{key} already exist, aborted.")


def upload_directory(user_db_tmp_path):
    s3 = get_client()
    try:
        for root, dirs, files in os.walk(f"data/tmp/{user_db_tmp_path}"):
            for file in files:
                file_path = os.path.join(root, file)
                key = file_path.replace(f"{LOCAL_PREFIX}/", "")
                upload_file(key)
                
    except FileNotFoundError:
        print("The directory was not found")
        return False
    except NoCredentialsError:
        print("Credentials not available")
        return False

    return True


