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
    pattern = f"{q}%" if q else "%"
    results: List[MentionResult] = []

    # ── Clientes / Leads (dim_clientes + gold_cliente_360) ───────────────────
    # Lead = cliente com total_pedidos = 0 ou sem registro no gold
    rows = db.execute(
        text("""
            SELECT
                c.giid_cliente,
                c.nome_completo,
                c.email,
                c.telefone,
                COALESCE(g.total_pedidos, 0) AS total_pedidos
            FROM dim_clientes c
            LEFT JOIN gold_cliente_360 g ON g.id_cliente = c.giid_cliente
            WHERE c.nome_completo LIKE :p OR c.giid_cliente LIKE :p
            LIMIT :lim
        """),
        {"p": pattern, "lim": limit},
    ).fetchall()

    for r in rows:
        nome = r.nome_completo or r.giid_cliente
        sublabel = r.email or r.telefone or None
        tipo = "lead" if (r.total_pedidos == 0) else "contact"
        results.append(MentionResult(
            id=r.giid_cliente,
            type=tipo,
            display=nome,
            label=nome,
            sublabel=sublabel,
        ))

    # ── Produtos (dim_produtos) ───────────────────────────────────────────────
    rows = db.execute(
        text("""
            SELECT id_produto, nome_produto, categoria
            FROM dim_produtos
            WHERE nome_produto LIKE :p OR id_produto LIKE :p
            LIMIT :lim
        """),
        {"p": pattern, "lim": limit},
    ).fetchall()

    for r in rows:
        results.append(MentionResult(
            id=r.id_produto,
            type="product",
            display=r.nome_produto or r.id_produto,
            label=r.nome_produto or r.id_produto,
            sublabel=r.categoria or None,
        ))

    # ── Pedidos (ft_pedidos) ──────────────────────────────────────────────────
    rows = db.execute(
        text("""
            SELECT id_pedido, id_cliente, status, valor_pedido, data_pedido
            FROM ft_pedidos
            WHERE id_pedido LIKE :p OR id_cliente LIKE :p
            LIMIT :lim
        """),
        {"p": pattern, "lim": limit},
    ).fetchall()

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

    # ── Agentes de suporte (dim_agentes_suporte) ──────────────────────────────
    rows = db.execute(
        text("""
            SELECT agente_suporte, qtd_tickets_resolvidos, nota_media_atendimento
            FROM dim_agentes_suporte
            WHERE agente_suporte LIKE :p
            LIMIT :lim
        """),
        {"p": pattern, "lim": limit},
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

    return MentionSearchResponse(results=results)
