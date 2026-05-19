# Arquitetura do Agente

## Visão Geral

> Descreva brevemente o papel do V.AI no sistema.

**Framework:** PydanticAI  
**Modelo:** Gemini 2.5 Flash (`google-gla:gemini-2.5-flash`)  
**Fonte de dados:** `backend/database/vcommerce.db`

---

## Arquivos do módulo

| Arquivo | Responsabilidade |
|---|---|
| `agent.py` | Factory do agente, ferramentas, memória de sessão e função `chat()` |
| `database_tools.py` | Conexão com o banco, execução de queries e validação SELECT-only |
| `prompts.py` | System prompt e sugestões de perguntas iniciais |
| `test_agent.py` | Script de testes interativo e non-interactive |

---

## Dependências injetadas (`AgentDeps`)

| Campo | Tipo | Descrição |
|---|---|---|
| `db` | `DatabaseTools` | Instância de conexão com o banco |
| `executed_queries` | `list[str]` | Queries executadas na run — usadas para popular `sources` na resposta |

---

## Ferramentas registradas

| Ferramenta | Descrição |
|---|---|
| `list_tables` | Lista todas as tabelas disponíveis no banco com descrição |
| `get_table_schema` | Retorna schema e amostra de dados de uma tabela |
| `execute_sql` | Executa uma query SELECT e retorna os resultados formatados |

---

## Memória de conversa

> Descreva como o histórico de sessão é gerenciado.

- Armazenamento: em memória (`dict[session_id → list[ModelMessage]]`)
- Limite: últimas **20 mensagens** por sessão
- Funções: `get_session_history()`, `save_session_history()`, `clear_session_history()`

---

## Resposta da função `chat()`

| Campo | Tipo | Descrição |
|---|---|---|
| `answer` | `str` | Resposta em linguagem natural |
| `sources` | `list[str]` | Tabelas consultadas nas queries executadas |
| `queries` | `list[str]` | Queries SQL executadas (para debug) |
| `session_id` | `str` | ID da sessão — confirma continuidade da memória |

---

## Integração com o backend

> Descreva como o agente é chamado pelo `agentRouter.py`.