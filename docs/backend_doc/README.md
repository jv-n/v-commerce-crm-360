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
| `authRouter` | `/auth` | Login e geração de JWT |
| `bookmarkRouter` | `/bookmarks` | Favoritos do usuário (autenticado) |
| `contactDetailRouter` | `/contact-details` | Perfil 360, métricas, pedidos e tickets de um contato |
| `contactRouter` | `/contacts` | Listagem, CRUD e exportação de contatos |
| `conversationRouter` | `/conversations` | Histórico de conversas do agente de IA |
| `dashboardRouter` | `/dashboard` | KPIs, receita, pedidos, top categorias e mapa |
| `goalRouter` | `/goals` | Metas de negócio do usuário (autenticado) |
| `mentionRouter` | `/mentions` | Autocomplete de menções `@` no chat |
| `productRouter` | `/products` | Listagem e CRUD de produtos do catálogo |
| `reviewRouter` | `/reviews` | Avaliações pós-compra |
| `saleRouter` | `/sales` | Pedidos e histórico de vendas |
| `ticketRouter` | `/tickets` | Tickets de suporte |
| `userRouter` | `/users` | Gestão de usuários e perfil autenticado |

---

## Stack

- FastAPI
- SQLAlchemy
- Alembic
- Pydantic
- SQLite (padrão) — substituível por PostgreSQL via connection string