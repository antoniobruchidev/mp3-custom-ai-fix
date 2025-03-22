from flask_mail import Message
import os
from custom_assistant import mail, HEROKU_DOMAIN
import hmac
import hashlib


def create_hash(string1, string2):
    combined = string1 + string2 + os.getenv("FORGOT_PASSWD_KEY")
    hash_object = hmac.new(combined.encode("utf-8"), digestmod=hashlib.sha256)
    return hash_object.hexdigest()


def send_activation_email(user):
    msg = Message(
        "The Custom Assistant - Please activate your account",
        sender=os.environ.get("MAIL_USERNAME"),
        recipients=[user.email],
    )
    msg.body = (
        f"Hello {user.email},\n\n"
        f"please click on the link below to activate your account.\n\n"
        f"http://localhost:5000/verify/{user.id}\n\n"
        f"{HEROKU_DOMAIN}/verify/{user.id}\n\n"
        "Thanks."
    )
    mail.send(msg)


def forgot_password_email(user):
    msg = Message(
        "The Custom Assistant - Did you forget your password?",
        sender=os.environ.get("MAIL_USERNAME"),
        recipients=[user.email],
    )
    hash = create_hash(str(user.id), user.email)
    msg.body = (
        f"Hello {user.email},\n\n"
        f"please click on the link below to reset your password.\n\n"
        f"If it wasn't you and we suggest you change your password anyway."
        f"http://localhost:5000/change_password/{hash}\n\n"
        f"{HEROKU_DOMAIN}/change_password/{hash}\n\n"
        "Thanks."
    )
    mail.send(msg)
    return hash
