# Camada Silver

## Visão Geral

> Descreva brevemente o objetivo da camada Silver no pipeline da V-Commerce.

**Notebook:** `02_silver_vcommerce.ipynb`  
**Origem:** `bronze.*`  
**Destino:** `silver.*` (Delta Lake no Databricks)

---

## Tabelas produzidas

| Tabela | Tipo | Descrição |
|---|---|---|
| `silver.dim_categorias_produto` | Dimensão | |
| `silver.dim_status_pedido` | Dimensão | |
| `silver.dim_tipos_problema` | Dimensão | |
| `silver.dim_agentes_suporte` | Dimensão | |
| `silver.dim_produtos` | Dimensão | |
| `silver.dim_clientes` | Dimensão | |
| `silver.ft_pedidos` | Fato | |
| `silver.ft_avaliacoes` | Fato | |
| `silver.ft_tickets_suporte` | Fato | |
| `silver.ft_clickstream` | Fato | |

---

## Tratamento por tabela

> Para cada tabela, documente os problemas encontrados na Bronze e o tratamento aplicado. Repita o bloco abaixo para cada tabela.

---

### `dim_categorias_produto`

**Problemas identificados**

| Coluna | Problema | Tratamento |
|---|---|---|
| `categoria` | | |

**Colunas derivadas**

| Coluna | Lógica |
|---|---|
| `segmento` | |

**Schema final**

| Coluna | Tipo |
|---|---|
| `categoria` | `string` |
| `segmento` | `string` |
| `timestamp_ingestion` | `timestamp` |

**Decisões de projeto**

> Registre aqui qualquer decisão que diverge do comportamento óbvio (ex: por que nulos foram descartados em vez de mantidos).

---

### `dim_clientes`

**Problemas identificados**

| Coluna | Problema | Tratamento |
|---|---|---|
| | | |

**Colunas derivadas**

| Coluna | Lógica |
|---|---|
| | |

**Schema final**

| Coluna | Tipo |
|---|---|
| | |

**Decisões de projeto**

>

---

### `dim_produtos`

**Problemas identificados**

| Coluna | Problema | Tratamento |
|---|---|---|
| | | |

**Colunas derivadas**

| Coluna | Lógica |
|---|---|
| | |

**Schema final**

| Coluna | Tipo |
|---|---|
| | |

**Decisões de projeto**

>

---

### `ft_pedidos`

**Problemas identificados**

| Coluna | Problema | Tratamento |
|---|---|---|
| | | |

**Colunas derivadas**

| Coluna | Lógica |
|---|---|
| | |

**Schema final**

| Coluna | Tipo |
|---|---|
| | |

**Decisões de projeto**

>

---

### `ft_avaliacoes`

**Problemas identificados**

| Coluna | Problema | Tratamento |
|---|---|---|
| | | |

**Colunas derivadas**

| Coluna | Lógica |
|---|---|
| | |

**Schema final**

| Coluna | Tipo |
|---|---|
| | |

**Decisões de projeto**

>

---

### `ft_tickets_suporte`

**Problemas identificados**

| Coluna | Problema | Tratamento |
|---|---|---|
| | | |

**Colunas derivadas**

| Coluna | Lógica |
|---|---|
| | |

**Schema final**

| Coluna | Tipo |
|---|---|
| | |

**Decisões de projeto**

>

---

### `ft_clickstream`

**Problemas identificados**

| Coluna | Problema | Tratamento |
|---|---|---|
| | | |

**Colunas derivadas**

| Coluna | Lógica |
|---|---|
| | |

**Schema final**

| Coluna | Tipo |
|---|---|
| | |

**Decisões de projeto**

>