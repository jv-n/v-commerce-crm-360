from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException

from app.models.saleModel import GoldPedidoDetalhado
from app.schemas.salesSchemas import SaleCreate, SaleUpdate, SaleOut, SalesPageOut

_TAB_STATUSES: dict[str, list[str]] = {
    "concluded": ["Aprovado"],
    "returned":  ["Reembolsado", "Recusado"],
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
    ):
        query = self.db.query(GoldPedidoDetalhado)

        if tab in _TAB_STATUSES:
            query = query.filter(GoldPedidoDetalhado.status.in_(_TAB_STATUSES[tab]))
        if status:
            query = query.filter(GoldPedidoDetalhado.status == status)
        if metodo_pagamento:
            query = query.filter(GoldPedidoDetalhado.metodo_pagamento == metodo_pagamento)
        if categoria:
            query = query.filter(GoldPedidoDetalhado.categoria == categoria)
        if ano_mes:
            query = query.filter(GoldPedidoDetalhado.ano_mes == ano_mes)
        if data_from:
            query = query.filter(GoldPedidoDetalhado.data_pedido >= data_from)
        if data_to:
            query = query.filter(GoldPedidoDetalhado.data_pedido <= data_to)
        if search:
            pattern = f"%{search}%"
            if search_field == "client":
                query = query.filter(GoldPedidoDetalhado.nome_cliente.ilike(pattern))
            elif search_field == "product":
                query = query.filter(GoldPedidoDetalhado.nome_produto.ilike(pattern))
            else:
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
    ) -> SalesPageOut:
        query = self._base_query(tab, status, metodo_pagamento, categoria, ano_mes, data_from, data_to, search, search_field)

        total = query.count()

        rows = (
            query
            .order_by(GoldPedidoDetalhado.data_pedido.desc())
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

    def update_sale(self, id_pedido: str, sale_in: SaleUpdate) -> SaleOut:
        row = self.db.get(GoldPedidoDetalhado, id_pedido)
        if not row:
            raise HTTPException(status_code=404, detail="Pedido não encontrado")
        for field, value in sale_in.model_dump(exclude_unset=True).items():
            setattr(row, field, value)
        self.db.commit()
        self.db.refresh(row)
        return SaleOut.model_validate(row)

    def delete_sale(self, id_pedido: str) -> None:
        row = self.db.get(GoldPedidoDetalhado, id_pedido)
        if not row:
            raise HTTPException(status_code=404, detail="Pedido não encontrado")
        self.db.delete(row)
        self.db.commit()
