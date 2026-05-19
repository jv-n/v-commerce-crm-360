# Documentação Agente de IA

Documentação do V.AI, agente conversacional Text-to-SQL integrado ao V-Commerce CRM 360, desenvolvido com **PydanticAI** e **Gemini 2.5 Flash**.

---

## Arquivos

| Arquivo | Descrição |
|---|---|
| [Arquitetura do Agente](./agent-doc.md) | Estrutura, dependências, ferramentas e configuração |
| [Text-to-SQL](./text-to-sql-doc.md) | Fluxo de tradução de perguntas para queries SQL |
| [Guardrails](./guardrails-doc.md) | Regras de segurança, escopo e resistência a prompt injection |
| [Testes](./testing-doc.md) | Guia completo para testar o agente localmente |

---

## Arquivos do módulo

| Arquivo | Descrição |
|---|---|
| `agent.py` | Definição do agente, ferramentas e lógica principal |
| `database_tools.py` | Conexão com o banco, execução de queries e validação SELECT-only |
| `prompts.py` | System prompt e instruções de comportamento do agente |
| `test_agent.py` | Script de teste interativo e non-interactive |

---

## Capacidades

- Traduz perguntas em linguagem natural para SQL válido
- Consulta as tabelas Silver e Gold do `vcommerce.db`
- Mantém memória de conversa entre turnos da mesma sessão
- Recusa perguntas fora do escopo dos dados da V-Commerce
- Bloqueia comandos que alterem ou deletem dados (`DELETE`, `UPDATE`, `DROP`)
- Resiste a tentativas de prompt injection

---

## Stack

- PydanticAI
- Gemini 2.5 Flash (Google AI Studio)
- SQLite (`vcommerce.db`)
- Python