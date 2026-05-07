from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from app.models.saleModel import GoldPedidoDetalhado
from app.schemas.salesSchemas import SaleCreate, SaleUpdate, SaleOut, SalesPageOut

_TAB_STATUSES: dict[str, list[str]] = {
    "concluded": ["Aprovado"],
    "returned":  ["Reembolsado", "Recusado"],
}


class SaleService:
    @staticmethod
    def get_sales(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        tab: str = "all",
        status: str = "",
        metodo_pagamento: str = "",
        categoria: str = "",
        ano_mes: str = "",
    ) -> SalesPageOut:
        query = db.query(GoldPedidoDetalhado)

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

        total = query.with_entities(func.count(GoldPedidoDetalhado.id_pedido)).scalar()

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


    @staticmethod
    def get_sale(db: Session, id_pedido: str) -> SaleOut:
        row = db.get(GoldPedidoDetalhado, id_pedido)
        if not row:
            raise HTTPException(status_code=404, detail="Pedido não encontrado")
        return SaleOut.model_validate(row)

    @staticmethod
    def create_sale(db: Session, sale_in: SaleCreate) -> SaleOut:
        if db.get(GoldPedidoDetalhado, sale_in.id_pedido):
            raise HTTPException(status_code=409, detail="Pedido já existe")
        row = GoldPedidoDetalhado(**sale_in.model_dump())
        db.add(row)
        db.commit()
        db.refresh(row)
        return SaleOut.model_validate(row)

    @staticmethod
    def update_sale(db: Session, id_pedido: str, sale_in: SaleUpdate) -> SaleOut:
        row = db.get(GoldPedidoDetalhado, id_pedido)
        if not row:
            raise HTTPException(status_code=404, detail="Pedido não encontrado")
        for field, value in sale_in.model_dump(exclude_unset=True).items():
            setattr(row, field, value)
        db.commit()
        db.refresh(row)
        return SaleOut.model_validate(row)

    @staticmethod
    def delete_sale(db: Session, id_pedido: str) -> None:
        row = db.get(GoldPedidoDetalhado, id_pedido)
        if not row:
            raise HTTPException(status_code=404, detail="Pedido não encontrado")
        db.delete(row)
        db.commit()
