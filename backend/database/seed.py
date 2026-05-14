"""
seed.py — Cria e popula o banco SQLite do V-Commerce CRM 360
a partir dos CSVs exportados das camadas Silver e Gold do Databricks.

Uso:
    python backend/database/seed.py

O banco é criado em backend/database/vcommerce.db
Os CSVs Gold devem estar em data-engineering/gold-data-csvs/
Os CSVs Silver devem estar em data-engineering/silver-data-csvs/
"""

import sqlite3
import pandas as pd
from pathlib import Path
import time
import uuid
from pwdlib import PasswordHash

_password_hasher = PasswordHash.recommended()

# ── Caminhos ──────────────────────────────────────────────────────────────────
ROOT       = Path(__file__).resolve().parents[2]
GOLD_DIR   = ROOT / "data-engineering" / "gold-data-csvs"
SILVER_DIR = ROOT / "data-engineering" / "silver-data-csvs"
DB_PATH    = Path(__file__).resolve().parent / "vcommerce.db"

# ── Usuários ──────────────────────────────────────────────────────────────────
USERS = [
    {
        "name": "Gustavo Admin",
        "email": "gustavo.admin@vcommerce.com",
        "password": "admin123",
        "role": "admin",
    },
    {
        "name": "Joao Vendas",
        "email": "joao.vendas@vcommerce.com",
        "password": "vendas123",
        "role": "sales",
    },
    {
        "name": "Maria Suporte",
        "email": "maria.suporte@vcommerce.com",
        "password": "support123",
        "role": "support",
    },
    {
        "name": "Caio Vendas",
        "email": "caio.vendas@vcommerce.com",
        "password": "sales123",
        "role": "sales",
    },
]

# ── Tabelas Silver ────────────────────────────────────────────────────────────
# Necessárias para o mentionRouter (dim_clientes, dim_produtos, ft_pedidos,
# dim_agentes_suporte) e para joins internos do agente de IA.
SILVER_TABLES = [
    ("dim_clientes",       "dim_clientes"),
    ("dim_produtos",       "dim_produtos"),
    ("dim_agentes_suporte","dim_agentes_suporte"),
    ("ft_pedidos",         "ft_pedidos"),
]

# ── Tabelas Gold ──────────────────────────────────────────────────────────────
# (nome_do_arquivo_sem_extensao, nome_da_tabela_no_banco)
GOLD_TABLES = [
    ("gold_cliente_360",                "gold_cliente_360"),
    ("gold_kpis_vendas_mensal",         "gold_kpis_vendas_mensal"),
    ("gold_vendas_por_dimensao",        "gold_vendas_por_dimensao"),
    ("gold_desempenho_produto",         "gold_desempenho_produto"),
    ("gold_analise_suporte_por_tipo",   "gold_analise_suporte_por_tipo"),
    ("gold_analise_suporte_por_agente", "gold_analise_suporte_por_agente"),
    ("gold_analise_suporte_cliente",    "gold_analise_suporte_cliente"),
    ("gold_satisfacao_nps",             "gold_satisfacao_nps"),
    ("gold_pedidos_detalhado",          "gold_pedidos_detalhado"),
    ("gold_pedidos_por_status",         "gold_pedidos_por_status"),
    ("gold_vendas_mensais",             "gold_vendas_mensais"),
]

# ── Tipos explícitos por tabela ───────────────────────────────────────────────
# Evita inferência errada do pandas em colunas booleanas/numéricas ambíguas
DTYPE_OVERRIDES: dict[str, dict] = {
    # Gold
    "gold_desempenho_produto": {
        "ativo": str,
    },
    "gold_cliente_360": {
        "total_pedidos": "float64",
        "receita_total": "float64",
        "ticket_medio":  "float64",
    },
    # Silver
    "dim_produtos": {
        "ativo": str,
    },
    "ft_pedidos": {
        "flag_data_pedido_ambigua":            str,
        "flag_valor_pedido_negativo":          str,
        "flag_quantidade_menor_igual_a_zero":  str,
        "flag_pedido_com_inconsistencia":      str,
    },
}

