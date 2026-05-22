from datetime import datetime, timezone, timedelta

from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException

from app.models.saleModel import GoldPedidoDetalhado, SaleActivity
from app.schemas.salesSchemas import SaleCreate, SaleUpdate, SaleOut, SalesPageOut, SaleActivityOut

_BRT = timezone(timedelta(hours=-3))

# (payload_field, model_attr, display_label)
_TRACKED_FIELDS: list[tuple[str, str, str]] = [
    ("nome_cliente",     "nome_cliente",     "Cliente"),
    ("nome_produto",     "nome_produto",     "Produto"),
    ("categoria",        "categoria",        "Categoria"),
    ("metodo_pagamento", "metodo_pagamento", "Método de pagamento"),
    ("status",           "status",           "Status"),
    ("data_pedido",      "data_pedido",      "Data do pedido"),
    ("quantidade",       "quantidade",       "Quantidade"),
    ("valor_pedido",     "valor_pedido",     "Valor"),
]

_TAB_STATUSES: dict[str, list[str]] = {
    "concluded": ["Entregue", "Entregue com Atraso", "Reembolsado"],
    "pending":   ["Aprovado", "Em rota"],
    "failed":    ["Recusado", "Cancelado"],
}

_SORT_COLUMNS = {
    "client":   "nome_cliente",
    "product":  "nome_produto",
    "value":    "valor_pedido",
    "amount":   "quantidade",
    "saleDate": "data_pedido",
}


class SaleService:
    def __init__(self, db: Session):
        self.db = db

    def _base_query(
        self,
        tab: str = "all",
        status: str = "",
        metodo_pagamento: str = "",
        categoria: str = "",
        ano_mes: str = "",
        data_from: str = "",
        data_to: str = "",
        search: str = "",
        search_field: str = "all",
        nome_cliente: str = "",
        nome_produto: str = "",
    ):
        query = self.db.query(GoldPedidoDetalhado)

        if tab in _TAB_STATUSES:
            query = query.filter(GoldPedidoDetalhado.status.in_(_TAB_STATUSES[tab]))
        if status:
            values = [s.strip() for s in status.split(",") if s.strip()]
            query = query.filter(GoldPedidoDetalhado.status.in_(values))
        if metodo_pagamento:
            values = [m.strip() for m in metodo_pagamento.split(",") if m.strip()]
            query = query.filter(GoldPedidoDetalhado.metodo_pagamento.in_(values))
        if categoria:
            values = [c.strip() for c in categoria.split(",") if c.strip()]
            query = query.filter(GoldPedidoDetalhado.categoria.in_(values))
        if ano_mes:
            query = query.filter(GoldPedidoDetalhado.ano_mes == ano_mes)
        if data_from:
            query = query.filter(GoldPedidoDetalhado.data_pedido >= data_from)
        if data_to:
            query = query.filter(GoldPedidoDetalhado.data_pedido <= data_to)
        if nome_cliente:
            query = query.filter(GoldPedidoDetalhado.nome_cliente.ilike(f"%{nome_cliente}%"))
        if nome_produto:
            query = query.filter(GoldPedidoDetalhado.nome_produto.ilike(f"%{nome_produto}%"))
        if search:
            if search_field == "sale_id":
                query = query.filter(GoldPedidoDetalhado.id_pedido.ilike(f"%{search}%"))
            elif search_field == "client_id":
                query = query.filter(GoldPedidoDetalhado.id_cliente == search)
            else:
                pattern = f"%{search}%"
                query = query.filter(or_(
                    GoldPedidoDetalhado.nome_cliente.ilike(pattern),
                    GoldPedidoDetalhado.nome_produto.ilike(pattern),
                ))

        return query

    def get_sales(
        self,
        page: int = 1,
        page_size: int = 20,
        tab: str = "all",
        status: str = "",
        metodo_pagamento: str = "",
        categoria: str = "",
        ano_mes: str = "",
        data_from: str = "",
        data_to: str = "",
        search: str = "",
        search_field: str = "all",
        nome_cliente: str = "",
        nome_produto: str = "",
        sort_key: str = "",
        sort_dir: str = "desc",
    ) -> SalesPageOut:
        query = self._base_query(tab, status, metodo_pagamento, categoria, ano_mes, data_from, data_to, search, search_field, nome_cliente, nome_produto)

        total = query.count()

        col_name = _SORT_COLUMNS.get(sort_key, "data_pedido")
        col = getattr(GoldPedidoDetalhado, col_name)
        order = col.asc() if sort_dir == "asc" else col.desc()

        rows = (
            query
            .order_by(order)
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return SalesPageOut(
            data=[SaleOut.model_validate(row) for row in rows],
            total=total,
            page=page,
            pageSize=page_size,
        )

    def get_sale(self, id_pedido: str) -> SaleOut:
        row = self.db.get(GoldPedidoDetalhado, id_pedido)
        if not row:
            raise HTTPException(status_code=404, detail="Pedido não encontrado")
        return SaleOut.model_validate(row)

    def create_sale(self, sale_in: SaleCreate) -> SaleOut:
        if self.db.get(GoldPedidoDetalhado, sale_in.id_pedido):
            raise HTTPException(status_code=409, detail="Pedido já existe")
        row = GoldPedidoDetalhado(**sale_in.model_dump())
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return SaleOut.model_validate(row)

    def update_sale(self, id_pedido: str, sale_in: SaleUpdate, user_name: str = "Sistema") -> SaleOut:
        row = self.db.get(GoldPedidoDetalhado, id_pedido)
        if not row:
            raise HTTPException(status_code=404, detail="Pedido não encontrado")

        now = datetime.now(_BRT).replace(tzinfo=None)
        activities: list[SaleActivity] = []

        for payload_attr, model_attr, label in _TRACKED_FIELDS:
            new_val = getattr(sale_in, payload_attr, None)
            if new_val is None:
                continue
            old_raw = getattr(row, model_attr)

            if payload_attr == "valor_pedido":
                old_display = f"R$ {old_raw:.2f}".replace(".", ",") if old_raw is not None else "—"
                new_display = f"R$ {float(new_val):.2f}".replace(".", ",")
                changed = old_raw != float(new_val)
            elif payload_attr == "quantidade":
                old_display = str(int(old_raw)) if old_raw is not None else "—"
                new_display = str(int(new_val))
                changed = old_raw != float(new_val)
            else:
                old_display = str(old_raw) if old_raw is not None else "—"
                new_display = str(new_val)
                changed = old_raw != new_val

            if changed:
                activities.append(SaleActivity(
                    id_pedido=id_pedido,
                    user_name=user_name,
                    field_name=label,
                    old_value=old_display,
                    new_value=new_display,
                    change_method="Edição direta",
                    changed_at=now,
                ))

        for field, value in sale_in.model_dump(exclude_unset=True).items():
            setattr(row, field, value)

        for act in activities:
            self.db.add(act)

        self.db.commit()
        self.db.refresh(row)
        return SaleOut.model_validate(row)

    def get_sale_activities(self, id_pedido: str, limit: int = 50) -> list[SaleActivityOut]:
        rows = (
            self.db.query(SaleActivity)
            .filter(SaleActivity.id_pedido == id_pedido)
            .order_by(SaleActivity.changed_at.desc())
            .limit(limit)
            .all()
        )
        return [SaleActivityOut.model_validate(r) for r in rows]

    def delete_sale(self, id_pedido: str) -> None:
        row = self.db.get(GoldPedidoDetalhado, id_pedido)
        if not row:
            raise HTTPException(status_code=404, detail="Pedido não encontrado")
        self.db.delete(row)
        self.db.commit()
