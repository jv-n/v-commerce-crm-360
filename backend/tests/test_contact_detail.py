"""
test_contact_detail.py
----------------------
Testes dos endpoints de detalhe de contato:
  GET /contacts/{id}/pedidos
  GET /contacts/{id}/resumo

Cobertura:
  pedidos
    - retorna lista de pedidos do cliente
    - lista vazia quando nao ha pedidos
    - respeita parametro limit (padrao 3, max 10)
    - pedidos ordenados por data decrescente
    - campos esperados presentes
    - nao retorna pedidos de outro cliente

  resumo
    - retorna 404 para contato inexistente
    - retorna campos: categoria_mais_comprada, produto_mais_caro,
      produto_mais_caro_valor, metodo_pagamento_favorito,
      produto_mais_comprado
    - todos os campos None quando nao ha pedidos
    - categoria_mais_comprada e a mais frequente (excluindo Reembolso)
    - produto_mais_caro e o de maior valor_pedido
    - produto_mais_comprado e o de maior quantidade total
    - pedidos com status Reembolso nao sao contados
"""

import uuid
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.database import Base, get_db
from app.models.contactModel import GoldCliente360
from app.models.saleModel import GoldPedidoDetalhado
from app.routes.contactRouter import router as contact_router
from app.services.contactService import ContactService
from app.schemas.contactSchemas import ContactCreate

# -- Infraestrutura -----------------------------------------------------------

TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI()
app.include_router(contact_router)


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
    return ContactService(db)


def make_contact(db, **kwargs):
    cid = str(uuid.uuid4())
    defaults = {
        "id_cliente":    cid,
        "nome_completo": "Cliente Teste",
        "segmento_cliente": "Ativo",
        "total_pedidos": 0,
        "total_produtos_distintos": 0,
        "receita_total": 0.0,
        "ticket_medio":  0.0,
        "total_tickets": 0,
        "taxa_resolucao": 0.0,
    }
    defaults.update(kwargs)
    c = GoldCliente360(**defaults)
    db.add(c); db.commit()
    return c


def make_order(db, client_id, **kwargs):
    defaults = {
        "id_pedido":        str(uuid.uuid4()),
        "id_cliente":       client_id,
        "nome_produto":     "Produto X",
        "status":           "Aprovado",
        "data_pedido":      "2024-06-15",
        "valor_pedido":     150.0,
        "quantidade":       1.0,
        "metodo_pagamento": "Pix",
        "categoria":        "Eletronicos",
        "receita_bruta":    150.0,
    }
    defaults.update(kwargs)
    o = GoldPedidoDetalhado(**defaults)
    db.add(o); db.commit()
    return o


# =============================================================================
# GET /contacts/{id}/pedidos
# =============================================================================

class TestContactPedidos:

    def test_lista_vazia_sem_pedidos(self, client, db):
        c = make_contact(db)
        resp = client.get(f"/contacts/{c.id_cliente}/pedidos")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_retorna_pedidos_do_cliente(self, client, db):
        c = make_contact(db)
        make_order(db, c.id_cliente)
        make_order(db, c.id_cliente)
        pedidos = client.get(f"/contacts/{c.id_cliente}/pedidos").json()
        assert len(pedidos) == 2

    def test_nao_retorna_pedidos_de_outro_cliente(self, client, db):
        c1 = make_contact(db)
        c2 = make_contact(db)
        make_order(db, c2.id_cliente)
        pedidos = client.get(f"/contacts/{c1.id_cliente}/pedidos").json()
        assert pedidos == []

    def test_limit_padrao_e_3(self, svc, db):
        c = make_contact(db)
        for _ in range(5):
            make_order(db, c.id_cliente)
        pedidos = svc.get_last_pedidos(c.id_cliente)
        assert len(pedidos) <= 3

    def test_limit_customizado(self, svc, db):
        c = make_contact(db)
        for _ in range(8):
            make_order(db, c.id_cliente)
        pedidos = svc.get_last_pedidos(c.id_cliente, limit=5)
        assert len(pedidos) <= 5

    def test_pedidos_ordenados_por_data_desc(self, svc, db):
        c = make_contact(db)
        make_order(db, c.id_cliente, data_pedido="2024-01-01")
        make_order(db, c.id_cliente, data_pedido="2024-06-01")
        make_order(db, c.id_cliente, data_pedido="2024-03-01")
        pedidos = svc.get_last_pedidos(c.id_cliente, limit=10)
        datas = [p["data_pedido"] for p in pedidos if p.get("data_pedido")]
        assert datas == sorted(datas, reverse=True)

    def test_campos_presentes(self, client, db):
        c = make_contact(db)
        make_order(db, c.id_cliente, nome_produto="Notebook")
        pedidos = client.get(f"/contacts/{c.id_cliente}/pedidos").json()
        p = pedidos[0]
        for campo in ("id_pedido", "nome_produto", "quantidade",
                      "valor_pedido", "metodo_pagamento", "data_pedido"):
            assert campo in p

    def test_nome_produto_correto(self, client, db):
        c = make_contact(db)
        make_order(db, c.id_cliente, nome_produto="Tablet Pro")
        pedidos = client.get(f"/contacts/{c.id_cliente}/pedidos").json()
        assert pedidos[0]["nome_produto"] == "Tablet Pro"

    def test_limit_via_query_param(self, client, db):
        c = make_contact(db)
        for _ in range(6):
            make_order(db, c.id_cliente)
        pedidos = client.get(f"/contacts/{c.id_cliente}/pedidos?limit=4").json()
        assert len(pedidos) <= 4


