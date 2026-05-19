"""
test_contacts_crud.py
---------------------
Testes de CRUD e logica de negocio do ContactService e endpoints /contacts.

Cobertura:
  POST /contacts/
    - cria contato com id UUID gerado automaticamente
    - status padrao "Ativo"
    - email opcional
    - retorna 201

  GET /contacts/{id}
    - retorna contato existente com todos os campos
    - retorna 404 para id inexistente

  PUT /contacts/{id}
    - atualiza nome
    - atualiza email
    - atualiza clientStatus para valores validos
    - status invalido nao e aplicado (ignorado silenciosamente)
    - retorna 404 para id inexistente

  Logica de normalizacao (ContactService)
    - engagement mapeado de categoria_nps_recente:
        Promotor -> "Promotor"
        Neutro   -> "Neutro"
        Detrator -> "Detrator"
        None/outro -> "Nenhum NPS"
    - engagementScore escala nota_nps_media * 10 arredondado para 1 decimal
    - data_primeiro_pedido formatado para DD/MM/YYYY

  Defaults ao criar contato
    - purchases = 0
    - totalRevenue = 0.0
    - totalTickets = 0
    - engagement = "Nenhum NPS" (nenhum NPS ainda)
"""

import uuid
import pytest
from datetime import date
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.database import Base, get_db
from app.models.contactModel import GoldCliente360
from app.routes.contactRouter import router as contact_router
from app.services.contactService import ContactService, _normalize_engagement, _normalize_score, _fmt_date
from app.schemas.contactSchemas import ContactCreate, ContactUpdate

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


def contact_payload(**kwargs):
    defaults = {
        "name": f"Cliente {uuid.uuid4().hex[:6]}",
        "email": f"cliente_{uuid.uuid4().hex[:6]}@teste.com",
    }
    defaults.update(kwargs)
    return defaults


# =============================================================================
# POST /contacts/
# =============================================================================

class TestContactCreate:

    def test_retorna_201(self, client):
        resp = client.post("/contacts/", json=contact_payload())
        assert resp.status_code == 201

    def test_retorna_id_uuid(self, client):
        data = client.post("/contacts/", json=contact_payload()).json()
        assert "id" in data
        assert len(data["id"]) == 36  # formato UUID

    def test_nome_salvo_corretamente(self, client):
        data = client.post("/contacts/", json=contact_payload(name="Ana Souza")).json()
        assert data["name"] == "Ana Souza"

    def test_email_salvo_corretamente(self, client):
        data = client.post("/contacts/", json=contact_payload(email="ana@exemplo.com")).json()
        assert data["email"] == "ana@exemplo.com"

    def test_email_opcional(self, client):
        resp = client.post("/contacts/", json={"name": "Sem Email"})
        assert resp.status_code == 201
        assert resp.json()["email"] is None

    def test_status_padrao_ativo(self, client):
        data = client.post("/contacts/", json=contact_payload()).json()
        assert data["clientStatus"] == "Ativo"

    def test_defaults_numericos_zerados(self, client):
        data = client.post("/contacts/", json=contact_payload()).json()
        assert data["purchases"] == 0
        assert data["totalRevenue"] == 0.0
        assert data["totalTickets"] == 0

    def test_engagement_padrao_nenhum_nps(self, client):
        data = client.post("/contacts/", json=contact_payload()).json()
        assert data["engagement"] == "Nenhum NPS"


# =============================================================================
# GET /contacts/{id}
# =============================================================================

class TestContactGetById:

    def test_retorna_200_para_existente(self, client):
        contact_id = client.post("/contacts/", json=contact_payload()).json()["id"]
        resp = client.get(f"/contacts/{contact_id}")
        assert resp.status_code == 200

    def test_retorna_dados_corretos(self, client):
        contact_id = client.post("/contacts/", json=contact_payload(name="Pedro Lima")).json()["id"]
        data = client.get(f"/contacts/{contact_id}").json()
        assert data["id"] == contact_id
        assert data["name"] == "Pedro Lima"

    def test_retorna_404_para_inexistente(self, client):
        resp = client.get(f"/contacts/{uuid.uuid4()}")
        assert resp.status_code == 404

    def test_campos_obrigatorios_presentes(self, client):
        contact_id = client.post("/contacts/", json=contact_payload()).json()["id"]
        data = client.get(f"/contacts/{contact_id}").json()
        for campo in ("id", "name", "email", "clientStatus", "purchases",
                      "totalRevenue", "engagement", "engagementScore"):
            assert campo in data


