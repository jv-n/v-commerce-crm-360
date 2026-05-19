"""
seed.py — Cria e popula o banco SQLite do V-Commerce CRM 360
a partir dos CSVs exportados da camada Gold do Databricks.

Uso:
    python backend/database/seed.py

O banco é criado em backend/database/vcommerce.db
Os CSVs Gold devem estar em data-engineering/gold-data-csvs/
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
# ── Tabelas Gold ──────────────────────────────────────────────────────────────
# (nome_do_arquivo_sem_extensao, nome_da_tabela_no_banco)
GOLD_TABLES = [
    ("gold_cliente_360",                "gold_cliente_360"),
    ("gold_kpis_vendas_mensal",         "gold_kpis_vendas_mensal"),
    ("gold_vendas_por_dimensao",        "gold_vendas_por_dimensao"),
    ("gold_desempenho_produto",         "gold_desempenho_produto"),
    ("gold_produtos_detalhado",         "gold_produtos_detalhado"),
    ("gold_dim_agentes_suporte",        "gold_dim_agentes_suporte"),
    ("gold_analise_suporte_por_tipo",   "gold_analise_suporte_por_tipo"),
    ("gold_analise_suporte_por_agente", "gold_analise_suporte_por_agente"),
    ("gold_analise_suporte_cliente",    "gold_analise_suporte_cliente"),
    ("gold_avaliacoes_360",              "gold_avaliacoes_360"),
    ("gold_satisfacao_nps",             "gold_satisfacao_nps"),
    ("gold_pedidos_detalhado",          "gold_pedidos_detalhado"),
    ("gold_pedidos_por_status",         "gold_pedidos_por_status"),
    ("gold_vendas_mensais",             "gold_vendas_mensais"),
    ("gold_engajamento_produto_digital","gold_engajamento_produto_digital"),
    ("gold_tickets_360",                "gold_tickets_360"),
    ("gold_sessao_resumo",              "gold_sessao_resumo"),
    ("gold_sessao_funil",               "gold_sessao_funil"),
]

# ── Tipos explícitos por tabela ───────────────────────────────────────────────
# Evita inferência errada do pandas em colunas booleanas/numéricas ambíguas.
DTYPE_OVERRIDES: dict[str, dict] = {
    "gold_desempenho_produto": {
        "ativo": str,
    },
    "gold_cliente_360": {
        "total_pedidos": "float64",
        "receita_total": "float64",
        "ticket_medio":  "float64",
    },
    "gold_tickets_360": {
        "ticket_id": str,
        "id_cliente": str,
        "status_atendimento": str,
        "tipo_problema": str,
        "data_abertura": str,
        "hora_abertura": str,
        "data_fechamento": str,
        "agente_suporte": str,
        "nome_cliente": str,
        "regiao_cliente": str,
        "estado_cliente": str,
        "faixa_etaria": str,
        "id_pedido": str,
        "timestamp_ingestion": str,
    },
}

# ── Índices ───────────────────────────────────────────────────────────────────
INDEXES = [
    # ── gold_pedidos_detalhado: filtros gerais de vendas/pedidos ──────────────
    "CREATE INDEX IF NOT EXISTS idx_gpedidos_data_pedido  ON gold_pedidos_detalhado(data_pedido DESC)",
    "CREATE INDEX IF NOT EXISTS idx_gpedidos_status       ON gold_pedidos_detalhado(status)",
    "CREATE INDEX IF NOT EXISTS idx_gpedidos_categoria    ON gold_pedidos_detalhado(categoria)",
    "CREATE INDEX IF NOT EXISTS idx_gpedidos_metodo       ON gold_pedidos_detalhado(metodo_pagamento)",
    "CREATE INDEX IF NOT EXISTS idx_gpedidos_ano_mes      ON gold_pedidos_detalhado(ano_mes)",
    "CREATE INDEX IF NOT EXISTS idx_gpedidos_status_data  ON gold_pedidos_detalhado(status, data_pedido DESC)",

    # ── gold_pedidos_detalhado: contact-details / mini dashboard ──────────────
    "CREATE INDEX IF NOT EXISTS idx_gpedidos_cliente_data ON gold_pedidos_detalhado(id_cliente, data_pedido DESC)",
    "CREATE INDEX IF NOT EXISTS idx_gpedidos_cliente_categoria_data ON gold_pedidos_detalhado(id_cliente, categoria, data_pedido DESC)",
    "CREATE INDEX IF NOT EXISTS idx_gpedidos_cliente_pedido ON gold_pedidos_detalhado(id_cliente, id_pedido)",

    # ── gold_pedidos_detalhado: busca de menções no chat IA ───────────────────
    "CREATE INDEX IF NOT EXISTS idx_gpedidos_id_pedido    ON gold_pedidos_detalhado(id_pedido)",

    # ── gold_cliente_360 ──────────────────────────────────────────────────────
    "CREATE INDEX IF NOT EXISTS idx_g360_id_cliente       ON gold_cliente_360(id_cliente)",
    "CREATE INDEX IF NOT EXISTS idx_g360_email            ON gold_cliente_360(email)",
    "CREATE INDEX IF NOT EXISTS idx_g360_regiao           ON gold_cliente_360(regiao)",
    "CREATE INDEX IF NOT EXISTS idx_g360_segmento         ON gold_cliente_360(segmento_cliente)",
    "CREATE INDEX IF NOT EXISTS idx_g360_nome_completo    ON gold_cliente_360(nome_completo)",
    "CREATE INDEX IF NOT EXISTS idx_g360_total_pedidos    ON gold_cliente_360(total_pedidos)",
    "CREATE INDEX IF NOT EXISTS idx_g360_data_ultimo      ON gold_cliente_360(data_ultimo_pedido)",
    "CREATE INDEX IF NOT EXISTS idx_g360_nps_media        ON gold_cliente_360(nota_nps_media)",
    "CREATE INDEX IF NOT EXISTS idx_g360_receita          ON gold_cliente_360(receita_total)",
    "CREATE INDEX IF NOT EXISTS idx_g360_ticket_medio     ON gold_cliente_360(ticket_medio)",

    # ── gold_tickets_360: filtros gerais de suporte ───────────────────────────
    "CREATE INDEX IF NOT EXISTS idx_gtickets_ticket_id       ON gold_tickets_360(ticket_id)",
    "CREATE INDEX IF NOT EXISTS idx_gtickets_id_cliente      ON gold_tickets_360(id_cliente)",
    "CREATE INDEX IF NOT EXISTS idx_gtickets_id_pedido       ON gold_tickets_360(id_pedido)",
    "CREATE INDEX IF NOT EXISTS idx_gtickets_data_abertura   ON gold_tickets_360(data_abertura DESC)",
    "CREATE INDEX IF NOT EXISTS idx_gtickets_status          ON gold_tickets_360(status_atendimento)",
    "CREATE INDEX IF NOT EXISTS idx_gtickets_agente          ON gold_tickets_360(agente_suporte)",
    "CREATE INDEX IF NOT EXISTS idx_gtickets_tipo_problema   ON gold_tickets_360(tipo_problema)",
    "CREATE INDEX IF NOT EXISTS idx_gtickets_nota            ON gold_tickets_360(nota_avaliacao)",
    "CREATE INDEX IF NOT EXISTS idx_gtickets_nome_cliente    ON gold_tickets_360(nome_cliente)",
    "CREATE INDEX IF NOT EXISTS idx_gtickets_regiao_cliente  ON gold_tickets_360(regiao_cliente)",
    "CREATE INDEX IF NOT EXISTS idx_gtickets_estado_cliente  ON gold_tickets_360(estado_cliente)",
    "CREATE INDEX IF NOT EXISTS idx_gtickets_faixa_etaria    ON gold_tickets_360(faixa_etaria)",
    "CREATE INDEX IF NOT EXISTS idx_gtickets_status_data     ON gold_tickets_360(status_atendimento, data_abertura DESC)",
    "CREATE INDEX IF NOT EXISTS idx_gtickets_agente_status   ON gold_tickets_360(agente_suporte, status_atendimento)",
    "CREATE INDEX IF NOT EXISTS idx_gtickets_problema_status ON gold_tickets_360(tipo_problema, status_atendimento)",

    # gold_kpis_vendas_mensal
    "CREATE INDEX IF NOT EXISTS idx_gkpis_ano_mes         ON gold_kpis_vendas_mensal(ano_mes)",

    # ── gold_dim_agentes_suporte: busca de menções no chat IA ─────────────────
    "CREATE INDEX IF NOT EXISTS idx_gagentes_nome         ON gold_dim_agentes_suporte(agente_suporte)", 

    # ── gold_produtos_detalhado: busca de menções no chat IA ──────────────────
    "CREATE INDEX IF NOT EXISTS idx_gproddet_nome_produto ON gold_produtos_detalhado(nome_produto)",
    "CREATE INDEX IF NOT EXISTS idx_gproddet_categoria    ON gold_produtos_detalhado(categoria)",
    "CREATE INDEX IF NOT EXISTS idx_gproddet_id_produto   ON gold_produtos_detalhado(id_produto)",   

    # ── gold_tickets_360: contact-details ─────────────────────────────────────
    "CREATE INDEX IF NOT EXISTS idx_gtickets_cliente_data ON gold_tickets_360(id_cliente, data_abertura DESC)",
    "CREATE INDEX IF NOT EXISTS idx_gtickets_cliente_data_hora ON gold_tickets_360(id_cliente, data_abertura DESC, hora_abertura DESC)",

    # ── gold_vendas_por_dimensao ──────────────────────────────────────────────
    "CREATE INDEX IF NOT EXISTS idx_gdim_ano_mes          ON gold_vendas_por_dimensao(ano_mes)",
    "CREATE INDEX IF NOT EXISTS idx_gdim_regiao           ON gold_vendas_por_dimensao(regiao)",
    "CREATE INDEX IF NOT EXISTS idx_gdim_categoria        ON gold_vendas_por_dimensao(categoria)",

    # ── gold_desempenho_produto ───────────────────────────────────────────────
    "CREATE INDEX IF NOT EXISTS idx_gprod_categoria       ON gold_desempenho_produto(categoria)",
    "CREATE INDEX IF NOT EXISTS idx_gprod_ativo           ON gold_desempenho_produto(ativo)",

    # ── gold_satisfacao_nps ───────────────────────────────────────────────────
    "CREATE INDEX IF NOT EXISTS idx_gnps_ano_mes          ON gold_satisfacao_nps(ano_mes)",
    "CREATE INDEX IF NOT EXISTS idx_gnps_categoria        ON gold_satisfacao_nps(categoria)",

    # ── gold_engajamento_produto_digital ──────────────────────────────────────
    "CREATE INDEX IF NOT EXISTS idx_gengaj_categoria      ON gold_engajamento_produto_digital(categoria)",
    "CREATE INDEX IF NOT EXISTS idx_gengaj_id_produto     ON gold_engajamento_produto_digital(id_produto)",
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
            pass

    conn.commit()


# ── Demo de ordens com status de entrega ──────────────────────────────────────
# Não existe dado de entrega no dataset original (pedidos.csv só tem status de
# pagamento). Esses registros permitem visualizar e testar os novos status no CRM.
# Formato: (status, nome_completo, email, estado, regiao, nome_produto, categoria,
#           metodo_pagamento, quantidade, valor_pedido, data_pedido_iso)
_DEMO_ORDERS: list[tuple] = [
    # ── Em rota ──────────────────────────────────────────────────────────────
    ("Em rota", "Ana Lima",          "ana.lima@email.com",       "SP", "Sudeste",  "Smart TV 55\"",       "Eletronicos", "Pix",    1, 2499.90, "2025-04-20"),
    ("Em rota", "Carlos Souza",      "carlos.s@email.com",       "RJ", "Sudeste",  "Cadeira Gamer",       "Moveis",      "Cartão", 1,  899.00, "2025-04-21"),
    ("Em rota", "Fernanda Costa",    "fecosta@email.com",        "MG", "Sudeste",  "Tênis Running",       "Esportes",    "Pix",    2,  349.90, "2025-04-22"),
    ("Em rota", "Bruno Oliveira",    "b.oliveira@email.com",     "BA", "Nordeste", "Perfume Importado",   "Beleza",      "Boleto", 1,  289.00, "2025-04-23"),
    ("Em rota", "Juliana Martins",   "ju.martins@email.com",     "SC", "Sul",      "Notebook Pro 15",     "Eletronicos", "Cartão", 1, 4799.00, "2025-04-24"),
    ("Em rota", "Pedro Henrique",    "pedro.h@email.com",        "RS", "Sul",      "Mochila Térmica",     "Esportes",    "Pix",    3,  149.90, "2025-04-25"),
    # ── Entregue ─────────────────────────────────────────────────────────────
    ("Entregue", "Mariana Ferreira", "mari.fe@email.com",        "SP", "Sudeste",  "Fone Bluetooth",      "Eletronicos", "Pix",    1,  199.90, "2025-03-10"),
    ("Entregue", "Roberto Alves",    "r.alves@email.com",        "RJ", "Sudeste",  "Mesa de Escritório",  "Moveis",      "Boleto", 1,  699.00, "2025-03-12"),
    ("Entregue", "Camila Santos",    "cami.s@email.com",         "CE", "Nordeste", "Vestido Floral",      "Vestuario",   "Cartão", 2,  189.90, "2025-03-14"),
    ("Entregue", "Lucas Pereira",    "lucas.p@email.com",        "PR", "Sul",      "Kit Churrasco",       "Casa",        "Pix",    1,  259.00, "2025-03-16"),
    ("Entregue", "Beatriz Rocha",    "bea.rocha@email.com",      "AM", "Norte",    "Creme Hidratante",    "Beleza",      "Cartão", 4,   89.90, "2025-03-18"),
    ("Entregue", "Diego Nascimento", "diego.n@email.com",        "GO", "Centro-Oeste","Raquete de Tênis", "Esportes",    "Boleto", 1,  320.00, "2025-03-20"),
    # ── Entregue com Atraso ───────────────────────────────────────────────────
    ("Entregue com Atraso", "Aline Barbosa",   "aline.b@email.com",  "SP", "Sudeste",     "Tablet 10\"",        "Eletronicos", "Cartão", 1, 1299.00, "2025-02-05"),
    ("Entregue com Atraso", "Rodrigo Lima",    "rod.lima@email.com", "MG", "Sudeste",     "Sofá 3 Lugares",     "Moveis",      "Boleto", 1, 2199.00, "2025-02-07"),
    ("Entregue com Atraso", "Tatiane Mendes",  "tati.m@email.com",   "PE", "Nordeste",    "Jaqueta de Couro",   "Vestuario",   "Pix",    1,  459.00, "2025-02-10"),
    ("Entregue com Atraso", "Vinícius Torres", "vini.t@email.com",   "RS", "Sul",         "Bicicleta MTB",      "Esportes",    "Cartão", 1, 1850.00, "2025-02-12"),
    ("Entregue com Atraso", "Larissa Pinto",   "la.pinto@email.com", "PA", "Norte",       "Conjunto de Panelas","Casa",        "Boleto", 1,  399.00, "2025-02-14"),
    ("Entregue com Atraso", "Thiago Carvalho", "thiago.c@email.com", "DF", "Centro-Oeste","Mouse Gamer",        "Eletronicos", "Pix",    1,  249.00, "2025-02-17"),
    # ── Cancelado ─────────────────────────────────────────────────────────────
    ("Cancelado", "Renata Moura",    "renata.m@email.com",       "SP", "Sudeste",  "Smartwatch Pro",      "Eletronicos", "Cartão", 1,  799.00, "2025-03-25"),
    ("Cancelado", "Felipe Araújo",   "felipe.a@email.com",       "RJ", "Sudeste",  "Cama Box Casal",      "Moveis",      "Boleto", 1, 1599.00, "2025-03-27"),
    ("Cancelado", "Isabela Fonseca", "isa.f@email.com",          "BA", "Nordeste", "Calça Jeans",         "Vestuario",   "Pix",    2,  219.90, "2025-03-29"),
    ("Cancelado", "Gustavo Lima",    "gus.lima@email.com",       "SC", "Sul",      "Kit Skincare",        "Beleza",      "Cartão", 1,  349.00, "2025-04-01"),
    ("Cancelado", "Priscila Nunes",  "pri.n@email.com",          "MG", "Sudeste",  "Esteira Elétrica",    "Esportes",    "Boleto", 1, 3299.00, "2025-04-03"),
    ("Cancelado", "André Batista",   "andre.b@email.com",        "PR", "Sul",      "Luminária LED",       "Casa",        "Pix",    3,  129.90, "2025-04-05"),
]

# Activity chains per final status (list of (days_offset, old, new) from order date)
_ACTIVITY_CHAINS: dict[str, list[tuple[int, str | None, str]]] = {
    "Em rota": [
        (0,  None,          "Processando"),
        (1,  "Processando", "Aprovado"),
        (2,  "Aprovado",    "Em rota"),
    ],
    "Entregue": [
        (0,  None,          "Processando"),
        (1,  "Processando", "Aprovado"),
        (2,  "Aprovado",    "Em rota"),
        (7,  "Em rota",     "Entregue"),
    ],
    "Entregue com Atraso": [
        (0,  None,          "Processando"),
        (1,  "Processando", "Aprovado"),
        (2,  "Aprovado",    "Em rota"),
        (18, "Em rota",     "Entregue com Atraso"),  # expected ~7 days, arrived in 18
    ],
    "Cancelado": [
        (0,  None,          "Processando"),
        (1,  "Processando", "Aprovado"),
        (3,  "Aprovado",    "Cancelado"),
    ],
}

_DEMO_USERS = ["Joao Vendas", "Caio Vendas", "Gustavo Admin"]


def seed_demo_delivery_orders(conn: sqlite3.Connection) -> None:
    from datetime import date, timedelta

    conn.execute("""
        CREATE TABLE IF NOT EXISTS ft_sale_activities (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            id_pedido     TEXT    NOT NULL,
            user_name     TEXT    NOT NULL,
            field_name    TEXT    NOT NULL,
            old_value     TEXT,
            new_value     TEXT,
            change_method TEXT    NOT NULL DEFAULT 'Edição direta',
            changed_at    TEXT    NOT NULL
        )
    """)

    cursor = conn.cursor()
    order_ids: list[str] = []

    for i, row in enumerate(_DEMO_ORDERS):
        status, nome, email, estado, regiao, produto, categoria, pagamento, qtd, valor, data_str = row
        order_id   = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"demo-delivery-{i}"))
        cliente_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"demo-client-{i}"))
        produto_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"demo-product-{i}"))
        ano_mes    = data_str[:7]  # "2025-04"

        cursor.execute("""
            INSERT OR REPLACE INTO gold_pedidos_detalhado
            (id_pedido, id_cliente, estado, regiao, nome_completo, email, telefone,
             id_produto, nome_produto, categoria, ativo, data_pedido, ano_mes,
             metodo_pagamento, status, quantidade, valor_pedido, receita_bruta,
             valor_reembolsado, timestamp_ingestion)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            order_id, cliente_id, estado, regiao, nome, email, "(11) 99999-0000",
            produto_id, produto, categoria, 1, data_str, ano_mes,
            pagamento, status, qtd, valor, valor, 0.0,
            "2025-05-01T00:00:00",
        ))

        order_ids.append(order_id)

    # ── Activity logs ─────────────────────────────────────────────────────────
    # Delete any previous demo activity logs to make seed idempotent
    cursor.execute(
        f"DELETE FROM ft_sale_activities WHERE id_pedido IN ({','.join('?' * len(order_ids))})",
        order_ids,
    )

    for i, (order_id, (status, *_rest, data_str)) in enumerate(zip(order_ids, _DEMO_ORDERS)):
        order_date = date.fromisoformat(data_str)
        chain      = _ACTIVITY_CHAINS[status]
        user       = _DEMO_USERS[i % len(_DEMO_USERS)]

        for days_offset, old_val, new_val in chain:
            changed_at = f"{order_date + timedelta(days=days_offset)} 10:{(i * 7 % 50):02d}:00"
            cursor.execute("""
                INSERT INTO ft_sale_activities
                (id_pedido, user_name, field_name, old_value, new_value, change_method, changed_at)
                VALUES (?,?,?,?,?,?,?)
            """, (order_id, user, "Status", old_val, new_val, "Edição direta", changed_at))

    conn.commit()
    print(f"   {'demo delivery orders':<35} {len(_DEMO_ORDERS):>8,} linhas  [seed estático]")
    print(f"   {'demo activity logs':<35} {sum(len(_ACTIVITY_CHAINS[r[0]]) for r in _DEMO_ORDERS):>8,} linhas  [seed estático]")


