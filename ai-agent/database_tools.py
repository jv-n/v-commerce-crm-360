import re
import sqlite3
import textwrap
from pathlib import Path
from typing import Any


MAX_ROWS = 100


DEFAULT_DB_PATH = Path(__file__).resolve().parents[1] / "backend" / "database" / "vcommerce.db"

# Descrições das tabelas usadas no list_tables
TABLE_DESCRIPTIONS: dict[str, str] = {
    # --- Fontes primárias (idênticas ao dashboard) ---
    "gold_pedidos_detalhado": "[FONTE PRIMÁRIA] Pedidos individuais com status, receita_bruta e valor_reembolsado. Use para receita, contagem de pedidos e análises por período — mesma fonte do dashboard.",
    "gold_cliente_360": "[FONTE PRIMÁRIA] Visão 360 de cada cliente: pedidos, receita, tickets, NPS (campo categoria_nps_recente) e segmento. Use para NPS e leads convertidos — mesma fonte do dashboard.",
    # --- Tabelas de suporte e análise ---
    "gold_desempenho_produto": "Desempenho individual de cada produto: receita, avaliações, tickets.",
    "gold_analise_suporte_por_tipo": "Análise de tickets de suporte agrupados por tipo de problema.",
    "gold_analise_suporte_por_agente": "Desempenho dos agentes de suporte: tickets, resolução, nota.",
    "gold_analise_suporte_cliente": "Análise de suporte consolidada por cliente.",
    "gold_pedidos_por_status": "Contagem e receita de pedidos agrupados por status.",
    # --- Tabelas PRÉ-AGREGADAS (podem divergir do dashboard) ---
    "gold_kpis_vendas_mensal": "[PRÉ-AGREGADO] KPIs mensais de vendas. ⚠️ Pode divergir do dashboard — prefira gold_pedidos_detalhado para métricas de receita.",
    "gold_vendas_mensais": "[PRÉ-AGREGADO] Resumo mensal de vendas. ⚠️ Pode divergir do dashboard — prefira gold_pedidos_detalhado.",
    "gold_vendas_por_dimensao": "[PRÉ-AGREGADO] Vendas por mês, região e categoria. Útil para análises cruzadas exploratórias.",
    "gold_satisfacao_nps": "[PRÉ-AGREGADO] NPS e satisfação por mês e categoria. ⚠️ Para NPS idêntico ao dashboard, use gold_cliente_360 com campo categoria_nps_recente.",
}


