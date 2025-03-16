from flask_mail import Message
import os
from custom_assistant import mail

def send_activation_email(user):
    msg = Message(
        "Please activate your account",
        sender=os.environ.get("MAIL_USERNAME"),
        recipients=[user.email],
    )
    msg.body = (
        f"Hello {user.email},\n\n"
        f"please click on the link below to activate your account.\n\n"
        f"http://localhost:5000/activate/{user.id}\n\n"
        "https://the-custom-assistant-b5bd8279ae7f.herokuapp.com/verify/{user.id}\n\n"
        "Thanks."
    )
    mail.send(msg)