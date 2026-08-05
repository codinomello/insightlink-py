"""
InsightLink - Backend Flask
----------------------------
API que recebe os arquivos exportados do ENIAC Link+ (PDF/planilha),
processa as informações e disponibiliza os dados já estruturados
para o front-end (React) montar dashboards, gráficos e indicadores.

Armazenamento: em memória (lista de registros) para simplificar o setup.
Para produção, trocar por um banco de dados (ex: SQLite/Postgres).
"""
from collections import Counter
from flask import Flask, request, jsonify
from flask_cors import CORS

from parser import parse_file

app = Flask(__name__)
CORS(app)

# "Banco de dados" em memória
DB = []


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
        records = parse_file(file.filename, file.read())
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Falha ao processar o arquivo: {e}"}), 500

    DB.extend(records)
    return jsonify({"imported": len(records), "records": records}), 201


@app.get("/api/projects")
def list_projects():
    tipo = request.args.get("tipo")
    empresa = request.args.get("empresa")
    cargo = request.args.get("cargo")
    q = request.args.get("q", "").lower()

    results = DB
    if tipo:
        results = [r for r in results if r.get("tipo") == tipo]
    if empresa:
        results = [r for r in results if r.get("empresa") == empresa]
    if cargo:
        results = [r for r in results if r.get("cargo") == cargo]
    if q:
        results = [
            r for r in results
            if q in (r.get("titulo", "") + r.get("proponente", "") + r.get("empresa", "")).lower()
        ]
    return jsonify(results)


@app.delete("/api/projects/<record_id>")
def delete_project(record_id):
    global DB
    before = len(DB)
    DB = [r for r in DB if r["id"] != record_id]
    if len(DB) == before:
        return jsonify({"error": "Registro não encontrado."}), 404
    return jsonify({"deleted": record_id})


@app.delete("/api/projects")
def clear_projects():
    DB.clear()
    return jsonify({"cleared": True})


@app.get("/api/dashboard/summary")
def dashboard_summary():
    total = len(DB)
    desafios = sum(1 for r in DB if r.get("tipo") == "Desafio")
    projetos = sum(1 for r in DB if r.get("tipo") == "Projeto")
    empresas = len({r.get("empresa") for r in DB if r.get("empresa")})
    proponentes = len({r.get("proponente") for r in DB if r.get("proponente")})
    completude_media = round(sum(r.get("completude", 0) for r in DB) / total, 1) if total else 0
    palavras_media = round(sum(r.get("palavras", 0) for r in DB) / total, 1) if total else 0

    por_empresa = Counter(r.get("empresa") for r in DB if r.get("empresa"))
    por_cargo = Counter(r.get("cargo") for r in DB if r.get("cargo"))
    por_tipo = Counter(r.get("tipo") for r in DB if r.get("tipo"))

    return jsonify({
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
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
