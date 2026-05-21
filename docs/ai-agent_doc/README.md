# Documentação Agente de IA

Documentação do V.AI, agente conversacional Text-to-SQL integrado ao V-Commerce CRM 360, desenvolvido com **PydanticAI** e **Gemini 2.5 Flash**.

---

## Arquivos

| Arquivo | Descrição |
|---|---|
| [Arquitetura do Agente](./agent-doc.md) | Estrutura, dependências, ferramentas, memória de sessão e integração com o backend |
| [Text-to-SQL](./text-to-sql-doc.md) | Fluxo de tradução, tabelas disponíveis, janela de tempo e fórmulas do dashboard |
| [Guardrails](./guardrails-doc.md) | Regras de segurança, escopo e resistência a prompt injection |
| [Testes](./testing-doc.md) | Guia completo para testar o agente localmente |

---

## Arquivos do módulo

| Arquivo | Descrição |
|---|---|
| `agent.py` | Definição do agente, ferramentas, memória de sessão e lógica principal |
| `database_tools.py` | Conexão com o banco, execução de queries e validação SELECT-only |
| `prompts.py` | System prompt, schema das tabelas Gold, fórmulas do dashboard e perguntas sugeridas |
| `test_agent.py` | Script de teste interativo e non-interactive |

---

## Capacidades

- Traduz perguntas em linguagem natural para SQL válido
- Consulta exclusivamente as tabelas Gold do `vcommerce.db`
- Mantém memória de conversa entre turnos da mesma sessão (últimas 20 mensagens)
- Classifica tabelas como **Fonte Primária** (idêntica ao dashboard) ou **Pré-agregada**, orientando o modelo a escolher a fonte correta para cada pergunta
- Aplica janela rolante de datas (`date('now', '-N days')`) para consistência com os filtros do dashboard
- Usa fórmulas exatas do dashboard para receita, NPS, tickets, sessões e mapa de estados
- Recusa perguntas fora do escopo dos dados da V-Commerce
- Bloqueia comandos que alterem ou deletem dados (`DELETE`, `UPDATE`, `DROP`)
- Resiste a tentativas de prompt injection

---

## Tabelas Gold acessíveis

**Fontes Primárias** (idênticas ao dashboard):

- `gold_pedidos_detalhado` — receita, pedidos e análises por período
- `gold_cliente_360` — perfil 360 do cliente, NPS e segmento
- `gold_tickets_360` — tickets individuais de suporte
- `gold_sessao_resumo` — sessões individuais com conversão
- `gold_engajamento_produto_digital` — visualizações, carrinho e abandono por produto

**Pré-agregadas** (análises exploratórias):

- `gold_kpis_vendas_mensal`, `gold_vendas_mensais`, `gold_vendas_por_dimensao`, `gold_satisfacao_nps`

**Análise e suporte:**

- `gold_desempenho_produto`, `gold_analise_suporte_por_tipo`, `gold_analise_suporte_por_agente`, `gold_analise_suporte_cliente`, `gold_pedidos_por_status`

---

## Stack

- PydanticAI
- Gemini 2.5 Flash (Google AI Studio)
- SQLite (`vcommerce.db`)
- Python
