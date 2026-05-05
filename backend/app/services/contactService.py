from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.contactModel import GoldCliente360, DimCliente
from app.schemas.contactSchemas import ContactOut, ContactsPageOut

# Valores de segmento_cliente no gold → ContactStatus no frontend
_SEGMENTO_MAP = {
    "Ativo":    "Cliente Ativo",
    "Inativo":  "Cliente Inativo",
    "VIP":      "Cliente VIP",
    "Em risco": "Em risco",
}

# Tabs do frontend → filtros de segmento_cliente no banco
_TAB_FILTER = {
    "clients": ["Ativo", "Inativo", "VIP"],
    "leads":   [],  # leads não existem no gold — retorna vazio
}

# ContactStatus do frontend → segmento_cliente no banco
_STATUS_TO_SEGMENTO: dict[str, str] = {v: k for k, v in _SEGMENTO_MAP.items()}


def _format_date(raw: str | None) -> str | None:
    if not raw:
        return None
    # gold armazena como "YYYY-MM-DD" ou "YYYY-MM-DD HH:MM:SS"
    try:
        date_part = raw.split(" ")[0]
        y, m, d = date_part.split("-")
        return f"{d}/{m}/{y}"
    except Exception:
        return raw


def _normalize_engagement(raw: str | None) -> str:
    if raw in ("Promotor", "Neutro", "Detrator"):
        return raw
    return "Nenhum NPS"


def _normalize_score(nota_nps: float | None) -> float:
    if nota_nps is None:
        return 0.0
    return round(nota_nps * 10, 1)


def _to_contact_out(gold: GoldCliente360, dim: DimCliente | None) -> ContactOut:
    return ContactOut(
        id=gold.id_cliente,
        name=gold.nome_completo,
        status=_SEGMENTO_MAP.get(gold.segmento_cliente or "", gold.segmento_cliente),
        email=gold.email,
        phone=dim.telefone if dim else None,
        lastPurchase=_format_date(gold.data_ultimo_pedido),
        purchases=int(gold.total_pedidos or 0),
        engagement=_normalize_engagement(gold.categoria_nps_predominante),
        engagementScore=_normalize_score(gold.nota_nps_media),
        createdAt=_format_date(dim.data_cadastro if dim else None),
    )


class ContactService:
    @staticmethod
    def get_contacts(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        tab: str = "all",
        search: str = "",
        status: str = "",
        purchases_min: int | None = None,
        purchases_max: int | None = None,
        created_year: str = "",
        engagement: str = "",
    ) -> ContactsPageOut:
        # tab "leads" não tem correspondência no gold — retorna vazio
        if tab == "leads":
            return ContactsPageOut(data=[], total=0, page=page, pageSize=page_size)

        query = (
            db.query(GoldCliente360, DimCliente)
            .outerjoin(DimCliente, GoldCliente360.id_cliente == DimCliente.id_cliente)
        )

        if tab == "clients":
            query = query.filter(GoldCliente360.segmento_cliente.in_(_TAB_FILTER["clients"]))

        if search:
            term = f"%{search}%"
            query = query.filter(
                GoldCliente360.nome_completo.ilike(term)
                | GoldCliente360.email.ilike(term)
            )

        if status:
            segmento = _STATUS_TO_SEGMENTO.get(status, status)
            query = query.filter(GoldCliente360.segmento_cliente == segmento)

        if purchases_min is not None:
            query = query.filter(GoldCliente360.total_pedidos >= purchases_min)

        if purchases_max is not None:
            query = query.filter(GoldCliente360.total_pedidos <= purchases_max)

        if created_year:
            query = query.filter(DimCliente.data_cadastro.like(f"{created_year}%"))

        if engagement:
            if engagement == "Nenhum NPS":
                query = query.filter(
                    ~GoldCliente360.categoria_nps_predominante.in_(["Promotor", "Neutro", "Detrator"])
                    | GoldCliente360.categoria_nps_predominante.is_(None)
                )
            else:
                query = query.filter(GoldCliente360.categoria_nps_predominante == engagement)

        total = query.with_entities(func.count(GoldCliente360.id_cliente)).scalar()

        rows = (
            query
            .order_by(GoldCliente360.nome_completo)
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        data = [_to_contact_out(gold, dim) for gold, dim in rows]

        return ContactsPageOut(data=data, total=total, page=page, pageSize=page_size)
