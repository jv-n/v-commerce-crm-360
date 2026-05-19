"""
test_product_detail.py
----------------------
Testes dos endpoints de detalhe de produto:
  GET /products/{id}/resumo
  GET /products/{id}/orders
  GET /products/{id}/tickets
  GET /products/{id}/monthly-revenue

Cobertura:
  resumo
    - retorna 404 para produto inexistente
    - retorna campos corretos (receita_total, melhor_mes,
      metodo_pagamento_favorito, problema_mais_frequente)
    - melhor_mes e o mes com maior receita_bruta
    - metodo_pagamento_favorito e o mais frequente nos pedidos
    - campos sao None quando nao ha pedidos

  orders
    - retorna lista de pedidos do produto
    - lista vazia para produto sem pedidos
    - pedidos ordenados por data descrescente
    - campos obrigatorios presentes

  tickets
    - retorna lista de tickets associados via id_pedido do produto
    - lista vazia para produto sem pedidos/tickets
    - resolvido = True quando status_atendimento == "Finalizado"
    - resolvido = False caso contrario

  monthly-revenue
    - retorna lista de receita por mes
    - lista vazia para produto sem pedidos
    - receita acumulada por ano_mes
    - ordem cronologica ascendente
"""

import uuid
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.database import Base, get_db
from app.models.productModel import GoldDesempenhoProduto, GoldProdutoDetalhado
from app.models.saleModel import GoldPedidoDetalhado
from app.models.ticketModel import FtTicketSuporte
from app.routes.productRouter import router as product_router
from app.services.productService import ProductService
from app.schemas.productSchemas import ProductCreate

# -- Infraestrutura -----------------------------------------------------------

TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI()
app.include_router(product_router)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSession(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db):
    def override():
        yield db
    app.dependency_overrides[get_db] = override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def svc(db):
    return ProductService(db)


def make_product(db, product_id="PROD-T001", **kwargs):
    gold = GoldDesempenhoProduto(id_produto=product_id, nome_produto="Produto Teste",
                                  ativo="True", estoque_disponivel=10.0, **kwargs)
    dim  = GoldProdutoDetalhado(id_produto=product_id, nome_produto="Produto Teste",
                                 ativo="True", estoque_disponivel=10.0)
    db.add(gold); db.add(dim); db.commit()
    return product_id


def make_order(db, product_id, **kwargs):
    defaults = {
        "id_pedido":        str(uuid.uuid4()),
        "id_cliente":       str(uuid.uuid4()),
        "id_produto":       product_id,
        "nome_produto":     "Produto Teste",
        "status":           "Aprovado",
        "data_pedido":      "2024-06-15",
        "ano_mes":          "2024-06",
        "receita_bruta":    100.0,
        "valor_pedido":     100.0,
        "quantidade":       1.0,
        "metodo_pagamento": "Cartao",
    }
    defaults.update(kwargs)
    o = GoldPedidoDetalhado(**defaults)
    db.add(o); db.commit()
    return o


def make_ticket(db, pedido_id, **kwargs):
    defaults = {
        "ticket_id":            str(uuid.uuid4()),
        "id_pedido":            pedido_id,
        "tipo_problema":        "Entrega",
        "data_abertura":        "2024-06-20",
        "status_atendimento":   "Finalizado",
        "agente_suporte":       "Agente01",
        "nota_avaliacao":       9.0,
    }
    defaults.update(kwargs)
    t = FtTicketSuporte(**defaults)
    db.add(t); db.commit()
    return t


# =============================================================================
# GET /products/{id}/resumo
# =============================================================================

class TestProductResumo:

    def test_404_para_produto_inexistente(self, client):
        resp = client.get("/products/PROD-9999/resumo")
        assert resp.status_code == 404

    def test_retorna_campos_esperados(self, client, db):
        pid = make_product(db, "PROD-R001")
        data = client.get(f"/products/{pid}/resumo").json()
        for campo in ("receita_total", "melhor_mes", "metodo_pagamento_favorito",
                      "problema_mais_frequente"):
            assert campo in data

    def test_campos_none_sem_pedidos(self, client, db):
        pid = make_product(db, "PROD-R002")
        data = client.get(f"/products/{pid}/resumo").json()
        assert data["melhor_mes"] is None
        assert data["metodo_pagamento_favorito"] is None

    def test_melhor_mes_com_maior_receita(self, svc, db):
        pid = make_product(db, "PROD-R003")
        make_order(db, pid, ano_mes="2024-01", receita_bruta=200.0)
        make_order(db, pid, ano_mes="2024-02", receita_bruta=500.0)
        make_order(db, pid, ano_mes="2024-03", receita_bruta=300.0)
        resumo = svc.get_product_resumo(pid)
        assert resumo.melhor_mes == "2024-02"

    def test_metodo_pagamento_favorito(self, svc, db):
        pid = make_product(db, "PROD-R004")
        make_order(db, pid, metodo_pagamento="Pix")
        make_order(db, pid, metodo_pagamento="Pix")
        make_order(db, pid, metodo_pagamento="Cartao")
        resumo = svc.get_product_resumo(pid)
        assert resumo.metodo_pagamento_favorito == "Pix"


# =============================================================================
# GET /products/{id}/orders
# =============================================================================

