# Text-to-SQL

## Visão Geral

O núcleo do V.AI é a capacidade de traduzir perguntas em linguagem natural para queries SQL válidas sobre o banco local da V-Commerce. Esse fluxo é inteiramente gerenciado pelo modelo Gemini 2.5 Flash, guiado pelo system prompt e pelas três ferramentas registradas no agente.

O processo é **agentic**: o modelo não gera a query de uma vez. Ele raciocina em múltiplos passos, consultando o schema das tabelas quando necessário, corrigindo queries com erro, e só então formulando a resposta final.

---

## Fluxo de tradução

```
Pergunta do usuário (linguagem natural)
           ↓
   Gemini recebe a pergunta + system prompt + histórico da sessão
           ↓
   [Opcional] Chama list_tables() para confirmar tabelas disponíveis
           ↓
   [Opcional] Chama get_table_schema(table_name) para ver colunas e exemplos
           ↓
   Gera e chama execute_sql(query)
           ↓
   [Se erro SQL] Lê a mensagem de erro e corrige a query automaticamente
           ↓
   Interpreta os resultados e formula a resposta em linguagem natural
           ↓
   Inclui indicação de fonte ao final da resposta
```

---

## Acesso restrito às tabelas Gold

O agente só tem acesso às tabelas da camada Gold do pipeline. Essa restrição é aplicada em dois níveis:

**1. No system prompt** — o modelo recebe o schema completo apenas das tabelas `gold_*` e é instruído a não acessar outras tabelas.

**2. No `DatabaseTools`** — o código valida o prefixo da tabela antes de executar qualquer operação:

```python
# Em get_table_schema:
if not table_name.startswith("gold_"):
    return "ERRO: Tabela não disponível para o agente de IA."

# Em execute_sql:
if not table.lower().startswith("gold_"):
    return "ERRO: Use apenas tabelas Gold (prefixo 'gold_')."
```

Essa dupla camada garante que mesmo que o modelo tente acessar tabelas Silver ou internas, o código bloqueia antes de qualquer query chegar ao banco.

---

## Tabelas Gold disponíveis — Fontes Primárias vs Pré-agregadas

As tabelas são classificadas em dois grupos no `TABLE_DESCRIPTIONS` do `database_tools.py`. Essa categorização guia o modelo a escolher a tabela certa para cada pergunta, especialmente quando o usuário quer um número que bata com o dashboard.

### Fontes Primárias

Tabelas granulares (nível de registro individual) que são a mesma fonte usada pelo dashboard. Preferir estas para garantir consistência com os valores exibidos na tela.

| Tabela | Uso principal |
|---|---|
| `gold_pedidos_detalhado` | Receita, contagem de pedidos, análises por período — fonte do card de Vendas e do gráfico de barras |
| `gold_cliente_360` | Perfil 360 do cliente, NPS (`categoria_nps_recente`), leads convertidos — fonte do card de NPS e novos clientes |
| `gold_tickets_360` | Tickets individuais com `status_atendimento` e `data_abertura` — fonte do card de Tickets Solucionados |
| `gold_sessao_resumo` | Sessões individuais com `data_sessao` e `houve_conversao` — fonte do card de Sessões |
| `gold_engajamento_produto_digital` | Engajamento digital por produto: visualizações, adições ao carrinho, abandonos e `taxa_abandono` |

### Pré-agregadas

Tabelas já sumarizadas, úteis para análises exploratórias mas que podem divergir dos valores exatos do dashboard.

| Tabela | Aviso |
|---|---|
| `gold_kpis_vendas_mensal` | Pode divergir do dashboard — preferir `gold_pedidos_detalhado` para métricas de receita |
| `gold_vendas_mensais` | Pode divergir do dashboard — preferir `gold_pedidos_detalhado` |
| `gold_vendas_por_dimensao` | Útil para análises cruzadas exploratórias por mês/região/categoria |
| `gold_satisfacao_nps` | Para NPS idêntico ao dashboard, usar `gold_cliente_360.categoria_nps_recente` |

### Tabelas de análise e suporte

| Tabela | Uso |
|---|---|
| `gold_desempenho_produto` | Desempenho individual de produto: receita, avaliações, tickets, `ratio_ticket_por_venda` |
| `gold_analise_suporte_por_tipo` | Tickets agrupados por tipo de problema |
| `gold_analise_suporte_por_agente` | Performance dos agentes de suporte |
| `gold_analise_suporte_cliente` | Suporte consolidado por cliente |
| `gold_pedidos_por_status` | Contagem de pedidos agrupados por status |

---

## Schema das principais tabelas

### `gold_cliente_360`

