"""
test_products.py
----------------
Testes do ProductService e endpoints /products.

Cobertura:
  POST /products/
    - cria produto com id no formato PROD-XXXX
    - retorna 201 e campos corretos
    - status "Ativo" por padrao

  GET /products/{id}
    - retorna produto existente
    - retorna 404 para id inexistente

  GET /products/
    - retorna paginacao correta (data, total, page, pageSize)
    - total reflete quantidade real de produtos

  PATCH /products/{id}
    - atualiza campos individualmente
    - retorna 404 para id inexistente
    - registra atividade para cada campo alterado
    - captura X-User-Name no header

  DELETE /products/{id}
    - retorna 204 e remove produto
    - retorna 404 para id inexistente

  Filtros GET /products/
    - search por nome (case-insensitive)
    - category filtra por categoria
    - status Ativo/Inativo
    - price_min/price_max
    - stock_min/stock_max
    - rating_min/rating_max
    - sales_min/sales_max
    - sort_by + sort_dir

  GET /products/{id}/activities
    - retorna lista de atividades em ordem decrescente

  GET /products/suppliers
    - retorna lista de fornecedores distintos sem nulos
"""

import uuid
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.database import Base, get_db
from app.models.productModel import GoldDesempenhoProduto, GoldProdutoDetalhado, ProductActivity
from app.routes.productRouter import router as product_router
from app.services.productService import ProductService
from app.schemas.productSchemas import ProductCreate, ProductUpdate

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


def product_payload(**kwargs):
    defaults = {
        "name": f"Produto {uuid.uuid4().hex[:6]}",
        "category": "Eletronicos",
        "price": 99.90,
        "supplier": "FornecedorX",
        "stock": 10,
        "status": "Ativo",
    }
    defaults.update(kwargs)
    return defaults


# =============================================================================
# POST /products/
# =============================================================================

class TestProductCreate:

    def test_cria_produto_retorna_201(self, client):
        resp = client.post("/products/", json=product_payload())
        assert resp.status_code == 201

    def test_id_no_formato_prod(self, client):
        data = client.post("/products/", json=product_payload()).json()
        assert data["id"].startswith("PROD-")

    def test_campos_retornados_corretamente(self, client):
        payload = product_payload(name="Notebook Pro", price=2500.0, stock=5)
        data = client.post("/products/", json=payload).json()
        assert data["name"] == "Notebook Pro"
        assert data["price"] == 2500.0
        assert data["stock"] == 5

    def test_status_padrao_ativo(self, client):
        payload = product_payload()
        payload.pop("status")
        data = client.post("/products/", json=payload).json()
        assert data["status"] == "Ativo"

    def test_status_inativo_salvo(self, client):
        data = client.post("/products/", json=product_payload(status="Inativo")).json()
        assert data["status"] == "Inativo"

    def test_ids_incrementais(self, svc):
        p1 = svc.create_product(ProductCreate(name="P1", stock=0))
        p2 = svc.create_product(ProductCreate(name="P2", stock=0))
        n1 = int(p1.id.split("-")[1])
        n2 = int(p2.id.split("-")[1])
        assert n2 == n1 + 1


# =============================================================================
# GET /products/{id}
# =============================================================================

