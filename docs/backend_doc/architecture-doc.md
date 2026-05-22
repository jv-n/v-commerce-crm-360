# Arquitetura do Backend

## Visão Geral

O backend é uma API REST que serve como camada intermediária entre o banco SQLite (alimentado pelo pipeline de engenharia de dados) e o frontend React. Centraliza três responsabilidades:

1. **Consultas analíticas** sobre as tabelas Gold para o dashboard, listagens e perfis 360°.
2. **CRUD operacional** sobre tabelas mutáveis (contatos, produtos, pedidos, bookmarks, goals, conversas do agente) com audit log via tabelas `ft_*_activities`.
3. **Integração com o agente de IA**, que é importado dinamicamente pelo router `/agent` como módulo Python externo (vide `backend/app/routes/agentRouter.py`).

A API é stateless: nenhum estado fica na memória do processo entre requisições, exceto a instância singleton do agente PydanticAI e seu histórico de sessões em RAM (decisão 24 do `decisions-doc.md`).

**Framework:** FastAPI
**Linguagem:** Python 3.12
**ORM:** SQLAlchemy 2.0 (declarativo, com `Mapped[]` e `select()` tipados)
**Validação:** Pydantic v2
**Banco de dados:** SQLite (`backend/database/vcommerce.db`)
**Autenticação:** JWT (HS256) com `pwdlib` (argon2id) e `python-jose`
**Documentação interativa:** `/docs` (Swagger UI gerado automaticamente)

---

## Estrutura de pastas

```
backend/
├── alembic/                            # Pasta criada mas não usada (decisão 7)
├── app/
│   ├── core/
│   │   ├── dependencies.py             # get_current_user (extrai user_id do JWT)
│   │   └── security.py                 # hash_password, verify_password, create_access_token, decode_token
│   ├── models/                         # SQLAlchemy: uma classe por tabela
│   │   ├── bookmarkModel.py            # bookmarks (com UniqueConstraint user_id+entity_id)
│   │   ├── contactModel.py             # GoldCliente360 + ContactActivity (audit)
│   │   ├── conversationModel.py        # agent_conversations
│   │   ├── goalModel.py                # goals (com user_id)
│   │   ├── productModel.py             # DimProduto + GoldDesempenhoProduto + ProductActivity
│   │   ├── reviewModel.py              # avaliações pós-compra
│   │   ├── saleModel.py                # GoldPedidoDetalhado + SaleActivity
│   │   ├── sessionModel.py             # gold_sessao_resumo
│   │   ├── ticketModel.py              # GoldTicket360
│   │   └── userModel.py                # usuários do CRM (com role)
│   ├── routes/                         # FastAPI Routers (um por domínio)
│   │   ├── agentRouter.py              # /agent — proxy para ai-agent/agent.py
│   │   ├── authRouter.py               # /auth/login
│   │   ├── bookmarkRouter.py           # /bookmarks (autenticado)
│   │   ├── contactDetailRouter.py      # /contact-details/{id}/...
│   │   ├── contactRouter.py            # /contacts (lista, CRUD, export)
│   │   ├── conversationRouter.py       # /conversations (histórico do chat IA)
│   │   ├── dashboardRouter.py          # /dashboard/{metrics,revenue,orders,top-categories,map}
│   │   ├── goalRouter.py               # /goals (autenticado)
│   │   ├── mentionRouter.py            # /mentions (autocomplete @cliente, @produto)
│   │   ├── productRouter.py            # /products (lista, CRUD)
│   │   ├── reviewRouter.py             # /reviews
│   │   ├── saleRouter.py               # /sales
│   │   ├── ticketRouter.py             # /tickets
│   │   └── userRouter.py               # /users
│   ├── schemas/                        # Pydantic v2 — entrada/saída de cada endpoint
│   ├── services/                       # Lógica de negócio (queries, agregações)
│   ├── config.py                       # Settings (DATABASE_URL, GEMINI_API_KEY, SECRET_KEY)
│   └── main.py                         # Cria app, registra routers, executa migração e cria índices
├── database/
│   ├── database.py                     # Engine SQLAlchemy + sessionmaker + get_db
│   ├── migrate_user_scope.py           # Migração idempotente user_id em bookmarks/goals (decisão 7)
│   ├── seed.py                         # Popula o SQLite a partir dos CSVs Gold
│   └── vcommerce.db                    # Arquivo SQLite (não versionado)
├── tests/                              # Pytest
├── .env.example                        # Modelo do .env (GEMINI_API_KEY)
├── alembic.ini                         # Config Alembic (não usado em produção)
├── Dockerfile                          # python:3.12-slim
├── pyrightconfig.json                  # Type checking estrito
├── pytest.ini                          # Config dos testes
└── requirements.txt                    # Dependências fixas (FastAPI, SQLAlchemy, pwdlib, jose, pandas, pydantic-ai...)
```

