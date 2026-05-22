# Banco de Dados

## Visão Geral

**Arquivo:** `backend/database/vcommerce.db`  
**Engine:** SQLite  
**ORM:** SQLAlchemy  
**Migrations:** Alembic

---

## Origem dos dados

O banco SQLite é populado principalmente a partir dos arquivos CSV exportados da camada **Gold** do pipeline Databricks.

**Diretório esperado dos CSVs:**

```text
data-engineering/gold-data-csvs/
```

Além das tabelas carregadas por CSV, o arquivo `seed.py` cria tabelas utilizadas diretamente pela aplicação e registros demonstrativos para testes de status de entrega.

---

## Tabelas

### Tabelas carregadas da camada Gold

| Tabela | Camada | Descrição |
|---|---|---|
| `gold_cliente_360` | Gold | Visão consolidada dos clientes, incluindo dados cadastrais, comportamento de compra, receita, ticket médio e indicadores de satisfação. |
| `gold_kpis_vendas_mensal` | Gold | Indicadores mensais consolidados de vendas. |
| `gold_vendas_por_dimensao` | Gold | Métricas de vendas agrupadas por dimensões analíticas, como período, região e categoria. |
| `gold_desempenho_produto` | Gold | Indicadores de desempenho comercial dos produtos. |
| `gold_produtos_detalhado` | Gold | Visão detalhada dos produtos utilizada em consultas e buscas da aplicação. |
| `gold_dim_agentes_suporte` | Gold | Dimensão consolidada dos agentes responsáveis por atendimentos de suporte. |
| `gold_analise_suporte_por_tipo` | Gold | Análise de tickets e atendimentos agrupados por tipo de problema. |
| `gold_analise_suporte_por_agente` | Gold | Análise dos atendimentos agrupados por agente de suporte. |
| `gold_analise_suporte_cliente` | Gold | Indicadores de suporte associados aos clientes. |
| `gold_avaliacoes_360` | Gold | Visão consolidada das avaliações registradas na plataforma. |
| `gold_satisfacao_nps` | Gold | Indicadores de satisfação e NPS utilizados nas análises da aplicação. |
| `gold_pedidos_detalhado` | Gold | Visão detalhada dos pedidos, incluindo cliente, produto, pagamento, status e valores. |
| `gold_pedidos_por_status` | Gold | Indicadores de pedidos agrupados por status. |
| `gold_vendas_mensais` | Gold | Consolidação mensal das vendas realizadas. |
| `gold_engajamento_produto_digital` | Gold | Indicadores de engajamento digital relacionados aos produtos. |
| `gold_tickets_360` | Gold | Visão detalhada dos tickets de suporte, incluindo cliente, pedido, problema, agente, status e avaliação. |
| `gold_sessao_resumo` | Gold | Resumo consolidado das sessões de navegação ou interação digital. |
| `gold_sessao_funil` | Gold | Informações de sessões organizadas para análise de funil. |

### Tabelas criadas diretamente pelo seed

| Tabela | Camada | Descrição |
|---|---|---|
| `users` | Aplicação | Usuários cadastrados para autenticação e controle de acesso ao sistema. |
| `ft_sale_activities` | Aplicação / Demo | Histórico de alterações de status dos pedidos demonstrativos inseridos pelo seed. |

---

## Carga de dados

### Tabelas Gold

As tabelas Gold são carregadas a partir de arquivos CSV injetados em:

```text
data-engineering/gold-data-csvs/
```

O nome de cada arquivo CSV deve corresponder ao nome da tabela esperada pelo seed:

| Arquivo CSV | Tabela gerada no SQLite |
|---|---|
| `gold_cliente_360.csv` | `gold_cliente_360` |
| `gold_kpis_vendas_mensal.csv` | `gold_kpis_vendas_mensal` |
| `gold_vendas_por_dimensao.csv` | `gold_vendas_por_dimensao` |
| `gold_desempenho_produto.csv` | `gold_desempenho_produto` |
| `gold_produtos_detalhado.csv` | `gold_produtos_detalhado` |
| `gold_dim_agentes_suporte.csv` | `gold_dim_agentes_suporte` |
| `gold_analise_suporte_por_tipo.csv` | `gold_analise_suporte_por_tipo` |
| `gold_analise_suporte_por_agente.csv` | `gold_analise_suporte_por_agente` |
| `gold_analise_suporte_cliente.csv` | `gold_analise_suporte_cliente` |
| `gold_avaliacoes_360.csv` | `gold_avaliacoes_360` |
| `gold_satisfacao_nps.csv` | `gold_satisfacao_nps` |
| `gold_pedidos_detalhado.csv` | `gold_pedidos_detalhado` |
| `gold_pedidos_por_status.csv` | `gold_pedidos_por_status` |
| `gold_vendas_mensais.csv` | `gold_vendas_mensais` |
| `gold_engajamento_produto_digital.csv` | `gold_engajamento_produto_digital` |
| `gold_tickets_360.csv` | `gold_tickets_360` |
| `gold_sessao_resumo.csv` | `gold_sessao_resumo` |
| `gold_sessao_funil.csv` | `gold_sessao_funil` |

