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


def _table_exists(cur: sqlite3.Cursor, table: str) -> bool:
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
    return cur.fetchone() is not None


def _column_exists(cur: sqlite3.Cursor, table: str, column: str) -> bool:
    cur.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cur.fetchall())


def run():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # ── bookmarks ─────────────────────────────────────────────────────────────
    bookmarks_exists = _table_exists(cur, "bookmarks")
    bookmarks_new_exists = _table_exists(cur, "bookmarks_new")

    if not bookmarks_exists and bookmarks_new_exists:
        # Migração anterior foi interrompida após o DROP TABLE bookmarks mas antes do RENAME
        cur.execute("ALTER TABLE bookmarks_new RENAME TO bookmarks")
        conn.commit()
        print("[migrate] bookmarks: recuperado de migração incompleta anterior.")
    elif bookmarks_exists and not _column_exists(cur, "bookmarks", "user_id"):
        cur.executescript("""
            DROP TABLE IF EXISTS bookmarks_new;

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
