from calendar import monthrange
from datetime import date, datetime, timezone, timedelta

_BRT = timezone(timedelta(hours=-3))

from fastapi import Depends
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.models.contactModel import GoldCliente360, ContactActivity
from app.models.saleModel import GoldPedidoDetalhado
from app.models.ticketModel import GoldTicket360
from app.schemas.contactDetailSchemas import (
    ContactCategoryMetricOut,
    ContactDashboardOut,
    ContactDetailOut,
    ContactDetailPatchIn,
    ContactMetricsOut,
    ContactOrderOut,
    ContactOrderProductOut,
    ContactOrdersPageOut,
    ContactTicketOut,
    ContactTicketsPageOut,
    ContactViewedProductOut,
)
from database.database import get_db


_VALID_PERIODS = {
    "current_month",
    "last_3_months",
    "current_semester",
    "current_year",
    "all_time",
}

_PERIOD_LABELS = {
    "current_month": "Esse mês",
    "last_3_months": "Últimos 3 meses",
    "current_semester": "Esse semestre",
    "current_year": "Esse ano",
    "all_time": "Todo o período",
}


def _fmt_date(raw: str | None) -> str | None:
    if not raw:
        return None

    try:
        date_part = str(raw).split(" ")[0]
        y, m, d = date_part.split("-")
        return f"{d}/{m}/{y}"
    except Exception:
        return str(raw)


def _display_date_to_iso(raw: str | None) -> str | None:
    if raw is None:
        return None

    value = str(raw).strip()

    if not value:
        return None

    try:
        if "/" in value:
            d, m, y = value.split("/")
            return f"{y}-{m.zfill(2)}-{d.zfill(2)}"

        if "-" in value:
            return value[:10]
    except Exception:
        return value

    return value


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


def _parse_iso_date(raw: str | None) -> date | None:
    if not raw:
        return None

    value = str(raw).strip()

    if not value:
        return None

    try:
        return datetime.strptime(value[:10], "%Y-%m-%d").date()
    except Exception:
        return None


def _format_iso_date(value: date | None) -> str | None:
    return value.strftime("%Y-%m-%d") if value else None


def _add_months(value: date, months: int) -> date:
    month_index = value.month - 1 + months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    day = min(value.day, monthrange(year, month)[1])

    return date(year, month, day)


def _month_start(value: date) -> date:
    return date(value.year, value.month, 1)


def _month_end(value: date) -> date:
    return date(value.year, value.month, monthrange(value.year, value.month)[1])


def _resolve_period_range(
    period: str,
    reference_date: date | None,
) -> tuple[str, str | None, str | None]:
    normalized_period = period if period in _VALID_PERIODS else "current_month"

    if normalized_period == "all_time":
        return normalized_period, None, None

    if reference_date is None:
        return normalized_period, None, None

    if normalized_period == "current_month":
        start = _month_start(reference_date)
        end = _month_end(reference_date)

    elif normalized_period == "last_3_months":
        start = _month_start(_add_months(reference_date, -2))
        end = _month_end(reference_date)

    elif normalized_period == "current_semester":
        if reference_date.month <= 6:
            start = date(reference_date.year, 1, 1)
            end = date(reference_date.year, 6, 30)
        else:
            start = date(reference_date.year, 7, 1)
            end = date(reference_date.year, 12, 31)

    elif normalized_period == "current_year":
        start = date(reference_date.year, 1, 1)
        end = date(reference_date.year, 12, 31)

    else:
        start = _month_start(reference_date)
        end = _month_end(reference_date)

    return normalized_period, _format_iso_date(start), _format_iso_date(end)


def _apply_date_filter(query, column, start_date: str | None, end_date: str | None):
    if start_date:
        query = query.filter(column >= start_date)

    if end_date:
        query = query.filter(column <= end_date)

    return query


def _contact_type(gold: GoldCliente360) -> str:
    return "Lead" if gold.segmento_cliente == "Lead" else "Cliente"


def _title_case(value: str | None) -> str | None:
    if value is None:
        return None

    cleaned = str(value).strip()

    if not cleaned:
        return None

    return cleaned.lower().title()


def _to_int(value) -> int | None:
    if value is None:
        return None

    try:
        return int(float(value))
    except Exception:
        return None


