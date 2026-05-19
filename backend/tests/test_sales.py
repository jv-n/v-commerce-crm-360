"""
test_sales.py
-------------
Testes do SaleService e endpoint /sales do V-Commerce CRM 360.

Cobertura:
  CRUD basico via endpoint
    - GET /sales/         lista vendas com paginacao
    - GET /sales/{id}     busca venda existente
    - GET /sales/{id}     404 para id inexistente
    - POST /sales/        cria nova venda
    - POST /sales/        409 para pedido duplicado
    - PATCH /sales/{id}   atualiza campos de uma venda
    - PATCH /sales/{id}   404 para id inexistente
    - DELETE /sales/{id}  deleta venda existente
    - DELETE /sales/{id}  404 para id inexistente

  Filtros do _base_query
    - Filtro por tab (concluded / returned)
    - Filtro por status exato
    - Filtro por metodo_pagamento
    - Filtro por categoria
    - Filtro por ano_mes
    - Filtro por data_from e data_to
    - Filtro por data_from e data_to combinados
    - Busca por nome do cliente (search + search_field=client)
    - Busca por nome do produto (search + search_field=product)
    - Busca geral (search_field=all)

  Paginacao
    - page e pageSize controlam o slice retornado
    - campo total reflete o total sem paginacao
    - page alem do total retorna lista vazia

  Rastreamento de atividades (update)
    - alterar status gera SaleActivity com old/new corretos
    - alterar valor_pedido gera SaleActivity com formatacao R$
    - alterar quantidade gera SaleActivity com valor inteiro
    - campo nao alterado nao gera SaleActivity
    - multiplos campos alterados geram multiplas atividades
    - GET /sales/{id}/activities retorna atividades em ordem desc

  SaleService direto (unit)
    - get_sale levanta 404 para id desconhecido
    - create_sale levanta 409 para id duplicado
    - delete_sale levanta 404 para id desconhecido
"""

import uuid
import pytest
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.database import Base, get_db
from app.models.saleModel import GoldPedidoDetalhado, SaleActivity
from app.models.userModel import User
from app.routes.saleRouter import router as sale_router
from app.services.saleService import SaleService
from app.schemas.salesSchemas import SaleCreate, SaleUpdate


# ── Infraestrutura de teste ───────────────────────────────────────────────────

TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI()
app.include_router(sale_router)


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
    def override_get_db():
        yield db
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def service(db):
    return SaleService(db)


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_sale(db, **kwargs) -> GoldPedidoDetalhado:
    """Insere uma venda diretamente no banco e retorna o objeto."""
    defaults = {
        "id_pedido": str(uuid.uuid4()),
        "nome_cliente": "Cliente Teste",
        "nome_produto": "Produto Teste",
        "categoria": "Eletronicos",
        "status": "Aprovado",
        "metodo_pagamento": "Cartao",
        "data_pedido": "2024-03-15",
        "ano_mes": "2024-03",
        "quantidade": 2.0,
        "valor_pedido": 199.90,
    }
    defaults.update(kwargs)
    sale = GoldPedidoDetalhado(**defaults)
    db.add(sale)
    db.commit()
    db.refresh(sale)
    return sale


# ══════════════════════════════════════════════════════════════════════════════
# CRUD via endpoint
# ══════════════════════════════════════════════════════════════════════════════

