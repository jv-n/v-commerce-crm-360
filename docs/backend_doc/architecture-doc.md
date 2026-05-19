# Arquitetura do Backend

## Visão Geral

> Descreva brevemente o papel do backend no sistema.

**Framework:** FastAPI  
**Linguagem:** Python  
**Banco de dados:** SQLite (`vcommerce.db`)

---

## Estrutura de pastas

```
backend/
├── alembic/            # Migrations
├── app/
│   ├── core/
│   │   └── security.py
│   ├── models/         # Models SQLAlchemy
│   ├── routes/         # Routers FastAPI
│   ├── schemas/        # Schemas Pydantic
│   ├── services/       # Lógica de negócio
│   ├── config.py
│   └── main.py
├── database/
│   ├── database.py
│   └── seed.py
└── requirements.txt
```

---

## Fluxo de uma requisição

```
Request HTTP
    └── Router (routes/)
            └── Service (services/)
                    └── Model (models/)
                            └── Banco SQLite
```

---

## Routers registrados

| Router | Prefixo | Arquivo |
|---|---|---|
| Agent | `/agent` | `agentRouter.py` |
| Contacts | `/contacts` | `contactRouter.py` |
| Conversations | `/conversations` | `conversationRouter.py` |
| Mentions | `/mentions` | `mentionRouter.py` |
| Products | `/products` | `productRouter.py` |
| Reviews | `/reviews` | `reviewRouter.py` |
| Sales | `/sales` | `saleRouter.py` |
| Users | `/users` | `userRouter.py` |

---

## Decisões arquiteturais

> Registre aqui as principais decisões tomadas pelo time.

| Decisão | Justificativa |
|---|---|
| SQLite em vez de PostgreSQL | |
| Tabelas Gold desnormalizadas | |
| | |