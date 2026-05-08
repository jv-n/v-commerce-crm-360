from sqlalchemy.orm import Session

from app.models.productModel import DimProduto, GoldDesempenhoProduto
from app.schemas.productSchemas import ProductSchema


def _dmy_to_iso(dmy: str) -> str:
    d, m, y = dmy.strip().split("/")
    return f"{y}-{m.zfill(2)}-{d.zfill(2)}"


def _to_product_out(dim: DimProduto, gold: GoldDesempenhoProduto | None) -> ProductSchema:
    raw_date = dim.data_cadastro_produto or ""
    if raw_date and "-" in raw_date:
        y, m, d = raw_date[:10].split("-")
        created_at = f"{d}/{m}/{y}"
    else:
        created_at = raw_date or None

    return ProductSchema(
        id=dim.id_produto,
        name=dim.nome_produto,
        price=dim.preco,
        stock=int(dim.estoque_disponivel or 0),
        category=dim.categoria,
        status="Ativo" if str(dim.ativo or "").lower() == "true" else "Inativo",
        uf=None,
        created_at=created_at,
        rating=gold.nota_media_avaliacao if gold else None,
        total_sales=gold.qtd_vendida if gold else None,
        receita_total=gold.receita_total if gold else None,
        ticket_medio=gold.ticket_medio if gold else None,
        qtd_avaliacoes=gold.qtd_avaliacoes if gold else None,
        nota_nps_media=gold.nota_nps_media if gold else None,
        qtd_tickets_gerados=gold.qtd_tickets_gerados if gold else None,
        tipo_problema_mais_frequente=gold.tipo_problema_mais_frequente if gold else None,
        ratio_ticket_por_venda=gold.ratio_ticket_por_venda if gold else None,
    )


class ProductService:
    def __init__(self, db: Session):
        self.db = db

    def _base_query(self):
        return (
            self.db.query(DimProduto, GoldDesempenhoProduto)
            .outerjoin(
                GoldDesempenhoProduto,
                DimProduto.id_produto == GoldDesempenhoProduto.id_produto,
            )
        )

    def get_products(
        self,
        page: int = 1,
        page_size: int = 10,
        search: str | None = None,
        category: str | None = None,
        status: str | None = None,
        uf: str | None = None,
        price_min: float | None = None,
        price_max: float | None = None,
        stock_min: int | None = None,
        stock_max: int | None = None,
        rating_min: float | None = None,
        rating_max: float | None = None,
        sales_min: float | None = None,
        sales_max: float | None = None,
        date_from: str | None = None,
        date_to: str | None = None,
    ) -> tuple[list[ProductSchema], int]:
        query = self._base_query()

        if search:
            query = query.filter(DimProduto.nome_produto.ilike(f"%{search}%"))

        if category:
            query = query.filter(DimProduto.categoria.ilike(f"%{category}%"))

        if status:
            statuses = [s.strip() for s in status.split(",") if s.strip()]
            ativo_values = []
            for s in statuses:
                if s == "Ativo":
                    ativo_values.append("True")
                elif s == "Inativo":
                    ativo_values.append("False")
            if ativo_values:
                query = query.filter(DimProduto.ativo.in_(ativo_values))

        if price_min is not None:
            query = query.filter(DimProduto.preco >= price_min)
        if price_max is not None:
            query = query.filter(DimProduto.preco <= price_max)

        if stock_min is not None:
            query = query.filter(DimProduto.estoque_disponivel >= stock_min)
        if stock_max is not None:
            query = query.filter(DimProduto.estoque_disponivel <= stock_max)

        if rating_min is not None:
            query = query.filter(GoldDesempenhoProduto.nota_media_avaliacao >= rating_min)
        if rating_max is not None:
            query = query.filter(GoldDesempenhoProduto.nota_media_avaliacao <= rating_max)

        if sales_min is not None:
            query = query.filter(GoldDesempenhoProduto.qtd_vendida >= sales_min)
        if sales_max is not None:
            query = query.filter(GoldDesempenhoProduto.qtd_vendida <= sales_max)

        # data_cadastro_produto é YYYY-MM-DD — comparação direta após converter o input
        if date_from:
            try:
                query = query.filter(DimProduto.data_cadastro_produto >= _dmy_to_iso(date_from))
            except ValueError:
                pass
        if date_to:
            try:
                query = query.filter(DimProduto.data_cadastro_produto <= _dmy_to_iso(date_to))
            except ValueError:
                pass

        total = query.count()
        rows = query.offset((page - 1) * page_size).limit(page_size).all()
        return [_to_product_out(dim, gold) for dim, gold in rows], total

    def get_product_by_id(self, product_id: str) -> ProductSchema | None:
        row = self._base_query().filter(DimProduto.id_produto == product_id).first()
        return _to_product_out(row[0], row[1]) if row else None
