import datetime
import os
import boto3
from dotenv import load_dotenv
from botocore.exceptions import NoCredentialsError

from proprietary_hardware import ALLOWED_EXTENSIONS

AWS_BUCKET_NAME = os.getenv('AWS_BUCKET_NAME')
BASE_PREFIX = "the_custom_assistant_data"
LOCAL_PREFIX = "tmp"

def get_client():
    """Method to get aws s3 client

    Returns:
        _type_: _description_
    """
    return boto3.client(
        "s3",
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )


def get_files(path=None):
    """Method to get the list of files in the s3 bucket

    Args:
        path (str, optional): the path in which we'll look for files. Defaults to None.

    Returns:
        list: list of strings representing the path in the s3 bucket
    """
    s3 = get_client()
    if path:
        path = f"{BASE_PREFIX}/{path}"
    else:
        path = BASE_PREFIX
    response = s3.list_objects_v2(Bucket=AWS_BUCKET_NAME, Prefix=path)
    keys = [obj['Key'] for obj in response.get('Contents')]
    return keys


def download_file(key):
    """Method to download a single file from aws s3 bucket

    Args:
        key (str): the path to the file

    Returns:
        bool: _description_
    """
    s3 = get_client()
    local_key = f"{LOCAL_PREFIX}/{key}"
    filename = local_key.split("/")[-1]
    local_path = local_key.replace(f"/{filename}", "")
    if not os.path.exists(local_path):
        os.makedirs(local_path)
    aws_key = f"{BASE_PREFIX}/{key}"
    print(f"aws key {aws_key}")
    print(f"local key {local_key}")
    try:
        assert s3.download_file(Bucket=AWS_BUCKET_NAME, Key=aws_key, Filename=local_key)
    except Exception as e:
        return False
    return True


def upload_file(key):
    """Method to uplad a file to the aws s3 bucket, it will overwrite.

    Args:
        key (str): the path of the file

    Returns:
        boole: success or not
    """
    s3 = get_client()
    local_key = f'{LOCAL_PREFIX}/{key}'
    try:
        s3.upload_file(local_key, AWS_BUCKET_NAME, f"{BASE_PREFIX}/{key}")
        print(f"File {key} uploaded to S3 successfully.")
    except Exception as e:
        print(f"{datetime.datetime.now().isoformat()} - Unknown error: {e}")
        return False
    return True


def upload_file_no_overwrite(key): 
    """Method to upload a file without overwriting

    Args:
        key (str): the path of the file
    """
    aws_key = f'{BASE_PREFIX}/{key}'
    keys = get_files()
    if aws_key not in keys and aws_key.split(".")[1] not in ALLOWED_EXTENSIONS:
        upload_file(key)
    else:
        print(f"{key} already exist, aborted.")


def upload_directory(user_db_tmp_path):
    """Method to upload a directory

    Args:
        user_db_tmp_path (str): the path to the directory where the it will
        upload the user vectorstore with the embedded sources

    Returns:
        bool: success or not
    """
    s3 = get_client()
    try:
        for root, dirs, files in os.walk(f"tmp/{user_db_tmp_path}"):
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