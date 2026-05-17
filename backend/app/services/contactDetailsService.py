from fastapi import Depends
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.models.contactModel import DimCliente, GoldCliente360
from app.models.saleModel import GoldPedidoDetalhado
from app.models.ticketModel import GoldTicket360
from app.schemas.contactDetailsSchemas import (
    ContactCategoryMetricOut,
    ContactDetailsOut,
    ContactMetricsOut,
    ContactOrderOut,
    ContactOrderProductOut,
    ContactOrdersPageOut,
    ContactTicketOut,
    ContactTicketsPageOut,
    ContactViewedProductOut,
)
from database.database import get_db


def _fmt_date(raw: str | None) -> str | None:
    if not raw:
        return None

    try:
        date_part = str(raw).split(" ")[0]
        y, m, d = date_part.split("-")
        return f"{d}/{m}/{y}"
    except Exception:
        return str(raw)


def _fmt_phone(raw) -> str | None:
    if raw is None:
        return None

    value = str(raw).strip()

    if not value:
        return None

    try:
        if value.endswith(".0"):
            value = value[:-2]
        elif value.replace(".", "", 1).isdigit():
            value = str(int(float(value)))
    except Exception:
        pass

    return value


def _title_case(raw: str | None) -> str | None:
    if raw is None:
        return None

    value = str(raw).strip()

    if not value:
        return None

    return value.lower().capitalize()


def _contact_type(gold: GoldCliente360) -> str:
    return "Lead" if gold.segmento_cliente == "Lead" else "Cliente"


