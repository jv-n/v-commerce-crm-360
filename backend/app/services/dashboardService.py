from datetime import date, timedelta

from sqlalchemy import select, func, distinct
from sqlalchemy.orm import Session

from app.models.contactModel import GoldCliente360
from app.models.saleModel import GoldPedidoDetalhado
from app.models.ticketModel import FtTicketSuporte

# Only valid Brazilian state names → 2-letter sigla
_ESTADO_SIGLA: dict[str, str] = {
    "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM",
    "Bahia": "BA", "Ceará": "CE", "Distrito Federal": "DF", "Espírito Santo": "ES",
    "Goiás": "GO", "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS",
    "Minas Gerais": "MG", "Pará": "PA", "Paraíba": "PB", "Paraná": "PR",
    "Pernambuco": "PE", "Piauí": "PI", "Rio Grande do Norte": "RN",
    "Rio Grande do Sul": "RS", "Rio de Janeiro": "RJ", "Rondônia": "RO",
    "Roraima": "RR", "Santa Catarina": "SC", "São Paulo": "SP",
    "Sergipe": "SE", "Tocantins": "TO",
}

_PERIOD_DAYS: dict[str, int] = {
    "2weeks": 14,
    "month": 30,
    "3months": 90,
    "semester": 180,
    "year": 365,
}


