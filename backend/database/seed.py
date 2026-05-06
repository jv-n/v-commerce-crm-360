"""
seed.py — Cria e popula o banco SQLite do V-Commerce CRM 360
a partir dos CSVs exportados das camadas Silver e Gold do Databricks.

Uso:
    python backend/database/seed.py

O banco é criado em backend/database/vcommerce.db
Os CSVs Silver devem estar em data-engineering/silver-data-csvs/
Os CSVs Gold  devem estar em data-engineering/gold-data-csvs/
"""

import sqlite3
import pandas as pd
from pathlib import Path
import sys
import time

# ── Caminhos ──────────────────────────────────────────────────────────────────
ROOT         = Path(__file__).resolve().parents[2]
SILVER_DIR   = ROOT / "data-engineering" / "silver-data-csvs"
GOLD_DIR     = ROOT / "data-engineering" / "gold-data-csvs"
DB_PATH      = Path(__file__).resolve().parent / "vcommerce.db"

# ── Tabelas Silver ────────────────────────────────────────────────────────────
# (nome_do_arquivo_sem_extensao, nome_da_tabela_no_banco)
SILVER_TABLES = [
    # Dimensões (menores, carregadas primeiro)
    ("dim_categorias_produto",  "dim_categorias_produto"),
    ("dim_status_pedido",       "dim_status_pedido"),
    ("dim_tipos_problema",      "dim_tipos_problema"),
    ("dim_agentes_suporte",     "dim_agentes_suporte"),
    ("dim_produtos",            "dim_produtos"),
    ("dim_clientes",            "dim_clientes"),
    # Fatos (maiores, dependem das dimensões)
    ("ft_pedidos",              "ft_pedidos"),
    ("ft_avaliacoes",           "ft_avaliacoes"),
    ("ft_tickets_suporte",      "ft_tickets_suporte"),
    ("ft_clickstream",          "ft_clickstream"),
]

# ── Tabelas Gold ──────────────────────────────────────────────────────────────
GOLD_TABLES = [
    ("gold_cliente_360",                "gold_cliente_360"),
    ("gold_kpis_vendas_mensal",         "gold_kpis_vendas_mensal"),
    ("gold_vendas_por_dimensao",        "gold_vendas_por_dimensao"),
    ("gold_desempenho_produto",         "gold_desempenho_produto"),
    ("gold_analise_suporte_por_tipo",   "gold_analise_suporte_por_tipo"),
    ("gold_analise_suporte_por_agente", "gold_analise_suporte_por_agente"),
    ("gold_satisfacao_nps",             "gold_satisfacao_nps"),
    ("gold_pedidos_detalhado",          "gold_pedidos_detalhado"),
    ("gold_pedidos_por_status",         "gold_pedidos_por_status"),
    ("gold_vendas_mensais",             "gold_vendas_mensais"),
]

# ── Tipos explícitos por tabela ───────────────────────────────────────────────
# Evita inferência errada do pandas em colunas booleanas/numéricas ambíguas
DTYPE_OVERRIDES: dict[str, dict] = {
    # Silver
    "dim_clientes": {
        "device_ids": str,
        "telefone": str,
    },
    "dim_produtos": {
        "ativo": str,
    },
    "ft_avaliacoes": {
        "recomenda": str,
        "nota_nps": "float64",
        "nota_produto": "float64",
    },
    "ft_tickets_suporte": {
        "resolvido": str,
        "tempo_resolucao_horas": "float64",
        "nota_avaliacao": "float64",
    },
    "ft_clickstream": {
        "is_conversao": str,
        "tempo_pagina_seg": "float64",
    },
    # Gold
    "gold_desempenho_produto": {
        "ativo": str,
    },
    "gold_cliente_360": {
        "total_pedidos": "float64",
        "receita_total": "float64",
        "ticket_medio": "float64",
    },
}

