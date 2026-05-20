# Camada Gold

## Visão Geral

A camada Gold consolida e agrega os dados tratados da Silver em Data Marts prontos para consumo. As tabelas são **desnormalizadas por design**: cada uma responde a uma pergunta de negócio clara, com JOINs já feitos e métricas calculadas, para que o backend FastAPI e o agente de IA não precisem executar lógica de agregação em tempo de consulta.

**Notebook:** `03_gold_vcommerce.ipynb`  
**Origem:** `vcommerce_catalog.vcommerce_silver.*`  
**Destino:** `vcommerce_catalog.vcommerce_gold.*` → exportado para `data-engineering/gold-data-csvs/`

---

## Princípios da camada Gold

- **Orientação ao consumidor** — cada tabela foi desenhada a partir das perguntas de negócio dos stakeholders (Diretor Comercial, Customer Success, Gerente de Produto)
- **Desnormalização intencional** — campos de outras dimensões são incorporados diretamente, eliminando JOINs em tempo de consulta
- **Métricas calculadas** — campos como `taxa_cancelamento`, `ratio_ticket_por_venda` e `nps_score` são computados na Gold e entregues prontos
- **Exportação para SQLite** — ao final do pipeline, as tabelas são exportadas como CSVs e carregadas no banco local via `seed.py`

---

## Data Marts produzidos

| Tabela | Stakeholder principal | Consumido por |
|---|---|---|
| `gold_cliente_360` | Fernanda Souza — Diretora de Customer Success | Backend (perfil do cliente), Agente de IA |
| `gold_kpis_vendas_mensal` | Ricardo Alves — Diretor Comercial | Backend (dashboard KPIs), Agente de IA |
| `gold_vendas_por_dimensao` | Ricardo Alves — Diretor Comercial | Backend (gráficos por região/categoria), Agente de IA |
| `gold_desempenho_produto` | Marcelo Teixeira — Gerente de Produto | Backend (catálogo), Agente de IA |
| `gold_analise_suporte_por_tipo` | Ops de Suporte | Agente de IA |
| `gold_analise_suporte_por_agente` | Ops de Suporte | Agente de IA |
| `gold_satisfacao_nps` | Customer Success | Backend, Agente de IA |
| `gold_analise_suporte_cliente` | Customer Success | Backend (perfil do cliente) |
| `gold_pedidos_detalhado` | Analista de Operações | Backend (listagem de pedidos) |
| `gold_pedidos_por_status` | Diretor Comercial | Backend (dashboard) |
| `gold_vendas_mensais` | Diretor Comercial | Backend (dashboard) |

---

## Detalhamento por Data Mart

---

### `gold_cliente_360`

**Tabelas Silver utilizadas:** `dim_clientes`, `ft_pedidos`, `ft_tickets_suporte`, `ft_avaliacoes`, `ft_clickstream`, `dim_produtos`

**Descrição:** Uma linha por cliente com toda a visão consolidada — dados cadastrais, métricas de compra, histórico de suporte, NPS e comportamento digital. Responde à demanda da Diretora de Customer Success: "Em segundos, ver o histórico completo de um cliente".

**Métricas calculadas:**

| Coluna | Fórmula |
|---|---|
| `total_pedidos` | `COUNT(id_pedido)` por cliente (pedidos não cancelados) |
| `receita_total` | `SUM(valor_pedido)` por cliente |
| `ticket_medio` | `receita_total / total_pedidos` |
| `data_primeiro_pedido` | `MIN(data_pedido)` |
| `data_ultimo_pedido` | `MAX(data_pedido)` |
| `metodo_pagamento_favorito` | Método de pagamento mais frequente (`row_number()` sobre contagem) |
| `total_tickets` | `COUNT(ticket_id)` por cliente |
| `taxa_resolucao` | `tickets_resolvidos / total_tickets` |
| `nota_media_atendimento` | `AVG(nota_avaliacao)` dos tickets |
| `nota_nps_media` | `AVG(nota_nps)` das avaliações |
| `nota_produto_media` | `AVG(nota_produto)` das avaliações |
| `categoria_nps_predominante` | Categoria NPS mais frequente (`Promotor`, `Neutro`, `Detrator`) |
| `segmento_cliente` | Calculado a partir de `receita_total` e `data_ultimo_pedido` → `VIP`, `Ativo`, `Inativo`, `Novo` |

