"""
test_reviews.py
---------------
Testes do ReviewService e endpoint GET /reviews.

Cobertura:
  GET /reviews
    - retorna estrutura paginada (data, total, page, pageSize)
    - lista vazia quando nao ha avaliacoes

  Filtros
    - product_id filtra por produto
    - categoria_nps filtra por Promotor / Neutro / Detrator
    - rating_min filtra nota_produto >= min
    - rating_max filtra nota_produto <= max
    - combinacao de filtros

  Ordenacao
    - sort_by=data desc (padrao)
    - sort_by=nota_produto asc
    - sort_by=nota_nps desc

  Paginacao
    - pageSize limita resultados
    - page 2 retorna itens diferentes da page 1
    - total nao muda com paginacao

  Mapeamento de campos
    - recomenda "True" -> True (bool)
    - recomenda "False" -> False (bool)
    - recomenda None -> None
    - todos os campos do ReviewSchema presentes
"""

import uuid
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.database import Base, get_db
from app.models.reviewModel import GoldAvaliacao360
from app.routes.reviewRouter import router as review_router
from app.services.reviewService import ReviewService

# -- Infraestrutura -----------------------------------------------------------

TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI()
app.include_router(review_router)


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
    return ReviewService(db)


def make_review(db, **kwargs):
    defaults = {
        "id_avaliacao": str(uuid.uuid4()),
        "id_pedido":    str(uuid.uuid4()),
        "id_cliente":   str(uuid.uuid4()),
        "id_produto":   "PROD-0001",
        "nota_produto": 8.0,
        "nota_nps":     7.0,
        "categoria_nps": "Promotor",
        "recomenda":    "True",
        "data_avaliacao": "2024-06-15",
    }
    defaults.update(kwargs)
    r = GoldAvaliacao360(**defaults)
    db.add(r)
    db.commit()
    return r


# =============================================================================
# Estrutura basica
# =============================================================================

class TestReviewsBasic:

    def test_retorna_estrutura_paginada(self, client):
        resp = client.get("/reviews")
        assert resp.status_code == 200
        data = resp.json()
        for campo in ("data", "total", "page", "pageSize"):
            assert campo in data

    def test_lista_vazia_sem_dados(self, client):
        data = client.get("/reviews").json()
        assert data["data"] == []
        assert data["total"] == 0

    def test_total_incrementa_com_novas_avaliacoes(self, client, db):
        make_review(db)
        make_review(db)
        data = client.get("/reviews").json()
        assert data["total"] == 2

    def test_campos_do_review_presentes(self, client, db):
        make_review(db, nota_produto=9.0, comentario="Otimo produto")
        data = client.get("/reviews").json()
        review = data["data"][0]
        for campo in ("id", "id_produto", "nota_produto", "nota_nps",
                      "categoria_nps", "recomenda", "data_avaliacao"):
            assert campo in review


# =============================================================================
# Filtros
# =============================================================================

class TestReviewFilters:

    def test_filtro_product_id(self, client, db):
        make_review(db, id_produto="PROD-AAA")
        make_review(db, id_produto="PROD-BBB")
        data = client.get("/reviews?product_id=PROD-AAA").json()
        prods = [r["id_produto"] for r in data["data"]]
        assert all(p == "PROD-AAA" for p in prods)
        assert "PROD-BBB" not in prods

    def test_filtro_categoria_nps_promotor(self, client, db):
        make_review(db, categoria_nps="Promotor")
        make_review(db, categoria_nps="Detrator")
        data = client.get("/reviews?categoria_nps=Promotor").json()
        cats = [r["categoria_nps"] for r in data["data"]]
        assert all(c == "Promotor" for c in cats)

    def test_filtro_categoria_nps_detrator(self, client, db):
        make_review(db, categoria_nps="Detrator", nota_nps=3.0)
        data = client.get("/reviews?categoria_nps=Detrator").json()
        assert data["total"] >= 1
        assert all(r["categoria_nps"] == "Detrator" for r in data["data"])

    def test_filtro_rating_min(self, client, db):
        make_review(db, nota_produto=3.0)
        make_review(db, nota_produto=9.0)
        data = client.get("/reviews?rating_min=7.0").json()
        notas = [r["nota_produto"] for r in data["data"]]
        assert all(n >= 7.0 for n in notas)

    def test_filtro_rating_max(self, client, db):
        make_review(db, nota_produto=2.0)
        make_review(db, nota_produto=8.0)
        data = client.get("/reviews?rating_max=5.0").json()
        notas = [r["nota_produto"] for r in data["data"]]
        assert all(n <= 5.0 for n in notas)

    def test_filtros_combinados(self, client, db):
        make_review(db, id_produto="PROD-C1", nota_produto=9.5, categoria_nps="Promotor")
        make_review(db, id_produto="PROD-C1", nota_produto=4.0, categoria_nps="Detrator")
        make_review(db, id_produto="PROD-C2", nota_produto=9.0, categoria_nps="Promotor")
        data = client.get("/reviews?product_id=PROD-C1&categoria_nps=Promotor").json()
        assert data["total"] == 1
        assert data["data"][0]["id_produto"] == "PROD-C1"
        assert data["data"][0]["categoria_nps"] == "Promotor"

    def test_product_id_inexistente_retorna_zero(self, client):
        data = client.get("/reviews?product_id=PROD-XXXX").json()
        assert data["total"] == 0
        assert data["data"] == []