class ContactDetailService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db

    def _get_reference_date_from_gold(
        self,
        contact_id: str,
        gold: GoldCliente360 | None,
    ) -> date | None:
        order_max = (
            self.db.query(func.max(GoldPedidoDetalhado.data_pedido))
            .filter(GoldPedidoDetalhado.id_cliente == contact_id)
            .scalar()
        )

        ticket_max = (
            self.db.query(func.max(GoldTicket360.data_abertura))
            .filter(GoldTicket360.id_cliente == contact_id)
            .scalar()
        )

        candidate_dates = [
            _parse_iso_date(order_max),
            _parse_iso_date(ticket_max),
            _parse_iso_date(gold.data_ultimo_pedido if gold else None),
            _parse_iso_date(gold.data_ultimo_evento if gold else None),
        ]

        valid_dates = [item for item in candidate_dates if item is not None]

        return max(valid_dates) if valid_dates else None

    def _get_period_context(
        self,
        contact_id: str,
        period: str,
        gold: GoldCliente360,
    ) -> tuple[str, str, str | None, str | None]:
        reference_date = self._get_reference_date_from_gold(contact_id, gold)

        normalized_period, start_date, end_date = _resolve_period_range(
            period,
            reference_date,
        )

        period_label = _PERIOD_LABELS.get(normalized_period, "Esse mês")

        return normalized_period, period_label, start_date, end_date

    def get_contact_details(self, contact_id: str) -> ContactDetailOut | None:
        gold = (
            self.db.query(GoldCliente360)
            .filter(GoldCliente360.id_cliente == contact_id)
            .first()
        )

        if not gold:
            return None

        return ContactDetailOut(
            id=gold.id_cliente,
            name=gold.nome_completo,
            email=gold.email,
            phone=_fmt_phone(gold.telefone),
            gender=gold.genero,
            birthDate=_fmt_date(gold.data_nascimento),
            age=_to_int(gold.idade),
            ageRange=gold.faixa_etaria,
            createdAt=_fmt_date(gold.data_cadastro),
            city=_title_case(gold.cidade),
            state=_title_case(gold.estado),
            region=gold.regiao,
            country=_title_case(gold.pais),
            origin=gold.origem,
            clientStatus=gold.segmento_cliente,
            contactType=_contact_type(gold),
        )

    def patch_contact_details(
        self,
        contact_id: str,
        payload: ContactDetailPatchIn,
        user_name: str = "Sistema",
    ) -> ContactDetailOut | None:
        gold = (
            self.db.query(GoldCliente360)
            .filter(GoldCliente360.id_cliente == contact_id)
            .first()
        )

        if not gold:
            return None

        try:
            update_data = payload.model_dump(exclude_unset=True)
        except AttributeError:
            update_data = payload.dict(exclude_unset=True)

        field_mapping = {
            "name": ("nome_completo", "Nome"),
            "email": ("email", "Email"),
            "phone": ("telefone", "Telefone"),
            "gender": ("genero", "Gênero"),
            "birthDate": ("data_nascimento", "Data de nascimento"),
            "age": ("idade", "Idade"),
            "createdAt": ("data_cadastro", "Data de cadastro"),
            "city": ("cidade", "Cidade"),
            "state": ("estado", "Estado"),
            "region": ("regiao", "Região"),
            "country": ("pais", "País"),
            "origin": ("origem", "Origem"),
            "clientStatus": ("segmento_cliente", "Status"),
        }

        now = datetime.now(_BRT).replace(tzinfo=None)
        activities: list[ContactActivity] = []

        for field_name, value in update_data.items():
            mapping = field_mapping.get(field_name)

            if not mapping:
                continue

            model_field, display_label = mapping

            if field_name in {"birthDate", "createdAt"}:
                value = _display_date_to_iso(value)

            old_val = getattr(gold, model_field)
            old_str = str(old_val) if old_val is not None else "—"
            new_str = str(value) if value is not None else "—"

            if old_str != new_str:
                activities.append(ContactActivity(
                    id_cliente=contact_id,
                    user_name=user_name,
                    field_name=display_label,
                    old_value=old_str,
                    new_value=new_str,
                    change_method="Edição direta",
                    changed_at=now,
                ))

            setattr(gold, model_field, value)

        for act in activities:
            self.db.add(act)

        self.db.commit()
        self.db.refresh(gold)

        return self.get_contact_details(contact_id)

    def delete_contact_details(self, contact_id: str) -> bool:
        gold = (
            self.db.query(GoldCliente360)
            .filter(GoldCliente360.id_cliente == contact_id)
            .first()
        )

        if not gold:
            return False

        self.db.delete(gold)
        self.db.commit()

        return True

    def _build_metrics(
        self,
        contact_id: str,
        gold: GoldCliente360,
        normalized_period: str,
        period_label: str,
        start_date: str | None,
        end_date: str | None,
    ) -> ContactMetricsOut:
        compras_query = (
            self.db.query(func.sum(GoldPedidoDetalhado.valor_pedido))
            .filter(GoldPedidoDetalhado.id_cliente == contact_id)
        )

        compras_query = _apply_date_filter(
            compras_query,
            GoldPedidoDetalhado.data_pedido,
            start_date,
            end_date,
        )

        compras_periodo = float(compras_query.scalar() or 0)

        cat_query = (
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

        cat_query = _apply_date_filter(
            cat_query,
            GoldPedidoDetalhado.data_pedido,
            start_date,
            end_date,
        )

        cat_rows = (
            cat_query.group_by(GoldPedidoDetalhado.categoria)
            .order_by(desc("receita_total"))
            .limit(8)
            .all()
        )

        return ContactMetricsOut(
            contactType=_contact_type(gold),
            period=normalized_period,
            periodLabel=period_label,
            periodStart=start_date,
            periodEnd=end_date,
            comprasMes=round(compras_periodo, 2),
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
            taxaConversaoPct=round(float(gold.taxa_conversao_pct or 0), 2),
            categoriasMaisCompradas=[
                ContactCategoryMetricOut(
                    categoria=row.categoria,
                    quantidade_total=float(row.quantidade_total or 0),
                    receita_total=round(float(row.receita_total or 0), 2),
                    total_pedidos=int(row.total_pedidos or 0),
                )
                for row in cat_rows
            ],
        )

    def _build_orders(
        self,
        contact_id: str,
        page: int,
        page_size: int,
        start_date: str | None,
        end_date: str | None,
    ) -> ContactOrdersPageOut:
        query = (
            self.db.query(GoldPedidoDetalhado)
            .filter(GoldPedidoDetalhado.id_cliente == contact_id)
        )

        query = _apply_date_filter(
            query,
            GoldPedidoDetalhado.data_pedido,
            start_date,
            end_date,
        )

        total = query.count()

        rows = (
            query.order_by(desc(GoldPedidoDetalhado.data_pedido))
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        data: list[ContactOrderOut] = []

        for row in rows:
            quantidade = float(row.quantidade or 0)
            valor = float(row.valor_pedido or row.receita_bruta or 0)

            produto = ContactOrderProductOut(
                id_produto=row.id_produto,
                nome_produto=row.nome_produto,
                categoria=row.categoria,
                quantidade=quantidade,
                valor=round(valor, 2),
            )

            qtd_label = int(quantidade) if quantidade.is_integer() else quantidade
            produtos_resumo = (
                f"{qtd_label}x {row.nome_produto}"
                if row.nome_produto
                else "Produto não informado"
            )

            data.append(
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
                    produtos=[produto],
                )
            )

        return ContactOrdersPageOut(
            data=data,
            total=total,
            page=page,
            pageSize=page_size,
        )

    def _build_tickets(
        self,
        contact_id: str,
        page: int,
        page_size: int,
        start_date: str | None,
        end_date: str | None,
    ) -> ContactTicketsPageOut:
        query = (
            self.db.query(GoldTicket360)
            .filter(GoldTicket360.id_cliente == contact_id)
        )

        query = _apply_date_filter(
            query,
            GoldTicket360.data_abertura,
            start_date,
            end_date,
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

        return ContactTicketsPageOut(
            data=[
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
            ],
            total=total,
            page=page,
            pageSize=page_size,
        )

    def _build_viewed_products(
        self,
        gold: GoldCliente360,
        normalized_period: str,
        start_date: str | None,
        end_date: str | None,
    ) -> list[ContactViewedProductOut]:
        if not gold.produto_mais_visualizado and not gold.produto_mais_visualizado_id:
            return []

        event_date = _parse_iso_date(gold.data_ultimo_evento)
        start = _parse_iso_date(start_date)
        end = _parse_iso_date(end_date)

        if normalized_period != "all_time" and event_date:
            if start and event_date < start:
                return []
            if end and event_date > end:
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
                    "Fallback baseado na gold_cliente_360: produto mais visualizado, "
                    "não lista histórica."
                ),
            )
        ]

    def get_contact_dashboard(
        self,
        contact_id: str,
        period: str = "current_month",
        page: int = 1,
        page_size: int = 5,
    ) -> ContactDashboardOut | None:
        gold = (
            self.db.query(GoldCliente360)
            .filter(GoldCliente360.id_cliente == contact_id)
            .first()
        )

        if not gold:
            return None

        normalized_period, period_label, start_date, end_date = self._get_period_context(
            contact_id=contact_id,
            period=period,
            gold=gold,
        )

        metrics = self._build_metrics(
            contact_id=contact_id,
            gold=gold,
            normalized_period=normalized_period,
            period_label=period_label,
            start_date=start_date,
            end_date=end_date,
        )

        orders = self._build_orders(
            contact_id=contact_id,
            page=page,
            page_size=page_size,
            start_date=start_date,
            end_date=end_date,
        )

        tickets = self._build_tickets(
            contact_id=contact_id,
            page=page,
            page_size=page_size,
            start_date=start_date,
            end_date=end_date,
        )

        viewed_products = self._build_viewed_products(
            gold=gold,
            normalized_period=normalized_period,
            start_date=start_date,
            end_date=end_date,
        )

        return ContactDashboardOut(
            metrics=metrics,
            orders=orders,
            tickets=tickets,
            viewedProducts=viewed_products,
        )

    def get_contact_metrics(
        self,
        contact_id: str,
        period: str = "current_month",
    ) -> ContactMetricsOut | None:
        gold = (
            self.db.query(GoldCliente360)
            .filter(GoldCliente360.id_cliente == contact_id)
            .first()
        )

        if not gold:
            return None

        normalized_period, period_label, start_date, end_date = self._get_period_context(
            contact_id=contact_id,
            period=period,
            gold=gold,
        )

        return self._build_metrics(
            contact_id=contact_id,
            gold=gold,
            normalized_period=normalized_period,
            period_label=period_label,
            start_date=start_date,
            end_date=end_date,
        )

    def get_contact_orders(
        self,
        contact_id: str,
        page: int = 1,
        page_size: int = 20,
        period: str = "current_month",
    ) -> ContactOrdersPageOut | None:
        gold = (
            self.db.query(GoldCliente360)
            .filter(GoldCliente360.id_cliente == contact_id)
            .first()
        )

        if not gold:
            return None

        _, _, start_date, end_date = self._get_period_context(
            contact_id=contact_id,
            period=period,
            gold=gold,
        )

        return self._build_orders(
            contact_id=contact_id,
            page=page,
            page_size=page_size,
            start_date=start_date,
            end_date=end_date,
        )

    def get_contact_tickets(
        self,
        contact_id: str,
        page: int = 1,
        page_size: int = 20,
        period: str = "current_month",
    ) -> ContactTicketsPageOut | None:
        gold = (
            self.db.query(GoldCliente360)
            .filter(GoldCliente360.id_cliente == contact_id)
            .first()
        )

        if not gold:
            return None

        _, _, start_date, end_date = self._get_period_context(
            contact_id=contact_id,
            period=period,
            gold=gold,
        )

        return self._build_tickets(
            contact_id=contact_id,
            page=page,
            page_size=page_size,
            start_date=start_date,
            end_date=end_date,
        )

    def get_contact_viewed_products(
        self,
        contact_id: str,
        period: str = "current_month",
    ) -> list[ContactViewedProductOut] | None:
        gold = (
            self.db.query(GoldCliente360)
            .filter(GoldCliente360.id_cliente == contact_id)
            .first()
        )

        if not gold:
            return None

        normalized_period, _, start_date, end_date = self._get_period_context(
            contact_id=contact_id,
            period=period,
            gold=gold,
        )

        return self._build_viewed_products(
            gold=gold,
            normalized_period=normalized_period,
            start_date=start_date,
            end_date=end_date,
        )