# Banco de Dados

## Visão Geral

**Arquivo:** `backend/database/vcommerce.db`  
**Engine:** SQLite  
**ORM:** SQLAlchemy  
**Migrations:** Alembic

---

## Tabelas

| Tabela | Camada | Descrição |
|---|---|---|
| `dim_categorias_produto` | Silver | |
| `dim_status_pedido` | Silver | |
| `dim_tipos_problema` | Silver | |
| `dim_agentes_suporte` | Silver | |
| `dim_produtos` | Silver | |
| `dim_clientes` | Silver | |
| `ft_pedidos` | Silver | |
| `ft_avaliacoes` | Silver | |
| `ft_tickets_suporte` | Silver | |
| `ft_clickstream` | Silver | |
| `gold_cliente_360` | Gold | |
| `gold_kpis_vendas_mensal` | Gold | |
| `gold_vendas_por_dimensao` | Gold | |
| `gold_desempenho_produto` | Gold | |
| `gold_analise_suporte_por_tipo` | Gold | |
| `gold_analise_suporte_por_agente` | Gold | |
| `gold_satisfacao_nps` | Gold | |
| `conversations` | Aplicação | Histórico de conversas do agente |

---

## Popular o banco

**Com dados reais (pipeline Databricks):**
```bash
python backend/database/seed.py
```

**Com dados mock (testes locais do agente):**
```bash
python backend/database/seed_mock.py
```

---

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

| Índice | Tabela | Coluna | Motivo |
|---|---|---|---|
| `idx_clientes_regiao` | `dim_clientes` | `regiao` | Filtros por região no CRM |
| `idx_produtos_categoria` | `dim_produtos` | `categoria` | Filtros por categoria |
| `idx_pedidos_cliente` | `ft_pedidos` | `id_cliente` | Join com clientes |
| `idx_pedidos_ano_mes` | `ft_pedidos` | `ano_mes` | Filtros por período |
| `idx_g360_segmento` | `gold_cliente_360` | `segmento_cliente` | Filtros de segmento |
| | | | |