---

## Fluxo de uma requisição

```
HTTP Request
    │
    ▼
┌──────────────────────────────────────────────┐
│ FastAPI Router (app/routes/*.py)             │
│  - valida path/query/body via Pydantic       │
│  - injeta db: Session = Depends(get_db)      │
│  - em rotas autenticadas, injeta             │
│    user_id = Depends(get_current_user)       │
└──────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────┐
│ Service (app/services/*.py)                  │
│  - regra de negócio                          │
│  - queries SQLAlchemy (select, func, etc.)   │
│  - agregações, formatações                   │
└──────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────┐
│ Model (app/models/*.py)                      │
│  - mapeamento tabela → classe                │
│  - Mapped[] / mapped_column                  │
└──────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────┐
│ SQLite (backend/database/vcommerce.db)       │
│  - tabelas gold_* (read-mostly)              │
│  - tabelas ft_*_activities (audit append)    │
│  - tabelas operacionais (users, bookmarks,   │
│    goals, conversations)                     │
└──────────────────────────────────────────────┘
```

A camada Service é o ponto onde a complexidade vive — routers ficam de 5 a 20 linhas. Vide [decisão 4](../decisions-doc.md#4-camada-de-service-entre-router-e-model).

---

## Inicialização do app (`main.py`)

A sequência exata no boot é importante para entender como tudo se conecta. Em ordem:

1. **Injeta `GEMINI_API_KEY` no `os.environ`** lendo do `pydantic-settings` para o SDK do Google.
2. **Cria as tabelas mutáveis** via `Base.metadata.create_all(bind=engine, checkfirst=True)` — cobre `agent_conversations`, `ft_*_activities`, `bookmarks`, `goals`. As tabelas Gold já vêm prontas do seed.
3. **Executa a migração** `database/migrate_user_scope.py` (idempotente, vide [decisão 7](../decisions-doc.md#7-migrações-via-script-python-idempotente-em-vez-de-alembic)).
4. **Cria os índices** com `CREATE INDEX IF NOT EXISTS` em `gold_pedidos_detalhado(data_pedido | id_produto | categoria)` e `gold_cliente_360(data_cadastro)` (vide [decisão 8](../decisions-doc.md#8-índices-criados-em-runtime-via-create-index-if-not-exists)).
5. **Cria o objeto `FastAPI`** com título e descrição.
6. **Aplica o middleware CORS** com `allow_origins=["*"]` (apenas dev — em produção precisaria restringir).
7. **Registra os 14 routers** (auth, agent, contacts, contact-details, sales, products, conversations, mentions, reviews, tickets, dashboard, bookmarks, goals, users).

```
Settings → env → metadata.create_all → migrate_user_scope → CREATE INDEX → FastAPI app → CORS → include_router × 14
```

---

## Routers registrados

| Router | Prefixo | Arquivo | Autenticado? |
|---|---|---|---|
| Auth | `/auth` | `authRouter.py` | Não (é o ponto de entrada) |
| Agent | `/agent` | `agentRouter.py` | Não |
| Bookmarks | `/bookmarks` | `bookmarkRouter.py` | **Sim** (`Depends(get_current_user)`) |
| Contact Details | `/contact-details` | `contactDetailRouter.py` | Não (header `X-User-Name` opcional para audit) |
| Contacts | `/contacts` | `contactRouter.py` | Não |
| Conversations | `/conversations` | `conversationRouter.py` | Não |
| Dashboard | `/dashboard` | `dashboardRouter.py` | Não |
| Goals | `/goals` | `goalRouter.py` | **Sim** |
| Mentions | `/mentions` | `mentionRouter.py` | Não |
| Products | `/products` | `productRouter.py` | Não (header `X-User-Name` opcional) |
| Reviews | `/reviews` | `reviewRouter.py` | Não |
| Sales | `/sales` | `saleRouter.py` | Não |
| Tickets | `/tickets` | `ticketRouter.py` | Não |
| Users | `/users` | `userRouter.py` | Não |

> A maior parte dos endpoints é "aberta" — apenas `bookmarks` e `goals` exigem JWT, porque precisam do `user_id` para escopar os dados. Vide [decisão 6](../decisions-doc.md#6-jwt-verificado-apenas-em-endpoints-de-personalização) para o racional.

---

## Decisões arquiteturais

As decisões completas (Contexto / Decisão / Consequências) estão em [`docs/decisions-doc.md`](../decisions-doc.md). Resumo das principais que afetam o backend:

| Decisão | Resumo |
|---|---|
| [1. SQLAlchemy 2.0 + pydantic-settings](../decisions-doc.md#1-sqlalchemy-20-declarativo--pydantic-settings-sobre-o-fastapi) | Modelos declarativos com `Mapped[]`, configuração resolvida em runtime |
| [2. SQLite](../decisions-doc.md#2-sqlite-como-banco-operacional-do-crm) | Zero configuração, suficiente para o volume Gold |
| [3. Gold sem renormalização](../decisions-doc.md#3-tabelas-gold-consumidas-pelo-orm-sem-renormalização) | Uma classe por tabela Gold, JOINs explícitos no service |
| [4. Camada Service](../decisions-doc.md#4-camada-de-service-entre-router-e-model) | Routers finos; lógica em `app/services/` |
| [5. JWT com pwdlib + jose](../decisions-doc.md#5-autenticação-jwt-com-pwdlib--python-jose) | argon2id + HS256, expiração de 8 horas |
| [6. JWT só em personalização](../decisions-doc.md#6-jwt-verificado-apenas-em-endpoints-de-personalização) | Apenas `/bookmarks` e `/goals` validam token — dívida técnica |
| [7. Migração via script idempotente](../decisions-doc.md#7-migrações-via-script-python-idempotente-em-vez-de-alembic) | `migrate_user_scope.py` em vez de Alembic |
| [8. Índices em runtime](../decisions-doc.md#8-índices-criados-em-runtime-via-create-index-if-not-exists) | `CREATE INDEX IF NOT EXISTS` no boot do `main.py` |
| [9. Janela rolante em dias](../decisions-doc.md#9-janela-rolante-em-dias-para-o-seletor-de-período-do-dashboard) | `date('now', '-N days')` em vez de meses calendário |
| [10. Receita só de aprovados](../decisions-doc.md#10-receita-do-dashboard-considera-apenas-pedidos-aprovados-sem-subtrair-reembolsos) | `_vendas` no `dashboardService.py` não subtrai reembolsos |
| [11. `ft_*_activities` para audit](../decisions-doc.md#11-tabelas-de-atividade-ft__activities-para-audit-log-de-edições-no-crm) | Log append-only de mudanças em contatos, produtos, pedidos |

---

## Como o backend conversa com o agente de IA

O backend e o agente de IA vivem em pastas separadas no repo (`backend/` e `ai-agent/`), mas o agente é carregado dentro do processo do backend, não como serviço separado.

```
backend/
├── app/routes/agentRouter.py   ─┐ insere ../../ai-agent no sys.path
└── ...                          │  e importa: chat, get_agent, DatabaseTools
                                 ▼
ai-agent/
├── agent.py                    ─┘ define o Agent PydanticAI + tools
├── database_tools.py              expõe list_tables, get_table_schema, execute_query
└── prompts.py                     SYSTEM_PROMPT + SUGGESTED_QUESTIONS
```

No Docker, o volume `./ai-agent:/ai-agent` garante o acesso ao módulo (vide [decisão 27](../decisions-doc.md#27-docker-compose-como-ambiente-único-de-desenvolvimento)). O `_DB_PATH` é resolvido a partir do `__file__` do `agentRouter.py` para funcionar tanto local quanto no container.

---

## Áreas com dívida técnica conhecida

| Tema | Onde | Pendência |
|---|---|---|
| Autenticação | Maioria dos routers | Não validam JWT — apenas `bookmarks` e `goals` validam |
| `SECRET_KEY` | `app/config.py:14` | Default `"mude-me"`; precisa override em produção |
| CORS | `app/main.py` | `allow_origins=["*"]` aceita qualquer origem |
| Fórmula de receita | `ai-agent/prompts.py` | Ainda contém a subtração de reembolsados que foi removida do backend (vide decisão 10) |
| Alembic | Pasta `alembic/` | Criada e não usada — manter ou remover conforme o projeto evoluir |
| Audit log retention | Tabelas `ft_*_activities` | Crescem sem TTL — sem política de retenção |
| Worker único | `uvicorn` | Histórico de sessão do agente vive em memória do processo (decisão 24) |
