"""
Esse .py é um script de teste interativo do Agente de IA V-Commerce CRM 360.

Como usar de maneira interativa:
    python ai-agent/test_agent.py

Ou em modo não-interativo:
    python ai-agent/test_agent.py "Qual foi a receita total em 2024?"
"""

import asyncio
import os
import sys
from pathlib import Path
from agent import chat  
from database_tools import DatabaseTools

#Setup de paths 
_ROOT = Path(__file__).resolve().parents[1]
_AGENT_DIR = _ROOT / "ai-agent"
_BACKEND_DIR = _ROOT / "backend"

sys.path.insert(0, str(_AGENT_DIR))
sys.path.insert(0, str(_BACKEND_DIR))

#Carrega .env do backend 
def _load_env():
    env_path = _BACKEND_DIR / ".env"
    if not env_path.exists():
        # Tenta .env.example como fallback
        env_path = _BACKEND_DIR / ".env.example"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, value = line.partition("=")
                    value = value.strip()
                    if key.strip() and value:
                        os.environ.setdefault(key.strip(), value)

_load_env()

#Verifica chave da API 
api_key = os.environ.get("GEMINI_API_KEY", "").strip()
if not api_key or api_key in ("sua-chave-aqui", "#colocar a chave aqui"):
    print("GEMINI_API_KEY não configurada.")
    print("Edite backend/.env e adicione sua chave do Google AI Studio.")
    print("Obtenha em: https://aistudio.google.com/app/apikey")
    sys.exit(1)


# Funções de exibição da IA

def _banner():
    print("\n" + "═" * 60)
    print(" V.AI — Agente de IA V-Commerce CRM 360")
    print("  Powered by Gemini 2.5 Flash + PydanticAI")
    print("═" * 60)
    print("  Digite sua pergunta e pressione Enter.")
    print("  Comandos: 'sair' para encerrar | 'limpar' para nova sessão")
    print("═" * 60 + "\n")


def _print_response(result: dict):
    print("\n" + "─" * 60)
    print("V.AI:")
    print(result["answer"])

    if result.get("sources"):
        print(f"\nFonte: {', '.join(f'`{s}`' for s in result['sources'])}")

    print("─" * 60 + "\n")

# Modo single-shot 

async def run_single(question: str):
    print(f"\nPergunta: {question}\n")
    print("Aguardando resposta...\n")
    result = await chat(message=question, session_id="cli-test")
    _print_response(result)

# Modo interativo 

async def run_interactive():
    _banner()

    session_id = "cli-interactive-001"
    db = DatabaseTools()

    # Verifica se o banco existe antes de começar
    if not db.db_path.exists():
        print(f"Banco não encontrado em: {db.db_path}")
        print("Execute primeiro: python backend/database/seed.py")
        return

    print(f"Banco conectado: {db.db_path.name}")
    print(f"API Key: {api_key[:8]}...{api_key[-4:]}")
    print(f"Sessão: {session_id}\n")

    perguntas_sugeridas = [
        "Qual foi a receita total dos últimos 3 meses?",
        "Quais são os 5 produtos mais vendidos?",
        "Qual região gerou mais receita este ano?",
    ]
    print("Sugestões para começar:")
    for i, q in enumerate(perguntas_sugeridas, 1):
        print(f"    {i}. {q}")
    print()

    turn = 0
    while True:
        try:
            user_input = input("Você: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\nEncerrando. Até mais!")
            break

        if not user_input:
            continue

        if user_input.lower() in ("sair", "exit", "quit"):
            print("\nEncerrando. Até mais!")
            break

        if user_input.lower() in ("limpar", "clear", "reset"):
            from agent import clear_session_history
            clear_session_history(session_id)
            turn = 0
            print("\nSessão reiniciada. Contexto anterior apagado.\n")
            continue

        turn += 1
        print(f"\nPensando... (turno {turn})\n")

        try:
            result = await chat(message=user_input, session_id=session_id, db=db)
            _print_response(result)
        except Exception as e:
            print(f"\nErro: {e}\n")

# Entry point

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Pergunta passada como argumento: python test_agent.py "minha pergunta"
        question = " ".join(sys.argv[1:])
        asyncio.run(run_single(question))
    else:
        # Modo interativo
        asyncio.run(run_interactive())
