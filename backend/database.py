"""
database.py
------------
Configuração da conexão com o PostgreSQL via SQLAlchemy.
"""
import os
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://insightlink:insightlink@localhost:5432/insightlink",
)


def init_db(app):
    app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_pre_ping": True,
    }
    db.init_app(app)
    with app.app_context():
        db.create_all()