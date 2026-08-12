"""
models.py
----------
Modelo de dados persistido no PostgreSQL: um "Record" representa um
Desafio ou Projeto importado de um PDF/planilha do ENIAC Link+.
"""
import uuid
from datetime import datetime

from sqlalchemy.dialects.postgresql import JSONB

from database import db


def gen_uuid():
    return str(uuid.uuid4())


class Record(db.Model):
    __tablename__ = "records"

    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    origem_arquivo = db.Column(db.String(255))
    tipo = db.Column(db.String(30), index=True)
    titulo = db.Column(db.String(500))
    proponente = db.Column(db.String(255), index=True)
    email = db.Column(db.String(255))
    telefone = db.Column(db.String(60))
    empresa = db.Column(db.String(255), index=True)
    cargo = db.Column(db.String(255), index=True)
    mentor = db.Column(db.String(255))
    objetivo = db.Column(db.Text)
    contexto_limitacoes = db.Column(db.Text)
    requisitos_tecnicos = db.Column(db.Text)
    restricoes = db.Column(db.Text)
    entregaveis_sucesso = db.Column(db.Text)
    texto_completo = db.Column(db.Text)
    palavras = db.Column(db.Integer, default=0)
    completude = db.Column(db.Integer, default=0)
    extras = db.Column(JSONB, default=dict)
    importado_em = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "origem_arquivo": self.origem_arquivo,
            "tipo": self.tipo,
            "titulo": self.titulo,
            "proponente": self.proponente,
            "email": self.email,
            "telefone": self.telefone,
            "empresa": self.empresa,
            "cargo": self.cargo,
            "mentor": self.mentor,
            "objetivo": self.objetivo,
            "contexto_limitacoes": self.contexto_limitacoes,
            "requisitos_tecnicos": self.requisitos_tecnicos,
            "restricoes": self.restricoes,
            "entregaveis_sucesso": self.entregaveis_sucesso,
            "palavras": self.palavras,
            "completude": self.completude,
            "extras": self.extras or {},
            "importado_em": self.importado_em.isoformat() if self.importado_em else None,
        }

    @classmethod
    def from_parsed(cls, record: dict) -> "Record":
        return cls(
            id=record.get("id") or gen_uuid(),
            origem_arquivo=record.get("origem_arquivo"),
            tipo=record.get("tipo"),
            titulo=record.get("titulo"),
            proponente=record.get("proponente"),
            email=record.get("email"),
            telefone=record.get("telefone"),
            empresa=record.get("empresa"),
            cargo=record.get("cargo"),
            mentor=record.get("mentor"),
            objetivo=record.get("objetivo"),
            contexto_limitacoes=record.get("contexto_limitacoes"),
            requisitos_tecnicos=record.get("requisitos_tecnicos"),
            restricoes=record.get("restricoes"),
            entregaveis_sucesso=record.get("entregaveis_sucesso"),
            texto_completo=record.get("texto_completo"),
            palavras=record.get("palavras", 0),
            completude=record.get("completude", 0),
            extras=record.get("extras", {}),
        )