from flask_mail import Message
import os
from custom_assistant import mail, HEROKU_DOMAIN


def send_activation_email(user):
    msg = Message(
        "The Custom Assistant - Please activate your account",
        sender=os.environ.get("MAIL_USERNAME"),
        recipients=[user.email],
    )
    msg.body = (
        f"Hello {user.email},\n\n"
        f"please click on the link below to activate your account.\n\n"
        f"http://localhost:5000/activate/{user.id}\n\n"
        f"{HEROKU_DOMAIN}/verify/{user.id}\n\n"
        "Thanks."
    )
    mail.send(msg)
