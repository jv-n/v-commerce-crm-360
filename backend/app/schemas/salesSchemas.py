from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class SaleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_pedido: str
    id_cliente: str | None
    nome_cliente: str | None
    email: str | None
    telefone: str | None

    @field_validator("telefone", mode="before")
    @classmethod
    def coerce_telefone(cls, v):
        if v is None:
            return None
        return str(int(float(str(v).split(".")[0]))) if str(v).replace(".", "").isdigit() else str(v)

    id_produto: str | None
    nome_produto: str | None
    categoria: str | None
    ativo: int | None
    data_pedido: str | None
    ano_mes: str | None
    metodo_pagamento: str | None
    status: str | None
    quantidade: float | None
    valor_pedido: float | None
    receita_bruta: float | None
    valor_reembolsado: float | None
    timestamp_ingestion: str | None


class SaleCreate(BaseModel):
    id_pedido: str
    id_cliente: str | None = None
    id_produto: str | None = None
    nome_produto: str | None = None
    nome_cliente: str | None = None
    categoria: str | None = None
    ativo: int | None = None
    data_pedido: str | None = None
    ano_mes: str | None = None
    metodo_pagamento: str | None = None
    status: str | None = None
    quantidade: float | None = None
    valor_pedido: float | None = None
    receita_bruta: float | None = None
    valor_reembolsado: float | None = None


class SaleUpdate(BaseModel):
    id_cliente: str | None = None
    id_produto: str | None = None
    nome_produto: str | None = None
    nome_cliente: str | None = None
    categoria: str | None = None
    ativo: int | None = None
    data_pedido: str | None = None
    ano_mes: str | None = None
    metodo_pagamento: str | None = None
    status: str | None = None
    quantidade: float | None = None
    valor_pedido: float | None = None
    receita_bruta: float | None = None
    valor_reembolsado: float | None = None


class SalesPageOut(BaseModel):
    data: list[SaleOut]
    total: int
    page: int
    pageSize: int


class SaleActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:            int
    id_pedido:     str
    user_name:     str
    field_name:    str
    old_value:     str | None = None
    new_value:     str | None = None
    change_method: str
    changed_at:    datetime
