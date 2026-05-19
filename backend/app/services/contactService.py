import csv
import io
import uuid
from datetime import date
from typing import Generator

from fastapi import Depends

from fastapi import Depends

from sqlalchemy.orm import Session
from sqlalchemy import asc, desc, func

from app.models.contactModel import GoldCliente360
from app.models.saleModel import GoldPedidoDetalhado
from app.schemas.contactSchemas import ContactOut, ContactsPageOut, ContactCreate, ContactUpdate, ContactResumoOut
from database.database import get_db

_VALID_STATUSES = {"Ativo", "Inativo", "VIP", "Lead", "Em risco"}

_SORT_COLS = {
    "name":         GoldCliente360.nome_completo,
    "purchases":    GoldCliente360.total_pedidos,
    "lastPurchase": GoldCliente360.data_ultimo_pedido,
    "engagement":   GoldCliente360.nota_nps_media,
    "totalRevenue": GoldCliente360.receita_total,
    "avgTicket":    GoldCliente360.ticket_medio,
}



def _fmt_date(raw: str | None) -> str | None:
    if not raw:
        return None
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


def _to_contact_out(g: GoldCliente360) -> ContactOut:
    first = _fmt_date(g.data_primeiro_pedido)
    return ContactOut(
        id=g.id_cliente,
        name=g.nome_completo,
        email=g.email,
        phone=str(g.telefone) if g.telefone is not None else None,
        clientStatus=g.segmento_cliente,
        region=g.regiao,
        origin=g.origem,
        purchases=int(g.total_pedidos or 0),
        distinctProducts=int(g.total_produtos_distintos or 0),
        totalRevenue=round(g.receita_total or 0.0, 2),
        avgTicket=round(g.ticket_medio or 0.0, 2),
        firstPurchase=first,
        lastPurchase=_fmt_date(g.data_ultimo_pedido),
        favPaymentMethod=g.metodo_pagamento_favorito,
        totalTickets=int(g.total_tickets or 0),
        resolutionRate=round(g.taxa_resolucao or 0.0, 4),
        avgSupportRating=g.nota_media_atendimento,
        engagement=_normalize_engagement(g.categoria_nps_recente),
        engagementScore=_normalize_score(g.nota_nps_media),
        productRating=g.nota_produto_media,
        createdAt=first,
    )


