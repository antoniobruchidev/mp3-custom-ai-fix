import os
from flask import Flask
from flask.cli import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from flask_argon2 import Argon2
from flask_mail import Mail
from flask_migrate import Migrate
from flask import Flask


UPLOAD_FOLDER = "/static/images/"
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

load_dotenv()

class Base(DeclarativeBase):
  pass

db = SQLAlchemy(model_class=Base)


app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("SQLALCHEMY_DATABASE_URI")
db.init_app(app)
migrate = Migrate(app, db)
argon2 = Argon2(app)
app.config["MAIL_SERVER"] = "smtp.gmail.com"
app.config["MAIL_PORT"] = 587
app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USE_SSL"] = False
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
mail = Mail(app)

#setting OAUTHLIB insecure transport to 1
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

from custom_assistant import routes