class DatabaseTools:
    #Conjunto de ferramentas SQL para o agente de IA.

    def __init__(self, db_path: Path | str = DEFAULT_DB_PATH) -> None:
        self.db_path = Path(db_path)

    # Helpers internos

    def _connect(self) -> sqlite3.Connection:
        if not self.db_path.exists():
            raise FileNotFoundError(
                f"Banco de dados não encontrado em '{self.db_path}'. "
                "Execute 'python backend/database/seed.py' para criá-lo."
            )
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        # Acesso somente-leitura 
        return conn

    @staticmethod
    def _is_select_only(query: str) -> bool:
        #Valida que a query é uma instrução SELECT pura.
        normalized = query.strip().upper()
        # Remove comentários simples com regex
        normalized = re.sub(r"--[^\n]*", "", normalized)
        normalized = re.sub(r"/\*.*?\*/", "", normalized, flags=re.DOTALL)
        normalized = normalized.strip()
        if not normalized.startswith("SELECT"):
            return False
        # Bloqueia keywords de escrita
        forbidden = r"\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|REPLACE|ATTACH|DETACH|PRAGMA)\b"
        if re.search(forbidden, normalized):
            return False
        return True

    @staticmethod
    def _format_rows(rows: list[sqlite3.Row], columns: list[str]) -> str:
        #Formata linhas do banco como tabela de texto legível
        if not rows:
            return "Nenhum resultado encontrado."

        # Converte para lista de dicts
        data: list[dict[str, Any]] = [dict(zip(columns, row)) for row in rows]

        # Calcula largura de cada coluna
        col_widths = {col: len(col) for col in columns}
        for row in data:
            for col in columns:
                col_widths[col] = max(col_widths[col], len(str(row.get(col, ""))))

        # Monta header
        header = " | ".join(col.ljust(col_widths[col]) for col in columns)
        separator = "-+-".join("-" * col_widths[col] for col in columns)
        lines = [header, separator]

        # Monta linhas
        for row in data:
            line = " | ".join(str(row.get(col, "")).ljust(col_widths[col]) for col in columns)
            lines.append(line)

        return "\n".join(lines)

    # Ferramentas chamadas pelo agente de IA

    def list_tables(self) -> str:
        """
        Lista todas as tabelas disponíveis no banco com uma descrição breve.
        É interessante usar esta ferramenta antes de formular queries para que conheça os dados disponíveis.
        """
        try:
            conn = self._connect()
            cursor = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
            )
            # Expõe apenas tabelas da camada Gold ao agente de IA
            tables = [row[0] for row in cursor.fetchall() if row[0].startswith("gold_")]
            conn.close()
        except FileNotFoundError as e:
            return f"ERRO: {e}"
        except sqlite3.Error as e:
            return f"ERRO ao listar tabelas: {e}"

        if not tables:
            return "Nenhuma tabela encontrada no banco de dados."

        lines = ["Tabelas disponíveis no banco V-Commerce CRM 360:\n"]
        for table in tables:
            desc = TABLE_DESCRIPTIONS.get(table, "Sem descrição disponível.")
            lines.append(f"  • {table}\n      {desc}")
        return "\n".join(lines)

    def get_table_schema(self, table_name: str) -> str:
        """
        Retorna o schema de uma tabela: colunas, tipos e até 3 linhas de exemplo.
        Usar esta ferramenta para entender a estrutura de uma tabela antes de consultar ela.

        """
        # Sanitiza o nome da tabela
        if not re.match(r"^\w+$", table_name):
            return f"ERRO: Nome de tabela inválido: '{table_name}'"

        # Restringe o acesso do agente às tabelas Gold
        if not table_name.startswith("gold_"):
            return (
                f"ERRO: Tabela '{table_name}' não está disponível para o agente de IA. "
                "Use list_tables() para ver as tabelas Gold disponíveis."
            )

        try:
            conn = self._connect()

            # Verifica se a tabela existe
            exists = conn.execute(
                "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",
                (table_name,),
            ).fetchone()
            if not exists:
                conn.close()
                return (
                    f"ERRO: Tabela '{table_name}' não existe. "
                    "Use list_tables() para ver as tabelas disponíveis."
                )

            # Schema das colunas
            pragma = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
            columns_info = []
            for col in pragma:
                
                col_name = col[1]
                col_type = col[2] or "TEXT"
                pk_marker = " [PK]" if col[5] else ""
                columns_info.append(f"    {col_name} ({col_type}){pk_marker}")

            # Amostra de dados
            cursor = conn.execute(f"SELECT * FROM {table_name} LIMIT 3")  
            sample_rows = cursor.fetchall()
            col_names = [desc[0] for desc in cursor.description]
            conn.close()

            schema_text = [
                f"Schema da tabela '{table_name}':",
                "  Colunas:",
                *columns_info,
                "",
                "  Exemplos de dados (até 3 linhas):",
                self._format_rows(sample_rows, col_names),
            ]
            return "\n".join(schema_text)

        except FileNotFoundError as e:
            return f"ERRO: {e}"
        except sqlite3.Error as e:
            return f"ERRO ao consultar schema: {e}"

    def execute_query(self, query: str) -> str:
        """
        Executa uma query SQL SELECT e retorna os resultados formatados.
        Só é permitido SELECT e é retornado no máximo de 100 linhas

        """
        # Validação de segurança — apenas SELECT
        if not self._is_select_only(query):
            return (
                "ERRO DE SEGURANÇA: Apenas queries SELECT são permitidas. "
                "Reformule a consulta usando somente SELECT."
            )

        # Restringe o acesso às tabelas Gold
        referenced_tables = re.findall(r"\bFROM\s+(\w+)|\bJOIN\s+(\w+)", query, re.IGNORECASE)
        for match in referenced_tables:
            table = match[0] or match[1]
            if table and not table.lower().startswith("gold_"):
                return (
                    f"ERRO: A tabela '{table}' não está disponível para o agente de IA. "
                    "Use apenas tabelas Gold (prefixo 'gold_'). "
                    "Consulte list_tables() para ver as opções disponíveis."
                )

        # Adiciona LIMIT se não houver
        query_normalized = query.strip().rstrip(";")
        if not re.search(r"\bLIMIT\b", query_normalized, re.IGNORECASE):
            query_normalized = f"{query_normalized} LIMIT {MAX_ROWS}"

        try:
            conn = self._connect()
            cursor = conn.execute(query_normalized)
            rows = cursor.fetchall()
            col_names = [desc[0] for desc in cursor.description]
            conn.close()
        except FileNotFoundError as e:
            return f"ERRO: {e}"
        except sqlite3.OperationalError as e:
            return (
                f"ERRO SQL: {e}\n"
                "Dica: Verifique o nome das tabelas e colunas com list_tables() e get_table_schema()."
            )
        except sqlite3.Error as e:
            return f"ERRO ao executar query: {e}"

        total = len(rows)
        result = self._format_rows(rows, col_names)

        footer = ""
        if total == MAX_ROWS:
            footer = f"\n\n[Resultado limitado a {MAX_ROWS} linhas. Use cláusulas WHERE ou GROUP BY para refinar.]"
        elif total == 0:
            pass
        else:
            footer = f"\n\n[{total} linha(s) retornada(s)]"

        return result + footer
