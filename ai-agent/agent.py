"""
Esse .py é o script principal da IA, contendo seu
factory e lógica principal do Agente de IA V-Commerce CRM 360.

Usamos as tecnologias:
- PydanticAI  : framework de agentes
- Gemini 2.5 Flash : modelo de linguagem 
- SQLite      : banco de dados local

e implementamos os diferenciais que estavam no case:
- Memória de conversa 
- Extração de metadados das queries executadas 
"""

import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from pydantic_ai import Agent, RunContext
from pydantic_ai.messages import ModelMessage, ModelRequest, ModelResponse, TextPart, UserPromptPart

# Garante que o módulo pode ser importado tanto como package
# quanto diretamente pelo backend FastAPI
_THIS_DIR = Path(__file__).parent
if str(_THIS_DIR) not in sys.path:
    sys.path.insert(0, str(_THIS_DIR))

from database_tools import DatabaseTools  
from prompts import SUGGESTED_QUESTIONS, SYSTEM_PROMPT  

# Dependências injetadas no contexto do agente

@dataclass
class AgentDeps:
    #Dependências disponíveis para as ferramentas do agente durante uma run
    db: DatabaseTools
    # Rastreia queries executadas nesta run para reportar transparência
    executed_queries: list[str] = field(default_factory=list)

# Factory do agente

def build_agent(model: str = "google-gla:gemini-2.5-flash") -> Agent[AgentDeps, str]:
    
    #Constrói e retorna o agente PydanticAI configurado com as ferramentas SQL.
    
    agent: Agent[AgentDeps, str] = Agent(
        model=model,
        deps_type=AgentDeps,
        system_prompt=SYSTEM_PROMPT,
        result_type=str,
    )

    # Ferramenta 1: Listar tabelas 

    @agent.tool
    async def list_tables(ctx: RunContext[AgentDeps]) -> str:
        """
        Lista todas as tabelas disponíveis no banco de dados do CRM V-Commerce,
        com uma descrição breve do conteúdo de cada uma.

        é bom usar esta ferramenta quando não souber quais dados estão disponíveis
        ou quiser confirmar o nome exato de uma tabela.
        """
        return ctx.deps.db.list_tables()

    # Ferramenta 2: Schema de tabela 

    @agent.tool
    async def get_table_schema(ctx: RunContext[AgentDeps], table_name: str) -> str:
        """
        Retorna o schema completo de uma tabela: colunas, tipos de dados
        e até 3 linhas de exemplo.

        Usar esta ferramenta antes de escrever uma query para confirmar
        o nome exato das colunas e o formato dos valores.
        """
        return ctx.deps.db.get_table_schema(table_name)

    # Ferramenta 3: Executar query SQL 

    @agent.tool
    async def execute_sql(ctx: RunContext[AgentDeps], query: str) -> str:
        """
        Executa uma query SQL SELECT no banco V-Commerce e retorna os resultados
        formatados como tabela de texto.

        IMPORTANTE:
        - Apenas SELECT é permitido.
        - Resultados limitados a 100 linhas.
        - Em caso de erro SQL, a mensagem de erro é retornada para você corrigir a query.
        """
        result = ctx.deps.db.execute_query(query)
        # Rastreia a query para transparência na resposta
        ctx.deps.executed_queries.append(query.strip())
        return result

    return agent

# Utilitários de metadados

def extract_tables_from_sql(queries: list[str]) -> list[str]:
    """
    Extrai os nomes de tabelas referenciados nas queries SQL executadas.
    Usado para popular o campo 'sources' na resposta da API.
    """
    tables: set[str] = set()
    pattern = r"\bFROM\s+(\w+)|\bJOIN\s+(\w+)"
    for query in queries:
        matches = re.findall(pattern, query, re.IGNORECASE)
        for match in matches:
            table = match[0] or match[1]
            if table and table.lower() not in ("select", "where", "and", "or"):
                tables.add(table)
    return sorted(tables)

# Armazenamento de histórico de sessões em memoria
# Em produção, substituir por Redis ou banco de dados.

_session_history: dict[str, list[ModelMessage]] = {}


def get_session_history(session_id: str) -> list[ModelMessage]:
    #Retorna o histórico de mensagens de uma sessão
    return _session_history.get(session_id, [])


def _clean_messages_for_history(messages: list[ModelMessage]) -> list[ModelMessage]:
    """
    Remove partes de tool call e tool response do histórico antes de salvar.

    O Gemini exige que cada function_call seja imediatamente seguido de um
    function_response. Se o slice do histórico cortar no meio de um par
    tool_call → tool_response, a próxima requisição recebe um 400
    INVALID_ARGUMENT. Manter apenas TextPart e UserPromptPart elimina
    completamente esse problema.
    """
    cleaned: list[ModelMessage] = []
    for msg in messages:
        if isinstance(msg, ModelResponse):
            text_parts = [p for p in msg.parts if isinstance(p, TextPart)]
            if text_parts:
                cleaned.append(ModelResponse(parts=text_parts, model_name=msg.model_name, timestamp=msg.timestamp))
        elif isinstance(msg, ModelRequest):
            user_parts = [p for p in msg.parts if isinstance(p, UserPromptPart)]
            if user_parts:
                cleaned.append(ModelRequest(parts=user_parts))
    return cleaned


def save_session_history(session_id: str, messages: list[ModelMessage]) -> None:
    """Persiste o histórico de mensagens de uma sessão.

    Limita a 20 mensagens e remove tool calls/responses para evitar
    o erro 400 INVALID_ARGUMENT do Gemini em conversas multi-turno.
    """
    cleaned = _clean_messages_for_history(messages)
    _session_history[session_id] = cleaned[-20:]


def clear_session_history(session_id: str) -> None:
    #Limpa o histórico de uma sessão
    _session_history.pop(session_id, None)

# Instância global do agente (criada uma vez, reutilizada)

_agent_instance: Agent[AgentDeps, str] | None = None


def get_agent(model: str = "google-gla:gemini-2.5-flash") -> Agent[AgentDeps, str]:
    """
    Retorna a instância singleton do agente.
    Na primeira chamada, cria e configura o agente.
    """
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = build_agent(model)
    return _agent_instance

# Função principal de chat

async def chat(
    message: str,
    session_id: str,
    db: DatabaseTools | None = None,
) -> dict[str, Any]:
    # Processa uma mensagem do usuário e retorna a resposta do agente.
    
    if db is None:
        db = DatabaseTools()

    agent = get_agent()
    deps = AgentDeps(db=db)

    # Recupera histórico da sessão 
    history = get_session_history(session_id)

    # Executa o agente
    result = await agent.run(
        message,
        deps=deps,
        message_history=history if history else None,
    )

    # Persiste o histórico atualizado
    save_session_history(session_id, result.all_messages())

    # Extrai metadados de transparência
    sources = extract_tables_from_sql(deps.executed_queries)

    return {
        "answer": result.output,
        "sources": sources,
        "queries": deps.executed_queries,
        "session_id": session_id,
    }