**Schema final (colunas principais):**

| Coluna | Tipo | Descrição |
|---|---|---|
| `id_cliente` | `string` | Identificador único do cliente |
| `nome_completo` | `string` | Nome e sobrenome |
| `email` | `string` | E-mail |
| `regiao` | `string` | Região geográfica |
| `origem` | `string` | Canal de aquisição |
| `total_pedidos` | `real` | Total de pedidos |
| `receita_total` | `real` | Receita gerada (R$) |
| `ticket_medio` | `real` | Valor médio por pedido (R$) |
| `segmento_cliente` | `string` | Segmento comportamental |
| `categoria_nps_predominante` | `string` | Perfil NPS do cliente |

---

### `gold_kpis_vendas_mensal`

**Tabelas Silver utilizadas:** `ft_pedidos`, `dim_clientes`

**Descrição:** Uma linha por mês com os KPIs gerais de vendas. Alimenta o painel de KPIs do dashboard e as análises de tendência temporal. Responde ao Diretor Comercial: "Em segundos, entender se o mês está indo bem ou mal".

**Métricas calculadas:**

| Coluna | Fórmula |
|---|---|
| `receita_total` | `SUM(valor_pedido)` — pedidos não cancelados |
| `total_pedidos` | `COUNT(id_pedido)` total |
| `total_clientes_ativos` | `COUNT(DISTINCT id_cliente)` com pedido no mês |
| `pedidos_cancelados` | `COUNT` de pedidos com status `Cancelado` |
| `novos_clientes` | Clientes cujo `MIN(data_pedido)` cai nesse mês |
| `ticket_medio` | `receita_total / (total_pedidos - pedidos_cancelados)` |
| `taxa_cancelamento` | `pedidos_cancelados / total_pedidos` (0 a 1) |

---

### `gold_vendas_por_dimensao`

**Tabelas Silver utilizadas:** `ft_pedidos`, `dim_clientes`, `dim_produtos`

**Descrição:** Vendas detalhadas agrupadas por mês, região geográfica e categoria de produto. Permite análises cruzadas como "qual região e categoria puxaram a receita para baixo em determinado mês".

**Métricas calculadas:**

| Coluna | Fórmula |
|---|---|
| `receita_total` | `SUM(valor_pedido)` |
| `total_pedidos` | `COUNT(id_pedido)` |
| `quantidade_itens_vendidos` | `SUM(quantidade)` |
| `ticket_medio` | `receita_total / total_pedidos` |

---

### `gold_desempenho_produto`

**Tabelas Silver utilizadas:** `dim_produtos`, `ft_pedidos`, `ft_avaliacoes`, `ft_tickets_suporte`

**Descrição:** Uma linha por produto com todas as métricas de desempenho: receita, avaliações, tickets e o `ratio_ticket_por_venda`. Responde ao Gerente de Produto: "Quais produtos vendem bem mas geram tantos tickets que não compensam?".

**Métricas calculadas:**

| Coluna | Fórmula |
|---|---|
| `receita_total` | `SUM(valor_pedido)` |
| `qtd_vendida` | `SUM(quantidade)` |
| `ticket_medio` | `receita_total / qtd_vendida` |
| `nota_media_avaliacao` | `AVG(nota_produto)` |
| `qtd_avaliacoes` | `COUNT(id_avaliacao)` |
| `nota_nps_media` | `AVG(nota_nps)` |
| `qtd_tickets_gerados` | `COUNT(ticket_id)` relacionados ao produto |
| `tipo_problema_mais_frequente` | Tipo de ticket mais comum via `row_number()` |
| `ratio_ticket_por_venda` | `qtd_tickets_gerados / qtd_vendida` |

---

### `gold_analise_suporte_por_tipo`

**Tabelas Silver utilizadas:** `ft_tickets_suporte`, `dim_tipos_problema`

**Descrição:** Análise agregada dos tickets de suporte por tipo de problema. Permite identificar quais categorias geram mais volume, têm pior taxa de resolução ou demoram mais para ser resolvidas.

**Métricas calculadas:**