# =============================================================================
# Ordenacao
# =============================================================================

class TestReviewSorting:

    def test_sort_data_desc_padrao(self, client, db):
        make_review(db, data_avaliacao="2024-01-01")
        make_review(db, data_avaliacao="2024-06-01")
        make_review(db, data_avaliacao="2024-12-01")
        data = client.get("/reviews?sort_by=data&sort_dir=desc").json()["data"]
        datas = [r["data_avaliacao"] for r in data if r["data_avaliacao"]]
        assert datas == sorted(datas, reverse=True)

    def test_sort_data_asc(self, client, db):
        make_review(db, data_avaliacao="2023-01-01")
        make_review(db, data_avaliacao="2023-06-01")
        data = client.get("/reviews?sort_by=data&sort_dir=asc").json()["data"]
        datas = [r["data_avaliacao"] for r in data if r["data_avaliacao"]]
        assert datas == sorted(datas)

    def test_sort_nota_produto_asc(self, svc, db):
        make_review(db, nota_produto=9.0)
        make_review(db, nota_produto=3.0)
        make_review(db, nota_produto=6.0)
        rows, _ = svc.get_reviews(sort_by="nota_produto", sort_dir="asc")
        notas = [r.nota_produto for r in rows if r.nota_produto is not None]
        assert notas == sorted(notas)

    def test_sort_nota_nps_desc(self, svc, db):
        make_review(db, nota_nps=9.0)
        make_review(db, nota_nps=4.0)
        rows, _ = svc.get_reviews(sort_by="nota_nps", sort_dir="desc")
        notas = [r.nota_nps for r in rows if r.nota_nps is not None]
        assert notas == sorted(notas, reverse=True)


# =============================================================================
# Paginacao
# =============================================================================

class TestReviewPagination:

    def test_page_size_limita_resultados(self, client, db):
        for _ in range(5):
            make_review(db)
        data = client.get("/reviews?pageSize=2").json()
        assert len(data["data"]) <= 2

    def test_total_nao_muda_com_paginacao(self, client, db):
        for _ in range(6):
            make_review(db)
        total_p1 = client.get("/reviews?page=1&pageSize=3").json()["total"]
        total_p2 = client.get("/reviews?page=2&pageSize=3").json()["total"]
        assert total_p1 == total_p2

    def test_page_2_retorna_itens_diferentes(self, client, db):
        for _ in range(4):
            make_review(db)
        p1 = client.get("/reviews?page=1&pageSize=2").json()["data"]
        p2 = client.get("/reviews?page=2&pageSize=2").json()["data"]
        ids_p1 = {r["id"] for r in p1}
        ids_p2 = {r["id"] for r in p2}
        assert ids_p1.isdisjoint(ids_p2)

    def test_page_alem_do_limite_retorna_vazio(self, client, db):
        make_review(db)
        data = client.get("/reviews?page=999&pageSize=10").json()
        assert data["data"] == []


# =============================================================================
# Mapeamento de campos
# =============================================================================

class TestReviewFieldMapping:

    def test_recomenda_true_vira_bool_true(self, svc, db):
        make_review(db, recomenda="True")
        rows, _ = svc.get_reviews()
        assert rows[0].recomenda is True

    def test_recomenda_false_vira_bool_false(self, svc, db):
        make_review(db, recomenda="False")
        rows, _ = svc.get_reviews()
        assert rows[0].recomenda is False

    def test_recomenda_none_vira_none(self, svc, db):
        make_review(db, recomenda=None)
        rows, _ = svc.get_reviews()
        assert rows[0].recomenda is None

    def test_campos_nulos_permitidos(self, client, db):
        make_review(db, comentario=None, nota_produto=None, nota_nps=None)
        data = client.get("/reviews").json()
        review = data["data"][0]
        assert review["comentario"] is None
        assert review["nota_produto"] is None
        assert review["nota_nps"] is None
