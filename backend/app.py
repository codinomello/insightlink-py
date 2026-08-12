"""
InsightLink - Backend Flask
----------------------------
API que recebe os arquivos exportados do ENIAC Link+ (PDF/planilha),
processa e persiste os dados no PostgreSQL, cacheia as agregações
pesadas em Redis e disponibiliza dashboards, cruzamentos de dados e
relatórios (PDF/Excel) para o front-end.
"""
from collections import Counter

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

from database import db, init_db
from models import Record
from parser import parse_file
from cache import cache_get, cache_set, cache_invalidate_all
from analytics import build_full_analytics
from reports import build_pdf_report, build_xlsx_report

app = Flask(__name__)
CORS(app)
init_db(app)


def all_records_as_dicts() -> list[dict]:
    return [r.to_dict() for r in Record.query.order_by(Record.importado_em.desc()).all()]


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/api/upload")
def upload():
    if "file" not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado. Use o campo 'file'."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Nome de arquivo vazio."}), 400

    try:
        parsed = parse_file(file.filename, file.read())
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Falha ao processar o arquivo: {e}"}), 500

    novos = [Record.from_parsed(r) for r in parsed]
    db.session.bulk_save_objects(novos)
    db.session.commit()
    cache_invalidate_all()

    return jsonify({"imported": len(parsed), "records": parsed}), 201


@app.get("/api/projects")
def list_projects():
    tipo = request.args.get("tipo")
    empresa = request.args.get("empresa")
    cargo = request.args.get("cargo")
    q = request.args.get("q", "").strip().lower()

    query = Record.query
    if tipo:
        query = query.filter(Record.tipo == tipo)
    if empresa:
        query = query.filter(Record.empresa == empresa)
    if cargo:
        query = query.filter(Record.cargo == cargo)

    results = query.order_by(Record.importado_em.desc()).all()
    dicts = [r.to_dict() for r in results]

    if q:
        dicts = [
            r for r in dicts
            if q in f"{r.get('titulo','')} {r.get('proponente','')} {r.get('empresa','')}".lower()
        ]
    return jsonify(dicts)


@app.delete("/api/projects/<record_id>")
def delete_project(record_id):
    record = Record.query.get(record_id)
    if not record:
        return jsonify({"error": "Registro não encontrado."}), 404
    db.session.delete(record)
    db.session.commit()
    cache_invalidate_all()
    return jsonify({"deleted": record_id})


@app.delete("/api/projects")
def clear_projects():
    Record.query.delete()
    db.session.commit()
    cache_invalidate_all()
    return jsonify({"cleared": True})


def _compute_summary() -> dict:
    records = all_records_as_dicts()
    total = len(records)
    desafios = sum(1 for r in records if r.get("tipo") == "Desafio")
    projetos = sum(1 for r in records if r.get("tipo") == "Projeto")
    empresas = len({r.get("empresa") for r in records if r.get("empresa")})
    proponentes = len({r.get("proponente") for r in records if r.get("proponente")})
    completude_media = round(sum(r.get("completude", 0) for r in records) / total, 1) if total else 0
    palavras_media = round(sum(r.get("palavras", 0) for r in records) / total, 1) if total else 0

    por_empresa = Counter(r.get("empresa") for r in records if r.get("empresa"))
    por_cargo = Counter(r.get("cargo") for r in records if r.get("cargo"))
    por_tipo = Counter(r.get("tipo") for r in records if r.get("tipo"))

    return {
        "total": total,
        "desafios": desafios,
        "projetos": projetos,
        "empresas": empresas,
        "proponentes": proponentes,
        "completude_media": completude_media,
        "palavras_media": palavras_media,
        "por_empresa": [{"nome": k, "quantidade": v} for k, v in por_empresa.most_common(10)],
        "por_cargo": [{"nome": k, "quantidade": v} for k, v in por_cargo.most_common(10)],
        "por_tipo": [{"nome": k, "quantidade": v} for k, v in por_tipo.most_common()],
    }


@app.get("/api/dashboard/summary")
def dashboard_summary():
    cached = cache_get("summary")
    if cached is not None:
        return jsonify(cached)
    summary = _compute_summary()
    cache_set("summary", summary)
    return jsonify(summary)


@app.get("/api/dashboard/analytics")
def dashboard_analytics():
    """Cruzamentos de dados: heatmap empresa x cargo, correlações, radar, treemap."""
    cached = cache_get("analytics")
    if cached is not None:
        return jsonify(cached)
    records = all_records_as_dicts()
    analytics = build_full_analytics(records)
    cache_set("analytics", analytics)
    return jsonify(analytics)


@app.get("/api/reports/pdf")
def report_pdf():
    records = all_records_as_dicts()
    summary = cache_get("summary") or _compute_summary()
    analytics = cache_get("analytics") or build_full_analytics(records)
    pdf_bytes = build_pdf_report(summary, analytics, records)
    return send_file(
        __import__("io").BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name="insightlink_relatorio.pdf",
    )


@app.get("/api/reports/xlsx")
def report_xlsx():
    records = all_records_as_dicts()
    summary = cache_get("summary") or _compute_summary()
    analytics = cache_get("analytics") or build_full_analytics(records)
    xlsx_bytes = build_xlsx_report(summary, analytics, records)
    return send_file(
        __import__("io").BytesIO(xlsx_bytes),
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name="insightlink_relatorio.xlsx",
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=5000)