# =============================================================================
# PUT /contacts/{id}
# =============================================================================

class TestContactUpdate:

    def test_atualiza_nome(self, client):
        contact_id = client.post("/contacts/", json=contact_payload(name="Antes")).json()["id"]
        resp = client.put(f"/contacts/{contact_id}", json={"name": "Depois"})
        assert resp.status_code == 200
        assert resp.json()["name"] == "Depois"

    def test_atualiza_email(self, client):
        contact_id = client.post("/contacts/", json=contact_payload()).json()["id"]
        resp = client.put(f"/contacts/{contact_id}", json={"email": "novo@email.com"})
        assert resp.status_code == 200
        assert resp.json()["email"] == "novo@email.com"

    def test_atualiza_client_status_valido(self, client):
        contact_id = client.post("/contacts/", json=contact_payload()).json()["id"]
        for status in ("VIP", "Lead", "Em risco", "Inativo", "Ativo"):
            resp = client.put(f"/contacts/{contact_id}", json={"clientStatus": status})
            assert resp.status_code == 200
            assert resp.json()["clientStatus"] == status

    def test_status_invalido_nao_e_aplicado(self, svc):
        c = svc.create_contact(ContactCreate(name="Teste"))
        result = svc.update_contact(c.id, ContactUpdate(clientStatus="SuperVIP"))
        # Status invalido e ignorado silenciosamente
        assert result.clientStatus == "Ativo"  # permanece o padrao

    def test_update_inexistente_retorna_none(self, svc):
        result = svc.update_contact(str(uuid.uuid4()), ContactUpdate(name="X"))
        assert result is None

    def test_update_inexistente_via_http_retorna_404(self, client):
        resp = client.put(f"/contacts/{uuid.uuid4()}", json={"name": "X"})
        assert resp.status_code == 404

    def test_campo_nao_enviado_nao_e_alterado(self, client):
        original_email = "original@teste.com"
        contact_id = client.post("/contacts/", json=contact_payload(email=original_email)).json()["id"]
        client.put(f"/contacts/{contact_id}", json={"name": "Novo Nome"})
        data = client.get(f"/contacts/{contact_id}").json()
        assert data["email"] == original_email


# =============================================================================
# Normalizacao NPS e engagementScore
# =============================================================================

class TestContactNormalization:

    def test_normalize_engagement_promotor(self):
        assert _normalize_engagement("Promotor") == "Promotor"

    def test_normalize_engagement_neutro(self):
        assert _normalize_engagement("Neutro") == "Neutro"

    def test_normalize_engagement_detrator(self):
        assert _normalize_engagement("Detrator") == "Detrator"

    def test_normalize_engagement_none_vira_nenhum_nps(self):
        assert _normalize_engagement(None) == "Nenhum NPS"

    def test_normalize_engagement_desconhecido_vira_nenhum_nps(self):
        assert _normalize_engagement("Passivo") == "Nenhum NPS"

    def test_normalize_score_escala_0_a_100(self):
        # nota_nps_media interna e 0-1; engagementScore exibido e 0-100
        assert _normalize_score(0.9) == 9.0
        assert _normalize_score(0.5) == 5.0
        assert _normalize_score(0.0) == 0.0

    def test_normalize_score_none_retorna_zero(self):
        assert _normalize_score(None) == 0.0

    def test_engagement_score_via_service(self, db):
        svc = ContactService(db)
        c = svc.create_contact(ContactCreate(name="Score Test"))
        # Recém criado nao tem nota_nps_media -> 0.0
        assert c.engagementScore == 0.0


# =============================================================================
# Formatacao de datas
# =============================================================================

class TestContactDateFormatting:

    def test_fmt_date_converte_iso_para_ddmmyyyy(self):
        assert _fmt_date("2024-03-15") == "15/03/2024"

    def test_fmt_date_com_hora(self):
        assert _fmt_date("2024-03-15 10:30:00") == "15/03/2024"

    def test_fmt_date_none_retorna_none(self):
        assert _fmt_date(None) is None

    def test_fmt_date_vazio_retorna_none(self):
        assert _fmt_date("") is None

    def test_first_purchase_formatado_ao_criar(self, svc):
        c = svc.create_contact(ContactCreate(name="Data Test"))
        today_fmt = date.today().strftime("%d/%m/%Y")
        # firstPurchase deve ser a data de hoje em DD/MM/YYYY
        assert c.firstPurchase == today_fmt
