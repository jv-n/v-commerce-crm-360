# Models e Schemas

## Visão Geral

A camada de models usa **SQLAlchemy 2.0** com mapeamento declarativo via `Mapped` / `mapped_column` (estilo moderno, type-hinted). Os schemas de entrada/saída são **Pydantic v2** (`BaseModel`). O banco é SQLite (`vcommerce.db`) e as tabelas seguem a nomenclatura das camadas do pipeline de dados.

### Famílias de tabelas

| Prefixo | Origem | Mutabilidade |
|---|---|---|
| `gold_*` | Pipeline Databricks → CSV → `seed.py` | Read-mostly (recriadas a cada seed) |
| `dim_*` | Pipeline | Read-mostly |
| `ft_*_activities` | Backend (audit log) | Append-only |
| Operacionais (`users`, `bookmarks`, `goals`, `agent_conversations`) | Backend | Read/write |

> Backend e agente de IA consomem as mesmas tabelas Gold sem renormalização (vide [decisão 3](../decisions-doc.md#3-tabelas-gold-consumidas-pelo-orm-sem-renormalização)). O acoplamento ao schema do pipeline é intencional.

---

## Models SQLAlchemy

Lista das classes em `app/models/`. Cada arquivo registra uma ou mais classes que herdam de `Base` (declarativo). A coluna `Mapped[]` define o tipo Python; `mapped_column(...)` define o tipo SQL e constraints.

---

### `DimProduto` → `dim_produtos`

| Coluna | Tipo SQLAlchemy | Nullable |
|---|---|---|
| `id_produto` | `String` (PK) | Não |
| `nome_produto` | `String` | Não |
| `categoria` | `String` | Sim |
| `preco` | `Float` | Sim |
| `estoque_disponivel` | `Float` | Sim |
| `ativo` | `String` | Sim |
| `data_cadastro_produto` | `String` | Sim |

---

### `GoldDesempenhoProduto` → `gold_desempenho_produto`

| Coluna | Tipo SQLAlchemy | Nullable |
|---|---|---|
| `id_produto` | `String` (PK) | Não |
| `nota_media_avaliacao` | `Float` | Sim |
| `qtd_vendida` | `Float` | Sim |
| `receita_total` | `Float` | Sim |
| `ticket_medio` | `Float` | Sim |
| `qtd_avaliacoes` | `Float` | Sim |
| `nota_nps_media` | `Float` | Sim |
| `qtd_tickets_gerados` | `Float` | Sim |
| `tipo_problema_mais_frequente` | `String` | Sim |
| `ratio_ticket_por_venda` | `Float` | Sim |

---

### `GoldCliente360` → `gold_cliente_360`

Tabela Gold principal de contatos — visão 360° de cada cliente, consolidando dados cadastrais, pedidos, suporte, NPS e comportamento digital.

| Coluna | Tipo SQLAlchemy | Nullable |
|---|---|---|
| `id_cliente` | `String` (PK) | Não |
| `nome_completo` | `String` | Sim |
| `email` | `String` | Sim |
| `telefone` | `String` | Sim |
| `genero` | `String` | Sim |
| `data_nascimento` | `String` | Sim |
| `idade` | `Integer` | Sim |
| `faixa_etaria` | `String` | Sim |
| `data_cadastro` | `String` | Sim |
| `regiao` | `String` | Sim |
| `cidade` | `String` | Sim |
| `estado` | `String` | Sim |
| `pais` | `String` | Sim |
| `origem` | `String` | Sim |
| `total_pedidos` | `Float` | Sim |
| `total_produtos_distintos` | `Float` | Sim |
| `receita_total` | `Float` | Sim |
| `ticket_medio` | `Float` | Sim |
| `data_primeiro_pedido` | `String` | Sim |
| `data_ultimo_pedido` | `String` | Sim |
| `metodo_pagamento_favorito` | `String` | Sim |
| `total_tickets` | `Float` | Sim |
| `taxa_resolucao` | `Float` | Sim |
| `nota_media_atendimento` | `Float` | Sim |
| `nota_nps_media` | `Float` | Sim |
| `nota_nps_recente` | `Float` | Sim |
| `nota_produto_media` | `Float` | Sim |
| `categoria_nps_recente` | `String` | Sim |
| `segmento_cliente` | `String` | Sim |
| `taxa_conversao_pct` | `Float` | Sim |
| `total_sessoes` | `Float` | Sim |
| `total_eventos` | `Float` | Sim |
| `total_visualizacoes` | `Float` | Sim |
| `total_carrinho` | `Float` | Sim |
| `total_checkouts` | `Float` | Sim |
| `total_compras_cs` | `Float` | Sim |
| `total_abandono_carrinho` | `Float` | Sim |
| `tempo_medio_pagina_seg` | `Float` | Sim |
| `canal_preferido` | `String` | Sim |
| `dispositivo_preferido` | `String` | Sim |
| `origem_sessao_preferida` | `String` | Sim |
| `periodo_dia_preferido` | `String` | Sim |
| `dia_semana_mais_ativo` | `String` | Sim |
| `produto_mais_visualizado_id` | `String` | Sim |
| `produto_mais_visualizado` | `String` | Sim |
| `categoria_mais_visualizada` | `String` | Sim |
| `timestamp_ingestion` | `String` | Sim |

---

### `ContactActivity` → `ft_contact_activities`

Log de alterações manuais realizadas nos dados de um contato.

| Coluna | Tipo SQLAlchemy | Nullable |
|---|---|---|
| `id` | `Integer` (PK, autoincrement) | Não |
| `id_cliente` | `String` (indexed) | Não |
| `user_name` | `String(255)` | Não |
| `field_name` | `String(100)` | Não |
| `old_value` | `String` | Sim |
| `new_value` | `String` | Sim |
| `change_method` | `String(100)` | Não (default: `"Edicao direta"`) |
| `changed_at` | `DateTime` | Não |

---

### `Conversation` → `agent_conversations`

Histórico das conversas do agente de IA persistidas no banco (paralelo à memória em RAM do agente — vide [decisão 24](../decisions-doc.md#24-memória-de-conversa-em-dicionário-em-memória-limite-20-mensagens)).

| Coluna | Tipo SQLAlchemy | Nullable |
|---|---|---|
| `id` | `String` (PK, UUID) | Não |
| `session_id` | `String` (indexed) | Não |
| `user_id` | `String` | Sim |
| `role` | `String` (`user` ou `assistant`) | Não |
| `content` | `Text` | Não |
| `created_at` | `DateTime` | Não |

---

### `GoldPedidoDetalhado` → `gold_pedidos_detalhado`

Tabela primária para análises de pedidos. Vem desnormalizada do pipeline — pedidos já carregam dados do cliente e do produto, eliminando JOINs no backend.

| Coluna | Tipo SQLAlchemy | Nullable |
|---|---|---|
| `id_pedido` | `String` (PK) | Não |
| `id_cliente` | `String` | Sim |
| `nome_cliente` | `String` (`nome_completo` no DB) | Sim |
| `email` | `String` | Sim |
| `telefone` | `String` | Sim |
| `id_produto` | `String` | Sim |
| `nome_produto` | `String` | Sim |
| `categoria` | `String` | Sim |
| `ativo` | `Integer` | Sim |
| `data_pedido` | `String` (`YYYY-MM-DD`) | Sim |
| `ano_mes` | `String` (`YYYY-MM`) | Sim |
| `metodo_pagamento` | `String` | Sim |
| `status` | `String` (`Aprovado`, `Processando`, `Recusado`, `Reembolsado`) | Sim |
| `quantidade` | `Float` | Sim |
| `valor_pedido` | `Float` | Sim |
| `receita_bruta` | `Float` | Sim |
| `valor_reembolsado` | `Float` | Sim |
| `timestamp_ingestion` | `String` | Sim |

> **Cuidado:** `receita_bruta` e `valor_pedido` divergem. O dashboard de receita usa `receita_bruta` (filtra `status='Aprovado'`); o mapa por estado usa `valor_pedido` (sem filtro de status). As regras estão no prompt do agente em `ai-agent/prompts.py`.

---

### `SaleActivity` → `ft_sale_activities`

Audit log de edições em pedidos.

| Coluna | Tipo SQLAlchemy | Nullable |
|---|---|---|
| `id` | `Integer` (PK, autoincrement) | Não |
| `id_pedido` | `String` (indexed) | Não |
| `user_name` | `String(255)` | Não |
| `field_name` | `String(100)` | Não |
| `old_value` | `String` | Sim |
| `new_value` | `String` | Sim |
| `change_method` | `String(100)` | Não (default: `"Edição direta"`) |
| `changed_at` | `DateTime` | Não |

---

### `User` → `users`

Usuários do CRM (não confundir com `gold_cliente_360`, que são os clientes da V-Commerce).

| Coluna | Tipo SQLAlchemy | Nullable |
|---|---|---|
| `id` | `Integer` (PK, autoincrement) | Não |
| `name` | `String(255)` | Não |
| `email` | `String(255)` (unique) | Não |
| `password` | `String` (hash argon2id) | Não |
| `role` | `String(50)` (`admin`, `sales`, `support`) | Não |
| `created_at` | `DateTime` | Sim |

> Populado pelo `seed.py` com 4 usuários (3 distintos por papel + 1 sales extra). Senhas em texto-puro no `seed.py` são hash com `pwdlib` antes de gravar.

---

### `BookmarkItem` → `bookmarks`

Favoritos por usuário (produtos, contatos, pedidos).

| Coluna | Tipo SQLAlchemy | Nullable |
|---|---|---|
| `id` | `String` (PK, UUID) | Não |
| `user_id` | `String` | Sim |
| `kind` | `String` (`product`, `contact`, `sale`) | Não |
| `entity_id` | `String` | Não |
| `name` | `String` | Não |
| `email` | `String` | Sim |
| `price` | `Float` | Sim |
| `total_sales` | `Integer` | Sim |
| `category` | `String` | Sim |

**Constraint:** `UniqueConstraint(user_id, entity_id, name="uq_bookmark_user_entity")` — um usuário não pode marcar a mesma entidade duas vezes.

> A migração `migrate_user_scope.py` recria essa tabela com a constraint composta (a versão anterior usava só `entity_id`).

---

### `GoalItem` → `goals`

Metas configuradas pelo usuário.

| Coluna | Tipo SQLAlchemy | Nullable |
|---|---|---|
| `id` | `String` (PK) | Não |
| `user_id` | `String` | Sim |
| (campos de meta: período, métrica alvo, valor) | — | — |

---

### `Review` → `gold_avaliacoes_360`

Avaliações pós-compra.

| Coluna | Tipo SQLAlchemy | Nullable |
|---|---|---|
| `id_avaliacao` | `String` (PK) | Não |
| `id_cliente` | `String` | Sim |
| `id_produto` | `String` | Sim |
| `id_pedido` | `String` | Sim |
| `nota_produto` | `Float` | Sim |
| `nota_nps` | `Float` | Sim |
| `comentario` | `Text` | Sim |
| `categoria_nps` | `String` (`Promotor`, `Neutro`, `Detrator`) | Sim |
| `data_avaliacao` | `String` (`YYYY-MM-DD`) | Sim |

---

### `GoldTicket360` → `gold_tickets_360`

Tickets individuais de suporte.

| Coluna | Tipo SQLAlchemy | Nullable |
|---|---|---|
| `ticket_id` | `String` (PK) | Não |
| `id_cliente` | `String` | Sim |
| `nome_cliente` | `String` | Sim |
| `status_atendimento` | `String` (`Finalizado`, `Em Andamento`, `Aberto`) | Sim |
| `tipo_problema` | `String` | Sim |
| `data_abertura` | `String` (`YYYY-MM-DD`) | Sim |
| `hora_abertura` | `String` | Sim |
| `data_fechamento` | `String` | Sim |
| `agente_suporte` | `String` | Sim |
| `regiao_cliente` | `String` | Sim |
| `estado_cliente` | `String` | Sim |
| `faixa_etaria` | `String` | Sim |
| `id_pedido` | `String` | Sim |
| `tempo_resolucao_horas` | `Float` | Sim |
| `nota_avaliacao` | `Float` | Sim |

---

### `GoldSessaoResumo` → `gold_sessao_resumo`

Sessões individuais (clickstream agregado por sessão).

| Coluna | Tipo SQLAlchemy | Nullable |
|---|---|---|
| `id_sessao` | `String` (PK) | Não |
| `data_sessao` | `String` (`YYYY-MM-DD`) | Sim |
| `ano_mes` | `String` (`YYYY-MM`) | Sim |
| `canal` | `String` (`Web`, `Mobile`) | Sim |
| `dispositivo` | `String` | Sim |
| `origem_sessao` | `String` | Sim |
| `id_cliente` | `String` | Sim (nullable para visitantes anônimos) |
| `houve_conversao` | `Integer` (0 ou 1) | Sim |
| `tempo_total_seg` | `Float` | Sim |
| `total_eventos` | `Integer` | Sim |

---

### `ProductActivity` → `ft_product_activities`

Audit log de edições em produtos. Mesma estrutura de `SaleActivity` / `ContactActivity`, com `id_produto` como chave do registro alterado.

---

## Schemas Pydantic

Schemas Pydantic v2 (`BaseModel`) usados para entrada/saída de endpoints. Eles **não** espelham 1:1 os modelos SQLAlchemy — em geral renomeiam campos para `camelCase` (esperado pelo frontend) e omitem colunas internas.

Cada schema mora em `app/schemas/<dominio>Schemas.py`. A convenção é:
- `<Entidade>Create` — payload de criação (campos obrigatórios mais restritivos)
- `<Entidade>Update` — payload de update (todos os campos opcionais)
- `<Entidade>Out` — resposta padrão (todos os campos do recurso)
- `<Entidade>sPageOut` — resposta paginada (`data`, `total`, `page`, `pageSize`)

---

### `ProductSchema`

**Usado em:** `GET /products`, `GET /products/{product_id}`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `str` | |
| `name` | `str` | |
| `price` | `float \| None` | |
| `stock` | `int` | |
| `category` | `str \| None` | |
| `status` | `str` | `Ativo` ou `Inativo` |
| `rating` | `float \| None` | Nota média de avaliação |
| `total_sales` | `float \| None` | Quantidade vendida |
| `receita_total` | `float \| None` | |
| `ticket_medio` | `float \| None` | |
| `qtd_avaliacoes` | `float \| None` | |
| `nota_nps_media` | `float \| None` | |
| `qtd_tickets_gerados` | `float \| None` | |
| `tipo_problema_mais_frequente` | `str \| None` | |
| `ratio_ticket_por_venda` | `float \| None` | |
| `created_at` | `str \| None` | |

---

### `ProductsPageOut`

**Usado em:** `GET /products`

| Campo | Tipo |
|---|---|
| `data` | `list[ProductSchema]` |
| `total` | `int` |
| `page` | `int` |
| `pageSize` | `int` |

---

### `ContactCreate`

**Usado em:** `POST /contacts/`

| Campo | Tipo | Obrigatório |
|---|---|---|
| `name` | `str` | Sim |
| `email` | `str \| None` | Não |
| `phone` | `str \| None` | Não |
| `clientStatus` | `str \| None` | Não |
| `region` | `str \| None` | Não |
| `origin` | `str \| None` | Não |

---

### `ContactUpdate`

**Usado em:** `PUT /contacts/{contact_id}`

Todos os campos são opcionais. Inclui os mesmos campos de `ContactCreate` acrescidos de: `gender`, `birthDate`, `age`, `responsible`, `createdAt`, `country`, `state`, `city`.

---

### `ContactOut`

**Usado em:** `GET /contacts`, `GET /contacts/{contact_id}`, `POST /contacts/`, `PUT /contacts/{contact_id}`

| Campo | Tipo | Origem na tabela `gold_cliente_360` |
|---|---|---|
| `id` | `str` | `id_cliente` |
| `name` | `str \| None` | `nome_completo` |
| `email` | `str \| None` | `email` |
| `phone` | `str \| None` | `telefone` |
| `clientStatus` | `str \| None` | `segmento_cliente` |
| `region` | `str \| None` | `regiao` |
| `origin` | `str \| None` | `origem` |
| `purchases` | `int` | `total_pedidos` |
| `distinctProducts` | `int` | `total_produtos_distintos` |
| `totalRevenue` | `float` | `receita_total` |
| `avgTicket` | `float` | `ticket_medio` |
| `firstPurchase` | `str \| None` | `data_primeiro_pedido` (formatado) |
| `lastPurchase` | `str \| None` | `data_ultimo_pedido` (formatado) |
| `favPaymentMethod` | `str \| None` | `metodo_pagamento_favorito` |
| `totalTickets` | `int` | `total_tickets` |
| `resolutionRate` | `float` | `taxa_resolucao` |
| `avgSupportRating` | `float \| None` | `nota_media_atendimento` |
| `engagement` | `str` | `categoria_nps_recente` (normalizado) |
| `engagementScore` | `float` | `nota_nps_media` (normalizado 0–100) |
| `productRating` | `float \| None` | `nota_produto_media` |
| `createdAt` | `str \| None` | `data_primeiro_pedido` (compat. frontend) |

---

### `ContactsPageOut`

**Usado em:** `GET /contacts`

| Campo | Tipo |
|---|---|
| `data` | `list[ContactOut]` |
| `total` | `int` |
| `page` | `int` |
| `pageSize` | `int` |

---

### `ContactDetailOut`

**Usado em:** `GET /contact-details/{id}/details`, `PATCH /contact-details/{id}/details`

| Campo | Tipo |
|---|---|
| `id` | `str` |
| `name` | `str \| None` |
| `email` | `str \| None` |
| `phone` | `str \| None` |
| `gender` | `str \| None` |
| `birthDate` | `str \| None` |
| `age` | `int \| None` |
| `ageRange` | `str \| None` |
| `createdAt` | `str \| None` |
| `city` | `str \| None` |
| `state` | `str \| None` |
| `region` | `str \| None` |
| `country` | `str \| None` |
| `origin` | `str \| None` |
| `clientStatus` | `str \| None` |
| `contactType` | `str` |

---

### `ContactMetricsOut`

**Usado em:** `GET /contact-details/{id}/metrics`, `GET /contact-details/{id}/dashboard`

| Campo | Tipo | Descrição |
|---|---|---|
| `contactType` | `str` | Tipo do contato |
| `period` | `str` | Período consultado |
| `periodLabel` | `str` | Rótulo legível do período |
| `periodStart` | `str \| None` | Data de início do período |
| `periodEnd` | `str \| None` | Data de fim do período |
| `comprasMes` | `float` | Receita total no período |
| `mediaNps` | `float \| None` | Média NPS no período |
| `categoriaNpsRecente` | `str \| None` | Categoria NPS (`Promotor`, `Neutro`, `Detrator`) |
| `origemLead` | `str \| None` | Origem de aquisição |
| `produtoMaisVisualizado` | `str \| None` | Produto mais visualizado |
| `categoriaMaisVisualizada` | `str \| None` | Categoria mais visualizada |
| `totalSessoes` | `int` | Total de sessões no período |
| `totalVisualizacoes` | `int` | Total de visualizações |
| `totalCarrinho` | `int` | Total de adições ao carrinho |
| `totalCheckouts` | `int` | Total de checkouts |
| `totalAbandonoCarrinho` | `int` | Total de abandonos de carrinho |
| `taxaConversaoPct` | `float` | Taxa de conversão em % |
| `categoriasMaisCompradas` | `list[ContactCategoryMetricOut]` | Top categorias compradas |

---

### `ContactDashboardOut`

**Usado em:** `GET /contact-details/{id}/dashboard`

| Campo | Tipo |
|---|---|
| `metrics` | `ContactMetricsOut` |
| `orders` | `ContactOrdersPageOut` |
| `tickets` | `ContactTicketsPageOut` |
| `viewedProducts` | `list[ContactViewedProductOut]` |

---

### `DashboardMetricsOut`

**Usado em:** `GET /dashboard/metrics`

| Campo | Tipo | Descrição |
|---|---|---|
| `period` | `PeriodInfo` | Datas de início/fim do período e dos comparativos |
| `nps` | `MetricOut` | KPI de NPS médio |
| `vendas` | `MetricOut` | KPI de receita total |
| `clientes` | `MetricOut` | KPI de clientes únicos |
| `tickets` | `MetricOut` | KPI de tickets solucionados |
| `leads_convertidos` | `MetricOut` | KPI de leads convertidos |
| `sessoes` | `MetricOut` | KPI de sessões |

**`MetricOut`:**

| Campo | Tipo | Descrição |
|---|---|---|
| `value` | `float` | Valor do período atual |
| `prev_value` | `float` | Valor do período anterior |
| `trend_pct` | `float` | Variação `%` em relação ao período anterior |
| `yoy_value` | `float` | Valor do mesmo período no ano anterior |
| `yoy_pct` | `float` | Variação `%` em relação ao mesmo período do ano anterior |

**`PeriodInfo`:**

| Campo | Tipo |
|---|---|
| `start` | `str` |
| `end` | `str` |
| `prev_start` | `str` |
| `prev_end` | `str` |
| `yoy_start` | `str` |
| `yoy_end` | `str` |

---

### `RevenueChartOut`

**Usado em:** `GET /dashboard/revenue`

| Campo | Tipo | Descrição |
|---|---|---|
| `bucket` | `str` | Granularidade: `day`, `week`, `month` ou `year` |
| `labels` | `list[str]` | Rótulos do eixo X |
| `series` | `list[RevenueSeriesOut]` | Séries de dados |

---

### `OrdersCardOut`

**Usado em:** `GET /dashboard/orders`

| Campo | Tipo |
|---|---|
| `total` | `int` |
| `prev_total` | `int` |
| `trend_pct` | `float` |
| `aprovados_pct` | `float` |
| `processando_pct` | `float` |
| `recusados_pct` | `float` |
| `reembolsados_pct` | `float` |

---

### `TopCategoriesOut`

**Usado em:** `GET /dashboard/top-categories`

| Campo | Tipo |
|---|---|
| `metric` | `str` |
| `order` | `str` |
| `items` | `list[TopCategoryItemOut]` |

---

### `MapDataOut`

**Usado em:** `GET /dashboard/map`

| Campo | Tipo |
|---|---|
| `view` | `str` (`estados` ou `regioes`) |
| `items` | `list[MapItemOut]` |

**`MapItemOut`:**

| Campo | Tipo |
|---|---|
| `key` | `str` (sigla do estado ou nome da região) |
| `total_pedidos` | `int` |
| `total_valor` | `float` |

---

### `LoginRequest` / `LoginResponse`

**Usado em:** `POST /auth/login`

`LoginRequest`:
| Campo | Tipo |
|---|---|
| `email` | `EmailStr` |
| `password` | `str` |

`LoginResponse`:
| Campo | Tipo |
|---|---|
| `access_token` | `str` |
| `token_type` | `str` (default: `"bearer"`) |
| `user` | `dict` |

---

### `SaleOut` / `SalesPageOut`

**Usado em:** `GET /sales`, `GET /sales/{id}`, `PUT /sales/{id}`

| Campo | Tipo | Origem em `gold_pedidos_detalhado` |
|---|---|---|
| `id_pedido` | `str` | `id_pedido` |
| `id_cliente` | `str \| None` | `id_cliente` |
| `nome_cliente` | `str \| None` | `nome_completo` |
| `email` | `str \| None` | `email` |
| `telefone` | `str \| None` | `telefone` |
| `id_produto` | `str \| None` | `id_produto` |
| `nome_produto` | `str \| None` | `nome_produto` |
| `categoria` | `str \| None` | `categoria` |
| `data_pedido` | `str \| None` | `data_pedido` |
| `metodo_pagamento` | `str \| None` | `metodo_pagamento` |
| `status` | `str \| None` | `status` |
| `quantidade` | `float \| None` | `quantidade` |
| `valor_pedido` | `float \| None` | `valor_pedido` |
| `receita_bruta` | `float \| None` | `receita_bruta` |
| `valor_reembolsado` | `float \| None` | `valor_reembolsado` |

---

### `ChatRequest` / `ChatResponse`

**Usado em:** `POST /agent/chat`

`ChatRequest`:
| Campo | Tipo |
|---|---|
| `message` | `str` |
| `session_id` | `str` |

`ChatResponse`:
| Campo | Tipo |
|---|---|
| `answer` | `str` |
| `sources` | `list[str]` (tabelas referenciadas) |
| `queries` | `list[str]` (queries SQL executadas) |
| `session_id` | `str` |

---

### `SuggestionsResponse`

**Usado em:** `GET /agent/suggestions`

| Campo | Tipo |
|---|---|
| `suggestions` | `list[str]` |

---

### `ReviewOut`

**Usado em:** `GET /reviews`, `GET /reviews/{id}`

| Campo | Tipo |
|---|---|
| `id_avaliacao` | `str` |
| `id_cliente` | `str \| None` |
| `id_produto` | `str \| None` |
| `id_pedido` | `str \| None` |
| `nota_produto` | `float \| None` |
| `nota_nps` | `float \| None` |
| `comentario` | `str \| None` |
| `categoria_nps` | `str \| None` |
| `data_avaliacao` | `str \| None` |

---

### `TicketOut` / `TicketsPageOut`

**Usado em:** `GET /tickets`

| Campo | Tipo | Origem em `gold_tickets_360` |
|---|---|---|
| `ticket_id` | `str` | `ticket_id` |
| `id_cliente` | `str \| None` | `id_cliente` |
| `status_atendimento` | `str \| None` | `status_atendimento` |
| `tipo_problema` | `str \| None` | `tipo_problema` |
| `data_abertura` | `str \| None` | `data_abertura` |
| `data_fechamento` | `str \| None` | `data_fechamento` |
| `agente_suporte` | `str \| None` | `agente_suporte` |
| `tempo_resolucao_horas` | `float \| None` | `tempo_resolucao_horas` |
| `nota_avaliacao` | `float \| None` | `nota_avaliacao` |

---

### `BookmarkOut`

**Usado em:** `GET /bookmarks`, `POST /bookmarks`

| Campo | Tipo |
|---|---|
| `id` | `str` |
| `kind` | `str` (`product`, `contact`, `sale`) |
| `entity_id` | `str` |
| `name` | `str` |
| `email` | `str \| None` |
| `price` | `float \| None` |
| `total_sales` | `int \| None` |
| `category` | `str \| None` |

---

### `MentionOut`

**Usado em:** `GET /mentions`

| Campo | Tipo |
|---|---|
| `id` | `str` |
| `label` | `str` |
| `kind` | `str` |

---

### `UserOut`

**Usado em:** `GET /users`, `GET /users/me`

| Campo | Tipo |
|---|---|
| `id` | `int` |
| `name` | `str` |
| `email` | `str` |
| `role` | `str` |

> Note que `password` **não** está no schema — nunca é devolvida pelo backend.