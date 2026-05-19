# Camada Gold

## Visão Geral

> Descreva brevemente o objetivo da camada Gold no pipeline da V-Commerce.

**Notebook:** `03_gold_vcommerce.ipynb`  
**Origem:** `silver.*`  
**Destino:** `gold.*` (Delta Lake no Databricks) → exportado para `gold-data-csvs/`

---

## Data Marts produzidos

| Tabela | Descrição | Consumido por |
|---|---|---|
| `gold_cliente_360` | Visão consolidada por cliente | Backend, Agente de IA |
| `gold_kpis_vendas_mensal` | KPIs de vendas agregados por mês | Backend, Agente de IA |
| `gold_vendas_por_dimensao` | Vendas por mês, região e categoria | Backend, Agente de IA |
| `gold_desempenho_produto` | Desempenho individual de cada produto | Backend, Agente de IA |
| `gold_analise_suporte_por_tipo` | Tickets agrupados por tipo de problema | Agente de IA |
| `gold_analise_suporte_por_agente` | Desempenho por agente de suporte | Agente de IA |
| `gold_satisfacao_nps` | NPS e satisfação por mês e categoria | Backend, Agente de IA |

---

## Detalhamento por Data Mart

> Para cada tabela Gold, documente as tabelas Silver de origem, as métricas calculadas e o schema final. Repita o bloco abaixo para cada tabela.

---

### `gold_cliente_360`

**Tabelas Silver utilizadas**

- `dim_clientes`
- `ft_pedidos`
- `ft_tickets_suporte`
- `ft_avaliacoes`

**Métricas calculadas**

| Coluna | Fórmula / Lógica |
|---|---|
| `total_pedidos` | |
| `receita_total` | |
| `ticket_medio` | |
| `taxa_resolucao` | |
| `segmento_cliente` | |

**Schema final**

| Coluna | Tipo | Descrição |
|---|---|---|
| `id_cliente` | `string` | |
| `nome_completo` | `string` | |
| | | |

---

### `gold_kpis_vendas_mensal`

**Tabelas Silver utilizadas**

- `ft_pedidos`
- `dim_clientes`

**Métricas calculadas**

| Coluna | Fórmula / Lógica |
|---|---|
| `receita_total` | |
| `ticket_medio` | |
| `taxa_cancelamento` | |
| `novos_clientes` | |

**Schema final**

| Coluna | Tipo | Descrição |
|---|---|---|
| `ano_mes` | `string` | |
| | | |

---

### `gold_vendas_por_dimensao`

**Tabelas Silver utilizadas**

- `ft_pedidos`

**Métricas calculadas**

| Coluna | Fórmula / Lógica |
|---|---|
| `receita_total` | |
| `total_pedidos` | |
| `ticket_medio` | |

**Schema final**

| Coluna | Tipo | Descrição |
|---|---|---|
| `ano_mes` | `string` | |
| `regiao` | `string` | |
| `categoria` | `string` | |
| | | |

---

### `gold_desempenho_produto`

**Tabelas Silver utilizadas**

- `dim_produtos`
- `ft_pedidos`
- `ft_avaliacoes`
- `ft_tickets_suporte`

**Métricas calculadas**

| Coluna | Fórmula / Lógica |
|---|---|
| `receita_total` | |
| `nota_media_avaliacao` | |
| `ratio_ticket_por_venda` | |

**Schema final**

| Coluna | Tipo | Descrição |
|---|---|---|
| `id_produto` | `string` | |
| | | |

---

### `gold_analise_suporte_por_tipo`

**Tabelas Silver utilizadas**

- `ft_tickets_suporte`
- `dim_tipos_problema`

**Métricas calculadas**

| Coluna | Fórmula / Lógica |
|---|---|
| `taxa_resolucao` | |
| `tempo_medio_resolucao_horas` | |

**Schema final**

| Coluna | Tipo | Descrição |
|---|---|---|
| `tipo_problema` | `string` | |
| | | |

---

### `gold_analise_suporte_por_agente`

**Tabelas Silver utilizadas**

- `ft_tickets_suporte`
- `dim_agentes_suporte`

**Métricas calculadas**

| Coluna | Fórmula / Lógica |
|---|---|
| `taxa_resolucao` | |
| `tempo_medio_resolucao_horas` | |
| `nota_media_atendimento` | |

**Schema final**

| Coluna | Tipo | Descrição |
|---|---|---|
| `agente_suporte` | `string` | |
| | | |

---

### `gold_satisfacao_nps`

**Tabelas Silver utilizadas**

- `ft_avaliacoes`

**Métricas calculadas**

| Coluna | Fórmula / Lógica |
|---|---|
| `nps_score` | `(% promotores - % detratores)` |
| `pct_promotores` | |
| `pct_detratores` | |

**Schema final**

| Coluna | Tipo | Descrição |
|---|---|---|
| `ano_mes` | `string` | |
| `categoria` | `string` | |
| | | |