| Coluna | Tipo | Destaque |
|---|---|---|
| `id_cliente` | TEXT [PK] | Chave de JOIN com `gold_pedidos_detalhado` |
| `nome_completo` | TEXT | — |
| `email` | TEXT | — |
| `estado` | TEXT | Ex: "São Paulo" — usar para mapa de estados |
| `regiao` | TEXT | Norte/Nordeste/Centro-Oeste/Sudeste/Sul — usar para mapa de regiões |
| `cidade` | TEXT | — |
| `origem` | TEXT | Canal de aquisição |
| `receita_total` | REAL | Receita acumulada do cliente (R$) |
| `ticket_medio` | REAL | Valor médio por pedido (R$) |
| `nota_nps_recente` | REAL | NPS mais recente (0–10) |
| `categoria_nps_recente` | TEXT | `Promotor`, `Neutro`, `Detrator`, `Não avaliou` — fonte do NPS do dashboard |
| `segmento_cliente` | TEXT | VIP, Ativo, Inativo, Novo |

### `gold_pedidos_detalhado`

| Coluna | Tipo | Destaque |
|---|---|---|
| `id_pedido` | TEXT [PK] | — |
| `id_cliente` | TEXT | Chave de JOIN com `gold_cliente_360` |
| `data_pedido` | TEXT | YYYY-MM-DD — usar para filtros por período |
| `ano_mes` | TEXT | YYYY-MM |
| `status` | TEXT | `Aprovado`, `Processando`, `Recusado`, `Reembolsado` |
| `receita_bruta` | REAL | Receita bruta (R$) — usar para gráfico de receita |
| `valor_reembolsado` | REAL | Preenchido quando `status = 'Reembolsado'` |
| `valor_pedido` | REAL | Valor total do pedido — usar para mapa de estados |
| `categoria` | TEXT | Categoria do produto |
| `quantidade` | REAL | Itens no pedido |

### `gold_tickets_360`

| Coluna | Tipo | Destaque |
|---|---|---|
| `ticket_id` | TEXT [PK] | — |
| `status_atendimento` | TEXT | `Finalizado`, `Em Andamento` etc. |
| `data_abertura` | TEXT | YYYY-MM-DD — usar para filtros por período |
| `agente_suporte` | TEXT | — |
| `tempo_resolucao_horas` | REAL | — |
| `regiao_cliente` | TEXT | — |

### `gold_sessao_resumo`

| Coluna | Tipo | Destaque |
|---|---|---|
| `id_sessao` | TEXT [PK] | — |
| `data_sessao` | TEXT | YYYY-MM-DD |
| `houve_conversao` | INTEGER | 1 = sim, 0 = não |
| `canal` | TEXT | — |
| `dispositivo` | TEXT | — |

### `gold_engajamento_produto_digital`

| Coluna | Tipo | Destaque |
|---|---|---|
| `id_produto` | TEXT [PK] | — |
| `total_visualizacoes` | REAL | — |
| `total_adicionados_carrinho` | REAL | — |
| `total_compras` | REAL | — |
| `total_abandonos_carrinho` | REAL | — |
| `taxa_abandono` | REAL | 0 a 1 |
| Sem coluna de data | — | Dados acumulados totais, sem filtro por período |

---

## Janela de tempo — Regra crítica

O dashboard usa **janela rolante em dias** a partir de hoje, e **não meses calendário**. "Últimos 3 meses" não é "março + abril + maio" — são os últimos 90 dias corridos.

| O usuário diz | Dias | Filtro SQL |
|---|---|---|
| Últimas 2 semanas | 14 | `data_pedido >= date('now','-14 days')` |
| Último mês | 30 | `data_pedido >= date('now','-30 days')` |
| Últimos 3 meses | 90 | `data_pedido >= date('now','-90 days')` |
| Semestre | 180 | `data_pedido >= date('now','-180 days')` |
| Último ano | 365 | `data_pedido >= date('now','-365 days')` |

> **Exemplo:** se hoje é 20/05/2026, "últimos 3 meses" começa em 19/02/2026 — não em 01/03/2026.
> Nunca usar `ano_mes = '2026-03'` ou blocos de meses calendário quando o usuário pedir "últimos N meses/semanas".

---

## Fórmulas do dashboard — para resultados consistentes

Quando o usuário perguntar sobre métricas que aparecem no dashboard, o agente usa as fórmulas abaixo para garantir que os números batam com o que é exibido na tela.

### Receita líquida (card de Vendas)
```sql
SELECT
    SUM(CASE WHEN status = 'Aprovado' THEN receita_bruta ELSE 0 END)
  - SUM(CASE WHEN status = 'Reembolsado' THEN valor_reembolsado ELSE 0 END)
FROM gold_pedidos_detalhado
WHERE data_pedido >= date('now', '-90 days') AND data_pedido <= date('now')
```

### Receita por período — gráfico de barras (apenas `Aprovado`)
```sql
SELECT strftime('%Y-%m', data_pedido) AS ano_mes, SUM(receita_bruta) AS receita
FROM gold_pedidos_detalhado
WHERE data_pedido >= date('now', '-90 days') AND data_pedido <= date('now')
  AND status = 'Aprovado' AND receita_bruta IS NOT NULL
GROUP BY strftime('%Y-%m', data_pedido)
ORDER BY ano_mes
```
> O **card** subtrai reembolsados; o **gráfico** mostra só os aprovados. Usar a fórmula errada causa divergência nos valores mensais. Nunca usar `gold_kpis_vendas_mensal` nem `gold_vendas_mensais` para receita.

