# Arquitetura do Agente

## Visão Geral

O **V.AI** é o assistente conversacional de análise de dados do V-Commerce CRM 360. Ele permite que qualquer pessoa da empresa faça perguntas sobre vendas, clientes, produtos e suporte em linguagem natural e receba respostas precisas, sem precisar escrever SQL ou acionar um analista técnico.

Internamente, o V.AI recebe a pergunta do usuário, decide quais tabelas do banco consultar, gera e executa queries SQL, e devolve a resposta formatada em português com a indicação das fontes consultadas.

**Framework:** PydanticAI  
**Modelo:** Gemini 2.5 Flash (`google-gla:gemini-2.5-flash`)  
**Fonte de dados:** `backend/database/vcommerce.db` (tabelas da camada Gold)

---

## Arquivos do módulo

| Arquivo | Responsabilidade |
|---|---|
| `agent.py` | Factory do agente, registro de ferramentas, gerenciamento de memória de sessão e função `chat()` |
| `database_tools.py` | Conexão com o banco SQLite, execução de queries, validação SELECT-only e formatação de resultados |
| `prompts.py` | System prompt completo com schema das tabelas Gold e perguntas sugeridas ao iniciar o chat |
| `test_agent.py` | Script de testes: modo interativo (REPL) e modo non-interactive (pergunta única via CLI) |

---

## Dependências injetadas (`AgentDeps`)

O PydanticAI injeta dependências no contexto de cada run via o dataclass `AgentDeps`. Isso desacopla o agente do banco de dados e facilita testes.

| Campo | Tipo | Descrição |
|---|---|---|
| `db` | `DatabaseTools` | Instância de conexão com o banco SQLite |
| `executed_queries` | `list[str]` | Lista das queries SQL executadas na run — usadas para popular o campo `sources` na resposta da API e garantir transparência ao usuário |

---

## Ferramentas registradas

O agente tem acesso a três ferramentas, registradas via `@agent.tool`. O modelo decide autonomamente quando e em qual ordem chamá-las para responder cada pergunta.

| Ferramenta | Assinatura | Descrição |
|---|---|---|
| `list_tables` | `(ctx) → str` | Lista todas as tabelas `gold_*` disponíveis no banco com uma descrição curta de cada uma. O agente usa isso para orientação antes de formular queries. |
| `get_table_schema` | `(ctx, table_name: str) → str` | Retorna o schema completo de uma tabela (colunas e tipos) e até 3 linhas de exemplo. Restrito a tabelas `gold_*`. |
| `execute_sql` | `(ctx, query: str) → str` | Executa uma query `SELECT` no banco e devolve os resultados formatados como tabela de texto. Limitado a 100 linhas. Registra a query em `executed_queries` para transparência. |

---

## Ciclo de vida de uma pergunta

```
Usuário → POST /agent/chat
               ↓
         agentRouter.py
               ↓
         agent.chat()          ← recupera histórico da sessão
               ↓
         agent.run()           ← envia mensagem + histórico ao Gemini
               ↓
    ┌─────────────────────┐
    │  Gemini decide:      │
    │  1. list_tables?     │  ← tools chamadas quantas vezes o modelo precisar
    │  2. get_table_schema?│
    │  3. execute_sql?     │
    └─────────────────────┘
               ↓
         result.output         ← resposta final em linguagem natural
               ↓
    extract_tables_from_sql()  ← extrai tabelas consultadas para `sources`
               ↓
    save_session_history()     ← persiste histórico (últimas 20 mensagens)
               ↓
         ChatResponse { answer, sources, queries, session_id }
```

---

## Memória de conversa

O agente mantém contexto entre perguntas da mesma sessão, permitindo perguntas de follow-up como "E desses produtos, qual tem a pior avaliação?".

| Aspecto | Detalhe |
|---|---|
| Armazenamento | Em memória — `dict[session_id → list[ModelMessage]]` no processo Python |
| Limite | Últimas **20 mensagens** por sessão (janela deslizante) |
| Identificação | Cada sessão é identificada por um `session_id` (string livre — o frontend gera um UUID) |
| Funções internas | `get_session_history(session_id)`, `save_session_history(session_id, messages)`, `clear_session_history(session_id)` |
| Observação | Por ser em memória, o histórico é perdido quando o processo reinicia. Em produção, substituir por Redis ou banco de dados persistente. |

### Limpeza do histórico antes de salvar (`_clean_messages_for_history`)

O Gemini exige que cada `function_call` no histórico seja imediatamente seguido de um `function_response`. Quando o histórico é truncado na janela de 20 mensagens e o corte cai no meio de um par tool_call → tool_response, a próxima requisição recebe um erro `400 INVALID_ARGUMENT`.

Para evitar isso, a função `_clean_messages_for_history()` é aplicada antes de salvar o histórico: ela remove todas as partes de tool call e tool response, mantendo apenas `TextPart` (respostas em texto do modelo) e `UserPromptPart` (mensagens do usuário):

```python
def _clean_messages_for_history(messages: list[ModelMessage]) -> list[ModelMessage]:
    cleaned = []
    for msg in messages:
        if isinstance(msg, ModelResponse):
            text_parts = [p for p in msg.parts if isinstance(p, TextPart)]
            if text_parts:
                cleaned.append(ModelResponse(parts=text_parts, ...))
        elif isinstance(msg, ModelRequest):
            user_parts = [p for p in msg.parts if isinstance(p, UserPromptPart)]
            if user_parts:
                cleaned.append(ModelRequest(parts=user_parts))
    return cleaned
```

O resultado é um histórico enxuto com apenas o diálogo pergunta/resposta, sem rastros de tool calls — compatível com qualquer tamanho de janela.

---

## Resposta da função `chat()`

A função `chat()` é o ponto de entrada principal do módulo. Ela orquestra a run do agente, a memória e a extração de metadados.

```python
async def chat(message: str, session_id: str, db: DatabaseTools | None = None) -> dict
```

| Campo retornado | Tipo | Descrição |
|---|---|---|
| `answer` | `str` | Resposta do agente em linguagem natural (português) |
| `sources` | `list[str]` | Tabelas Gold consultadas durante a run (extraídas via regex das queries SQL) |
| `queries` | `list[str]` | Queries SQL executadas — útil para debug e auditoria |
| `session_id` | `str` | ID da sessão — confirma que a memória está sendo mantida |

---

## Padrão Singleton

O agente é construído uma única vez (`build_agent()`) e reutilizado em todas as requisições via `get_agent()`. Isso evita overhead de instanciação a cada chamada e garante que o registro de ferramentas seja feito uma só vez.

```python
_agent_instance: Agent[AgentDeps, str] | None = None

def get_agent() -> Agent[AgentDeps, str]:
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = build_agent()
    return _agent_instance
```

---

## Integração com o backend

O agente é integrado ao backend FastAPI através do `agentRouter.py`, que expõe quatro endpoints:

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/agent/suggestions` | Retorna as 8 perguntas sugeridas para orientar o usuário ao iniciar o chat |
| `POST` | `/agent/chat` | Envia uma mensagem ao agente e recebe a resposta. O campo `session_id` deve ser o mesmo em toda a conversa para manter o contexto. |
| `DELETE` | `/agent/session/{session_id}` | Limpa o histórico de uma sessão, reiniciando a conversa do zero |
| `GET` | `/agent/health` | Verifica se o agente está configurado corretamente (banco acessível e `GEMINI_API_KEY` presente) |

O router instancia um único `DatabaseTools` compartilhado entre todas as requisições e valida a presença da `GEMINI_API_KEY` antes de cada chamada ao modelo.