# =============================================================================
# GET /contacts/{id}/resumo
# =============================================================================

class TestContactResumo:

    def test_404_para_contato_inexistente(self, client):
        resp = client.get(f"/contacts/{uuid.uuid4()}/resumo")
        assert resp.status_code == 404

    def test_retorna_campos_esperados(self, client, db):
        c = make_contact(db)
        data = client.get(f"/contacts/{c.id_cliente}/resumo").json()
        for campo in ("categoria_mais_comprada", "produto_mais_caro",
                      "produto_mais_caro_valor", "metodo_pagamento_favorito",
                      "produto_mais_comprado"):
            assert campo in data

    def test_campos_none_sem_pedidos(self, client, db):
        c = make_contact(db)
        data = client.get(f"/contacts/{c.id_cliente}/resumo").json()
        assert data["categoria_mais_comprada"] is None
        assert data["produto_mais_caro"] is None
        assert data["produto_mais_comprado"] is None

    def test_categoria_mais_comprada(self, svc, db):
        c = make_contact(db)
        make_order(db, c.id_cliente, categoria="Eletronicos")
        make_order(db, c.id_cliente, categoria="Eletronicos")
        make_order(db, c.id_cliente, categoria="Livros")
        resumo = svc.get_contact_resumo(c.id_cliente)
        assert resumo.categoria_mais_comprada == "Eletronicos"

    def test_produto_mais_caro(self, svc, db):
        c = make_contact(db)
        make_order(db, c.id_cliente, nome_produto="Notebook", valor_pedido=3000.0)
        make_order(db, c.id_cliente, nome_produto="Mouse",    valor_pedido=50.0)
        resumo = svc.get_contact_resumo(c.id_cliente)
        assert resumo.produto_mais_caro == "Notebook"
        assert resumo.produto_mais_caro_valor == 3000.0

    def test_produto_mais_comprado_por_quantidade(self, svc, db):
        c = make_contact(db)
        make_order(db, c.id_cliente, nome_produto="Caneta", quantidade=10.0)
        make_order(db, c.id_cliente, nome_produto="Caneta", quantidade=5.0)
        make_order(db, c.id_cliente, nome_produto="Caderno", quantidade=3.0)
        resumo = svc.get_contact_resumo(c.id_cliente)
        assert resumo.produto_mais_comprado == "Caneta"

    def test_reembolso_nao_conta_na_categoria(self, svc, db):
        c = make_contact(db)
        make_order(db, c.id_cliente, categoria="Reembolsado", status="Reembolso")
        make_order(db, c.id_cliente, categoria="Games",       status="Aprovado")
        resumo = svc.get_contact_resumo(c.id_cliente)
        assert resumo.categoria_mais_comprada == "Games"

    def test_reembolso_nao_conta_no_produto_mais_caro(self, svc, db):
        c = make_contact(db)
        make_order(db, c.id_cliente, nome_produto="Caro Reembolsado",
                   valor_pedido=9999.0, status="Reembolso")
        make_order(db, c.id_cliente, nome_produto="Barato Aprovado",
                   valor_pedido=200.0, status="Aprovado")
        resumo = svc.get_contact_resumo(c.id_cliente)
        assert resumo.produto_mais_caro == "Barato Aprovado"
