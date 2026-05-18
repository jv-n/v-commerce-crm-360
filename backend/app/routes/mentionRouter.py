from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import List, Optional

from database.database import get_db

router = APIRouter(prefix="/mentions", tags=["mentions"])


class MentionResult(BaseModel):
    id: str
    type: str          # "contact" | "product" | "order" | "agent"
    display: str       # texto exibido no chip
    label: str         # linha principal do dropdown
    sublabel: Optional[str] = None   # linha secundária (desambiguação)


class MentionSearchResponse(BaseModel):
    results: List[MentionResult]


@router.get("/search", response_model=MentionSearchResponse)
def search_mentions(
    q: str = Query("", min_length=0),
    limit: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db),
):
    # Capitaliza o input para bater com nomes no banco (ex: "caio" → "Caio")
    q_name = q.capitalize() if q else ""
    name_pattern = f"{q_name}%" if q_name else "%"
    # IDs e pedidos são case-insensitive por natureza (hex/uuid)
    id_pattern = f"{q}%" if q else "%"
    per_cat = max(1, limit // 2)  # busca menos por categoria para não estourar o total
    results: List[MentionResult] = []

    # ── Clientes / Leads (gold_cliente_360) ──────────────────────────────────
    # Lead = cliente com total_pedidos = 0
    rows = db.execute(
        text("""
            SELECT
                id_cliente,
                nome_completo,
                email,
                telefone,
                COALESCE(total_pedidos, 0) AS total_pedidos
            FROM gold_cliente_360
            WHERE nome_completo LIKE :p
            LIMIT :lim
        """),
        {"p": name_pattern, "lim": per_cat},
    ).fetchall()

    for r in rows:
        nome = r.nome_completo or r.id_cliente
        sublabel = r.email or r.telefone or None
        tipo = "lead" if (r.total_pedidos == 0) else "contact"
        results.append(MentionResult(
            id=r.id_cliente,
            type=tipo,
            display=nome,
            label=nome,
            sublabel=sublabel,
        ))

    # ── Produtos (gold_produtos_detalhado) ───────────────────────────────────
    rows = db.execute(
        text("""
            SELECT id_produto, nome_produto, categoria
            FROM gold_produtos_detalhado
            WHERE nome_produto LIKE :p
            LIMIT :lim
        """),
        {"p": name_pattern, "lim": per_cat},
    ).fetchall()

    for r in rows:
        results.append(MentionResult(
            id=r.id_produto,
            type="product",
            display=r.nome_produto or r.id_produto,
            label=r.nome_produto or r.id_produto,
            sublabel=r.categoria or None,
        ))

    # ── Pedidos (gold_pedidos_detalhado) — só busca se parece com ID (≥8 chars)
    rows = db.execute(
        text("""
            SELECT id_pedido, id_cliente, status, valor_pedido, data_pedido
            FROM gold_pedidos_detalhado
            WHERE id_pedido LIKE :p
            GROUP BY id_pedido
            LIMIT :lim
        """),
        {"p": id_pattern, "lim": per_cat},
    ).fetchall() if len(q) >= 8 else []

    for r in rows:
        sublabel_parts = []
        if r.status:
            sublabel_parts.append(r.status)
        if r.valor_pedido is not None:
            sublabel_parts.append(f"R$ {r.valor_pedido:,.2f}")
        if r.data_pedido:
            sublabel_parts.append(str(r.data_pedido)[:10])
        results.append(MentionResult(
            id=r.id_pedido,
            type="order",
            display=r.id_pedido[:8] + "…",   # UUID curto no chip
            label=f"Pedido {r.id_pedido[:8]}…",
            sublabel=" · ".join(sublabel_parts) or None,
        ))

    # ── Agentes de suporte (gold_dim_agentes_suporte) ────────────────────────
    rows = db.execute(
        text("""
            SELECT agente_suporte, qtd_tickets_resolvidos, nota_media_atendimento
            FROM gold_dim_agentes_suporte
            WHERE agente_suporte LIKE :p
            LIMIT :lim
        """),
        {"p": name_pattern, "lim": per_cat},
    ).fetchall()

    for r in rows:
        nota = f"nota {r.nota_media_atendimento:.1f}" if r.nota_media_atendimento else None
        results.append(MentionResult(
            id=r.agente_suporte,
            type="agent",
            display=r.agente_suporte,
            label=r.agente_suporte,
            sublabel=nota,
        ))

    return MentionSearchResponse(results=results[:limit])