class TestProductOrders:

    def test_lista_vazia_sem_pedidos(self, client, db):
        pid = make_product(db, "PROD-O001")
        resp = client.get(f"/products/{pid}/orders")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_retorna_pedidos_do_produto(self, client, db):
        pid = make_product(db, "PROD-O002")
        make_order(db, pid)
        make_order(db, pid)
        resp = client.get(f"/products/{pid}/orders")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_nao_retorna_pedidos_de_outro_produto(self, client, db):
        pid_a = make_product(db, "PROD-O003")
        pid_b = make_product(db, "PROD-O004")
        make_order(db, pid_b)
        resp = client.get(f"/products/{pid_a}/orders")
        assert resp.json() == []

    def test_campos_obrigatorios_presentes(self, client, db):
        pid = make_product(db, "PROD-O005")
        make_order(db, pid)
        orders = client.get(f"/products/{pid}/orders").json()
        order = orders[0]
        for campo in ("id_pedido", "id_cliente", "data_pedido", "status",
                      "valor_pedido", "metodo_pagamento", "quantidade"):
            assert campo in order

    def test_pedidos_ordenados_por_data_desc(self, svc, db):
        pid = make_product(db, "PROD-O006")
        make_order(db, pid, data_pedido="2024-01-01")
        make_order(db, pid, data_pedido="2024-06-01")
        make_order(db, pid, data_pedido="2024-03-01")
        orders = svc.get_product_orders(pid)
        datas = [o.data_pedido for o in orders]
        assert datas == sorted(datas, reverse=True)


# =============================================================================
# GET /products/{id}/tickets
# =============================================================================

class TestProductTickets:

    def test_lista_vazia_sem_pedidos(self, client, db):
        pid = make_product(db, "PROD-TK01")
        resp = client.get(f"/products/{pid}/tickets")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_retorna_tickets_do_produto(self, client, db):
        pid = make_product(db, "PROD-TK02")
        order = make_order(db, pid)
        make_ticket(db, order.id_pedido)
        tickets = client.get(f"/products/{pid}/tickets").json()
        assert len(tickets) == 1

    def test_resolvido_true_quando_finalizado(self, svc, db):
        pid = make_product(db, "PROD-TK03")
        order = make_order(db, pid)
        make_ticket(db, order.id_pedido, status_atendimento="Finalizado")
        tickets = svc.get_product_tickets(pid)
        assert tickets[0].resolvido is True

    def test_resolvido_false_quando_nao_finalizado(self, svc, db):
        pid = make_product(db, "PROD-TK04")
        order = make_order(db, pid)
        make_ticket(db, order.id_pedido, status_atendimento="Aguardando")
        tickets = svc.get_product_tickets(pid)
        assert tickets[0].resolvido is False

    def test_campos_obrigatorios_presentes(self, client, db):
        pid = make_product(db, "PROD-TK05")
        order = make_order(db, pid)
        make_ticket(db, order.id_pedido)
        tickets = client.get(f"/products/{pid}/tickets").json()
        ticket = tickets[0]
        for campo in ("ticket_id", "id_pedido", "tipo_problema",
                      "data_abertura", "resolvido"):
            assert campo in ticket

    def test_nao_retorna_tickets_de_outro_produto(self, svc, db):
        pid_a = make_product(db, "PROD-TK06")
        pid_b = make_product(db, "PROD-TK07")
        order_b = make_order(db, pid_b)
        make_ticket(db, order_b.id_pedido)
        tickets = svc.get_product_tickets(pid_a)
        assert tickets == []


# =============================================================================
# GET /products/{id}/monthly-revenue
# =============================================================================

class TestProductMonthlyRevenue:

    def test_lista_vazia_sem_pedidos(self, client, db):
        pid = make_product(db, "PROD-MR01")
        resp = client.get(f"/products/{pid}/monthly-revenue")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_retorna_receita_por_mes(self, client, db):
        pid = make_product(db, "PROD-MR02")
        make_order(db, pid, ano_mes="2024-01", receita_bruta=100.0)
        make_order(db, pid, ano_mes="2024-02", receita_bruta=200.0)
        data = client.get(f"/products/{pid}/monthly-revenue").json()
        assert len(data) == 2

    def test_receita_acumulada_por_mes(self, svc, db):
        pid = make_product(db, "PROD-MR03")
        make_order(db, pid, ano_mes="2024-03", receita_bruta=150.0)
        make_order(db, pid, ano_mes="2024-03", receita_bruta=250.0)
        rows = svc.get_product_monthly_revenue(pid)
        jan = next((r for r in rows if r.ano_mes == "2024-03"), None)
        assert jan is not None
        assert abs(jan.receita - 400.0) < 0.01

    def test_ordem_cronologica_ascendente(self, svc, db):
        pid = make_product(db, "PROD-MR04")
        make_order(db, pid, ano_mes="2024-06", receita_bruta=50.0)
        make_order(db, pid, ano_mes="2024-01", receita_bruta=50.0)
        make_order(db, pid, ano_mes="2024-03", receita_bruta=50.0)
        rows = svc.get_product_monthly_revenue(pid)
        meses = [r.ano_mes for r in rows]
        assert meses == sorted(meses)

    def test_nao_inclui_receita_de_outro_produto(self, svc, db):
        pid_a = make_product(db, "PROD-MR05")
        pid_b = make_product(db, "PROD-MR06")
        make_order(db, pid_b, ano_mes="2024-05", receita_bruta=999.0)
        rows = svc.get_product_monthly_revenue(pid_a)
        assert rows == []

    def test_campos_ano_mes_e_receita_presentes(self, client, db):
        pid = make_product(db, "PROD-MR07")
        make_order(db, pid, ano_mes="2024-04", receita_bruta=75.0)
        data = client.get(f"/products/{pid}/monthly-revenue").json()
        assert "ano_mes" in data[0]
        assert "receita" in data[0]