# ── Índices ───────────────────────────────────────────────────────────────────
INDEXES = [
    # gold_pedidos_detalhado
    "CREATE INDEX IF NOT EXISTS idx_gpedidos_data_pedido  ON gold_pedidos_detalhado(data_pedido DESC)",
    "CREATE INDEX IF NOT EXISTS idx_gpedidos_status       ON gold_pedidos_detalhado(status)",
    "CREATE INDEX IF NOT EXISTS idx_gpedidos_categoria    ON gold_pedidos_detalhado(categoria)",
    "CREATE INDEX IF NOT EXISTS idx_gpedidos_metodo       ON gold_pedidos_detalhado(metodo_pagamento)",
    "CREATE INDEX IF NOT EXISTS idx_gpedidos_ano_mes      ON gold_pedidos_detalhado(ano_mes)",
    "CREATE INDEX IF NOT EXISTS idx_gpedidos_status_data  ON gold_pedidos_detalhado(status, data_pedido DESC)",
    # gold_cliente_360
    "CREATE INDEX IF NOT EXISTS idx_g360_email            ON gold_cliente_360(email)",
    "CREATE INDEX IF NOT EXISTS idx_g360_regiao           ON gold_cliente_360(regiao)",
    "CREATE INDEX IF NOT EXISTS idx_g360_segmento         ON gold_cliente_360(segmento_cliente)",
    "CREATE INDEX IF NOT EXISTS idx_g360_nome_completo    ON gold_cliente_360(nome_completo)",
    "CREATE INDEX IF NOT EXISTS idx_g360_total_pedidos    ON gold_cliente_360(total_pedidos)",
    "CREATE INDEX IF NOT EXISTS idx_g360_data_ultimo      ON gold_cliente_360(data_ultimo_pedido)",
    "CREATE INDEX IF NOT EXISTS idx_g360_nps_media        ON gold_cliente_360(nota_nps_media)",
    "CREATE INDEX IF NOT EXISTS idx_g360_receita          ON gold_cliente_360(receita_total)",
    "CREATE INDEX IF NOT EXISTS idx_g360_ticket_medio     ON gold_cliente_360(ticket_medio)",
    # dim_clientes (busca de menções no chat IA)
    "CREATE INDEX IF NOT EXISTS idx_dimcli_nome_completo  ON dim_clientes(nome_completo)",
    "CREATE INDEX IF NOT EXISTS idx_dimcli_id_cliente     ON dim_clientes(id_cliente)",
    # dim_produtos (busca de menções no chat IA)
    "CREATE INDEX IF NOT EXISTS idx_dimprod_nome_produto  ON dim_produtos(nome_produto)",
    "CREATE INDEX IF NOT EXISTS idx_dimprod_categoria     ON dim_produtos(categoria)",
    # ft_pedidos (busca de menções no chat IA)
    "CREATE INDEX IF NOT EXISTS idx_ftpedidos_id_pedido   ON ft_pedidos(id_pedido)",
    "CREATE INDEX IF NOT EXISTS idx_ftpedidos_id_cliente  ON ft_pedidos(id_cliente)",
    "CREATE INDEX IF NOT EXISTS idx_ftpedidos_status      ON ft_pedidos(status)",
    # gold_kpis_vendas_mensal
    "CREATE INDEX IF NOT EXISTS idx_gkpis_ano_mes         ON gold_kpis_vendas_mensal(ano_mes)",
    # gold_vendas_por_dimensao
    "CREATE INDEX IF NOT EXISTS idx_gdim_ano_mes          ON gold_vendas_por_dimensao(ano_mes)",
    "CREATE INDEX IF NOT EXISTS idx_gdim_regiao           ON gold_vendas_por_dimensao(regiao)",
    "CREATE INDEX IF NOT EXISTS idx_gdim_categoria        ON gold_vendas_por_dimensao(categoria)",
    # gold_desempenho_produto
    "CREATE INDEX IF NOT EXISTS idx_gprod_categoria       ON gold_desempenho_produto(categoria)",
    "CREATE INDEX IF NOT EXISTS idx_gprod_ativo           ON gold_desempenho_produto(ativo)",
    # gold_satisfacao_nps
    "CREATE INDEX IF NOT EXISTS idx_gnps_ano_mes          ON gold_satisfacao_nps(ano_mes)",
    "CREATE INDEX IF NOT EXISTS idx_gnps_categoria        ON gold_satisfacao_nps(categoria)",
]


