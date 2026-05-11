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

## 4. Rodar com Docker (recomendado)

Requer **Docker** e **Docker Compose** instalados.

### 4.1. Configurar o `.env` do backend

Crie o arquivo `backend/.env` a partir do exemplo:

```bash
cp backend/.env.example backend/.env
```

Edite `backend/.env` e preencha sua chave da API do Google AI Studio:

```env
GEMINI_API_KEY=sua-chave-aqui
```

> **Importante:** não adicione a variável `DATABASE_URL` ao `.env`. O caminho do banco é resolvido automaticamente pelo `config.py` e uma URL com caminho absoluto do host vai quebrar dentro do container.

### 4.2. Subir os containers

```bash
docker compose up --build
```

- Backend disponível em `http://localhost:8000` (docs em `http://localhost:8000/docs`)
- Frontend disponível em `http://localhost:5173`

### 4.3. Verificar se o banco está acessível

```bash
curl http://localhost:8000/agent/health
```

O campo `"database"` deve retornar `"ok"`. Se retornar `"banco não encontrado"`, rode o seed dentro do container:

```bash
docker compose exec backend python database/seed.py
```

---

## 5. Rodar o backend manualmente (sem Docker)

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

## 6. Rodar o frontend manualmente (sem Docker)

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