Quando um arquivo CSV não é encontrado, o seed informa a ausência no terminal e ignora a carga daquela tabela.

## Popular o banco

**Com dados reais da camada Gold e registros auxiliares da aplicação:**

```bash
python backend/database/seed.py
```

## Migrations com Alembic

```bash
# Gerar uma nova migration
cd backend
alembic revision --autogenerate -m "descricao_da_migration"

# Aplicar migrations pendentes
alembic upgrade head

# Reverter última migration
alembic downgrade -1
```

---

## Índices criados

Os índices abaixo são criados pelo `seed.py` com `CREATE INDEX IF NOT EXISTS`. Caso a tabela correspondente não exista no momento da execução, o script ignora a falha de criação daquele índice.

### Índices de pedidos detalhados

| Índice | Tabela | Coluna(s) | Motivo |
|---|---|---|---|
| `idx_gpedidos_data_pedido` | `gold_pedidos_detalhado` | `data_pedido DESC` | Ordenação e consultas por data do pedido. |
| `idx_gpedidos_status` | `gold_pedidos_detalhado` | `status` | Filtros por status do pedido. |
| `idx_gpedidos_categoria` | `gold_pedidos_detalhado` | `categoria` | Filtros por categoria do produto. |
| `idx_gpedidos_metodo` | `gold_pedidos_detalhado` | `metodo_pagamento` | Filtros por método de pagamento. |
| `idx_gpedidos_ano_mes` | `gold_pedidos_detalhado` | `ano_mes` | Consultas e agregações por período. |
| `idx_gpedidos_status_data` | `gold_pedidos_detalhado` | `status`, `data_pedido DESC` | Consultas de pedidos por status ordenados por data. |
| `idx_gpedidos_cliente_data` | `gold_pedidos_detalhado` | `id_cliente`, `data_pedido DESC` | Consulta do histórico recente de pedidos de um cliente específico. |
| `idx_gpedidos_cliente_categoria_data` | `gold_pedidos_detalhado` | `id_cliente`, `categoria`, `data_pedido DESC` | Consulta de pedidos do cliente por categoria e data. |
| `idx_gpedidos_cliente_pedido` | `gold_pedidos_detalhado` | `id_cliente`, `id_pedido` | Busca de pedidos associados a um cliente. |
| `idx_gpedidos_id_pedido` | `gold_pedidos_detalhado` | `id_pedido` | Busca direta de pedidos e suporte a menções no chat de IA. |

### Índices da visão 360° de clientes

| Índice | Tabela | Coluna(s) | Motivo |
|---|---|---|---|
| `idx_g360_id_cliente` | `gold_cliente_360` | `id_cliente` | Busca direta de clientes pelo identificador. |
| `idx_g360_email` | `gold_cliente_360` | `email` | Busca de clientes por e-mail. |
| `idx_g360_regiao` | `gold_cliente_360` | `regiao` | Filtros de clientes por região. |
| `idx_g360_segmento` | `gold_cliente_360` | `segmento_cliente` | Filtros de clientes por segmento. |
| `idx_g360_nome_completo` | `gold_cliente_360` | `nome_completo` | Busca de clientes pelo nome. |
| `idx_g360_total_pedidos` | `gold_cliente_360` | `total_pedidos` | Ordenação e análise pela quantidade de pedidos. |
| `idx_g360_data_ultimo` | `gold_cliente_360` | `data_ultimo_pedido` | Ordenação e consulta pela compra mais recente. |
| `idx_g360_nps_media` | `gold_cliente_360` | `nota_nps_media` | Análises relacionadas à satisfação do cliente. |
| `idx_g360_receita` | `gold_cliente_360` | `receita_total` | Ordenação e análise por receita gerada. |
| `idx_g360_ticket_medio` | `gold_cliente_360` | `ticket_medio` | Ordenação e análise por ticket médio. |

### Índices de tickets de suporte

