from datetime import date, datetime, timezone, timedelta

_BRT = timezone(timedelta(hours=-3))

from sqlalchemy import asc, desc, select, func
from sqlalchemy.orm import Session

from app.models.productModel import DimProduto, GoldDesempenhoProduto, ProductActivity
from app.models.saleModel import GoldPedidoDetalhado
from app.models.ticketModel import FtTicketSuporte
from app.schemas.productSchemas import (
    ProductSchema, ProductCreate, ProductUpdate,
    ProductOrderOut, ProductTicketOut, ProductMonthlyRevenueOut,
    ProductActivityOut, ProductResumoOut,
)


def _to_product_out(
    gold: GoldDesempenhoProduto,
    peso_kg: float | None = None,
    data_cadastro: str | None = None,
) -> ProductSchema:
    raw_date = data_cadastro or ""
    if raw_date and "-" in raw_date:
        y, m, d = raw_date[:10].split("-")
        created_at = f"{d}/{m}/{y}"
    else:
        created_at = raw_date or None

    return ProductSchema(
        id=gold.id_produto,
        name=gold.nome_produto or "",
        price=gold.preco,
        supplier=gold.fornecedor,
        weight_kg=peso_kg,
        stock=int(gold.estoque_disponivel or 0),
        category=gold.categoria,
        status="Ativo" if str(gold.ativo or "").lower() == "true" else "Inativo",
        uf=None,
        created_at=created_at,
        rating=gold.nota_media_avaliacao,
        total_sales=gold.qtd_vendida,
        receita_total=gold.receita_total,
        ticket_medio=gold.ticket_medio,
        qtd_avaliacoes=gold.qtd_avaliacoes,
        nota_nps_media=gold.nota_nps_media,
        qtd_tickets_gerados=gold.qtd_tickets_gerados,
        tipo_problema_mais_frequente=gold.tipo_problema_mais_frequente,
        ratio_ticket_por_venda=gold.ratio_ticket_por_venda,
    )