def load_csv(csv_dir: Path, stem: str) -> pd.DataFrame | None:
    path = csv_dir / f"{stem}.csv"
    if not path.exists():
        print(f"  ⚠  {stem}.csv não encontrado — pulando.")
        return None
    dtypes = DTYPE_OVERRIDES.get(stem, {})
    df = pd.read_csv(path, dtype=dtypes, low_memory=False)
    return df


def insert_table(conn: sqlite3.Connection, df: pd.DataFrame, table_name: str) -> None:
    """Insere um DataFrame no SQLite respeitando o limite de variáveis."""
    # SQLite tem limite de 32766 variáveis por statement.
    safe_chunk = max(1, 32766 // len(df.columns))
    df.to_sql(
        name=table_name,
        con=conn,
        if_exists="replace",
        index=False,
        chunksize=safe_chunk,
        method="multi",
    )


def create_indexes(conn: sqlite3.Connection) -> None:
    cursor = conn.cursor()
    for sql in INDEXES:
        try:
            cursor.execute(sql)
        except sqlite3.OperationalError:
            pass  # tabela não existe ainda — ignora silenciosamente
    conn.commit()


def seed_users(conn: sqlite3.Connection) -> None:
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id       TEXT PRIMARY KEY,
            name     TEXT NOT NULL,
            email    TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role     TEXT NOT NULL
        )
    """)
    cursor = conn.cursor()
    for user in USERS:
        user_id = str(uuid.uuid4())
        hashed = _password_hasher.hash(user["password"])
        cursor.execute(
            "INSERT OR IGNORE INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)",
            (user_id, user["name"], user["email"], hashed, user["role"]),
        )
    conn.commit()
    print(f"   {'users':<30} {len(USERS):>8,} linhas  [seed estático]")


def seed() -> None:
    print(f"\n{'='*60}")
    print("  V-Commerce CRM 360 — Seed do banco SQLite")
    print(f"{'='*60}")
    print(f"  Silver: {SILVER_DIR}")
    print(f"  Gold  : {GOLD_DIR}")
    print(f"  Banco : {DB_PATH}\n")

    if not GOLD_DIR.exists():
        print(f"ERRO: Pasta Gold não encontrada em {GOLD_DIR}")
        raise SystemExit(1)

    if not SILVER_DIR.exists():
        print(f"ERRO: Pasta Silver não encontrada em {SILVER_DIR}")
        raise SystemExit(1)

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
    conn.execute("PRAGMA cache_size = -64000")
    conn.execute("PRAGMA foreign_keys = OFF")

    total_rows = 0
    start_total = time.time()

    # ── Camada Silver ─────────────────────────────────────────────────────────
    print("  [ Silver ]")
    for stem, table_name in SILVER_TABLES:
        t0 = time.time()
        df = load_csv(SILVER_DIR, stem)
        if df is None:
            continue
        print(f"   {table_name:<35} {len(df):>8,} linhas", end="", flush=True)
        insert_table(conn, df, table_name)
        print(f"  [{time.time() - t0:.1f}s]")
        total_rows += len(df)

    # ── Camada Gold ───────────────────────────────────────────────────────────
    print()
    print("  [ Gold ]")
    for stem, table_name in GOLD_TABLES:
        t0 = time.time()
        df = load_csv(GOLD_DIR, stem)
        if df is None:
            continue
        print(f"   {table_name:<35} {len(df):>8,} linhas", end="", flush=True)
        insert_table(conn, df, table_name)
        print(f"  [{time.time() - t0:.1f}s]")
        total_rows += len(df)

    # ── Usuários ──────────────────────────────────────────────────────────────
    print()
    print("  [ Usuários ]")
    seed_users(conn)

    # ── Índices ───────────────────────────────────────────────────────────────
    print(f"\n  Criando índices...", end=" ", flush=True)
    create_indexes(conn)
    print("OK")

    conn.execute("PRAGMA foreign_keys = ON")
    conn.close()

    elapsed_total = time.time() - start_total
    size_mb = DB_PATH.stat().st_size / (1024 * 1024)

    print(f"\n{'='*60}")
    print(f"  Banco criado com sucesso!")
    print(f"  Linhas totais carregadas : {total_rows:>10,}")
    print(f"  Tamanho do arquivo       : {size_mb:>9.1f} MB")
    print(f"  Tempo total              : {elapsed_total:>9.1f}s")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    seed()
