"""
seed.py — Cria e popula o banco SQLite do V-Commerce CRM 360
a partir dos CSVs exportados da camada Silver do Databricks.

Uso:
    python backend/database/seed.py

O banco é criado em backend/database/vcommerce.db
Os CSVs devem estar em data-engineering/silver-data-csvs/
"""

import sqlite3
import pandas as pd
from pathlib import Path
import sys
import time

# ── Caminhos ──────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parents[2]
CSV_DIR = ROOT / "data-engineering" / "silver-data-csvs"
DB_PATH = Path(__file__).resolve().parent / "vcommerce.db"

# ── Mapeamento CSV → tabela SQLite ────────────────────────────────────────────
# (nome_do_arquivo_sem_extensao, nome_da_tabela_no_banco)
TABLES = [
    # Dimensões (menores, carregadas primeiro)
    ("dim_categorias_produto",  "dim_categorias_produto"),
    ("dim_status_pedido",       "dim_status_pedido"),
    ("dim_tipos_problema",      "dim_tipos_problema"),
    ("dim_agentes_suporte",     "dim_agentes_suporte"),
    ("dim_produtos",            "dim_produtos"),
    ("dim_clientes",            "dim_clientes"),
    # Fatos (maiores, dependem das dimensões)
    ("ft_pedidos",              "ft_pedidos"),       # pode não existir ainda
    ("ft_avaliacoes",           "ft_avaliacoes"),
    ("ft_tickets_suporte",      "ft_tickets_suporte"),
    ("ft_clickstream",          "ft_clickstream"),
]

# Tipos explícitos para colunas problemáticas (evita inferência errada do pandas)
DTYPE_OVERRIDES: dict[str, dict] = {
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
}


def load_csv(stem: str) -> pd.DataFrame | None:
    path = CSV_DIR / f"{stem}.csv"
    if not path.exists():
        print(f"  ⚠  {stem}.csv não encontrado — pulando.")
        return None
    dtypes = DTYPE_OVERRIDES.get(stem, {})
    df = pd.read_csv(path, dtype=dtypes, low_memory=False)
    return df


def create_indexes(conn: sqlite3.Connection) -> None:
    """Cria índices nas colunas mais consultadas pelo backend."""
    indexes = [
        # Clientes
        "CREATE INDEX IF NOT EXISTS idx_clientes_email   ON dim_clientes(email)",
        "CREATE INDEX IF NOT EXISTS idx_clientes_regiao  ON dim_clientes(regiao)",
        "CREATE INDEX IF NOT EXISTS idx_clientes_origem  ON dim_clientes(origem)",
        # Produtos
        "CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON dim_produtos(categoria)",
        "CREATE INDEX IF NOT EXISTS idx_produtos_ativo     ON dim_produtos(ativo)",
        # Pedidos (quando existir)
        "CREATE INDEX IF NOT EXISTS idx_pedidos_cliente  ON ft_pedidos(id_cliente)",
        "CREATE INDEX IF NOT EXISTS idx_pedidos_produto  ON ft_pedidos(id_produto)",
        "CREATE INDEX IF NOT EXISTS idx_pedidos_status   ON ft_pedidos(status)",
        "CREATE INDEX IF NOT EXISTS idx_pedidos_ano_mes  ON ft_pedidos(ano_mes)",
        # Avaliações
        "CREATE INDEX IF NOT EXISTS idx_aval_cliente     ON ft_avaliacoes(id_cliente)",
        "CREATE INDEX IF NOT EXISTS idx_aval_produto     ON ft_avaliacoes(id_produto)",
        "CREATE INDEX IF NOT EXISTS idx_aval_pedido      ON ft_avaliacoes(id_pedido)",
        "CREATE INDEX IF NOT EXISTS idx_aval_categoria   ON ft_avaliacoes(categoria_nps)",
        # Tickets
        "CREATE INDEX IF NOT EXISTS idx_tickets_cliente  ON ft_tickets_suporte(id_cliente)",
        "CREATE INDEX IF NOT EXISTS idx_tickets_pedido   ON ft_tickets_suporte(id_pedido)",
        "CREATE INDEX IF NOT EXISTS idx_tickets_agente   ON ft_tickets_suporte(agente_suporte)",
        # Clickstream
        "CREATE INDEX IF NOT EXISTS idx_click_cliente    ON ft_clickstream(id_cliente)",
        "CREATE INDEX IF NOT EXISTS idx_click_produto    ON ft_clickstream(id_produto)",
        "CREATE INDEX IF NOT EXISTS idx_click_tipo       ON ft_clickstream(tipo_evento)",
    ]
    cursor = conn.cursor()
    for sql in indexes:
        try:
            cursor.execute(sql)
        except sqlite3.OperationalError:
            pass  # tabela ainda não existe (ex: ft_pedidos ausente)
    conn.commit()


def seed() -> None:
    print(f"\n{'='*60}")
    print("  V-Commerce CRM 360 — Seed do banco SQLite")
    print(f"{'='*60}")
    print(f"  CSVs:  {CSV_DIR}")
    print(f"  Banco: {DB_PATH}\n")

    if not CSV_DIR.exists():
        print(f"ERRO: Pasta de CSVs não encontrada em {CSV_DIR}")
        sys.exit(1)

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)

    # Performance: desabilita journal síncrono durante a carga massiva
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
    conn.execute("PRAGMA cache_size = -64000")  # 64 MB de cache
    conn.execute("PRAGMA foreign_keys = OFF")   # desabilita FKs durante o seed

    total_rows = 0
    start_total = time.time()

    for stem, table_name in TABLES:
        t0 = time.time()
        df = load_csv(stem)
        if df is None:
            continue

        print(f"  → {table_name:<30} {len(df):>8,} linhas", end="", flush=True)

        df.to_sql(
            name=table_name,
            con=conn,
            if_exists="replace",
            index=False,
            chunksize=10_000,
            method="multi",
        )

        elapsed = time.time() - t0
        print(f"  [{elapsed:.1f}s]")
        total_rows += len(df)

    print(f"\n  Criando índices...", end=" ", flush=True)
    create_indexes(conn)
    print("OK")

    conn.execute("PRAGMA foreign_keys = ON")
    conn.close()

    elapsed_total = time.time() - start_total
    size_mb = DB_PATH.stat().st_size / (1024 * 1024)

    print(f"\n{'='*60}")
    print(f"  ✓ Banco criado com sucesso!")
    print(f"  Linhas totais carregadas : {total_rows:>10,}")
    print(f"  Tamanho do arquivo       : {size_mb:>9.1f} MB")
    print(f"  Tempo total              : {elapsed_total:>9.1f}s")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    seed()
