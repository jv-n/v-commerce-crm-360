# Documentação Backend

Documentação da API e serviços do V-Commerce CRM 360, construído em **FastAPI (Python)**.

---

## Arquivos

| Arquivo | Descrição |
|---|---|
| [Arquitetura](./architecture-doc.md) | Visão geral, stack, estrutura de pastas e fluxo de uma requisição |
| [Endpoints](./endpoints-doc.md) | Todos os endpoints FastAPI com exemplos de request e response |
| [Models e Schemas](./models-doc.md) | Models SQLAlchemy, schemas Pydantic e seus relacionamentos |
| [Banco de Dados](./database-doc.md) | Estrutura do `vcommerce.db`, seed, seed_mock e migrations |

---

## Routers disponíveis

| Router | Prefixo | Descrição |
|---|---|---|
| `agentRouter` | `/agent` | Endpoints do agente de IA (chat e health check) |
| `contactRouter` | `/contacts` | Listagem e perfil de clientes |
| `conversationRouter` | `/conversations` | Histórico de conversas do agente |
| `mentionRouter` | `/mentions` | Menções em conversas |
| `productRouter` | `/products` | CRUD de produtos do catálogo |
| `reviewRouter` | `/reviews` | Avaliações pós-compra |
| `saleRouter` | `/sales` | Pedidos e histórico de vendas |
| `userRouter` | `/users` | Autenticação e gestão de usuários |

---

## Stack

- FastAPI
- SQLAlchemy
- Alembic
- Pydantic
- SQLite (padrão) — substituível por PostgreSQL via connection string