class TestSaleEndpointCRUD:

    def test_get_sales_retorna_200(self, client, db):
        make_sale(db)
        resp = client.get("/sales/")
        assert resp.status_code == 200

    def test_get_sales_retorna_estrutura_paginada(self, client, db):
        make_sale(db)
        data = client.get("/sales/").json()
        assert "data" in data
        assert "total" in data
        assert "page" in data
        assert "pageSize" in data

    def test_get_sale_por_id_retorna_200(self, client, db):
        sale = make_sale(db)
        resp = client.get(f"/sales/{sale.id_pedido}")
        assert resp.status_code == 200
        assert resp.json()["id_pedido"] == sale.id_pedido

    def test_get_sale_inexistente_retorna_404(self, client):
        resp = client.get("/sales/id-que-nao-existe")
        assert resp.status_code == 404

    def test_post_sale_cria_com_201(self, client):
        payload = {"id_pedido": str(uuid.uuid4()), "status": "Aprovado", "valor_pedido": 50.0}
        resp = client.post("/sales/", json=payload)
        assert resp.status_code == 201
        assert resp.json()["id_pedido"] == payload["id_pedido"]

    def test_post_sale_duplicado_retorna_409(self, client, db):
        sale = make_sale(db)
        payload = {"id_pedido": sale.id_pedido}
        resp = client.post("/sales/", json=payload)
        assert resp.status_code == 409

    def test_patch_sale_atualiza_campo(self, client, db):
        sale = make_sale(db, status="Pendente")
        resp = client.patch(f"/sales/{sale.id_pedido}", json={"status": "Aprovado"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "Aprovado"

    def test_patch_sale_inexistente_retorna_404(self, client):
        resp = client.patch("/sales/nao-existe", json={"status": "Aprovado"})
        assert resp.status_code == 404

    def test_delete_sale_retorna_204(self, client, db):
        sale = make_sale(db)
        resp = client.delete(f"/sales/{sale.id_pedido}")
        assert resp.status_code == 204

    def test_delete_sale_remove_do_banco(self, client, db):
        sale = make_sale(db)
        client.delete(f"/sales/{sale.id_pedido}")
        resp = client.get(f"/sales/{sale.id_pedido}")
        assert resp.status_code == 404

    def test_delete_sale_inexistente_retorna_404(self, client):
        resp = client.delete("/sales/nao-existe")
        assert resp.status_code == 404


# ══════════════════════════════════════════════════════════════════════════════
# Filtros
# ══════════════════════════════════════════════════════════════════════════════

class TestSaleFilters:

    def test_filtro_tab_concluded_retorna_aprovados(self, client, db):
        make_sale(db, status="Aprovado")
        make_sale(db, status="Pendente")
        data = client.get("/sales/?tab=concluded").json()
        assert all(s["status"] == "Aprovado" for s in data["data"])

    def test_filtro_tab_returned_retorna_reembolsados_e_recusados(self, client, db):
        make_sale(db, status="Reembolsado")
        make_sale(db, status="Recusado")
        make_sale(db, status="Aprovado")
        data = client.get("/sales/?tab=returned").json()
        statuses = {s["status"] for s in data["data"]}
        assert statuses <= {"Reembolsado", "Recusado"}
        assert "Aprovado" not in statuses

    def test_filtro_status_exato(self, client, db):
        make_sale(db, status="Pendente")
        make_sale(db, status="Aprovado")
        data = client.get("/sales/?status=Pendente").json()
        assert all(s["status"] == "Pendente" for s in data["data"])

    def test_filtro_metodo_pagamento(self, client, db):
        make_sale(db, metodo_pagamento="Pix")
        make_sale(db, metodo_pagamento="Cartao")
        data = client.get("/sales/?metodo_pagamento=Pix").json()
        assert all(s["metodo_pagamento"] == "Pix" for s in data["data"])

    def test_filtro_categoria(self, client, db):
        make_sale(db, categoria="Livros")
        make_sale(db, categoria="Games")
        data = client.get("/sales/?categoria=Livros").json()
        assert all(s["categoria"] == "Livros" for s in data["data"])

    def test_filtro_ano_mes(self, client, db):
        make_sale(db, ano_mes="2024-01")
        make_sale(db, ano_mes="2024-06")
        data = client.get("/sales/?ano_mes=2024-01").json()
        assert all(s["ano_mes"] == "2024-01" for s in data["data"])

    def test_filtro_data_from(self, client, db):
        make_sale(db, data_pedido="2024-01-10")
        make_sale(db, data_pedido="2024-06-20")
        data = client.get("/sales/?data_from=2024-06-01").json()
        assert all(s["data_pedido"] >= "2024-06-01" for s in data["data"])

    def test_filtro_data_to(self, client, db):
        make_sale(db, data_pedido="2024-01-10")
        make_sale(db, data_pedido="2024-06-20")
        data = client.get("/sales/?data_to=2024-03-01").json()
        assert all(s["data_pedido"] <= "2024-03-01" for s in data["data"])

    def test_filtro_data_from_e_to_combinados(self, client, db):
        make_sale(db, data_pedido="2024-01-01")
        make_sale(db, data_pedido="2024-05-15")
        make_sale(db, data_pedido="2024-12-31")
        data = client.get("/sales/?data_from=2024-04-01&data_to=2024-06-30").json()
        for s in data["data"]:
            assert "2024-04-01" <= s["data_pedido"] <= "2024-06-30"

    def test_busca_por_nome_cliente(self, client, db):
        make_sale(db, nome_cliente="Ana Silva")
        make_sale(db, nome_cliente="Bruno Costa")
        data = client.get("/sales/?search=Ana&search_field=client").json()
        assert all("Ana" in (s["nome_cliente"] or "") for s in data["data"])

    def test_busca_por_nome_produto(self, client, db):
        make_sale(db, nome_produto="Notebook Gamer")
        make_sale(db, nome_produto="Mouse Comum")
        data = client.get("/sales/?search=Notebook&search_field=product").json()
        assert all("Notebook" in (s["nome_produto"] or "") for s in data["data"])

    def test_busca_geral_retorna_matches_de_cliente_e_produto(self, client, db):
        make_sale(db, nome_cliente="Carla Buscavel", nome_produto="Item X")
        make_sale(db, nome_cliente="Outro Nome", nome_produto="Produto Buscavel")
        make_sale(db, nome_cliente="Sem Match", nome_produto="Sem Match Produto")
        data = client.get("/sales/?search=Buscavel&search_field=all").json()
        ids_retornados = {s["nome_cliente"] for s in data["data"]}
        assert "Carla Buscavel" in ids_retornados or any("Buscavel" in (s["nome_produto"] or "") for s in data["data"])


# ══════════════════════════════════════════════════════════════════════════════
# Paginacao
# ══════════════════════════════════════════════════════════════════════════════

class TestSalePagination:

    def test_pagesize_limita_resultados(self, client, db):
        for _ in range(5):
            make_sale(db)
        data = client.get("/sales/?pageSize=2").json()
        assert len(data["data"]) == 2

    def test_total_reflete_contagem_sem_paginacao(self, client, db):
        n = 4
        for _ in range(n):
            make_sale(db)
        data = client.get("/sales/?pageSize=1").json()
        assert data["total"] >= n

    def test_page_2_retorna_itens_diferentes_da_page_1(self, client, db):
        for _ in range(4):
            make_sale(db)
        page1 = {s["id_pedido"] for s in client.get("/sales/?pageSize=2&page=1").json()["data"]}
        page2 = {s["id_pedido"] for s in client.get("/sales/?pageSize=2&page=2").json()["data"]}
        assert page1.isdisjoint(page2)

    def test_page_alem_do_total_retorna_lista_vazia(self, client, db):
        make_sale(db)
        data = client.get("/sales/?pageSize=100&page=9999").json()
        assert data["data"] == []


# ══════════════════════════════════════════════════════════════════════════════
# Rastreamento de atividades
# ══════════════════════════════════════════════════════════════════════════════

class TestSaleActivities:

    def test_update_status_gera_activity(self, client, db):
        sale = make_sale(db, status="Pendente")
        client.patch(f"/sales/{sale.id_pedido}", json={"status": "Aprovado"})
        activities = client.get(f"/sales/{sale.id_pedido}/activities").json()
        assert len(activities) == 1
        act = activities[0]
        assert act["field_name"] == "Status"
        assert act["old_value"] == "Pendente"
        assert act["new_value"] == "Aprovado"

    def test_update_valor_formata_reais(self, client, db):
        sale = make_sale(db, valor_pedido=100.0)
        client.patch(f"/sales/{sale.id_pedido}", json={"valor_pedido": 250.50})
        activities = client.get(f"/sales/{sale.id_pedido}/activities").json()
        valor_act = next(a for a in activities if a["field_name"] == "Valor")
        assert "R$" in valor_act["old_value"]
        assert "R$" in valor_act["new_value"]
        assert "250" in valor_act["new_value"]

    def test_update_quantidade_usa_inteiro(self, client, db):
        sale = make_sale(db, quantidade=3.0)
        client.patch(f"/sales/{sale.id_pedido}", json={"quantidade": 5.0})
        activities = client.get(f"/sales/{sale.id_pedido}/activities").json()
        qtd_act = next(a for a in activities if a["field_name"] == "Quantidade")
        assert qtd_act["old_value"] == "3"
        assert qtd_act["new_value"] == "5"

    def test_campo_nao_alterado_nao_gera_activity(self, client, db):
        sale = make_sale(db, status="Aprovado")
        client.patch(f"/sales/{sale.id_pedido}", json={"status": "Aprovado"})
        activities = client.get(f"/sales/{sale.id_pedido}/activities").json()
        assert len(activities) == 0

    def test_multiplos_campos_geram_multiplas_activities(self, client, db):
        sale = make_sale(db, status="Pendente", categoria="Livros")
        client.patch(f"/sales/{sale.id_pedido}", json={"status": "Aprovado", "categoria": "Games"})
        activities = client.get(f"/sales/{sale.id_pedido}/activities").json()
        campos = {a["field_name"] for a in activities}
        assert "Status" in campos
        assert "Categoria" in campos

    def test_activities_retornadas_em_ordem_desc(self, client, db):
        sale = make_sale(db, status="Pendente")
        client.patch(f"/sales/{sale.id_pedido}", json={"status": "Aprovado"})
        client.patch(f"/sales/{sale.id_pedido}", json={"status": "Reembolsado"})
        activities = client.get(f"/sales/{sale.id_pedido}/activities").json()
        assert len(activities) >= 2
        datas = [a["changed_at"] for a in activities]
        assert datas == sorted(datas, reverse=True)

    def test_update_registra_user_name_do_header(self, client, db):
        sale = make_sale(db, status="Pendente")
        client.patch(
            f"/sales/{sale.id_pedido}",
            json={"status": "Aprovado"},
            headers={"X-User-Name": "Fulano"},
        )
        activities = client.get(f"/sales/{sale.id_pedido}/activities").json()
        assert activities[0]["user_name"] == "Fulano"

    def test_update_sem_header_usa_sistema(self, client, db):
        sale = make_sale(db, status="Pendente")
        client.patch(f"/sales/{sale.id_pedido}", json={"status": "Aprovado"})
        activities = client.get(f"/sales/{sale.id_pedido}/activities").json()
        assert activities[0]["user_name"] == "Sistema"


# ══════════════════════════════════════════════════════════════════════════════
# SaleService unit tests (sem HTTP)
# ══════════════════════════════════════════════════════════════════════════════

class TestSaleServiceUnit:

    def test_get_sale_levanta_404_para_id_desconhecido(self, service):
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            service.get_sale("id-inexistente")
        assert exc.value.status_code == 404

    def test_create_sale_levanta_409_para_duplicado(self, service, db):
        sale = make_sale(db)
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            service.create_sale(SaleCreate(id_pedido=sale.id_pedido))
        assert exc.value.status_code == 409

    def test_delete_sale_levanta_404_para_id_desconhecido(self, service):
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            service.delete_sale("id-inexistente")
        assert exc.value.status_code == 404

    def test_update_sale_levanta_404_para_id_desconhecido(self, service):
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            service.update_sale("id-inexistente", SaleUpdate())
        assert exc.value.status_code == 404

    def test_get_sales_retorna_salesPageOut(self, service, db):
        make_sale(db)
        result = service.get_sales()
        assert result.total >= 1
        assert isinstance(result.data, list)

    def test_get_sale_activities_retorna_lista_vazia_sem_mudancas(self, service, db):
        sale = make_sale(db)
        result = service.get_sale_activities(sale.id_pedido)
        assert result == []