class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    # ------------------------------------------------------------------
    # Date helpers
    # ------------------------------------------------------------------

    def _resolve_dates(
        self,
        period_type: str,
        start_date: str | None,
        end_date: str | None,
    ) -> tuple[str, str, str, str, str, str]:
        today = date.today()

        if period_type == "custom" and start_date and end_date:
            start = date.fromisoformat(start_date)
            end = date.fromisoformat(end_date)
        else:
            days = _PERIOD_DAYS.get(period_type, 30)
            end = today
            start = today - timedelta(days=days)

        duration = (end - start).days

        prev_end = start - timedelta(days=1)
        prev_start = prev_end - timedelta(days=duration)

        yoy_start = start - timedelta(days=365)
        yoy_end = end - timedelta(days=365)

        return (
            start.isoformat(),
            end.isoformat(),
            prev_start.isoformat(),
            prev_end.isoformat(),
            yoy_start.isoformat(),
            yoy_end.isoformat(),
        )

    @staticmethod
    def _trend(current: float, previous: float) -> float:
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round((current - previous) / abs(previous) * 100, 1)

    # ------------------------------------------------------------------
    # Metric calculators
    # ------------------------------------------------------------------

    def _nps(self, start: str, end: str) -> float:
        rows = self.db.execute(
            select(
                GoldCliente360.categoria_nps_recente,
                func.count(GoldCliente360.id_cliente).label("cnt"),
            )
            .where(GoldCliente360.data_ultimo_pedido >= start)
            .where(GoldCliente360.data_ultimo_pedido <= end)
            .where(GoldCliente360.categoria_nps_recente.isnot(None))
            .group_by(GoldCliente360.categoria_nps_recente)
        ).all()

        counts = {row[0]: row[1] for row in rows}
        total = sum(counts.values())
        if total == 0:
            return 0.0

        promotores = counts.get("Promotor", 0)
        detratores = counts.get("Detrator", 0)
        return round((promotores / total - detratores / total) * 100, 1)

    def _vendas(self, start: str, end: str) -> float:
        aprovado = self.db.execute(
            select(func.sum(GoldPedidoDetalhado.receita_bruta))
            .where(GoldPedidoDetalhado.data_pedido >= start)
            .where(GoldPedidoDetalhado.data_pedido <= end)
            .where(GoldPedidoDetalhado.status == "Aprovado")
        ).scalar() or 0.0

        reembolsado = self.db.execute(
            select(func.sum(GoldPedidoDetalhado.valor_reembolsado))
            .where(GoldPedidoDetalhado.data_pedido >= start)
            .where(GoldPedidoDetalhado.data_pedido <= end)
            .where(GoldPedidoDetalhado.status == "Reembolsado")
        ).scalar() or 0.0

        return round(float(aprovado) - float(reembolsado), 2)

    def _clientes(self, start: str, end: str) -> int:
        return (
            self.db.execute(
                select(func.count(distinct(GoldPedidoDetalhado.id_cliente)))
                .where(GoldPedidoDetalhado.data_pedido >= start)
                .where(GoldPedidoDetalhado.data_pedido <= end)
            ).scalar()
            or 0
        )

    def _tickets(self, start: str, end: str) -> int:
        return (
            self.db.execute(
                select(func.count(FtTicketSuporte.ticket_id))
                .where(FtTicketSuporte.data_abertura >= start)
                .where(FtTicketSuporte.data_abertura <= end)
                .where(FtTicketSuporte.resolvido == "True")
            ).scalar()
            or 0
        )

    # ------------------------------------------------------------------
    # Public endpoints
    # ------------------------------------------------------------------

    def get_metrics(
        self,
        period_type: str,
        start_date: str | None,
        end_date: str | None,
    ) -> dict:
        cur_s, cur_e, prev_s, prev_e, yoy_s, yoy_e = self._resolve_dates(
            period_type, start_date, end_date
        )

        nps_cur  = self._nps(cur_s, cur_e)
        nps_prev = self._nps(prev_s, prev_e)
        nps_yoy  = self._nps(yoy_s, yoy_e)

        vendas_cur  = self._vendas(cur_s, cur_e)
        vendas_prev = self._vendas(prev_s, prev_e)
        vendas_yoy  = self._vendas(yoy_s, yoy_e)

        cli_cur  = float(self._clientes(cur_s, cur_e))
        cli_prev = float(self._clientes(prev_s, prev_e))
        cli_yoy  = float(self._clientes(yoy_s, yoy_e))

        tick_cur  = float(self._tickets(cur_s, cur_e))
        tick_prev = float(self._tickets(prev_s, prev_e))
        tick_yoy  = float(self._tickets(yoy_s, yoy_e))

        return {
            "period": {
                "start": cur_s, "end": cur_e,
                "prev_start": prev_s, "prev_end": prev_e,
                "yoy_start": yoy_s, "yoy_end": yoy_e,
            },
            "nps": {
                "value": nps_cur, "prev_value": nps_prev,
                "trend_pct": self._trend(nps_cur, nps_prev),
                "yoy_value": nps_yoy, "yoy_pct": self._trend(nps_cur, nps_yoy),
            },
            "vendas": {
                "value": vendas_cur, "prev_value": vendas_prev,
                "trend_pct": self._trend(vendas_cur, vendas_prev),
                "yoy_value": vendas_yoy, "yoy_pct": self._trend(vendas_cur, vendas_yoy),
            },
            "clientes": {
                "value": cli_cur, "prev_value": cli_prev,
                "trend_pct": self._trend(cli_cur, cli_prev),
                "yoy_value": cli_yoy, "yoy_pct": self._trend(cli_cur, cli_yoy),
            },
            "tickets": {
                "value": tick_cur, "prev_value": tick_prev,
                "trend_pct": self._trend(tick_cur, tick_prev),
                "yoy_value": tick_yoy, "yoy_pct": self._trend(tick_cur, tick_yoy),
            },
        }

    def get_map_data(
        self,
        view: str,
        period_type: str,
        start_date: str | None,
        end_date: str | None,
    ) -> list[dict]:
        cur_s, cur_e, *_ = self._resolve_dates(period_type, start_date, end_date)

        is_estados = view == "estados"
        group_col = GoldCliente360.estado if is_estados else GoldCliente360.regiao

        rows = self.db.execute(
            select(
                group_col.label("key"),
                func.count(GoldPedidoDetalhado.id_pedido).label("total_pedidos"),
                func.sum(GoldPedidoDetalhado.valor_pedido).label("total_valor"),
            )
            .select_from(GoldPedidoDetalhado)
            .join(
                GoldCliente360,
                GoldPedidoDetalhado.id_cliente == GoldCliente360.id_cliente,
            )
            .where(GoldPedidoDetalhado.data_pedido >= cur_s)
            .where(GoldPedidoDetalhado.data_pedido <= cur_e)
            .where(group_col.isnot(None))
            .group_by(group_col)
        ).all()

        result = []
        for row in rows:
            if is_estados:
                sigla = _ESTADO_SIGLA.get(row.key)
                if not sigla:
                    continue  # skip city-level entries in the estado column
                key = sigla
            else:
                key = row.key

            result.append({
                "key": key,
                "total_pedidos": int(row.total_pedidos),
                "total_valor": float(row.total_valor or 0),
            })

        return result