class ProductService:
    def __init__(self, db: Session):
        self.db = db

    _SORT_COLUMNS = {
        "name":       lambda: GoldDesempenhoProduto.nome_produto,
        "price":      lambda: GoldDesempenhoProduto.preco,
        "stock":      lambda: GoldDesempenhoProduto.estoque_disponivel,
        "rating":     lambda: GoldDesempenhoProduto.nota_media_avaliacao,
        "totalSales": lambda: GoldDesempenhoProduto.qtd_vendida,
    }

    # (payload_attr, gold_attr, label em PT)
    _TRACKED_FIELDS: list[tuple[str, str, str]] = [
        ("name",     "nome_produto", "Nome do produto"),
        ("category", "categoria",   "Categoria"),
        ("price",    "preco",       "Preço"),
        ("supplier", "fornecedor",  "Fornecedor"),
        ("stock",    "estoque_disponivel", "Estoque disponível"),
        ("status",   "ativo",       "Status"),
    ]

    def _build_dim_map(self, ids: list[str]) -> dict[str, DimProduto]:
        if not ids:
            return {}
        rows = self.db.query(DimProduto).filter(DimProduto.id_produto.in_(ids)).all()
        return {r.id_produto: r for r in rows}

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
        sort_by: str | None = None,
        sort_dir: str | None = "asc",
    ) -> tuple[list[ProductSchema], int]:
        query = self.db.query(GoldDesempenhoProduto)

        if search:
            query = query.filter(GoldDesempenhoProduto.nome_produto.ilike(f"%{search}%"))
        if category:
            query = query.filter(GoldDesempenhoProduto.categoria.ilike(f"%{category}%"))
        if status:
            statuses = [s.strip() for s in status.split(",") if s.strip()]
            ativo_values = []
            for s in statuses:
                if s == "Ativo":
                    ativo_values.append("True")
                elif s == "Inativo":
                    ativo_values.append("False")
            if ativo_values:
                query = query.filter(GoldDesempenhoProduto.ativo.in_(ativo_values))
        if price_min is not None:
            query = query.filter(GoldDesempenhoProduto.preco >= price_min)
        if price_max is not None:
            query = query.filter(GoldDesempenhoProduto.preco <= price_max)
        if stock_min is not None:
            query = query.filter(GoldDesempenhoProduto.estoque_disponivel >= stock_min)
        if stock_max is not None:
            query = query.filter(GoldDesempenhoProduto.estoque_disponivel <= stock_max)
        if rating_min is not None:
            query = query.filter(GoldDesempenhoProduto.nota_media_avaliacao >= rating_min)
        if rating_max is not None:
            query = query.filter(GoldDesempenhoProduto.nota_media_avaliacao <= rating_max)
        if sales_min is not None:
            query = query.filter(GoldDesempenhoProduto.qtd_vendida >= sales_min)
        if sales_max is not None:
            query = query.filter(GoldDesempenhoProduto.qtd_vendida <= sales_max)

        # date_from / date_to: buscados no dim_produtos via subquery
        if date_from or date_to:
            dim_q = select(DimProduto.id_produto)
            if date_from:
                try:
                    d, m, y = date_from.strip().split("/")
                    dim_q = dim_q.where(DimProduto.data_cadastro_produto >= f"{y}-{m.zfill(2)}-{d.zfill(2)}")
                except ValueError:
                    pass
            if date_to:
                try:
                    d, m, y = date_to.strip().split("/")
                    dim_q = dim_q.where(DimProduto.data_cadastro_produto <= f"{y}-{m.zfill(2)}-{d.zfill(2)}")
                except ValueError:
                    pass
            query = query.filter(GoldDesempenhoProduto.id_produto.in_(dim_q))

        col_fn = self._SORT_COLUMNS.get(sort_by or "")
        if col_fn:
            order = asc(col_fn()) if sort_dir != "desc" else desc(col_fn())
            query = query.order_by(order)

        total = query.count()
        gold_rows: list[GoldDesempenhoProduto] = (
            query.offset((page - 1) * page_size).limit(page_size).all()
        )

        ids = [g.id_produto for g in gold_rows]
        dim_map = self._build_dim_map(ids)

        return [
            _to_product_out(
                g,
                peso_kg=dim_map[g.id_produto].peso_kg if g.id_produto in dim_map else None,
                data_cadastro=dim_map[g.id_produto].data_cadastro_produto if g.id_produto in dim_map else None,
            )
            for g in gold_rows
        ], total

    def get_product_by_id(self, product_id: str) -> ProductSchema | None:
        gold = self.db.query(GoldDesempenhoProduto).filter(
            GoldDesempenhoProduto.id_produto == product_id
        ).first()
        if not gold:
            return None
        dim = self.db.query(DimProduto).filter(DimProduto.id_produto == product_id).first()
        return _to_product_out(
            gold,
            peso_kg=dim.peso_kg if dim else None,
            data_cadastro=dim.data_cadastro_produto if dim else None,
        )

    def get_product_orders(self, product_id: str, limit: int = 10) -> list[ProductOrderOut]:
        rows = (
            self.db.query(GoldPedidoDetalhado)
            .filter(GoldPedidoDetalhado.id_produto == product_id)
            .order_by(desc(GoldPedidoDetalhado.data_pedido))
            .limit(limit)
            .all()
        )
        return [
            ProductOrderOut(
                id_pedido=r.id_pedido,
                id_cliente=r.id_cliente,
                nome_cliente=r.nome_cliente,
                data_pedido=r.data_pedido,
                status=r.status,
                valor_pedido=r.valor_pedido,
                metodo_pagamento=r.metodo_pagamento,
                quantidade=r.quantidade,
            )
            for r in rows
        ]

    def get_product_tickets(self, product_id: str, limit: int = 10) -> list[ProductTicketOut]:
        rows = (
            self.db.query(FtTicketSuporte)
            .join(GoldPedidoDetalhado, FtTicketSuporte.id_pedido == GoldPedidoDetalhado.id_pedido)
            .filter(GoldPedidoDetalhado.id_produto == product_id)
            .order_by(desc(FtTicketSuporte.data_abertura))
            .limit(limit)
            .all()
        )
        return [
            ProductTicketOut(
                ticket_id=r.ticket_id,
                id_pedido=r.id_pedido,
                tipo_problema=r.tipo_problema,
                data_abertura=r.data_abertura,
                data_resolucao=r.data_resolucao,
                resolvido=str(r.resolvido or "").lower() == "true",
                agente_suporte=r.agente_suporte,
                nota_avaliacao=r.nota_avaliacao,
            )
            for r in rows
        ]

    def get_product_monthly_revenue(self, product_id: str) -> list[ProductMonthlyRevenueOut]:
        rows = (
            self.db.query(
                GoldPedidoDetalhado.ano_mes,
                func.round(func.sum(GoldPedidoDetalhado.receita_bruta), 2).label("receita"),
            )
            .filter(GoldPedidoDetalhado.id_produto == product_id)
            .group_by(GoldPedidoDetalhado.ano_mes)
            .order_by(GoldPedidoDetalhado.ano_mes)
            .all()
        )
        return [ProductMonthlyRevenueOut(ano_mes=r.ano_mes, receita=r.receita or 0) for r in rows]

    def get_suppliers(self) -> list[str]:
        rows = (
            self.db.query(GoldDesempenhoProduto.fornecedor)
            .filter(GoldDesempenhoProduto.fornecedor.isnot(None))
            .distinct()
            .order_by(GoldDesempenhoProduto.fornecedor)
            .all()
        )
        return [r.fornecedor for r in rows if r.fornecedor]

    def _next_product_id(self) -> str:
        rows = (
            self.db.query(GoldDesempenhoProduto.id_produto)
            .filter(GoldDesempenhoProduto.id_produto.like("PROD-%"))
            .all()
        )
        max_num = 0
        for (pid,) in rows:
            try:
                max_num = max(max_num, int(pid.split("-")[1]))
            except (IndexError, ValueError):
                pass
        return f"PROD-{max_num + 1:04d}"

    def create_product(self, body: ProductCreate) -> ProductSchema:
        new_id = self._next_product_id()
        ativo = "True" if body.status == "Ativo" else "False"
        today = date.today().isoformat()

        # Escreve na Silver (fonte do pipeline), como dim_clientes p/ contatos
        dim = DimProduto(
            id_produto=new_id,
            nome_produto=body.name,
            categoria=body.category,
            preco=body.price,
            fornecedor=body.supplier,
            peso_kg=body.weight_kg,
            estoque_disponivel=float(body.stock),
            ativo=ativo,
            data_cadastro_produto=today,
        )
        self.db.add(dim)

        # Cria entrada na Gold para o produto aparecer na listagem imediatamente
        gold = GoldDesempenhoProduto(
            id_produto=new_id,
            nome_produto=body.name,
            categoria=body.category,
            preco=body.price,
            fornecedor=body.supplier,
            estoque_disponivel=float(body.stock),
            ativo=ativo,
        )
        self.db.add(gold)
        self.db.commit()
        self.db.refresh(dim)

        return _to_product_out(gold, peso_kg=dim.peso_kg, data_cadastro=dim.data_cadastro_produto)

    def update_product(
        self,
        product_id: str,
        body: ProductUpdate,
        user_name: str = "Sistema",
    ) -> ProductSchema | None:
        gold = self.db.query(GoldDesempenhoProduto).filter(
            GoldDesempenhoProduto.id_produto == product_id
        ).first()
        if not gold:
            return None

        dim = self.db.query(DimProduto).filter(DimProduto.id_produto == product_id).first()

        # ── snapshot dos valores antigos antes de qualquer alteração ──
        now = datetime.now(_BRT).replace(tzinfo=None)
        activities: list[ProductActivity] = []

        for payload_attr, gold_attr, label in self._TRACKED_FIELDS:
            new_val = getattr(body, payload_attr)
            if new_val is None:
                continue

            if payload_attr == "status":
                old_display = "Ativo" if str(gold.ativo or "").lower() == "true" else "Inativo"
                new_display = new_val
                changed = old_display != new_display
            elif payload_attr == "stock":
                old_display = str(int(gold.estoque_disponivel or 0))
                new_display = str(new_val)
                changed = int(gold.estoque_disponivel or 0) != new_val
            elif payload_attr == "price":
                old_display = f"R$ {gold.preco:.2f}".replace(".", ",") if gold.preco is not None else "—"
                new_display = f"R$ {new_val:.2f}".replace(".", ",")
                changed = gold.preco != new_val
            else:
                old_raw = getattr(gold, gold_attr)
                old_display = str(old_raw) if old_raw is not None else "—"
                new_display = str(new_val)
                changed = old_raw != new_val

            if changed:
                activities.append(ProductActivity(
                    id_produto=product_id,
                    user_name=user_name,
                    field_name=label,
                    old_value=old_display,
                    new_value=new_display,
                    change_method="Edição direta",
                    changed_at=now,
                ))

        # weight_kg vem do DimProduto
        if body.weight_kg is not None and dim:
            old_w = f"{dim.peso_kg} kg" if dim.peso_kg is not None else "—"
            new_w = f"{body.weight_kg} kg"
            if dim.peso_kg != body.weight_kg:
                activities.append(ProductActivity(
                    id_produto=product_id,
                    user_name=user_name,
                    field_name="Peso (kg)",
                    old_value=old_w,
                    new_value=new_w,
                    change_method="Edição direta",
                    changed_at=now,
                ))

        # ── aplica as alterações ──
        if body.name     is not None: gold.nome_produto       = body.name
        if body.category is not None: gold.categoria          = body.category
        if body.price    is not None: gold.preco              = body.price
        if body.supplier is not None: gold.fornecedor         = body.supplier
        if body.stock    is not None: gold.estoque_disponivel = float(body.stock)
        if body.status   is not None: gold.ativo              = "True" if body.status == "Ativo" else "False"

        if dim:
            if body.name      is not None: dim.nome_produto       = body.name
            if body.category  is not None: dim.categoria          = body.category
            if body.price     is not None: dim.preco              = body.price
            if body.supplier  is not None: dim.fornecedor         = body.supplier
            if body.stock     is not None: dim.estoque_disponivel = float(body.stock)
            if body.status    is not None: dim.ativo              = "True" if body.status == "Ativo" else "False"
            if body.weight_kg is not None: dim.peso_kg            = body.weight_kg
        else:
            dim = DimProduto(
                id_produto=product_id,
                nome_produto=body.name or gold.nome_produto,
                peso_kg=body.weight_kg,
            )
            self.db.add(dim)

        for act in activities:
            self.db.add(act)

        self.db.commit()
        self.db.refresh(gold)
        if dim:
            self.db.refresh(dim)

        return _to_product_out(
            gold,
            peso_kg=dim.peso_kg if dim else None,
            data_cadastro=dim.data_cadastro_produto if dim else None,
        )

    def get_product_resumo(self, product_id: str) -> ProductResumoOut | None:
        gold = self.db.query(GoldDesempenhoProduto).filter(
            GoldDesempenhoProduto.id_produto == product_id
        ).first()
        if not gold:
            return None

        # ── Mês com maior receita ─────────────────────────────────────────────
        melhor_mes_row = (
            self.db.query(
                GoldPedidoDetalhado.ano_mes,
                func.sum(GoldPedidoDetalhado.receita_bruta).label("receita"),
            )
            .filter(GoldPedidoDetalhado.id_produto == product_id)
            .group_by(GoldPedidoDetalhado.ano_mes)
            .order_by(desc("receita"))
            .first()
        )

        # ── Método de pagamento mais usado ────────────────────────────────────
        metodo_row = (
            self.db.query(
                GoldPedidoDetalhado.metodo_pagamento,
                func.count().label("total"),
            )
            .filter(
                GoldPedidoDetalhado.id_produto == product_id,
                GoldPedidoDetalhado.metodo_pagamento.isnot(None),
            )
            .group_by(GoldPedidoDetalhado.metodo_pagamento)
            .order_by(desc("total"))
            .first()
        )

        return ProductResumoOut(
            receita_total=round(gold.receita_total, 2) if gold.receita_total else None,
            melhor_mes=melhor_mes_row.ano_mes if melhor_mes_row else None,
            metodo_pagamento_favorito=metodo_row.metodo_pagamento if metodo_row else None,
            problema_mais_frequente=gold.tipo_problema_mais_frequente,
        )

    def get_product_activities(self, product_id: str, limit: int = 50) -> list[ProductActivityOut]:
        rows = (
            self.db.query(ProductActivity)
            .filter(ProductActivity.id_produto == product_id)
            .order_by(ProductActivity.changed_at.desc())
            .limit(limit)
            .all()
        )
        return [ProductActivityOut.model_validate(r) for r in rows]

    def delete_product(self, product_id: str) -> bool:
        gold = self.db.query(GoldDesempenhoProduto).filter(
            GoldDesempenhoProduto.id_produto == product_id
        ).first()
        if not gold:
            return False
        dim = self.db.query(DimProduto).filter(DimProduto.id_produto == product_id).first()
        if dim:
            self.db.delete(dim)
        self.db.delete(gold)
        self.db.commit()
        return True