| Índice | Tabela | Coluna(s) | Motivo |
|---|---|---|---|
| `idx_gtickets_ticket_id` | `gold_tickets_360` | `ticket_id` | Busca direta de tickets pelo identificador. |
| `idx_gtickets_id_cliente` | `gold_tickets_360` | `id_cliente` | Consulta de tickets associados a um cliente. |
| `idx_gtickets_id_pedido` | `gold_tickets_360` | `id_pedido` | Consulta de tickets associados a um pedido. |
| `idx_gtickets_data_abertura` | `gold_tickets_360` | `data_abertura DESC` | Ordenação e filtragem por data de abertura. |
| `idx_gtickets_status` | `gold_tickets_360` | `status_atendimento` | Filtros por status do atendimento. |
| `idx_gtickets_agente` | `gold_tickets_360` | `agente_suporte` | Filtros por agente responsável. |
| `idx_gtickets_tipo_problema` | `gold_tickets_360` | `tipo_problema` | Filtros por categoria do problema. |
| `idx_gtickets_nota` | `gold_tickets_360` | `nota_avaliacao` | Filtros e análises por avaliação do atendimento. |
| `idx_gtickets_nome_cliente` | `gold_tickets_360` | `nome_cliente` | Busca de tickets pelo nome do cliente. |
| `idx_gtickets_regiao_cliente` | `gold_tickets_360` | `regiao_cliente` | Filtros de tickets por região do cliente. |
| `idx_gtickets_estado_cliente` | `gold_tickets_360` | `estado_cliente` | Filtros de tickets por estado do cliente. |
| `idx_gtickets_faixa_etaria` | `gold_tickets_360` | `faixa_etaria` | Filtros de tickets por faixa etária do cliente. |
| `idx_gtickets_status_data` | `gold_tickets_360` | `status_atendimento`, `data_abertura DESC` | Consulta de tickets por status ordenados por abertura. |
| `idx_gtickets_agente_status` | `gold_tickets_360` | `agente_suporte`, `status_atendimento` | Análise de atendimentos por agente e status. |
| `idx_gtickets_problema_status` | `gold_tickets_360` | `tipo_problema`, `status_atendimento` | Análise de problemas por situação do atendimento. |
| `idx_gtickets_cliente_data` | `gold_tickets_360` | `id_cliente`, `data_abertura DESC` | Histórico de tickets na visualização de cliente específico. |
| `idx_gtickets_cliente_data_hora` | `gold_tickets_360` | `id_cliente`, `data_abertura DESC`, `hora_abertura DESC` | Ordenação cronológica detalhada dos tickets de um cliente específico. |

### Índices de indicadores e dimensões Gold

| Índice | Tabela | Coluna(s) | Motivo |
|---|---|---|---|
| `idx_gkpis_ano_mes` | `gold_kpis_vendas_mensal` | `ano_mes` | Consulta de KPIs mensais por período. |
| `idx_gagentes_nome` | `gold_dim_agentes_suporte` | `agente_suporte` | Busca de agentes de suporte e suporte a menções no chat de IA. |
| `idx_gproddet_nome_produto` | `gold_produtos_detalhado` | `nome_produto` | Busca textual por produto. |
| `idx_gproddet_categoria` | `gold_produtos_detalhado` | `categoria` | Filtros por categoria de produto. |
| `idx_gproddet_id_produto` | `gold_produtos_detalhado` | `id_produto` | Busca direta de produtos pelo identificador. |
| `idx_gdim_ano_mes` | `gold_vendas_por_dimensao` | `ano_mes` | Análises dimensionais por período. |
| `idx_gdim_regiao` | `gold_vendas_por_dimensao` | `regiao` | Análises dimensionais por região. |
| `idx_gdim_categoria` | `gold_vendas_por_dimensao` | `categoria` | Análises dimensionais por categoria. |
| `idx_gprod_categoria` | `gold_desempenho_produto` | `categoria` | Filtros de desempenho por categoria. |
| `idx_gprod_ativo` | `gold_desempenho_produto` | `ativo` | Filtros de produtos ativos ou inativos. |
| `idx_gnps_ano_mes` | `gold_satisfacao_nps` | `ano_mes` | Análises de satisfação por período. |
| `idx_gnps_categoria` | `gold_satisfacao_nps` | `categoria` | Análises de satisfação por categoria. |
| `idx_gengaj_categoria` | `gold_engajamento_produto_digital` | `categoria` | Análises de engajamento por categoria. |
| `idx_gengaj_id_produto` | `gold_engajamento_produto_digital` | `id_produto` | Consulta de engajamento por produto. |