class ContactService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db

    def get_last_pedidos(self, id_cliente: str, limit: int = 3) -> list[dict]:
        rows = (
            self.db.query(GoldPedidoDetalhado)
            .filter(GoldPedidoDetalhado.id_cliente == id_cliente)
            .order_by(GoldPedidoDetalhado.data_pedido.desc())
            .limit(limit)
            .all()
        )
        return [
            {
                "id_pedido": r.id_pedido,
                "nome_produto": r.nome_produto,
                "quantidade": float(r.quantidade) if r.quantidade is not None else None,
                "valor_pedido": float(r.valor_pedido) if r.valor_pedido is not None else None,
                "metodo_pagamento": r.metodo_pagamento,
                "data_pedido": _fmt_date(r.data_pedido),
            }
            for r in rows
        ]

    def _apply_filters(self, query, tab, search, purchases_min, purchases_max,
                       created_year, engagement, client_status,
                       regioes, origens, pagamentos,
                       receita_min, receita_max, ticket_medio_min, ticket_medio_max,
                       primeira_compra_from, primeira_compra_to,
                       ultima_compra_from, ultima_compra_to,
                       tickets_suporte_min, tickets_suporte_max,
                       nota_atend_min, nota_atend_max,
                       nps_min, nps_max, nota_prod_min, nota_prod_max,
                       generos, faixas_etarias, estados,
                       canais_preferidos, dispositivos, origens_sessao,
                       periodos_dia, dias_semana, categorias_visualizadas,
                       taxa_conversao_min, taxa_conversao_max,
                       total_sessoes_min, total_sessoes_max,
                       abandono_carrinho_min, abandono_carrinho_max,
                       nps_recente_min, nps_recente_max):
        """Aplica todos os filtros em GoldCliente360."""
        if tab == "clients":
            query = query.filter(GoldCliente360.segmento_cliente.in_(["Ativo", "Inativo", "VIP"]))
        elif tab == "leads":
            query = query.filter(GoldCliente360.segmento_cliente == "Lead")

        if search:
            term = f"%{search}%"
            query = query.filter(
                GoldCliente360.nome_completo.ilike(term)
                | GoldCliente360.email.ilike(term)
            )

        if purchases_min is not None:
            query = query.filter(GoldCliente360.total_pedidos >= purchases_min)
        if purchases_max is not None:
            query = query.filter(GoldCliente360.total_pedidos <= purchases_max)

        if created_year:
            query = query.filter(GoldCliente360.data_primeiro_pedido.like(f"{created_year}%"))

        if engagement:
            if engagement == "Nenhum NPS":
                query = query.filter(
                    ~GoldCliente360.categoria_nps_recente.in_(["Promotor", "Neutro", "Detrator"])
                    | GoldCliente360.categoria_nps_recente.is_(None)
                )
            else:
                query = query.filter(GoldCliente360.categoria_nps_recente == engagement)

        if client_status:
            query = query.filter(GoldCliente360.segmento_cliente.in_(client_status))


        if regioes:
            query = query.filter(GoldCliente360.regiao.in_(regioes))
        if origens:
            query = query.filter(GoldCliente360.origem.in_(origens))
        if pagamentos:
            query = query.filter(GoldCliente360.metodo_pagamento_favorito.in_(pagamentos))

        if receita_min is not None:
            query = query.filter(GoldCliente360.receita_total >= receita_min)
        if receita_max is not None:
            query = query.filter(GoldCliente360.receita_total <= receita_max)

        if ticket_medio_min is not None:
            query = query.filter(GoldCliente360.ticket_medio >= ticket_medio_min)
        if ticket_medio_max is not None:
            query = query.filter(GoldCliente360.ticket_medio <= ticket_medio_max)

        if primeira_compra_from:
            query = query.filter(GoldCliente360.data_primeiro_pedido >= primeira_compra_from)
        if primeira_compra_to:
            query = query.filter(GoldCliente360.data_primeiro_pedido <= primeira_compra_to)

        if ultima_compra_from:
            query = query.filter(GoldCliente360.data_ultimo_pedido >= ultima_compra_from)
        if ultima_compra_to:
            query = query.filter(GoldCliente360.data_ultimo_pedido <= ultima_compra_to)

        if tickets_suporte_min is not None:
            query = query.filter(GoldCliente360.total_tickets >= tickets_suporte_min)
        if tickets_suporte_max is not None:
            query = query.filter(GoldCliente360.total_tickets <= tickets_suporte_max)

        if nota_atend_min is not None:
            query = query.filter(GoldCliente360.nota_media_atendimento >= nota_atend_min)
        if nota_atend_max is not None:
            query = query.filter(GoldCliente360.nota_media_atendimento <= nota_atend_max)

        if nps_min is not None:
            query = query.filter(GoldCliente360.nota_nps_media >= nps_min / 10)
        if nps_max is not None:
            query = query.filter(GoldCliente360.nota_nps_media <= nps_max / 10)

        if nota_prod_min is not None:
            query = query.filter(GoldCliente360.nota_produto_media >= nota_prod_min)
        if nota_prod_max is not None:
            query = query.filter(GoldCliente360.nota_produto_media <= nota_prod_max)

        if generos:
            query = query.filter(GoldCliente360.genero.in_(generos))
        if faixas_etarias:
            query = query.filter(GoldCliente360.faixa_etaria.in_(faixas_etarias))
        if estados:
            query = query.filter(GoldCliente360.estado.in_(estados))
        if canais_preferidos:
            query = query.filter(GoldCliente360.canal_preferido.in_(canais_preferidos))
        if dispositivos:
            query = query.filter(GoldCliente360.dispositivo_preferido.in_(dispositivos))
        if origens_sessao:
            query = query.filter(GoldCliente360.origem_sessao_preferida.in_(origens_sessao))
        if periodos_dia:
            query = query.filter(GoldCliente360.periodo_dia_preferido.in_(periodos_dia))
        if dias_semana:
            query = query.filter(GoldCliente360.dia_semana_mais_ativo.in_(dias_semana))
        if categorias_visualizadas:
            query = query.filter(GoldCliente360.categoria_mais_visualizada.in_(categorias_visualizadas))

        if taxa_conversao_min is not None:
            query = query.filter(GoldCliente360.taxa_conversao_pct >= taxa_conversao_min)
        if taxa_conversao_max is not None:
            query = query.filter(GoldCliente360.taxa_conversao_pct <= taxa_conversao_max)

        if total_sessoes_min is not None:
            query = query.filter(GoldCliente360.total_sessoes >= total_sessoes_min)
        if total_sessoes_max is not None:
            query = query.filter(GoldCliente360.total_sessoes <= total_sessoes_max)

        if abandono_carrinho_min is not None:
            query = query.filter(GoldCliente360.total_abandono_carrinho >= abandono_carrinho_min)
        if abandono_carrinho_max is not None:
            query = query.filter(GoldCliente360.total_abandono_carrinho <= abandono_carrinho_max)

        if nps_recente_min is not None:
            query = query.filter(GoldCliente360.nota_nps_recente >= nps_recente_min)
        if nps_recente_max is not None:
            query = query.filter(GoldCliente360.nota_nps_recente <= nps_recente_max)

        return query

    def create_contact(self, data: ContactCreate) -> ContactOut:
        contact_id = str(uuid.uuid4())
        today = date.today().strftime("%Y-%m-%d")

        gold = GoldCliente360(
            id_cliente=contact_id,
            nome_completo=data.name,
            email=data.email,
            segmento_cliente="Ativo",
            total_pedidos=0,
            total_produtos_distintos=0,
            receita_total=0,
            ticket_medio=0,
            total_tickets=0,
            taxa_resolucao=0,
            data_primeiro_pedido=today,
            timestamp_ingestion=today,
        )
        self.db.add(gold)
        self.db.commit()
        self.db.refresh(gold)
        return _to_contact_out(gold)

    def update_contact(self, contact_id: str, data: ContactUpdate) -> ContactOut | None:
        gold = self.db.query(GoldCliente360).filter(GoldCliente360.id_cliente == contact_id).first()
        if not gold:
            return None

        if data.name is not None:
            gold.nome_completo = data.name
        if data.email is not None:
            gold.email = data.email
        if data.clientStatus is not None and data.clientStatus in _VALID_STATUSES:
            gold.segmento_cliente = data.clientStatus

        self.db.commit()
        self.db.refresh(gold)
        return _to_contact_out(gold)

    def get_contacts(
        self,
        page: int = 1,
        page_size: int = 20,
        tab: str = "all",
        search: str = "",
        purchases_min: int | None = None,
        purchases_max: int | None = None,
        created_year: str = "",
        engagement: str = "",
        client_status: list[str] | None = None,
        sort_by: str = "",
        sort_dir: str = "asc",
        regioes: list[str] | None = None,
        origens: list[str] | None = None,
        pagamentos: list[str] | None = None,
        receita_min: float | None = None,
        receita_max: float | None = None,
        ticket_medio_min: float | None = None,
        ticket_medio_max: float | None = None,
        primeira_compra_from: str = "",
        primeira_compra_to: str = "",
        ultima_compra_from: str = "",
        ultima_compra_to: str = "",
        tickets_suporte_min: int | None = None,
        tickets_suporte_max: int | None = None,
        nota_atend_min: float | None = None,
        nota_atend_max: float | None = None,
        nps_min: float | None = None,
        nps_max: float | None = None,
        nota_prod_min: float | None = None,
        nota_prod_max: float | None = None,
        generos: list[str] | None = None,
        faixas_etarias: list[str] | None = None,
        estados: list[str] | None = None,
        canais_preferidos: list[str] | None = None,
        dispositivos: list[str] | None = None,
        origens_sessao: list[str] | None = None,
        periodos_dia: list[str] | None = None,
        dias_semana: list[str] | None = None,
        categorias_visualizadas: list[str] | None = None,
        taxa_conversao_min: float | None = None,
        taxa_conversao_max: float | None = None,
        total_sessoes_min: int | None = None,
        total_sessoes_max: int | None = None,
        abandono_carrinho_min: int | None = None,
        abandono_carrinho_max: int | None = None,
        nps_recente_min: float | None = None,
        nps_recente_max: float | None = None,
    ) -> ContactsPageOut:
        filter_args = (
            tab, search, purchases_min, purchases_max, created_year, engagement,
            client_status, regioes, origens, pagamentos,
            receita_min, receita_max, ticket_medio_min, ticket_medio_max,
            primeira_compra_from, primeira_compra_to, ultima_compra_from, ultima_compra_to,
            tickets_suporte_min, tickets_suporte_max, nota_atend_min, nota_atend_max,
            nps_min, nps_max, nota_prod_min, nota_prod_max,
            generos, faixas_etarias, estados,
            canais_preferidos, dispositivos, origens_sessao,
            periodos_dia, dias_semana, categorias_visualizadas,
            taxa_conversao_min, taxa_conversao_max,
            total_sessoes_min, total_sessoes_max,
            abandono_carrinho_min, abandono_carrinho_max,
            nps_recente_min, nps_recente_max,
        )

        # ── Count: só em GoldCliente360, sem join ─────────────────────────────
        count_q = self._apply_filters(self.db.query(GoldCliente360), *filter_args)
        total = count_q.count()

        # ── Dados paginados: ORDER BY + LIMIT em GoldCliente360 ───────────────
        sort_col = _SORT_COLS.get(sort_by, GoldCliente360.nome_completo)
        order_fn = desc if sort_dir == "desc" else asc

        rows = (
            count_q
            .order_by(order_fn(sort_col))
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        # .add_columns() faz com que cada row seja (GoldCliente360, telefone)
        return ContactsPageOut(
            data=[_to_contact_out(g) for g in rows],
            total=total,
            page=page,
            pageSize=page_size,
        )

    def export_contacts_csv(
        self,
        tab: str = "all", search: str = "",
        purchases_min: int | None = None, purchases_max: int | None = None,
        created_year: str = "", engagement: str = "",
        client_status: list[str] | None = None,
        regioes: list[str] | None = None, origens: list[str] | None = None,
        pagamentos: list[str] | None = None,
        receita_min: float | None = None, receita_max: float | None = None,
        ticket_medio_min: float | None = None, ticket_medio_max: float | None = None,
        primeira_compra_from: str = "", primeira_compra_to: str = "",
        ultima_compra_from: str = "", ultima_compra_to: str = "",
        tickets_suporte_min: int | None = None, tickets_suporte_max: int | None = None,
        nota_atend_min: float | None = None, nota_atend_max: float | None = None,
        nps_min: float | None = None, nps_max: float | None = None,
        nota_prod_min: float | None = None, nota_prod_max: float | None = None,
        generos: list[str] | None = None, faixas_etarias: list[str] | None = None,
        estados: list[str] | None = None,
        canais_preferidos: list[str] | None = None, dispositivos: list[str] | None = None,
        origens_sessao: list[str] | None = None, periodos_dia: list[str] | None = None,
        dias_semana: list[str] | None = None, categorias_visualizadas: list[str] | None = None,
        taxa_conversao_min: float | None = None, taxa_conversao_max: float | None = None,
        total_sessoes_min: int | None = None, total_sessoes_max: int | None = None,
        abandono_carrinho_min: int | None = None, abandono_carrinho_max: int | None = None,
        nps_recente_min: float | None = None, nps_recente_max: float | None = None,
    ) -> Generator[str, None, None]:
        _HEADERS = [
            "id_cliente", "nome_completo", "email",
            "genero", "faixa_etaria", "regiao", "cidade", "estado", "origem",
            "segmento_cliente",
            "total_pedidos", "total_produtos_distintos",
            "receita_total", "ticket_medio",
            "data_primeiro_pedido", "data_ultimo_pedido", "metodo_pagamento_favorito",
            "total_tickets", "taxa_resolucao", "nota_media_atendimento",
            "nota_nps_media", "nota_nps_recente", "nota_produto_media", "categoria_nps_recente",
            "taxa_conversao_pct", "total_sessoes", "total_eventos",
            "total_visualizacoes", "total_carrinho", "total_checkouts",
            "total_compras_cs", "total_abandono_carrinho", "tempo_medio_pagina_seg",
            "data_primeiro_evento", "data_ultimo_evento",
            "canal_preferido", "dispositivo_preferido", "origem_sessao_preferida",
            "periodo_dia_preferido", "dia_semana_mais_ativo",
            "produto_mais_visualizado", "categoria_mais_visualizada",
        ]

        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(_HEADERS)
        yield buf.getvalue()

        query = self._apply_filters(
            self.db.query(GoldCliente360),
            tab, search, purchases_min, purchases_max, created_year, engagement,
            client_status, regioes, origens, pagamentos,
            receita_min, receita_max, ticket_medio_min, ticket_medio_max,
            primeira_compra_from, primeira_compra_to, ultima_compra_from, ultima_compra_to,
            tickets_suporte_min, tickets_suporte_max, nota_atend_min, nota_atend_max,
            nps_min, nps_max, nota_prod_min, nota_prod_max,
            generos, faixas_etarias, estados,
            canais_preferidos, dispositivos, origens_sessao,
            periodos_dia, dias_semana, categorias_visualizadas,
            taxa_conversao_min, taxa_conversao_max,
            total_sessoes_min, total_sessoes_max,
            abandono_carrinho_min, abandono_carrinho_max,
            nps_recente_min, nps_recente_max,
        )

        for g in query.yield_per(500):
            buf.seek(0); buf.truncate(0)
            writer.writerow([
                g.id_cliente, g.nome_completo, g.email,
                g.genero, g.faixa_etaria, g.regiao, g.cidade, g.estado, g.origem,
                g.segmento_cliente,
                g.total_pedidos, g.total_produtos_distintos,
                g.receita_total, g.ticket_medio,
                g.data_primeiro_pedido, g.data_ultimo_pedido, g.metodo_pagamento_favorito,
                g.total_tickets, g.taxa_resolucao, g.nota_media_atendimento,
                g.nota_nps_media, g.nota_nps_recente, g.nota_produto_media, g.categoria_nps_recente,
                g.taxa_conversao_pct, g.total_sessoes, g.total_eventos,
                g.total_visualizacoes, g.total_carrinho, g.total_checkouts,
                g.total_compras_cs, g.total_abandono_carrinho, g.tempo_medio_pagina_seg,
                g.data_primeiro_evento, g.data_ultimo_evento,
                g.canal_preferido, g.dispositivo_preferido, g.origem_sessao_preferida,
                g.periodo_dia_preferido, g.dia_semana_mais_ativo,
                g.produto_mais_visualizado, g.categoria_mais_visualizada,
            ])
            yield buf.getvalue()

    def get_contact_by_id(self, contact_id: str) -> ContactOut | None:
        gold = self.db.query(GoldCliente360).filter(GoldCliente360.id_cliente == contact_id).first()
        if not gold:
            return None
        return _to_contact_out(gold)

    def get_contact_resumo(self, contact_id: str) -> ContactResumoOut | None:
        gold = self.db.query(GoldCliente360).filter(GoldCliente360.id_cliente == contact_id).first()
        if not gold:
            return None

        # ── Categoria mais comprada ───────────────────────────────────────────
        cat_row = (
            self.db.query(
                GoldPedidoDetalhado.categoria,
                func.count().label("total"),
            )
            .filter(
                GoldPedidoDetalhado.id_cliente == contact_id,
                GoldPedidoDetalhado.status != "Reembolso",
                GoldPedidoDetalhado.categoria.isnot(None),
            )
            .group_by(GoldPedidoDetalhado.categoria)
            .order_by(desc("total"))
            .first()
        )

        # ── Produto mais caro comprado ────────────────────────────────────────
        caro_row = (
            self.db.query(
                GoldPedidoDetalhado.nome_produto,
                GoldPedidoDetalhado.valor_pedido,
            )
            .filter(
                GoldPedidoDetalhado.id_cliente == contact_id,
                GoldPedidoDetalhado.status != "Reembolso",
                GoldPedidoDetalhado.nome_produto.isnot(None),
            )
            .order_by(desc(GoldPedidoDetalhado.valor_pedido))
            .first()
        )

        # ── Produto mais comprado (por quantidade) ────────────────────────────
        qty_row = (
            self.db.query(
                GoldPedidoDetalhado.nome_produto,
                func.sum(GoldPedidoDetalhado.quantidade).label("total_qty"),
            )
            .filter(
                GoldPedidoDetalhado.id_cliente == contact_id,
                GoldPedidoDetalhado.status != "Reembolso",
                GoldPedidoDetalhado.nome_produto.isnot(None),
            )
            .group_by(GoldPedidoDetalhado.nome_produto)
            .order_by(desc("total_qty"))
            .first()
        )

        return ContactResumoOut(
            categoria_mais_comprada=cat_row.categoria if cat_row else None,
            produto_mais_caro=caro_row.nome_produto if caro_row else None,
            produto_mais_caro_valor=round(caro_row.valor_pedido, 2) if caro_row and caro_row.valor_pedido else None,
            metodo_pagamento_favorito=gold.metodo_pagamento_favorito,
            produto_mais_comprado=qty_row.nome_produto if qty_row else None,
            produto_mais_comprado_qty=round(qty_row.total_qty, 0) if qty_row and qty_row.total_qty else None,
        )
