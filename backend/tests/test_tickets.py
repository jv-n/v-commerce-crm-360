"""
test_tickets.py
---------------
Testes do TicketService e endpoint /tickets.

Cobertura:
  CRUD
    - GET /tickets/      lista com paginacao
    - GET /tickets/{id}  busca existente e 404
    - POST /tickets/     cria ticket com id gerado
    - PATCH /tickets/{id} atualiza campo e 404
    - DELETE /tickets/{id} remove e 404
    - GET /tickets/responsibles  lista agentes distintos

  Filtros
    - search (nome, agente, tipo_problema, status)
    - responsible (lista)
    - problem (lista)
    - status (lista normalizada)
    - status invalido retorna 400
    - score exato
    - score "sem avaliacao"
    - score invalido retorna 400
    - openedFrom e openedTo
    - data invalida retorna 400

  Ordenacao
    - sortKey openedAt desc
    - sortKey client asc
    - sortKey score desc

  Logica de negocio
    - _status_to_resolvido: Finalizado -> True
    - _status_to_resolvido: Em atendimento -> False
    - _status_to_resolvido: None -> None
"""

import uuid
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.database import Base, get_db
from app.models.ticketModel import GoldTicket360
from app.routes.ticketRouter import router as ticket_router
from app.services.ticketService import TicketService
from app.schemas.ticketSchemas import TicketCreate, TicketUpdate

# ── Infraestrutura ────────────────────────────────────────────────────────────

TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI()
app.include_router(ticket_router)


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


def make_ticket(db, **kwargs) -> GoldTicket360:
    defaults = {
        "ticket_id": str(uuid.uuid4()),
        "nome_cliente": "Cliente Teste",
        "agente_suporte": "Agente Um",
        "tipo_problema": "Entrega",
        "status_atendimento": "Em atendimento",
        "data_abertura": "2024-05-10",
        "nota_avaliacao": 4.0,
    }
    defaults.update(kwargs)
    t = GoldTicket360(**defaults)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


# ══════════════════════════════════════════════════════════════════════════════
# CRUD
# ══════════════════════════════════════════════════════════════════════════════

class TestTicketCRUD:

    def test_get_tickets_retorna_200(self, client, db):
        make_ticket(db)
        resp = client.get("/tickets/")
        assert resp.status_code == 200

    def test_get_tickets_estrutura_paginada(self, client, db):
        make_ticket(db)
        data = client.get("/tickets/").json()
        assert all(k in data for k in ("data", "total", "page", "pageSize"))

    def test_get_ticket_por_id(self, client, db):
        t = make_ticket(db)
        resp = client.get(f"/tickets/{t.ticket_id}")
        assert resp.status_code == 200
        assert resp.json()["ticket_id"] == t.ticket_id

    def test_get_ticket_inexistente_404(self, client):
        assert client.get("/tickets/nao-existe").status_code == 404

    def test_post_ticket_retorna_201(self, client):
        payload = {"tipo_problema": "Pagamento", "status_atendimento": "Aguardando"}
        resp = client.post("/tickets/", json=payload)
        assert resp.status_code == 201
        assert "ticket_id" in resp.json()

    def test_post_ticket_gera_id_uuid(self, client):
        resp = client.post("/tickets/", json={}).json()
        assert len(resp["ticket_id"]) == 36

    def test_patch_ticket_atualiza_campo(self, client, db):
        t = make_ticket(db, status_atendimento="Aguardando")
        resp = client.patch(f"/tickets/{t.ticket_id}", json={"status_atendimento": "Finalizado"})
        assert resp.status_code == 200
        assert resp.json()["status_atendimento"] == "Finalizado"

    def test_patch_ticket_inexistente_404(self, client):
        assert client.patch("/tickets/nao-existe", json={"nota_avaliacao": 3}).status_code == 404

    def test_delete_ticket_retorna_204(self, client, db):
        t = make_ticket(db)
        assert client.delete(f"/tickets/{t.ticket_id}").status_code == 204

    def test_delete_ticket_remove_do_banco(self, client, db):
        t = make_ticket(db)
        client.delete(f"/tickets/{t.ticket_id}")
        assert client.get(f"/tickets/{t.ticket_id}").status_code == 404

    def test_delete_ticket_inexistente_404(self, client):
        assert client.delete("/tickets/nao-existe").status_code == 404

    def test_get_responsibles_retorna_lista(self, client, db):
        make_ticket(db, agente_suporte="Agente Alpha")
        make_ticket(db, agente_suporte="Agente Beta")
        resp = client.get("/tickets/responsibles")
        assert resp.status_code == 200
        data = resp.json()
        assert "Agente Alpha" in data
        assert "Agente Beta" in data

    def test_get_responsibles_sem_duplicatas(self, client, db):
        make_ticket(db, agente_suporte="Agente Unico")
        make_ticket(db, agente_suporte="Agente Unico")
        data = client.get("/tickets/responsibles").json()
        assert data.count("Agente Unico") == 1


# ══════════════════════════════════════════════════════════════════════════════
# Filtros
# ══════════════════════════════════════════════════════════════════════════════

