# Endpoints

> Documentação de todos os endpoints da API. Para cada router, liste os endpoints com método, path, parâmetros e exemplo de resposta.

**Base URL:** `http://localhost:8000`  
**Documentação interativa:** `http://localhost:8000/docs`

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

> Preencha com os parâmetros e resposta do endpoint.

### `GET /contacts/{contact_id}`

> Preencha com os parâmetros e resposta do endpoint.

---

## Sales `/sales`

### `GET /sales`

> Preencha com os parâmetros e resposta do endpoint.

---

## Reviews `/reviews`

### `GET /reviews`

> Preencha com os parâmetros e resposta do endpoint.

---

## Agent `/agent`

### `POST /agent/chat`

Envia uma mensagem para o agente de IA e recebe a resposta.

**Body:**
```json
{
  "message": "Quais são os 5 produtos mais vendidos?",
  "session_id": "abc123"
}
```

**Resposta:**
```json
{
  "answer": "",
  "sources": [],
  "session_id": "abc123"
}
```

### `GET /agent/health`

Verifica se o banco está acessível pelo agente.

**Resposta:**
```json
{
  "status": "ok",
  "database": "ok"
}
```

---

## Users `/users`

### `POST /users/login`

> Preencha com os parâmetros e resposta do endpoint.

---

## Conversations `/conversations`

### `GET /conversations`

> Preencha com os parâmetros e resposta do endpoint.