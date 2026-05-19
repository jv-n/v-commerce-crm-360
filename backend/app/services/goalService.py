import uuid
from datetime import date
from dateutil.relativedelta import relativedelta
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.goalModel import GoalItem
from app.models.saleModel import GoldPedidoDetalhado
from app.models.contactModel import GoldCliente360
from app.schemas.goalSchemas import GoalCreate, GoalOut


class GoalService:
    def __init__(self, db: Session):
        self.db = db

    # ── Helpers de data ───────────────────────────────────────────────────────

    def _month_range(self) -> tuple[str, str]:
        """
        Retorna (início, fim) do mês de referência como strings ISO.
        Usa o mês mais recente com dados em gold_pedidos_detalhado,
        evitando retornar 0 quando o banco não tem dados do mês calendário atual/anterior.
        """
        latest = self.db.execute(
            select(func.max(GoldPedidoDetalhado.data_pedido))
        ).scalar()

        if latest:
            ref_date = date.fromisoformat(latest[:10])
        else:
            # fallback: mês passado no calendário
            ref_date = (date.today() - relativedelta(months=1))

        month_start = ref_date.replace(day=1)
        month_end   = month_start + relativedelta(months=1)
        return month_start.isoformat(), month_end.isoformat()

    # ── Progresso em lote (máximo 3 queries para N metas) ────────────────────

    def _compute_all_currents(self, rows: list[GoalItem]) -> tuple[dict[str, int], str]:
        """
        Calcula o progresso de todas as metas em no máximo 3 queries.
        Retorna ({goal.id: current_value}, reference_month "YYYY-MM").
        """
        start, end = self._month_range()
        reference_month = start[:7]   # "YYYY-MM"
        result: dict[str, int] = {r.id: 0 for r in rows}

        # ── product_sales ─────────────────────────────────────────────────────
        product_goals = [r for r in rows if r.kind == "product_sales" and r.product_id]
        if product_goals:
            product_ids = [r.product_id for r in product_goals]
            counts = self.db.execute(
                select(GoldPedidoDetalhado.id_produto, func.count().label("cnt"))
                .where(GoldPedidoDetalhado.data_pedido >= start)
                .where(GoldPedidoDetalhado.data_pedido <  end)
                .where(GoldPedidoDetalhado.id_produto.in_(product_ids))
                .group_by(GoldPedidoDetalhado.id_produto)
            ).all()
            count_map = {row.id_produto: row.cnt for row in counts}
            for goal in product_goals:
                result[goal.id] = count_map.get(goal.product_id, 0)

        # ── new_clients ───────────────────────────────────────────────────────
        client_goals = [r for r in rows if r.kind == "new_clients"]
        if client_goals:
            new_clients_count = self.db.execute(
                select(func.count())
                .select_from(GoldCliente360)
                .where(GoldCliente360.data_cadastro >= start)
                .where(GoldCliente360.data_cadastro <  end)
            ).scalar() or 0
            for goal in client_goals:
                result[goal.id] = int(new_clients_count)

        # ── category_sales ────────────────────────────────────────────────────
        category_goals = [r for r in rows if r.kind == "category_sales" and r.category]
        if category_goals:
            categories = [r.category for r in category_goals]
            counts = self.db.execute(
                select(GoldPedidoDetalhado.categoria, func.count().label("cnt"))
                .where(GoldPedidoDetalhado.data_pedido >= start)
                .where(GoldPedidoDetalhado.data_pedido <  end)
                .where(GoldPedidoDetalhado.categoria.in_(categories))
                .group_by(GoldPedidoDetalhado.categoria)
            ).all()
            count_map = {row.categoria: row.cnt for row in counts}
            for goal in category_goals:
                result[goal.id] = count_map.get(goal.category, 0)

        return result, reference_month

    # ── CRUD ──────────────────────────────────────────────────────────────────

    def get_all(self) -> list[GoalOut]:
        """Retorna metas sem calcular progresso — rápido."""
        rows = self.db.query(GoalItem).all()
        return [self._to_out(r, 0, None) for r in rows]

    def get_progress(self) -> dict:
        """Calcula o progresso de todas as metas (queries pesadas).
        Retorna {id: current, "_reference_month": "YYYY-MM"}.
        """
        rows = self.db.query(GoalItem).all()
        if not rows:
            return {}
        currents, ref_month = self._compute_all_currents(rows)
        return {**currents, "_reference_month": ref_month}

    def get_single_progress(self, goal_id: str) -> dict:
        """Calcula o progresso de uma única meta.
        Retorna {"current": int, "reference_month": "YYYY-MM"}.
        """
        row = self.db.query(GoalItem).filter(GoalItem.id == goal_id).first()
        if not row:
            return {"current": 0, "reference_month": ""}
        currents, ref_month = self._compute_all_currents([row])
        return {"current": currents.get(goal_id, 0), "reference_month": ref_month}

    def add(self, data: GoalCreate) -> GoalOut:
        row = GoalItem(
            id=str(uuid.uuid4()),
            kind=data.kind,
            label=data.label,
            target=data.target,
            product_id=data.product_id,
            product_name=data.product_name,
            category=data.category,
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return self._to_out(row, 0, None)  # progresso é buscado separadamente pelo frontend

    def remove(self, goal_id: str) -> bool:
        row = self.db.query(GoalItem).filter(GoalItem.id == goal_id).first()
        if not row:
            return False
        self.db.delete(row)
        self.db.commit()
        return True

    def _to_out(self, r: GoalItem, current: int, reference_month: str | None) -> GoalOut:
        return GoalOut(
            id=r.id,
            kind=r.kind,
            label=r.label,
            target=r.target,
            current=current,
            reference_month=reference_month,
            product_id=r.product_id,
            product_name=r.product_name,
            category=r.category,
        )