### Total de pedidos por status (card de Pedidos)
```sql
SELECT status, COUNT(id_pedido) AS total
FROM gold_pedidos_detalhado
WHERE data_pedido >= date('now', '-90 days') AND data_pedido <= date('now')
GROUP BY status
```

### NPS (idêntico ao dashboard)
```sql
SELECT categoria_nps_recente, COUNT(id_cliente) AS cnt
FROM gold_cliente_360
WHERE data_ultimo_pedido >= date('now', '-90 days')
  AND data_ultimo_pedido <= date('now')
  AND categoria_nps_recente != 'Não avaliou'
GROUP BY categoria_nps_recente
-- NPS score = (promotores / total − detratores / total) × 100
```
> Não usar `gold_satisfacao_nps.nps_score` — a fonte correta é `gold_cliente_360.categoria_nps_recente`.

### Novos clientes (leads convertidos)
```sql
SELECT COUNT(id_cliente) FROM gold_cliente_360
WHERE data_primeiro_pedido >= date('now', '-90 days')
  AND data_primeiro_pedido <= date('now')
```

### Estados/Regiões com mais vendas — 3 regras especiais
1. Usar `valor_pedido` — **não** `receita_bruta`
2. **Sem filtro de status** — todos os pedidos contam
3. Estado vem de `gold_cliente_360.estado` via JOIN (não existe em `gold_pedidos_detalhado`)

```sql
SELECT c.estado, COUNT(p.id_pedido) AS total_pedidos, SUM(p.valor_pedido) AS total_valor
FROM gold_pedidos_detalhado p
JOIN gold_cliente_360 c ON p.id_cliente = c.id_cliente
WHERE p.data_pedido >= date('now', '-90 days') AND p.data_pedido <= date('now')
  AND c.estado IS NOT NULL
GROUP BY c.estado
ORDER BY total_valor DESC LIMIT 10
```

### Tickets solucionados
```sql
SELECT COUNT(ticket_id) FROM gold_tickets_360
WHERE data_abertura >= date('now', '-90 days') AND data_abertura <= date('now')
  AND LOWER(status_atendimento) = 'finalizado'
```

### Sessões
```sql
SELECT COUNT(id_sessao) FROM gold_sessao_resumo
WHERE data_sessao >= date('now', '-90 days') AND data_sessao <= date('now')
```

### Engajamento por categoria (sem filtro de período)
```sql
-- Visualizações por categoria
SELECT categoria, SUM(total_visualizacoes) AS total
FROM gold_engajamento_produto_digital
WHERE categoria IS NOT NULL
GROUP BY categoria ORDER BY total DESC LIMIT 5

-- Taxa de abandono por categoria
SELECT categoria, AVG(taxa_abandono) AS abandono_medio
FROM gold_engajamento_produto_digital
WHERE categoria IS NOT NULL
GROUP BY categoria ORDER BY abandono_medio DESC LIMIT 5
```

---

## Regras SQL instruídas ao modelo

| Regra | Detalhe |
|---|---|
| Apenas `SELECT` | Nunca usar `INSERT`, `UPDATE`, `DELETE`, `DROP` ou similares |
| Limite de linhas | Sempre incluir `LIMIT` (máximo 100) |
| Comparações de texto | Usar `LOWER()` para case-insensitive |
| Formato de datas | `ano_mes` no formato `YYYY-MM`; datas completas em `YYYY-MM-DD` |
| Valores monetários | Campos de receita e ticket médio estão em Reais (R$) |
| Proporções | `taxa_cancelamento` e `taxa_resolucao` variam de 0 a 1 — multiplicar por 100 para `%` |
| Campo `ativo` | String `'True'` ou `'False'` em `gold_desempenho_produto`; INTEGER 0/1 em `gold_pedidos_detalhado` |
| Schema primeiro | Usar `get_table_schema` antes de escrever uma query quando houver dúvida sobre nomes de colunas |

---

## Tratamento de erros SQL

Se o banco retornar um erro de sintaxe ou coluna inexistente, o `DatabaseTools` devolve a mensagem de erro para o modelo em vez de lançar uma exceção. O modelo lê o erro, corrige a query e tenta novamente — sem intervenção do usuário:

```python
except sqlite3.OperationalError as e:
    return (
        f"ERRO SQL: {e}\n"
        "Dica: Verifique o nome das tabelas e colunas com list_tables() e get_table_schema()."
    )
```

---

## Transparência da fonte

Ao final de cada resposta, o agente indica qual tabela foi consultada. A extração é feita automaticamente por `extract_tables_from_sql()` via regex sobre as queries executadas:

```python
pattern = r"\bFROM\s+(\w+)|\bJOIN\s+(\w+)"
```

O campo `sources` da `ChatResponse` lista as tabelas, e o system prompt instrui o modelo a também mencionar a fonte diretamente no texto da resposta.