# ── Índices ───────────────────────────────────────────────────────────────────
INDEXES = [
    # Silver — dim_clientes
    "CREATE INDEX IF NOT EXISTS idx_clientes_email     ON dim_clientes(email)",
    "CREATE INDEX IF NOT EXISTS idx_clientes_regiao    ON dim_clientes(regiao)",
    "CREATE INDEX IF NOT EXISTS idx_clientes_origem    ON dim_clientes(origem)",
    # Silver — dim_produtos
    "CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON dim_produtos(categoria)",
    "CREATE INDEX IF NOT EXISTS idx_produtos_ativo     ON dim_produtos(ativo)",
    # Silver — ft_pedidos (pode não existir ainda)
    "CREATE INDEX IF NOT EXISTS idx_pedidos_cliente    ON ft_pedidos(id_cliente)",
    "CREATE INDEX IF NOT EXISTS idx_pedidos_produto    ON ft_pedidos(id_produto)",
    "CREATE INDEX IF NOT EXISTS idx_pedidos_status     ON ft_pedidos(status)",
    "CREATE INDEX IF NOT EXISTS idx_pedidos_ano_mes    ON ft_pedidos(ano_mes)",
    # Silver — ft_avaliacoes
    "CREATE INDEX IF NOT EXISTS idx_aval_cliente       ON ft_avaliacoes(id_cliente)",
    "CREATE INDEX IF NOT EXISTS idx_aval_produto       ON ft_avaliacoes(id_produto)",
    "CREATE INDEX IF NOT EXISTS idx_aval_pedido        ON ft_avaliacoes(id_pedido)",
    "CREATE INDEX IF NOT EXISTS idx_aval_categoria     ON ft_avaliacoes(categoria_nps)",
    # Silver — ft_tickets_suporte
    "CREATE INDEX IF NOT EXISTS idx_tickets_cliente    ON ft_tickets_suporte(id_cliente)",
    "CREATE INDEX IF NOT EXISTS idx_tickets_pedido     ON ft_tickets_suporte(id_pedido)",
    "CREATE INDEX IF NOT EXISTS idx_tickets_agente     ON ft_tickets_suporte(agente_suporte)",
    # Silver — ft_clickstream
    "CREATE INDEX IF NOT EXISTS idx_click_cliente      ON ft_clickstream(id_cliente)",
    "CREATE INDEX IF NOT EXISTS idx_click_produto      ON ft_clickstream(id_produto)",
    "CREATE INDEX IF NOT EXISTS idx_click_tipo         ON ft_clickstream(tipo_evento)",
    # Gold — gold_cliente_360
    "CREATE INDEX IF NOT EXISTS idx_g360_email         ON gold_cliente_360(email)",
    "CREATE INDEX IF NOT EXISTS idx_g360_regiao        ON gold_cliente_360(regiao)",
    "CREATE INDEX IF NOT EXISTS idx_g360_segmento      ON gold_cliente_360(segmento_cliente)",
    # Gold — gold_kpis_vendas_mensal
    "CREATE INDEX IF NOT EXISTS idx_gkpis_ano_mes      ON gold_kpis_vendas_mensal(ano_mes)",
    # Gold — gold_vendas_por_dimensao
    "CREATE INDEX IF NOT EXISTS idx_gdim_ano_mes       ON gold_vendas_por_dimensao(ano_mes)",
    "CREATE INDEX IF NOT EXISTS idx_gdim_regiao        ON gold_vendas_por_dimensao(regiao)",
    "CREATE INDEX IF NOT EXISTS idx_gdim_categoria     ON gold_vendas_por_dimensao(categoria)",
    # Gold — gold_desempenho_produto
    "CREATE INDEX IF NOT EXISTS idx_gprod_categoria    ON gold_desempenho_produto(categoria)",
    "CREATE INDEX IF NOT EXISTS idx_gprod_ativo        ON gold_desempenho_produto(ativo)",
    # Gold — gold_satisfacao_nps
    "CREATE INDEX IF NOT EXISTS idx_gnps_ano_mes       ON gold_satisfacao_nps(ano_mes)",
    "CREATE INDEX IF NOT EXISTS idx_gnps_categoria     ON gold_satisfacao_nps(categoria)",
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
            pass  # tabela não existe ainda (ex: ft_pedidos ausente)
    conn.commit()


def seed() -> None:
    print(f"\n{'='*60}")
    print("  V-Commerce CRM 360 — Seed do banco SQLite")
    print(f"{'='*60}")
    print(f"  Silver : {SILVER_DIR}")
    print(f"  Gold   : {GOLD_DIR}")
    print(f"  Banco  : {DB_PATH}\n")

    if not SILVER_DIR.exists():
        print(f"ERRO: Pasta Silver não encontrada em {SILVER_DIR}")
        sys.exit(1)

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
    if not GOLD_DIR.exists():
        print(f"  ⚠  Pasta Gold não encontrada em {GOLD_DIR} — pulando tabelas Gold.")
    else:
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
