# Models e Schemas

## Visão Geral

> Descreva brevemente a camada de models e schemas do backend.

---

## Models SQLAlchemy

> Para cada model, liste as colunas, tipos e a tabela do banco que ele mapeia.

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

### `Conversation` → `conversations`

> Preencha com as colunas do model.

| Coluna | Tipo SQLAlchemy | Nullable |
|---|---|---|
| | | |

---

> Repita o bloco acima para os demais models: `contactModel`, `orderModel`, `reviewModel`, `saleModel`, `userModel`.

---

## Schemas Pydantic

> Para cada schema, descreva os campos e em quais endpoints ele é usado.

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

> Repita o bloco acima para os demais schemas: `contactSchemas`, `orderSchemas`, `reviewSchemas`, `salesSchemas`, `userSchemas`, `agentSchemas`, `conversationSchemas`.