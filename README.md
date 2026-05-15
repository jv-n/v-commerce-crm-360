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

## Documentação

- [Documentação Frontend](./docs/frontend_doc/)
- [Documentação Backend](./docs/backend_doc/)
- [Documentação Data Engineering](./docs/data-engineering_doc/)
- [Documentação Agente de IA](./docs/ai-agent_doc/)
- [Decisões Arquiteturais](./docs/decisions-doc.md)

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
# Linux/macOS
cp backend/.env.example backend/.env

# Windows (PowerShell)
Copy-Item backend\.env.example backend\.env
```

Edite `backend/.env` e preencha **apenas** a chave da API do Google AI Studio:

```env
GEMINI_API_KEY=sua-chave-aqui
```

> **Importante:** deixe a variável `DATABASE_URL` fora do `.env` (ou remova-a se estiver lá). O `config.py` resolve o caminho do banco automaticamente com `Path(__file__)`, e uma URL com caminho absoluto do host vai quebrar dentro do container.

### 4.2. Subir os containers

Na raiz do repositório:

```bash
docker compose up --buildgit stash
```

Na primeira execução o Docker vai baixar as imagens base e instalar as dependências — pode demorar alguns minutos. Nas próximas vezes, você pode subir sem o flag `--build` **somente se não houver mudanças no código ou nas dependências**. Sempre que houver alteração de código, Dockerfile, `requirements.txt`, `package.json` ou qualquer outra dependência, rode novamente com `--build`.

```bash
docker compose up
```

Serviços disponíveis após o boot:

| Serviço  | URL                                        |
|----------|--------------------------------------------|
| Backend  | http://localhost:8000                      |
| API Docs | http://localhost:8000/docs                 |
| Frontend | http://localhost:5173                      |

### 4.3. Popular o banco (primeira vez)

Se o banco ainda não foi gerado pelo seed, rode dentro do container do backend:

```bash
docker compose exec backend python database/seed.py
```

### 4.4. Verificar se o banco está acessível

```bash
curl http://localhost:8000/agent/health
```

O campo `"database"` deve retornar `"ok"`. Se retornar `"banco não encontrado"`, repita o passo 4.3.

### 4.5. Ver logs em tempo real

```bash
# Todos os serviços
docker compose logs -f

# Apenas o backend
docker compose logs -f backend

# Apenas o frontend
docker compose logs -f frontend
```

### 4.6. Parar os containers

```bash
# Para e mantém os containers (sobe rápido depois com `docker compose up`)
docker compose stop

# Para e remove os containers (próximo `up` recria tudo)
docker compose down
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
