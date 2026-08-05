"""
parser.py
----------
Responsável por transformar os arquivos exportados pela plataforma
ENIAC Link+ (PDF ou planilha) em registros estruturados que a aplicação
InsightLink consegue armazenar e exibir em dashboards.
"""
import re
import io
import uuid
from datetime import datetime

import pdfplumber
import pandas as pd

# Cabeçalhos (rótulos) conhecidos que aparecem nos templates do ENIAC Link+
HEADER_FIELDS = [
    ("Desafio", "titulo"),
    ("Nome do Projeto", "titulo"),
    ("Proponente", "proponente"),
    ("Mentor indicado", "mentor"),
    ("E-mail para contato", "email"),
    ("E-mail do mentor", "email_mentor"),
    ("E-mail", "email"),
    ("Telefone para contato", "telefone"),
    ("Telefone do mentor", "telefone_mentor"),
    ("Telefone", "telefone"),
    ("Empresa", "empresa"),
    ("Cargo", "cargo"),
]

# Perguntas-guia usadas nos templates para dividir o corpo do texto em seções
QUESTION_MARKERS = [
    "Qual é o objetivo principal deste desafio",
    "Qual é o objetivo principal deste projeto",
    "Em que contexto ou ambiente a solução será aplicada",
    "Quais são os requisitos técnicos e considerações de design",
    "Existem restrições de orçamento ou recursos",
    "Quais são os entregáveis esperados",
]

SECTION_KEYS = [
    "objetivo",
    "contexto_limitacoes",
    "requisitos_tecnicos",
    "restricoes",
    "entregaveis_sucesso",
]


def _clean(text: str) -> str:
    return re.sub(r"[ \t]+", " ", text or "").strip()


def _extract_header_fields(text: str) -> dict:
    data = {}
    lines = text.split("\n")
    for line in lines:
        line = line.strip()
        if not line:
            continue
        for label, key in HEADER_FIELDS:
            pattern = rf"^{re.escape(label)}\s*[:：]\s*(.+)$"
            m = re.match(pattern, line)
            if m and key not in data:
                data[key] = _clean(m.group(1))
                break
    return data


def _extract_sections(text: str) -> dict:
    """Divide o corpo do documento nas perguntas-guia conhecidas."""
    # Localiza a posição de cada pergunta conhecida dentro do texto
    positions = []
    for marker in QUESTION_MARKERS:
        idx = text.find(marker)
        if idx != -1:
            positions.append((idx, marker))
    positions.sort(key=lambda p: p[0])

    sections = {}
    for i, (idx, marker) in enumerate(positions):
        end = positions[i + 1][0] if i + 1 < len(positions) else len(text)
        chunk = text[idx:end]
        # Remove a própria pergunta do início do trecho
        chunk = chunk[len(marker):].strip(" ?\n")
        key_index = min(i, len(SECTION_KEYS) - 1)
        key = SECTION_KEYS[key_index]
        # Se já existe (ex: objetivo aparece com dois textos possíveis), concatena
        sections[key] = _clean(sections.get(key, "") + " " + chunk)
    return sections


def _detect_tipo(text: str) -> str:
    upper = text.upper()
    if "PROPOSTA DE DESAFIO" in upper or re.search(r"Desafio\s*:", text):
        return "Desafio"
    if "PROPOSTA DO PROJETO" in upper or "Nome do Projeto" in text:
        return "Projeto"
    return "Indefinido"


def _score_completude(record: dict) -> int:
    """Estima o quão completo está o registro (0-100), usado como KPI."""
    campos = ["titulo", "proponente", "email", "telefone", "empresa", "cargo"]
    campos += SECTION_KEYS
    preenchidos = sum(1 for c in campos if record.get(c))
    return round(100 * preenchidos / len(campos))


def parse_pdf(file_bytes: bytes, filename: str) -> dict:
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            text += page_text + "\n"

    header = _extract_header_fields(text)
    sections = _extract_sections(text)

    record = {
        "id": str(uuid.uuid4()),
        "origem_arquivo": filename,
        "tipo": _detect_tipo(text),
        "titulo": header.get("titulo") or filename.rsplit(".", 1)[0],
        "proponente": header.get("proponente", ""),
        "email": header.get("email", ""),
        "telefone": header.get("telefone", ""),
        "empresa": header.get("empresa", ""),
        "cargo": header.get("cargo", ""),
        "mentor": header.get("mentor", ""),
        "objetivo": sections.get("objetivo", ""),
        "contexto_limitacoes": sections.get("contexto_limitacoes", ""),
        "requisitos_tecnicos": sections.get("requisitos_tecnicos", ""),
        "restricoes": sections.get("restricoes", ""),
        "entregaveis_sucesso": sections.get("entregaveis_sucesso", ""),
        "texto_completo": _clean(text),
        "palavras": len(text.split()),
        "importado_em": datetime.utcnow().isoformat(),
    }
    record["completude"] = _score_completude(record)
    return record


# Possíveis nomes de colunas em uma planilha exportada e para qual campo mapeiam
XLSX_COLUMN_MAP = {
    "desafio": "titulo",
    "nome do projeto": "titulo",
    "nome": "titulo",
    "titulo": "titulo",
    "título": "titulo",
    "proponente": "proponente",
    "e-mail para contato": "email",
    "e-mail": "email",
    "email": "email",
    "telefone para contato": "telefone",
    "telefone": "telefone",
    "empresa": "empresa",
    "cargo": "cargo",
    "mentor indicado": "mentor",
    "status": "status",
    "tipo": "tipo",
}


def parse_xlsx(file_bytes: bytes, filename: str) -> list:
    df = pd.read_excel(io.BytesIO(file_bytes))
    df.columns = [str(c).strip().lower() for c in df.columns]

    records = []
    for _, row in df.iterrows():
        record = {
            "id": str(uuid.uuid4()),
            "origem_arquivo": filename,
            "tipo": "Indefinido",
            "titulo": "",
            "proponente": "",
            "email": "",
            "telefone": "",
            "empresa": "",
            "cargo": "",
            "mentor": "",
            "objetivo": "",
            "contexto_limitacoes": "",
            "requisitos_tecnicos": "",
            "restricoes": "",
            "entregaveis_sucesso": "",
            "texto_completo": "",
            "palavras": 0,
            "importado_em": datetime.utcnow().isoformat(),
        }
        extras = {}
        for col, val in row.items():
            key = XLSX_COLUMN_MAP.get(col)
            if pd.isna(val):
                continue
            val = str(val).strip()
            if key:
                record[key] = val
            else:
                extras[col] = val
        if not record["titulo"]:
            # usa a primeira coluna textual como título de fallback
            record["titulo"] = next(iter(extras.values()), f"Registro {row.name + 1}")
        if record["tipo"] not in ("Desafio", "Projeto"):
            record["tipo"] = "Desafio" if "desafio" in " ".join(df.columns) else "Indefinido"
        record["extras"] = extras
        record["completude"] = _score_completude(record)
        records.append(record)
    return records


def parse_file(filename: str, file_bytes: bytes):
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return [parse_pdf(file_bytes, filename)]
    if lower.endswith(".xlsx") or lower.endswith(".xls"):
        return parse_xlsx(file_bytes, filename)
    raise ValueError("Formato de arquivo não suportado. Envie um PDF ou uma planilha (.xlsx).")
