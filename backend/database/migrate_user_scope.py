"""
migrate_user_scope.py
---------------------
Migração idempotente: adiciona a coluna user_id às tabelas bookmarks e goals,
e recria a tabela bookmarks para substituir a constraint UNIQUE(entity_id)
pela constraint composta UNIQUE(user_id, entity_id).

Executado automaticamente pelo main.py na inicialização da API.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "vcommerce.db")


def _column_exists(cur: sqlite3.Cursor, table: str, column: str) -> bool:
    cur.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cur.fetchall())


def run():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # ── bookmarks ─────────────────────────────────────────────────────────────
    # Recria a tabela para:
    #   1. Adicionar coluna user_id
    #   2. Trocar UNIQUE(entity_id) → UNIQUE(user_id, entity_id)
    if not _column_exists(cur, "bookmarks", "user_id"):
        cur.executescript("""
            CREATE TABLE bookmarks_new (
                id          TEXT PRIMARY KEY,
                user_id     TEXT,
                kind        TEXT NOT NULL,
                entity_id   TEXT NOT NULL,
                name        TEXT NOT NULL,
                email       TEXT,
                price       REAL,
                total_sales INTEGER,
                category    TEXT,
                UNIQUE(user_id, entity_id)
            );

            INSERT INTO bookmarks_new
                (id, user_id, kind, entity_id, name, email, price, total_sales, category)
            SELECT id, NULL, kind, entity_id, name, email, price, total_sales, category
            FROM bookmarks;

            DROP TABLE bookmarks;

            ALTER TABLE bookmarks_new RENAME TO bookmarks;
        """)
        print("[migrate] bookmarks: coluna user_id adicionada, constraint atualizada.")
    else:
        print("[migrate] bookmarks: já atualizada, pulando.")

    # ── goals ─────────────────────────────────────────────────────────────────
    if not _column_exists(cur, "goals", "user_id"):
        cur.execute("ALTER TABLE goals ADD COLUMN user_id TEXT")
        print("[migrate] goals: coluna user_id adicionada.")
    else:
        print("[migrate] goals: já atualizada, pulando.")

    conn.commit()
    conn.close()


if __name__ == "__main__":
    run()
