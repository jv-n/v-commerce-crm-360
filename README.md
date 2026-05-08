# V-Commerce CRM 360

Plataforma integrada de CRM para a V-Commerce, construída sobre a arquitetura Medalhão (Bronze → Silver → Gold) no Databricks. Centraliza dados de clientes, pedidos, produtos e suporte em dashboards analíticos com um agente de IA conversacional (Text-to-SQL).

---

## Estrutura do repositório

```
v-commerce-crm-360/
├── data-engineering/          # Notebooks PySpark (Databricks)
│   ├── 01_bronze_vcommerce.ipynb
│   ├── 02_silver_vcommerce.ipynb
│   ├── 03_gold_vcommerce.ipynb
│   ├── silver-data-csvs/      # gerado pelo pipeline, não versionado
│   └── gold-data-csvs/        # gerado pelo pipeline, não versionado
├── backend/                   # FastAPI (Python)
│   ├── app/
│   ├── database/
│   │   └── seed.py            # Script de população do banco
│   └── requirements.txt
├── frontend/                  # React + TypeScript (Vite)
└── README.md
```

---

## 2. Exportar os CSVs para o repositório local

Após rodar o pipeline, baixe os CSVs gerados e coloque-os nas pastas corretas:

**Silver** — tabelas brutas limpas, usadas pelo backend para consultas detalhadas:
```
data-engineering/silver-data-csvs/

```

**Gold** — tabelas agregadas, consumidas diretamente pelos endpoints e pelo agente de IA:
```
data-engineering/gold-data-csvs/

```

> Essas pastas estão no `.gitignore` e não são versionadas. É preciso baixá-las localmente e adicionar a pasta correta!

---

## 3. Popular o banco de dados

Com os CSVs nas pastas corretas, rode o script de seed (as dependências já estão no `requirements.txt` do backend):

```bash
python backend/database/seed.py
``` 

## 4. Rodar o backend

**Windows:**
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Linux/macOS:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

A API ficará disponível em `http://localhost:8000`. Documentação interativa em `http://localhost:8000/docs`.

---

## 5. Rodar o frontend

Requer **Node.js v22+**. Para instalar via CLI:

```bash
winget install OpenJS.NodeJS.LTS
```

Após instalar, feche e abra o terminal novamente. Depois:

```bash
cd frontend
npm install
npm run dev
```

O frontend ficará disponível em `http://localhost:5173`.

---

## Decisões arquiteturais

- **SQLite** foi escolhido como banco local por ser zero-configuração e suficiente para o volume de dados após a agregação na camada Gold. A troca para PostgreSQL exige apenas alterar a connection string no backend.
- **Arquitetura Medalhão** (Bronze → Silver → Gold) garante rastreabilidade completa dos dados desde a origem bruta até as tabelas analíticas finais.
- **Tabelas Gold desnormalizadas** eliminam JOINs em tempo de consulta no backend, o que simplifica os endpoints e melhora a performance das queries do agente de IA.
- O arquivo `vcommerce.db` não é versionado. O banco é sempre gerado localmente a partir dos CSVs via `seed.py`.