def seed_users(conn: sqlite3.Connection) -> None:
    conn.execute("DROP TABLE IF EXISTS users")
    conn.execute("""
        CREATE TABLE users (
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
            """
            INSERT OR IGNORE INTO users (id, name, email, password, role)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, user["name"], user["email"], hashed, user["role"]),
        )

    conn.commit()
    print(f"   {'users':<30} {len(USERS):>8,} linhas  [seed estático]")


def seed() -> None:
    print(f"\n{'='*60}")
    print("  V-Commerce CRM 360 — Seed do banco SQLite")
    print(f"{'='*60}")
    print(f"  Gold  : {GOLD_DIR}")
    print(f"  Banco : {DB_PATH}\n")

    if not GOLD_DIR.exists():
        print(f"ERRO: Pasta Gold não encontrada em {GOLD_DIR}")
        raise SystemExit(1)

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)

    # PRAGMAs voltados para acelerar o processo de carga e melhorar leituras.
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
    conn.execute("PRAGMA cache_size = -64000")
    conn.execute("PRAGMA foreign_keys = OFF")

    # mmap_size pode ajudar leituras em bases maiores.
    # Se o ambiente não suportar, o SQLite apenas ignora ou limita.
    try:
        conn.execute("PRAGMA mmap_size = 268435456")  # 256 MB
    except sqlite3.OperationalError:
        pass

    total_rows = 0
    start_total = time.time()

    # ── Camada Gold ───────────────────────────────────────────────────────────
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

    # ── Demo: ordens com status de entrega ───────────────────────────────────
    print()
    print("  [ Demo — status de entrega ]")
    seed_demo_delivery_orders(conn)

    # ── Usuários ──────────────────────────────────────────────────────────────
    print()
    print("  [ Usuários ]")
    seed_users(conn)

    # ── Índices ───────────────────────────────────────────────────────────────
    print(f"\n  Criando índices e estatísticas...", end=" ", flush=True)
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