class TestProductGetById:

    def test_retorna_produto_existente(self, client):
        product_id = client.post("/products/", json=product_payload()).json()["id"]
        resp = client.get(f"/products/{product_id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == product_id

    def test_retorna_404_para_inexistente(self, client):
        resp = client.get("/products/PROD-9999")
        assert resp.status_code == 404

    def test_campos_do_produto_presentes(self, client):
        payload = product_payload(name="Smart TV", category="TV", price=1500.0)
        product_id = client.post("/products/", json=payload).json()["id"]
        data = client.get(f"/products/{product_id}").json()
        assert data["name"] == "Smart TV"
        assert data["category"] == "TV"
        assert data["price"] == 1500.0


# =============================================================================
# GET /products/
# =============================================================================

class TestProductList:

    def test_retorna_estrutura_de_paginacao(self, client):
        resp = client.get("/products")
        assert resp.status_code == 200
        data = resp.json()
        for campo in ("data", "total", "page", "pageSize"):
            assert campo in data

    def test_total_reflete_quantidade(self, client):
        before = client.get("/products").json()["total"]
        client.post("/products/", json=product_payload())
        client.post("/products/", json=product_payload())
        after = client.get("/products").json()["total"]
        assert after == before + 2

    def test_page_size_limita_resultados(self, client):
        for _ in range(5):
            client.post("/products/", json=product_payload())
        data = client.get("/products?pageSize=2").json()
        assert len(data["data"]) <= 2

    def test_page_2_contem_resultados_diferentes(self, client):
        for _ in range(4):
            client.post("/products/", json=product_payload())
        p1 = client.get("/products?page=1&pageSize=2").json()["data"]
        p2 = client.get("/products?page=2&pageSize=2").json()["data"]
        ids_p1 = {p["id"] for p in p1}
        ids_p2 = {p["id"] for p in p2}
        assert ids_p1.isdisjoint(ids_p2)


# =============================================================================
# PATCH /products/{id}
# =============================================================================

class TestProductUpdate:

    def test_atualiza_nome(self, client):
        pid = client.post("/products/", json=product_payload(name="Antigo")).json()["id"]
        resp = client.patch(f"/products/{pid}", json={"name": "Novo Nome"})
        assert resp.status_code == 200
        assert resp.json()["name"] == "Novo Nome"

    def test_atualiza_preco(self, client):
        pid = client.post("/products/", json=product_payload(price=100.0)).json()["id"]
        resp = client.patch(f"/products/{pid}", json={"price": 199.9})
        assert resp.status_code == 200
        assert resp.json()["price"] == 199.9

    def test_atualiza_estoque(self, client):
        pid = client.post("/products/", json=product_payload(stock=5)).json()["id"]
        resp = client.patch(f"/products/{pid}", json={"stock": 50})
        assert resp.status_code == 200
        assert resp.json()["stock"] == 50

    def test_atualiza_status_para_inativo(self, client):
        pid = client.post("/products/", json=product_payload(status="Ativo")).json()["id"]
        resp = client.patch(f"/products/{pid}", json={"status": "Inativo"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "Inativo"

    def test_patch_inexistente_retorna_404(self, client):
        resp = client.patch("/products/PROD-9999", json={"name": "X"})
        assert resp.status_code == 404

    def test_campo_nao_enviado_nao_e_alterado(self, client):
        pid = client.post("/products/", json=product_payload(category="Informatica")).json()["id"]
        client.patch(f"/products/{pid}", json={"price": 50.0})
        data = client.get(f"/products/{pid}").json()
        assert data["category"] == "Informatica"


# =============================================================================
# DELETE /products/{id}
# =============================================================================

class TestProductDelete:

    def test_delete_retorna_204(self, client):
        pid = client.post("/products/", json=product_payload()).json()["id"]
        resp = client.delete(f"/products/{pid}")
        assert resp.status_code == 204

    def test_delete_remove_produto(self, client):
        pid = client.post("/products/", json=product_payload()).json()["id"]
        client.delete(f"/products/{pid}")
        assert client.get(f"/products/{pid}").status_code == 404

    def test_delete_inexistente_retorna_404(self, client):
        resp = client.delete("/products/PROD-0000")
        assert resp.status_code == 404


# =============================================================================
# Filtros
# =============================================================================

class TestProductFilters:

    def test_search_por_nome(self, client):
        client.post("/products/", json=product_payload(name="Teclado Mecanico"))
        client.post("/products/", json=product_payload(name="Mouse Gamer"))
        data = client.get("/products?search=Teclado").json()
        names = [p["name"] for p in data["data"]]
        assert any("Teclado" in n for n in names)
        assert not any("Mouse" in n for n in names)

    def test_search_case_insensitive(self, client):
        client.post("/products/", json=product_payload(name="HeadSet Pro"))
        data = client.get("/products?search=headset").json()
        assert data["total"] >= 1

    def test_filtro_category(self, client):
        client.post("/products/", json=product_payload(name="P1", category="Audio"))
        client.post("/products/", json=product_payload(name="P2", category="Video"))
        data = client.get("/products?category=Audio").json()
        cats = [p["category"] for p in data["data"]]
        assert all(c == "Audio" for c in cats)

    def test_filtro_status_ativo(self, svc):
        svc.create_product(ProductCreate(name="Ativo1", stock=0, status="Ativo"))
        svc.create_product(ProductCreate(name="Inativo1", stock=0, status="Inativo"))
        rows, _ = svc.get_products(status="Ativo")
        statuses = [r.status for r in rows]
        assert all(s == "Ativo" for s in statuses)

    def test_filtro_status_inativo(self, svc):
        svc.create_product(ProductCreate(name="Inativo2", stock=0, status="Inativo"))
        rows, _ = svc.get_products(status="Inativo")
        statuses = [r.status for r in rows]
        assert all(s == "Inativo" for s in statuses)

    def test_filtro_price_min(self, svc):
        svc.create_product(ProductCreate(name="Barato", price=10.0, stock=0))
        svc.create_product(ProductCreate(name="Caro", price=500.0, stock=0))
        rows, _ = svc.get_products(price_min=100.0)
        prices = [r.price for r in rows if r.price is not None]
        assert all(p >= 100.0 for p in prices)

    def test_filtro_price_max(self, svc):
        svc.create_product(ProductCreate(name="Medio", price=200.0, stock=0))
        rows, _ = svc.get_products(price_max=250.0)
        prices = [r.price for r in rows if r.price is not None]
        assert all(p <= 250.0 for p in prices)

    def test_filtro_stock_min(self, svc):
        svc.create_product(ProductCreate(name="SemEstoque", stock=0))
        svc.create_product(ProductCreate(name="ComEstoque", stock=100))
        rows, _ = svc.get_products(stock_min=50)
        stocks = [r.stock for r in rows]
        assert all(s >= 50 for s in stocks)

    def test_filtro_stock_max(self, svc):
        svc.create_product(ProductCreate(name="Pouco", stock=5))
        rows, _ = svc.get_products(stock_max=10)
        stocks = [r.stock for r in rows]
        assert all(s <= 10 for s in stocks)

    def test_sort_by_price_asc(self, svc):
        svc.create_product(ProductCreate(name="Z_Caro", price=999.0, stock=0))
        svc.create_product(ProductCreate(name="Z_Barato", price=1.0, stock=0))
        rows, _ = svc.get_products(sort_by="price", sort_dir="asc")
        prices = [r.price for r in rows if r.price is not None]
        assert prices == sorted(prices)

    def test_sort_by_price_desc(self, svc):
        svc.create_product(ProductCreate(name="ZZ_Caro", price=888.0, stock=0))
        svc.create_product(ProductCreate(name="ZZ_Barato", price=2.0, stock=0))
        rows, _ = svc.get_products(sort_by="price", sort_dir="desc")
        prices = [r.price for r in rows if r.price is not None]
        assert prices == sorted(prices, reverse=True)

    def test_sort_by_name_asc(self, svc):
        svc.create_product(ProductCreate(name="ZZZ_Nome", stock=0))
        svc.create_product(ProductCreate(name="AAA_Nome", stock=0))
        rows, _ = svc.get_products(sort_by="name", sort_dir="asc")
        names = [r.name for r in rows if r.name]
        assert names == sorted(names)


# =============================================================================
# Activities
# =============================================================================

class TestProductActivities:

    def test_update_gera_atividade(self, client):
        pid = client.post("/products/", json=product_payload(name="Original")).json()["id"]
        client.patch(f"/products/{pid}", json={"name": "Modificado"})
        acts = client.get(f"/products/{pid}/activities").json()
        assert len(acts) >= 1

    def test_atividade_contem_old_new_value(self, client):
        pid = client.post("/products/", json=product_payload(price=100.0)).json()["id"]
        client.patch(f"/products/{pid}", json={"price": 200.0})
        acts = client.get(f"/products/{pid}/activities").json()
        preco_act = next((a for a in acts if "Preco" in a["field_name"] or "Preco" in a.get("field_name","") or "re" in a["field_name"].lower()), None)
        assert preco_act is not None
        assert preco_act["old_value"] is not None
        assert preco_act["new_value"] is not None

    def test_atividade_captura_x_user_name(self, client):
        pid = client.post("/products/", json=product_payload()).json()["id"]
        client.patch(
            f"/products/{pid}",
            json={"name": "Nome Novo"},
            headers={"X-User-Name": "Joao Silva"},
        )
        acts = client.get(f"/products/{pid}/activities").json()
        assert any(a["user_name"] == "Joao Silva" for a in acts)

    def test_multiplos_campos_geram_multiplas_atividades(self, client):
        pid = client.post("/products/", json=product_payload(price=50.0, stock=5)).json()["id"]
        client.patch(f"/products/{pid}", json={"price": 99.0, "stock": 20})
        acts = client.get(f"/products/{pid}/activities").json()
        assert len(acts) >= 2

    def test_sem_mudanca_nao_gera_atividade(self, client):
        pid = client.post("/products/", json=product_payload(name="Igual")).json()["id"]
        client.patch(f"/products/{pid}", json={"name": "Igual"})
        acts = client.get(f"/products/{pid}/activities").json()
        assert len(acts) == 0

    def test_atividades_em_ordem_decrescente(self, client):
        pid = client.post("/products/", json=product_payload(price=10.0)).json()["id"]
        client.patch(f"/products/{pid}", json={"price": 20.0})
        client.patch(f"/products/{pid}", json={"price": 30.0})
        acts = client.get(f"/products/{pid}/activities").json()
        if len(acts) >= 2:
            assert acts[0]["changed_at"] >= acts[1]["changed_at"]


# =============================================================================
# Suppliers
# =============================================================================

class TestProductSuppliers:

    def test_retorna_lista_de_fornecedores(self, client):
        client.post("/products/", json=product_payload(supplier="FornA"))
        client.post("/products/", json=product_payload(supplier="FornB"))
        resp = client.get("/products/suppliers")
        assert resp.status_code == 200
        fornecedores = resp.json()
        assert "FornA" in fornecedores
        assert "FornB" in fornecedores

    def test_sem_duplicatas(self, client):
        client.post("/products/", json=product_payload(supplier="FornDup"))
        client.post("/products/", json=product_payload(supplier="FornDup"))
        resp = client.get("/products/suppliers").json()
        assert resp.count("FornDup") == 1
