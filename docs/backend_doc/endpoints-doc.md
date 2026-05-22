# Endpoints

Documentação dos endpoints da API. O backend expõe 14 routers (vide [`architecture-doc.md`](./architecture-doc.md)), cada um com prefixo próprio.

**Base URL:** `http://localhost:8000`
**Documentação interativa:** `http://localhost:8000/docs` (Swagger UI gerado automaticamente pelo FastAPI)

**Convenções gerais:**
- Todos os endpoints respondem JSON, exceto `/contacts/export` (CSV streaming).
- Datas são strings `YYYY-MM-DD` (ou `dd/MM/yyyy` em campos visuais do frontend — convertidas no service).
- Valores monetários são `float` em Reais (R$).
- Paginação usa `page` (1-indexed) + `pageSize` + retorna `{ data, total, page, pageSize }`.
- O header `X-User-Name` (string opcional, padrão `"Sistema"`) é usado para registrar quem fez a edição em tabelas `ft_*_activities` quando o endpoint não autentica via JWT (vide [decisão 11](../decisions-doc.md#11-tabelas-de-atividade-ft__activities-para-audit-log-de-edições-no-crm)).
- Apenas `/bookmarks` e `/goals` exigem `Authorization: Bearer <jwt>`; os demais são públicos no backend (vide [decisão 6](../decisions-doc.md#6-jwt-verificado-apenas-em-endpoints-de-personalização)).

---

## Health

### `GET /`

Verifica se a API está no ar.

**Resposta:**
```json
{
  "status": "running",
  "message": "V-Commerce CRM 360 API is running!"
}
```

---

## Products `/products`

### `GET /products`

Lista produtos com paginação e filtros avançados.

**Query params:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `page` | `int` | Página (padrão: 1) |
| `pageSize` | `int` | Itens por página (padrão: 10, máx: 100) |
| `search` | `string` | Busca por nome do produto |
| `category` | `string` | Filtro por categoria |
| `status` | `string` | `Ativo` ou `Inativo` |
| `price_min` / `price_max` | `float` | Faixa de preço |
| `stock_min` / `stock_max` | `int` | Faixa de estoque |
| `rating_min` / `rating_max` | `float` | Faixa de avaliação |
| `sales_min` / `sales_max` | `float` | Faixa de vendas |
| `date_from` / `date_to` | `string` | Período de cadastro (`DD/MM/YYYY`) |
| `sort_by` | `string` | `name`, `price`, `stock`, `rating`, `totalSales` |
| `sort_dir` | `string` | `asc` ou `desc` |

**Resposta:**
```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "pageSize": 10
}
```

---

### `GET /products/{product_id}`

Retorna os dados de um produto específico.

**Path params:** `product_id` — ID do produto

**Resposta:** `ProductSchema` (ver `models-doc.md`)

**Erro:** `404` — Produto não encontrado

---

## Contacts `/contacts`

### `GET /contacts`

Lista contatos com paginação, filtros avançados e exportação CSV.

**Query params básicos:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `page` | `int` | Página (padrão: 1) |
| `pageSize` | `int` | Itens por página (padrão: 20, máx: 500000) |
| `tab` | `string` | `"all"` (único valor disponível) |
| `search` | `string` | Busca por nome do contato |
| `search_field` | `string` | Campo específico de busca |
| `purchases_min` / `purchases_max` | `int` | Faixa de número de compras |
| `created_from` / `created_to` | `string` | Período de cadastro (`YYYY-MM-DD`) |
| `engagement` | `string` | Filtro de categoria NPS |
| `client_status` | `list[string]` | Multi-select de status do cliente |
| `sort_by` | `string` | Coluna de ordenação (`name`, `lastPurchase`, `purchases`, `engagementScore`) |
| `sort_dir` | `string` | `asc` ou `desc` |

**Query params de filtros avançados (compras / financeiro):**

| Parâmetro | Tipo |
|---|---|
| `regioes` | `list[string]` |
| `origens` | `list[string]` |
| `pagamentos` | `list[string]` |
| `receita_min` / `receita_max` | `float` |
| `ticket_medio_min` / `ticket_medio_max` | `float` |
| `primeira_compra_from` / `primeira_compra_to` | `string` |
| `ultima_compra_from` / `ultima_compra_to` | `string` |
| `tickets_suporte_min` / `tickets_suporte_max` | `int` |
| `nota_atend_min` / `nota_atend_max` | `float` |
| `nps_min` / `nps_max` | `float` |
| `nota_prod_min` / `nota_prod_max` | `float` |

**Query params de filtros avançados (perfil):**

| Parâmetro | Tipo |
|---|---|
| `generos` | `list[string]` |
| `faixas_etarias` | `list[string]` |
| `estados` | `list[string]` |

**Query params de filtros avançados (comportamento digital):**

| Parâmetro | Tipo |
|---|---|
| `canais_preferidos` | `list[string]` |
| `dispositivos` | `list[string]` |
| `origens_sessao` | `list[string]` |
| `periodos_dia` | `list[string]` |
| `dias_semana` | `list[string]` |
| `categorias_visualizadas` | `list[string]` |
| `taxa_conversao_min` / `taxa_conversao_max` | `float` |
| `total_sessoes_min` / `total_sessoes_max` | `int` |
| `abandono_carrinho_min` / `abandono_carrinho_max` | `int` |
| `nps_recente_min` / `nps_recente_max` | `float` |

**Resposta:** `ContactsPageOut`
```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

---

### `GET /contacts/{contact_id}`

Retorna os dados resumidos de um contato específico (dados da tabela `gold_cliente_360`).

**Path params:** `contact_id` — ID do contato

**Resposta:** `ContactOut` (ver `models-doc.md`)

**Erro:** `404` — Contact not found

---

### `POST /contacts/`

Cria um novo contato.

**Body:** `ContactCreate`

```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "clientStatus": "string",
  "region": "string",
  "origin": "string"
}
```

**Resposta:** `ContactOut` — Status 201

---

### `PUT /contacts/{contact_id}`

Atualiza os dados de um contato.

**Path params:** `contact_id`

**Header:** `X-User-Name` — Nome do usuário que realizou a edição (padrão: `"Sistema"`)

**Body:** `ContactUpdate` (todos os campos opcionais)

**Resposta:** `ContactOut`

**Erro:** `404` — Contact not found

---

### `GET /contacts/{contact_id}/pedidos`

Retorna os últimos pedidos de um contato (usado no tooltip de última compra).

**Query params:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `limit` | `int` | Número de pedidos (padrão: 3, máx: 10) |

**Resposta:** `list[ContactPedidoOut]`

---

### `GET /contacts/{contact_id}/resumo`

Retorna o resumo agregado de compras de um contato.

**Resposta:** `ContactResumoOut`

**Erro:** `404` — Contact not found

---

### `GET /contacts/{contact_id}/activities`

Retorna o log de alterações do contato.

**Query params:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `limit` | `int` | Número de atividades (padrão: 50, máx: 100) |

**Resposta:** `list[ContactActivityOut]`

---

### `GET /contacts/export`

Exporta os contatos como CSV (streaming). Aceita os mesmos query params que `GET /contacts`.

**Resposta:** `text/csv; charset=utf-8` com header `Content-Disposition: attachment; filename=contatos.csv`

---

## Contact Details `/contact-details`

### `GET /contact-details/{contact_id}/details`

Retorna os dados cadastrais detalhados do contato.

**Resposta:** `ContactDetailOut`

**Erro:** `404` — Contact not found

---

### `PATCH /contact-details/{contact_id}/details`

Atualiza parcialmente os dados cadastrais do contato e registra a alteração no log de atividades.

**Header:** `X-User-Name` — Nome do usuário que realizou a edição

**Body:** `ContactDetailPatchIn` (todos os campos opcionais)

**Resposta:** `ContactDetailOut`

**Erro:** `404` — Contact not found

---

### `DELETE /contact-details/{contact_id}/details`

Remove o contato do sistema.

**Resposta:**
```json
{ "message": "Contact deleted successfully" }
```

**Erro:** `404` — Contact not found

---

### `GET /contact-details/{contact_id}/dashboard`

Retorna as métricas, pedidos, tickets e produtos visualizados do contato para um período.

**Query params:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `period` | `string` | `current_month`, `last_3_months`, `current_semester`, `current_year`, `all_time` |
| `page` | `int` | Página de pedidos/tickets (padrão: 1) |
| `pageSize` | `int` | Itens por página (padrão: 5, máx: 500) |

**Resposta:** `ContactDashboardOut`

**Erro:** `404` — Contact not found

---

### `GET /contact-details/{contact_id}/metrics`

Retorna apenas as métricas financeiras e de comportamento do contato para um período.

**Query params:**

| Parâmetro | Tipo |
|---|---|
| `period` | `string` (mesmos valores de `/dashboard`) |

**Resposta:** `ContactMetricsOut`

---

### `GET /contact-details/{contact_id}/orders`

Retorna os pedidos paginados do contato para um período.

**Query params:** `page`, `pageSize`, `period`

**Resposta:** `ContactOrdersPageOut`

---

### `GET /contact-details/{contact_id}/tickets`

Retorna os tickets paginados do contato para um período.

**Query params:** `page`, `pageSize`, `period`

**Resposta:** `ContactTicketsPageOut`

---

### `GET /contact-details/{contact_id}/viewed-products`

Retorna os produtos visualizados pelo contato em um período.

**Query params:** `period`

**Resposta:** `list[ContactViewedProductOut]`

---

## Dashboard `/dashboard`

### `GET /dashboard/metrics`

Retorna os 6 KPIs do dashboard para o período selecionado, com comparação ao período anterior e ao mesmo período do ano anterior (YoY).

**Query params:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `period_type` | `string` | `2weeks`, `month`, `3months`, `semester`, `year`, `custom` (padrão: `month`) |
| `start_date` | `string` | `YYYY-MM-DD` — obrigatório quando `period_type=custom` |
| `end_date` | `string` | `YYYY-MM-DD` — obrigatório quando `period_type=custom` |

**Resposta:** `DashboardMetricsOut`
```json
{
  "period": { "start": "", "end": "", "prev_start": "", "prev_end": "", "yoy_start": "", "yoy_end": "" },
  "nps":               { "value": 0, "prev_value": 0, "trend_pct": 0, "yoy_value": 0, "yoy_pct": 0 },
  "vendas":            { "value": 0, "prev_value": 0, "trend_pct": 0, "yoy_value": 0, "yoy_pct": 0 },
  "clientes":          { "value": 0, "prev_value": 0, "trend_pct": 0, "yoy_value": 0, "yoy_pct": 0 },
  "tickets":           { "value": 0, "prev_value": 0, "trend_pct": 0, "yoy_value": 0, "yoy_pct": 0 },
  "leads_convertidos": { "value": 0, "prev_value": 0, "trend_pct": 0, "yoy_value": 0, "yoy_pct": 0 },
  "sessoes":           { "value": 0, "prev_value": 0, "trend_pct": 0, "yoy_value": 0, "yoy_pct": 0 }
}
```

---

### `GET /dashboard/revenue`

Retorna a série temporal de receita para o gráfico de barras.

**Query params:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `period_type` | `string` | Mesmo conjunto de `/dashboard/metrics` |
| `start_date` / `end_date` | `string` | Para `period_type=custom` |
| `granularity` | `string` | `total`, `category`, `product` (padrão: `total`) |
| `categories` | `string` | Nomes de categorias separados por vírgula |
| `product_ids` | `string` | UUIDs de produtos separados por vírgula |

**Resposta:** `RevenueChartOut`
```json
{
  "bucket": "month",
  "labels": ["Jan/2024", "Fev/2024"],
  "series": [{ "name": "Total", "data": [0.0, 0.0] }]
}
```

---

### `GET /dashboard/orders`

Retorna o total de pedidos e a distribuição de status para o `OrdersCard`.

**Query params:** `period_type`, `start_date`, `end_date`

**Resposta:** `OrdersCardOut`
```json
{
  "total": 0,
  "prev_total": 0,
  "trend_pct": 0.0,
  "aprovados_pct": 0.0,
  "processando_pct": 0.0,
  "recusados_pct": 0.0,
  "reembolsados_pct": 0.0
}
```

---

### `GET /dashboard/top-categories`

Retorna o ranking das top categorias por quantidade vendida ou receita.

**Query params:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `period_type` | `string` | |
| `start_date` / `end_date` | `string` | Para `period_type=custom` |
| `metric` | `string` | `vendidos` ou `receita` (padrão: `vendidos`) |
| `top_n` | `int` | Número de categorias (padrão: 5, máx: 20) |
| `order` | `string` | `desc` ou `asc` (padrão: `desc`) |

**Resposta:** `TopCategoriesOut`
```json
{
  "metric": "vendidos",
  "order": "desc",
  "items": [{ "name": "Eletronicos", "value": 0.0 }]
}
```

---

### `GET /dashboard/map`

Retorna os dados geográficos para o mapa coroplético.

**Query params:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `view` | `string` | `estados` ou `regioes` (padrão: `estados`) |
| `period_type` | `string` | |
| `start_date` / `end_date` | `string` | Para `period_type=custom` |

**Resposta:** `MapDataOut`
```json
{
  "view": "estados",
  "items": [{ "key": "SP", "total_pedidos": 0, "total_valor": 0.0 }]
}
```

---

## Sales `/sales`

### `GET /sales`

Lista pedidos com paginação, filtros e ordenação. Fonte: `gold_pedidos_detalhado`.

**Query params:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `page` | `int` | Página (padrão: 1) |
| `pageSize` | `int` | Itens por página (padrão: 20) |
| `tab` | `string` | `all`, `approved`, `processing`, `returned` — `returned` agrupa `Reembolsado` e `Recusado` |
| `search` | `string` | Busca por id_pedido ou nome do cliente |
| `status` | `list[string]` | Multi-select de status (`Aprovado`, `Processando`, `Recusado`, `Reembolsado`) |
| `category` | `list[string]` | Multi-select de categoria |
| `payment` | `list[string]` | Multi-select de método de pagamento |
| `date_from` / `date_to` | `string` | Período do pedido (`YYYY-MM-DD`) |
| `value_min` / `value_max` | `float` | Faixa de valor |
| `sort_by` | `string` | Coluna (`id_pedido`, `data_pedido`, `valor_pedido`, etc.) |
| `sort_dir` | `string` | `asc` ou `desc` |

**Resposta:** `SalesPageOut` — `{ data: SaleOut[], total, page, pageSize }`

---

### `GET /sales/{id_pedido}`

Retorna os detalhes de um pedido específico.

**Resposta:** `SaleOut`

**Erro:** `404` — Pedido não encontrado

---

### `PUT /sales/{id_pedido}`

Atualiza campos editáveis do pedido (status, método de pagamento, etc.) e registra a mudança em `ft_sale_activities`.

**Header:** `X-User-Name` — Nome do usuário que realizou a edição

**Body:** `SaleUpdate` (todos os campos opcionais)

**Resposta:** `SaleOut`

---

### `GET /sales/{id_pedido}/activities`

Retorna o log de alterações do pedido.

**Query params:** `limit` (padrão: 50)

**Resposta:** `list[SaleActivityOut]`

---

## Reviews `/reviews`

### `GET /reviews`

Lista avaliações pós-compra (`gold_avaliacoes_360`).

**Query params:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `product_id` | `string` | Filtrar avaliações de um produto |
| `contact_id` | `string` | Filtrar avaliações de um cliente |
| `nota_min` / `nota_max` | `float` | Faixa de nota (1 a 5) |
| `nps_min` / `nps_max` | `float` | Faixa de NPS (0 a 10) |
| `page` | `int` | Página |
| `pageSize` | `int` | Itens por página |

**Resposta:** `ReviewsPageOut`

---

### `GET /reviews/{review_id}`

Retorna uma avaliação específica.

**Resposta:** `ReviewOut`

---

## Tickets `/tickets`

### `GET /tickets`

Lista tickets de suporte (`gold_tickets_360`).

**Query params:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `page` | `int` | Página |
| `pageSize` | `int` | Itens por página |
| `status` | `list[string]` | `Finalizado`, `Em Andamento`, `Aberto` |
| `tipo_problema` | `list[string]` | Multi-select de tipo |
| `agente` | `list[string]` | Multi-select do agente responsável |
| `date_from` / `date_to` | `string` | Período da abertura |

**Resposta:** `TicketsPageOut`

---

## Bookmarks `/bookmarks` (autenticado)

> Exige `Authorization: Bearer <jwt>`. O `user_id` é extraído do token via `Depends(get_current_user)`.

### `GET /bookmarks`

Lista os bookmarks (favoritos) do usuário atual.

**Query params:** `kind` (`product`, `contact`, `sale`)

**Resposta:** `list[BookmarkOut]`

---

### `POST /bookmarks`

Marca uma entidade como favorita do usuário atual.

**Body:**
```json
{
  "kind": "product",
  "entity_id": "string",
  "name": "string",
  "email": "string",
  "price": 0.0,
  "total_sales": 0,
  "category": "string"
}
```

**Erro:** `409` — bookmark já existe (UniqueConstraint `user_id + entity_id`)

---

### `DELETE /bookmarks/{id}`

Remove um bookmark do usuário atual.

---

## Goals `/goals` (autenticado)

> Exige `Authorization: Bearer <jwt>`.

### `GET /goals`

Lista metas do usuário atual.

**Resposta:** `list[GoalOut]`

---

### `POST /goals`

Cria uma meta (período, métrica alvo, valor).

**Body:** `GoalCreate`

---

### `PATCH /goals/{id}`

Atualiza uma meta.

---

### `DELETE /goals/{id}`

Remove uma meta.

---

## Mentions `/mentions`

Endpoint de autocomplete usado pelo chat do agente IA para sugerir `@cliente`, `@produto`, `@pedido`.

### `GET /mentions`

**Query params:** `kind` (`product`, `contact`, `sale`), `query` (texto digitado após o `@`), `limit` (padrão: 10).

**Resposta:** `list[MentionOut]` — `[{ id, label, kind }]`

---

## Conversations `/conversations`

Histórico das conversas do agente de IA (persiste no banco em `agent_conversations`, paralelo à memória em RAM do agente — vide [decisão 24](../decisions-doc.md#24-memória-de-conversa-em-dicionário-em-memória-limite-20-mensagens)).

### `GET /conversations`

Lista conversas (resumos) do usuário.

**Resposta:** `list[ConversationOut]`

---

### `GET /conversations/{id}/messages`

Retorna o conteúdo completo de uma conversa.

---

### `POST /conversations`

Cria uma nova conversa (gera `session_id` UUID).

---

### `DELETE /conversations/{id}`

Remove uma conversa.

---

## Agent `/agent`

Router que delega para o módulo `ai-agent/` (importado dinamicamente — vide `architecture-doc.md`).

### `GET /agent/suggestions`

Retorna a lista de perguntas sugeridas exibida quando o chat é aberto pela primeira vez (cobre o diferencial "agente sugira perguntas relevantes" do case).

**Resposta:** `SuggestionsResponse`
```json
{
  "suggestions": [
    "Qual foi a receita total dos últimos 3 meses?",
    "Quais são os 5 produtos mais vendidos?",
    "Qual região gerou mais receita este ano?",
    "..."
  ]
}
```

> A lista vem de `SUGGESTED_QUESTIONS` em `ai-agent/prompts.py`.

---

### `POST /agent/chat`

Envia uma mensagem para o agente de IA e recebe a resposta.

**Body:** `ChatRequest`
```json
{
  "message": "Quais são os 5 produtos mais vendidos?",
  "session_id": "abc123-uuid"
}
```

**Resposta:** `ChatResponse`
```json
{
  "answer": "Os 5 produtos mais vendidos no último ano foram...",
  "sources": ["gold_pedidos_detalhado"],
  "queries": ["SELECT nome_produto, SUM(quantidade) FROM gold_pedidos_detalhado WHERE..."],
  "session_id": "abc123-uuid"
}
```

| Campo | Origem |
|---|---|
| `answer` | Saída final do agente PydanticAI (texto) |
| `sources` | Tabelas extraídas via regex sobre `FROM/JOIN` das queries executadas (vide [decisão 26](../decisions-doc.md#26-extração-de-fontes-via-regex-sobre-fromjoin-para-transparência)) |
| `queries` | Lista bruta de queries SQL executadas pelo agente — útil para debug |
| `session_id` | Mesmo `session_id` enviado no request (echo) |

**Histórico de sessão:** o agente mantém memória dos últimos turnos da conversa em RAM, indexado por `session_id` (vide [decisão 24](../decisions-doc.md#24-memória-de-conversa-em-dicionário-em-memória-limite-20-mensagens)).

**Erro:** `503` — `GEMINI_API_KEY` ausente ou inválida; `500` — falha do modelo

---

### `DELETE /agent/session/{session_id}`

Limpa o histórico da sessão no agente (memória em RAM).

**Resposta:** `ClearSessionResponse`
```json
{ "success": true, "session_id": "abc123-uuid" }
```

---

### `GET /agent/health`

Verifica se o banco está acessível pelo agente.

**Resposta:**
```json
{
  "status": "ok",
  "database": "ok"
}
```

Se o arquivo `vcommerce.db` não existir, `database` retorna `"banco não encontrado"` — sinal para rodar `python backend/database/seed.py`.

---

## Auth `/auth`

### `POST /auth/login`

Autentica um usuário e retorna um JWT.

**Body:** `LoginRequest`
```json
{ "email": "user@example.com", "password": "string" }
```

**Resposta `200`:** `LoginResponse`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "user": { "id": 1, "name": "Gustavo Admin", "email": "gustavo.admin@vcommerce.com", "role": "admin" }
}
```

O token expira em **8 horas** (configurado em `ACCESS_TOKEN_EXPIRE_MINUTES` no `app/config.py`). Não há refresh — após expirar, o usuário precisa relogar.

**Erro:** `401` — Email ou senha incorretos

---

## Users `/users`

Endpoints administrativos sobre a tabela `users` (criada pelo `seed.py` com 4 usuários: 1 admin, 2 sales, 1 support).

### `GET /users/me`

Retorna o usuário do JWT atual.

**Header:** `Authorization: Bearer <jwt>`

**Resposta:** `UserOut`

---

### `GET /users`

Lista todos os usuários cadastrados (para uso interno em telas administrativas).

**Resposta:** `list[UserOut]`