class TestTicketFilters:

    def test_search_por_nome_cliente(self, client, db):
        make_ticket(db, nome_cliente="Roberta Buscavel")
        make_ticket(db, nome_cliente="Outro Nome")
        data = client.get("/tickets/?search=Roberta").json()
        assert all("Roberta" in (t["nome_cliente"] or "") for t in data["data"])

    def test_search_por_agente(self, client, db):
        make_ticket(db, agente_suporte="Agente Busca")
        make_ticket(db, agente_suporte="Outro Agente")
        data = client.get("/tickets/?search=Agente+Busca").json()
        assert all("Agente Busca" in (t["agente_suporte"] or "") for t in data["data"])

    def test_filtro_responsible(self, client, db):
        make_ticket(db, agente_suporte="Agente X")
        make_ticket(db, agente_suporte="Agente Y")
        data = client.get("/tickets/?responsible=Agente+X").json()
        assert all(t["agente_suporte"] == "Agente X" for t in data["data"])

    def test_filtro_problem(self, client, db):
        make_ticket(db, tipo_problema="Reembolso")
        make_ticket(db, tipo_problema="Entrega")
        data = client.get("/tickets/?problem=Reembolso").json()
        assert all(t["tipo_problema"] == "Reembolso" for t in data["data"])

    def test_filtro_status_finalizado(self, client, db):
        make_ticket(db, status_atendimento="Finalizado")
        make_ticket(db, status_atendimento="Aguardando")
        data = client.get("/tickets/?status=finalizado").json()
        assert all(t["status_atendimento"] == "Finalizado" for t in data["data"])

    def test_filtro_status_invalido_retorna_400(self, client, db):
        make_ticket(db)
        resp = client.get("/tickets/?status=status_invalido")
        assert resp.status_code == 400

    def test_filtro_score_exato(self, client, db):
        make_ticket(db, nota_avaliacao=5.0)
        make_ticket(db, nota_avaliacao=2.0)
        data = client.get("/tickets/?score=5.0").json()
        assert all(t["nota_avaliacao"] == 5.0 for t in data["data"])

    def test_filtro_score_sem_avaliacao(self, client, db):
        make_ticket(db, nota_avaliacao=None)
        make_ticket(db, nota_avaliacao=3.0)
        data = client.get("/tickets/?score=sem+avaliacao").json()
        assert all(t["nota_avaliacao"] is None for t in data["data"])

    def test_filtro_score_invalido_retorna_400(self, client, db):
        make_ticket(db)
        resp = client.get("/tickets/?score=nota_invalida")
        assert resp.status_code == 400

    def test_filtro_opened_from(self, client, db):
        make_ticket(db, data_abertura="2023-01-01")
        b = make_ticket(db, data_abertura="2024-08-15")
        data = client.get("/tickets/?openedFrom=2024-01-01").json()
        assert b.ticket_id in {t["ticket_id"] for t in data["data"]}
        assert all(t["data_abertura"] >= "2024-01-01" for t in data["data"])

    def test_filtro_opened_to(self, client, db):
        a = make_ticket(db, data_abertura="2022-03-01")
        make_ticket(db, data_abertura="2025-06-01")
        data = client.get("/tickets/?openedTo=2023-12-31").json()
        assert a.ticket_id in {t["ticket_id"] for t in data["data"]}

    def test_data_invalida_retorna_400(self, client):
        resp = client.get("/tickets/?openedFrom=nao-e-data")
        assert resp.status_code == 400


# ══════════════════════════════════════════════════════════════════════════════
# Ordenacao
# ══════════════════════════════════════════════════════════════════════════════

class TestTicketSorting:

    def test_sort_openedAt_desc(self, client, db):
        make_ticket(db, data_abertura="2024-01-01")
        make_ticket(db, data_abertura="2024-12-31")
        data = client.get("/tickets/?sortKey=openedAt&sortDir=desc").json()["data"]
        if len(data) >= 2:
            assert data[0]["data_abertura"] >= data[1]["data_abertura"]

    def test_sort_score_desc(self, client, db):
        make_ticket(db, nota_avaliacao=1.0)
        make_ticket(db, nota_avaliacao=5.0)
        data = client.get("/tickets/?sortKey=score&sortDir=desc").json()["data"]
        notas = [t["nota_avaliacao"] for t in data if t["nota_avaliacao"] is not None]
        if len(notas) >= 2:
            assert notas[0] >= notas[1]

    def test_sort_client_asc(self, client, db):
        make_ticket(db, nome_cliente="Zara")
        make_ticket(db, nome_cliente="Ana")
        data = client.get("/tickets/?sortKey=client&sortDir=asc").json()["data"]
        nomes = [t["nome_cliente"] for t in data if t["nome_cliente"]]
        if len(nomes) >= 2:
            assert nomes == sorted(nomes, key=str.lower)


# ══════════════════════════════════════════════════════════════════════════════
# Logica de negocio
# ══════════════════════════════════════════════════════════════════════════════

class TestTicketBusinessLogic:

    def test_status_finalizado_resolvido_true(self):
        assert TicketService._status_to_resolvido("Finalizado") == "True"

    def test_status_em_atendimento_resolvido_false(self):
        assert TicketService._status_to_resolvido("Em atendimento") == "False"

    def test_status_aguardando_resolvido_false(self):
        assert TicketService._status_to_resolvido("Aguardando") == "False"

    def test_status_none_resolvido_none(self):
        assert TicketService._status_to_resolvido(None) is None

    def test_resolvido_refletido_na_resposta_api(self, client, db):
        t = make_ticket(db, status_atendimento="Finalizado")
        resp = client.get(f"/tickets/{t.ticket_id}").json()
        assert resp["resolvido"] == "True"

    def test_nao_resolvido_refletido_na_resposta_api(self, client, db):
        t = make_ticket(db, status_atendimento="Aguardando")
        resp = client.get(f"/tickets/{t.ticket_id}").json()
        assert resp["resolvido"] == "False"