| Coluna | Fórmula |
|---|---|
| `total_tickets` | `COUNT(ticket_id)` |
| `tickets_resolvidos` | `COUNT` onde `resolvido = true` |
| `taxa_resolucao` | `tickets_resolvidos / total_tickets` |
| `tempo_medio_resolucao_horas` | `AVG(tempo_resolucao_horas)` — apenas tickets resolvidos |
| `nota_media_atendimento` | `AVG(nota_avaliacao)` |

---

### `gold_analise_suporte_por_agente`

**Tabelas Silver utilizadas:** `ft_tickets_suporte`, `dim_agentes_suporte`

**Descrição:** Desempenho individual de cada agente de suporte. Permite identificar os agentes com melhor e pior performance em resolução e satisfação do cliente.

**Métricas calculadas:**

| Coluna | Fórmula |
|---|---|
| `total_tickets` | `COUNT(ticket_id)` atendidos pelo agente |
| `tickets_resolvidos` | `COUNT` onde `resolvido = true` |
| `taxa_resolucao` | `tickets_resolvidos / total_tickets` |
| `tempo_medio_resolucao_horas` | `AVG(tempo_resolucao_horas)` |
| `nota_media_atendimento` | `AVG(nota_avaliacao)` |

---

### `gold_satisfacao_nps`

**Tabelas Silver utilizadas:** `ft_avaliacoes`, `dim_produtos`

**Descrição:** NPS e satisfação agregados por mês e categoria de produto. Permite acompanhar a evolução da satisfação ao longo do tempo e identificar categorias com problemas de qualidade percebida.

**Métricas calculadas:**

| Coluna | Fórmula |
|---|---|
| `nota_produto_media` | `AVG(nota_produto)` |
| `nota_nps_media` | `AVG(nota_nps)` |
| `qtd_promotores` | `COUNT` onde `nota_nps >= 9` |
| `qtd_neutros` | `COUNT` onde `nota_nps IN (7, 8)` |
| `qtd_detratores` | `COUNT` onde `nota_nps <= 6` |
| `pct_promotores` | `qtd_promotores / total_avaliacoes` |
| `pct_neutros` | `qtd_neutros / total_avaliacoes` |
| `pct_detratores` | `qtd_detratores / total_avaliacoes` |
| `nps_score` | `pct_promotores - pct_detratores` (× 100) |
| `pct_recomenda` | `AVG(recomenda)` — % de clientes que recomendam |

---

### `gold_pedidos_detalhado`

**Tabelas Silver utilizadas:** `ft_pedidos`, `dim_clientes`, `dim_produtos`

**Descrição:** Pedidos enriquecidos com nome do cliente, nome do produto e categoria. Alimenta a listagem de pedidos no CRM, permitindo filtros avançados sem JOINs em tempo de execução.

---

### `gold_pedidos_por_status`

**Tabelas Silver utilizadas:** `ft_pedidos`

**Descrição:** Contagem e receita de pedidos agrupados por status. Alimenta o painel de status do dashboard.

---

### `gold_vendas_mensais`

**Tabelas Silver utilizadas:** `ft_pedidos`

**Descrição:** Resumo simplificado de vendas por mês. Complementa o `gold_kpis_vendas_mensal` para endpoints que precisam apenas de receita e volume.

---

## Exportação para o banco local

Ao final do notebook Gold, todas as tabelas são exportadas como CSVs para a pasta `data-engineering/gold-data-csvs/`. O script `backend/database/seed.py` lê esses CSVs e popula o banco SQLite (`vcommerce.db`), que é o banco de dados consumido pelo backend FastAPI e pelo agente de IA.

```
data-engineering/gold-data-csvs/
├── gold_cliente_360.csv
├── gold_kpis_vendas_mensal.csv
├── gold_vendas_por_dimensao.csv
├── gold_desempenho_produto.csv
├── gold_analise_suporte_por_tipo.csv
├── gold_analise_suporte_por_agente.csv
├── gold_satisfacao_nps.csv
├── gold_analise_suporte_cliente.csv
├── gold_pedidos_detalhado.csv
├── gold_pedidos_por_status.csv
└── gold_vendas_mensais.csv
```

> Essa pasta está no `.gitignore` e não é versionada. É necessário baixar os CSVs do Databricks e colocá-los localmente antes de rodar o `seed.py`.