class ContactDetailsService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db

    def _get_gold_contact(self, contact_id: str) -> GoldCliente360 | None:
        return (
            self.db.query(GoldCliente360)
            .filter(GoldCliente360.id_cliente == contact_id)
            .first()
        )

    def get_contact_details(self, contact_id: str) -> ContactDetailsOut | None:
        gold = self._get_gold_contact(contact_id)

        if not gold:
            return None

        dim = (
            self.db.query(DimCliente)
            .filter(DimCliente.id_cliente == contact_id)
            .first()
        )

        return ContactDetailsOut(
            id=gold.id_cliente,
            name=(
                dim.nome_completo
                if dim and dim.nome_completo
                else gold.nome_completo
            ),
            email=dim.email if dim and dim.email else gold.email,
            phone=_fmt_phone(dim.telefone if dim and dim.telefone else gold.telefone),
            gender=dim.genero if dim and dim.genero else gold.genero,
            birthDate=_fmt_date(dim.data_nascimento) if dim else None,
            age=dim.idade if dim else None,
            ageRange=(
                dim.faixa_etaria
                if dim and dim.faixa_etaria
                else gold.faixa_etaria
            ),
            createdAt=(
                _fmt_date(dim.data_cadastro)
                if dim and dim.data_cadastro
                else _fmt_date(gold.data_primeiro_pedido)
            ),
            city=dim.cidade if dim and dim.cidade else gold.cidade,
            state=_title_case(dim.estado if dim and dim.estado else gold.estado),
            region=dim.regiao if dim and dim.regiao else gold.regiao,
            country=_title_case(dim.pais if dim and dim.pais else None),
            origin=dim.origem if dim and dim.origem else gold.origem,
            clientStatus=gold.segmento_cliente,
            contactType=_contact_type(gold),
            responsible=None,
        )

    def get_contact_orders(
        self,
        contact_id: str,
        page: int = 1,
        page_size: int = 20,
    ) -> ContactOrdersPageOut | None:
        gold = self._get_gold_contact(contact_id)

        if not gold:
            return None

        query = self.db.query(GoldPedidoDetalhado).filter(
            GoldPedidoDetalhado.id_cliente == contact_id
        )

        total = query.count()

        rows = (
            query.order_by(desc(GoldPedidoDetalhado.data_pedido))
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        orders: list[ContactOrderOut] = []

        for row in rows:
            quantidade = float(row.quantidade or 0)
            valor = float(row.valor_pedido or row.receita_bruta or 0)

            product = ContactOrderProductOut(
                id_produto=row.id_produto,
                nome_produto=row.nome_produto,
                categoria=row.categoria,
                quantidade=quantidade,
                valor=round(valor, 2),
            )

            if row.nome_produto:
                qtd_label = int(quantidade) if quantidade.is_integer() else quantidade
                produtos_resumo = f"{qtd_label}x {row.nome_produto}"
            else:
                produtos_resumo = "Produto não informado"

            orders.append(
                ContactOrderOut(
                    id_pedido=row.id_pedido,
                    id_cliente=row.id_cliente,
                    data_pedido=_fmt_date(row.data_pedido),
                    ano_mes=row.ano_mes,
                    status=row.status,
                    metodo_pagamento=row.metodo_pagamento,
                    valor_total=round(valor, 2),
                    receita_bruta=round(float(row.receita_bruta or 0), 2),
                    valor_reembolsado=round(float(row.valor_reembolsado or 0), 2),
                    quantidade_total=quantidade,
                    produtos_resumo=produtos_resumo,
                    produtos=[product],
                )
            )

        return ContactOrdersPageOut(
            data=orders,
            total=total,
            page=page,
            pageSize=page_size,
        )

    def get_contact_tickets(
        self,
        contact_id: str,
        page: int = 1,
        page_size: int = 20,
    ) -> ContactTicketsPageOut | None:
        gold = self._get_gold_contact(contact_id)

        if not gold:
            return None

        query = self.db.query(GoldTicket360).filter(
            GoldTicket360.id_cliente == contact_id
        )

        total = query.count()

        rows = (
            query.order_by(
                desc(GoldTicket360.data_abertura),
                desc(GoldTicket360.hora_abertura),
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        tickets = [
            ContactTicketOut(
                ticket_id=ticket.ticket_id,
                id_cliente=ticket.id_cliente,
                id_pedido=ticket.id_pedido,
                status_atendimento=ticket.status_atendimento,
                tipo_problema=ticket.tipo_problema,
                data_abertura=_fmt_date(ticket.data_abertura),
                hora_abertura=ticket.hora_abertura,
                agente_suporte=ticket.agente_suporte,
                tempo_resolucao_horas=ticket.tempo_resolucao_horas,
                nota_avaliacao=ticket.nota_avaliacao,
            )
            for ticket in rows
        ]

        return ContactTicketsPageOut(
            data=tickets,
            total=total,
            page=page,
            pageSize=page_size,
        )

    def get_contact_metrics(
        self,
        contact_id: str,
        ano_mes: str | None = None,
    ) -> ContactMetricsOut | None:
        gold = self._get_gold_contact(contact_id)

        if not gold:
            return None

        current_month = ano_mes or (
            gold.data_ultimo_pedido[:7] if gold.data_ultimo_pedido else None
        )

        purchases_month_query = (
            self.db.query(func.sum(GoldPedidoDetalhado.valor_pedido))
            .filter(GoldPedidoDetalhado.id_cliente == contact_id)
        )

        if current_month:
            purchases_month_query = purchases_month_query.filter(
                GoldPedidoDetalhado.ano_mes == current_month
            )

        purchases_month = float(purchases_month_query.scalar() or 0)

        category_query = (
            self.db.query(
                GoldPedidoDetalhado.categoria.label("categoria"),
                func.sum(GoldPedidoDetalhado.quantidade).label("quantidade_total"),
                func.sum(GoldPedidoDetalhado.valor_pedido).label("receita_total"),
                func.count(GoldPedidoDetalhado.id_pedido).label("total_pedidos"),
            )
            .filter(
                GoldPedidoDetalhado.id_cliente == contact_id,
                GoldPedidoDetalhado.categoria.isnot(None),
            )
        )

        if current_month:
            category_query = category_query.filter(
                GoldPedidoDetalhado.ano_mes == current_month
            )

        category_rows = (
            category_query
            .group_by(GoldPedidoDetalhado.categoria)
            .order_by(desc("receita_total"))
            .limit(8)
            .all()
        )

        categories = [
            ContactCategoryMetricOut(
                categoria=row.categoria,
                quantidade_total=float(row.quantidade_total or 0),
                receita_total=round(float(row.receita_total or 0), 2),
                total_pedidos=int(row.total_pedidos or 0),
            )
            for row in category_rows
        ]

        return ContactMetricsOut(
            contactType=_contact_type(gold),
            comprasMes=round(purchases_month, 2),
            mediaNps=gold.nota_nps_media,
            categoriaNpsRecente=gold.categoria_nps_recente,
            origemLead=gold.origem,
            produtoMaisVisualizado=gold.produto_mais_visualizado,
            categoriaMaisVisualizada=gold.categoria_mais_visualizada,
            totalSessoes=int(gold.total_sessoes or 0),
            totalVisualizacoes=int(gold.total_visualizacoes or 0),
            totalCarrinho=int(gold.total_carrinho or 0),
            totalCheckouts=int(gold.total_checkouts or 0),
            totalAbandonoCarrinho=int(gold.total_abandono_carrinho or 0),
            taxaConversaoPct=round(gold.taxa_conversao_pct or 0.0, 2),
            categoriasMaisCompradas=categories,
        )

    def get_contact_viewed_products(
        self,
        contact_id: str,
    ) -> list[ContactViewedProductOut] | None:
        gold = self._get_gold_contact(contact_id)

        if not gold:
            return None

        if not gold.produto_mais_visualizado and not gold.produto_mais_visualizado_id:
            return []

        return [
            ContactViewedProductOut(
                id_produto=gold.produto_mais_visualizado_id,
                nome_produto=gold.produto_mais_visualizado,
                categoria=gold.categoria_mais_visualizada,
                data_ultima_visualizacao=_fmt_date(gold.data_ultimo_evento),
                tempo_medio_pagina_seg=gold.tempo_medio_pagina_seg,
                origem=gold.origem_sessao_preferida,
                canal=gold.canal_preferido,
                dispositivo=gold.dispositivo_preferido,
                observacao=(
                    "Fallback baseado na gold_cliente_360: produto mais "
                    "visualizado, não lista histórica de últimos produtos."
                ),
            )
        ]