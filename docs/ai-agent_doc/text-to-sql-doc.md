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

## Tabelas Gold disponíveis para o agente

O system prompt inclui o schema detalhado de cada tabela Gold. Esse contexto é essencial para que o modelo gere queries corretas sem alucinações de nomes de colunas.

| Tabela | Uso principal | Colunas-chave |
|---|---|---|
| `gold_cliente_360` | Análises por cliente individual ou segmento | `id_cliente`, `regiao`, `receita_total`, `segmento_cliente`, `nota_nps_media` |
| `gold_kpis_vendas_mensal` | Tendências temporais e KPIs gerais | `ano_mes`, `receita_total`, `ticket_medio`, `novos_clientes`, `taxa_cancelamento` |
| `gold_vendas_por_dimensao` | Cruzamento de período × região × categoria | `ano_mes`, `regiao`, `categoria`, `receita_total` |
| `gold_desempenho_produto` | Performance de produto individual | `id_produto`, `receita_total`, `nota_media_avaliacao`, `ratio_ticket_por_venda` |
| `gold_analise_suporte_por_tipo` | Análise de tickets por problema | `tipo_problema`, `taxa_resolucao`, `tempo_medio_resolucao_horas` |
| `gold_analise_suporte_por_agente` | Performance dos agentes de SAC | `agente_suporte`, `taxa_resolucao`, `nota_media_atendimento` |
| `gold_satisfacao_nps` | NPS e satisfação por mês e categoria | `ano_mes`, `categoria`, `nps_score`, `pct_promotores` |
| `gold_analise_suporte_cliente` | Suporte consolidado por cliente | `id_cliente`, `total_tickets`, `taxa_resolucao` |
| `gold_pedidos_detalhado` | Pedidos enriquecidos com cliente e produto | `id_pedido`, `nome_cliente`, `nome_produto`, `categoria` |
| `gold_pedidos_por_status` | Contagem de pedidos por status | `status`, `total_pedidos`, `receita_total` |
| `gold_vendas_mensais` | Resumo mensal de vendas | `ano_mes`, `receita_total`, `total_pedidos` |

---

## Regras SQL instruídas ao modelo

O system prompt impõe um conjunto de regras para garantir queries corretas e seguras:

| Regra | Detalhe |
|---|---|
| Apenas `SELECT` | Nunca usar `INSERT`, `UPDATE`, `DELETE`, `DROP` ou similares |
| Limite de linhas | Sempre incluir `LIMIT` (máximo 100) |
| Comparações de texto | Usar `LOWER()` para case-insensitive |
| Formato de datas | `ano_mes` no formato `YYYY-MM`; datas completas em `YYYY-MM-DD` |
| Valores monetários | Campos de receita e ticket médio estão em Reais (R$) |
| Proporções | `taxa_cancelamento` e `taxa_resolucao` variam de 0 a 1 — multiplicar por 100 para exibir como `%` |
| Campo `ativo` | É uma string `'True'` ou `'False'`, não um booleano SQL |
| Schema primeiro | Usar `get_table_schema` antes de escrever uma query quando houver dúvida sobre nomes de colunas |

---

## Tratamento de erros SQL

Se o banco retornar um erro de sintaxe ou coluna inexistente, o `DatabaseTools` devolve a mensagem de erro para o modelo em vez de lançar uma exceção:

```python
except sqlite3.OperationalError as e:
    return (
        f"ERRO SQL: {e}\n"
        "Dica: Verifique o nome das tabelas e colunas com list_tables() e get_table_schema()."
    )
```

O modelo lê o erro, corrige a query e tenta novamente — sem intervenção do usuário.

---

## Limite de resultados e paginação

O `DatabaseTools` adiciona automaticamente `LIMIT 100` a qualquer query que não tenha um `LIMIT` explícito:

```python
if not re.search(r"\bLIMIT\b", query_normalized, re.IGNORECASE):
    query_normalized = f"{query_normalized} LIMIT {MAX_ROWS}"
```

Quando o limite é atingido, o resultado inclui um aviso instruindo o usuário a refinar a consulta com filtros `WHERE` ou `GROUP BY`.

---

## Transparência da fonte

Ao final de cada resposta, o agente indica qual tabela foi consultada. Essa rastreabilidade é implementada em dois níveis:

**1. Extração automática** — a função `extract_tables_from_sql()` usa regex para extrair os nomes de tabelas presentes nas queries executadas:

```python
pattern = r"\bFROM\s+(\w+)|\bJOIN\s+(\w+)"
```

**2. Na resposta** — o campo `sources` da `ChatResponse` lista as tabelas, e o sistema prompt instrui o modelo a mencionar a fonte diretamente no texto da resposta:

> *Fonte: `gold_kpis_vendas_mensal` — dados consolidados do pipeline Gold.*

---

## Exemplos de perguntas e queries geradas

### Pergunta simples
**"Qual foi a receita total em 2024?"**
```sql
SELECT SUM(receita_total) AS receita_2024
FROM gold_kpis_vendas_mensal
WHERE ano_mes LIKE '2024-%'
LIMIT 1
```

### Ranking com filtro
**"Quais são os 5 produtos mais vendidos?"**
```sql
SELECT nome_produto, qtd_vendida, receita_total
FROM gold_desempenho_produto
ORDER BY qtd_vendida DESC
LIMIT 5
```

### Análise cruzada
**"Qual região do Brasil gerou mais receita no primeiro trimestre de 2024?"**
```sql
SELECT regiao, SUM(receita_total) AS receita_total
FROM gold_vendas_por_dimensao
WHERE ano_mes BETWEEN '2024-01' AND '2024-03'
GROUP BY regiao
ORDER BY receita_total DESC
LIMIT 5
```

### Follow-up com contexto (memória de sessão ativa)
**"E dessa região, qual categoria vendeu mais?"**
```sql
SELECT categoria, SUM(receita_total) AS receita_total
FROM gold_vendas_por_dimensao
WHERE regiao = 'Sudeste'  -- contexto da pergunta anterior
  AND ano_mes BETWEEN '2024-01' AND '2024-03'
GROUP BY categoria
ORDER BY receita_total DESC
LIMIT 5
```
