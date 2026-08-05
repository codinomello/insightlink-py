# insightlink-py
🤔 insightlink-py: dashboard de dados de projetos da plataforma eniaclink+

# InsightLink

Aplicação web (Flask + React) que importa os arquivos exportados pela
plataforma **ENIAC Link+** (PDF e/ou planilhas), processa as informações e
apresenta dashboards interativos, gráficos e indicadores gerenciais para
apoiar gestores e coordenadores no acompanhamento de desafios e projetos.

## Estrutura do projeto

```
insightlink/
├── backend/          Flask (API REST)
│   ├── app.py         rotas da API
│   ├── parser.py       lógica de extração dos PDFs/planilhas
│   └── requirements.txt
└── frontend/          React + Vite
    └── src/
        ├── App.jsx
        ├── api.js
        └── components/
            ├── UploadPanel.jsx
            ├── KpiCards.jsx
            ├── Charts.jsx
            └── ProjectsTable.jsx
```

## Como funciona

1. O usuário faz upload de um PDF (no formato dos templates "Proposta de
   Desafio" / "Proposta do Projeto" do ENIAC Link+) ou de uma planilha
   `.xlsx` com colunas equivalentes (Desafio/Nome, Proponente, E-mail,
   Telefone, Empresa, Cargo, etc).
2. O backend extrai o texto (via `pdfplumber`) ou lê a planilha (via
   `pandas`/`openpyxl`), identifica os campos do cabeçalho e separa o corpo
   do documento nas seções padrão (objetivo, contexto/limitações,
   requisitos técnicos, restrições, entregáveis).
3. Os registros ficam disponíveis via API para o front-end montar:
   - KPIs (total de registros, desafios x projetos, empresas, proponentes,
     completude média dos formulários);
   - Gráficos (registros por empresa, distribuição por cargo, desafios x
     projetos) usando **Recharts**;
   - Uma tabela com busca e filtros (tipo, empresa) e um painel de detalhes
     por registro.

> Observação: o armazenamento é feito em memória, para simplificar a
> execução local. Para uso em produção, troque a lista `DB` em
> `backend/app.py` por um banco de dados (SQLite/PostgreSQL).

## Como executar

### 1. Backend (Flask)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

A API sobe em `http://localhost:5000`.

### 2. Frontend (React + Vite)

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

A aplicação abre em `http://localhost:5173` (o Vite já está configurado
com proxy de `/api` para `http://localhost:5000`, então não é preciso
configurar CORS manualmente para o dev server).

### 3. Uso

1. Acesse `http://localhost:5173`.
2. Arraste um PDF exportado do ENIAC Link+ (ou uma planilha) para a área de
   upload.
3. Os KPIs, gráficos e a tabela de registros são atualizados
   automaticamente.
4. Clique em qualquer linha da tabela para ver o detalhamento completo do
   desafio/projeto.

## Build para produção

```bash
cd frontend
npm run build
```

Os arquivos estáticos são gerados em `frontend/dist`. Basta servi-los com
qualquer servidor estático (ou configurá-los no próprio Flask com
`send_from_directory`) apontando as chamadas `/api/*` para o backend.

## Principais endpoints da API

| Método | Rota                       | Descrição                                   |
|--------|-----------------------------|----------------------------------------------|
| POST   | `/api/upload`               | Envia um arquivo PDF/XLSX (campo `file`)     |
| GET    | `/api/projects`             | Lista registros (filtros: `tipo`, `empresa`, `cargo`, `q`) |
| DELETE | `/api/projects/<id>`        | Remove um registro                           |
| DELETE | `/api/projects`             | Remove todos os registros                    |
| GET    | `/api/dashboard/summary`    | KPIs e dados agregados para os gráficos      |