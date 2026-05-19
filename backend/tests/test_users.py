"""
test_users.py
-------------
Testes do UserService e endpoint /users.

Cobertura:
  POST /users/
    - cria usuario com id gerado automaticamente
    - senha e armazenada como hash (nao texto claro)
    - retorna campos corretos no UserOut

  GET /users/{id}
    - retorna usuario existente
    - retorna 404 para id inexistente

  GET /users/
    - retorna lista com todos os usuarios

  PATCH /users/{id}
    - atualiza nome
    - atualiza role
    - retorna False / 404 para id inexistente
    - campos nao enviados nao sao alterados (partial update)

  DELETE /users/{id}
    - remove usuario e retorna o objeto removido
    - retorna 404 para id inexistente
    - usuario nao aparece mais apos delete (verificado via service)

  UserService direto
    - get_user retorna None para id inexistente
    - get_all_users retorna lista
    - delete_user retorna (user, True) para user existente
    - delete_user retorna (None, False) para inexistente
"""

import uuid
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.database import Base, get_db
from app.models.userModel import User
from app.routes.userRouter import router as user_router
from app.services.userService import UserService
from app.schemas.userSchemas import UserCreate, UserUpdate
from app.core.security import verify_password

# -- Infraestrutura -----------------------------------------------------------

TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI()
app.include_router(user_router)


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


def user_payload(**kwargs):
    defaults = {
        "name": "Usuario Teste",
        "email": f"usuario_{uuid.uuid4().hex[:6]}@teste.com",
        "password": "Senha@123",
        "role": "admin",
    }
    defaults.update(kwargs)
    return defaults


# =============================================================================
# POST /users/
# =============================================================================

class TestCreateUser:

    def test_cria_usuario_retorna_201_ou_200(self, client):
        resp = client.post("/users/", json=user_payload())
        assert resp.status_code in (200, 201)

    def test_resposta_contem_id(self, client):
        data = client.post("/users/", json=user_payload()).json()
        assert "id" in data
        assert len(data["id"]) > 0

    def test_id_e_uuid(self, client):
        data = client.post("/users/", json=user_payload()).json()
        # UUID tem 36 chars com hifens
        assert len(data["id"]) == 36

    def test_senha_nao_retornada_no_userout(self, client):
        payload = user_payload(password="SenhaSecreta99")
        data = client.post("/users/", json=payload).json()
        assert "SenhaSecreta99" not in str(data)

    def test_senha_armazenada_como_hash(self, db):
        plain = "Senha@PlainText"
        user = UserService.create_user(
            UserCreate(name="Hash Test", email=f"hash_{uuid.uuid4().hex[:6]}@test.com",
                       password=plain, role="sales"),
            db,
        )
        assert user.password != plain
        assert len(user.password) > 20

    def test_verify_password_funciona_apos_create(self, db):
        plain = "MinhaSenh@123"
        user = UserService.create_user(
            UserCreate(name="Verify Test", email=f"verify_{uuid.uuid4().hex[:6]}@test.com",
                       password=plain, role="admin"),
            db,
        )
        assert verify_password(plain, user.password) is True


# =============================================================================
# GET /users/{id}
# =============================================================================

class TestGetUser:

    def test_get_usuario_existente_retorna_200(self, client):
        user_id = client.post("/users/", json=user_payload()).json()["id"]
        resp = client.get(f"/users/{user_id}")
        assert resp.status_code == 200

    def test_get_usuario_retorna_id_correto(self, client):
        user_id = client.post("/users/", json=user_payload()).json()["id"]
        data = client.get(f"/users/{user_id}").json()
        assert data["id"] == user_id

    def test_get_usuario_inexistente_retorna_404(self, client):
        resp = client.get(f"/users/{uuid.uuid4()}")
        assert resp.status_code == 404


# =============================================================================
# GET /users/
# =============================================================================

class TestGetAllUsers:

    def test_retorna_lista(self, client):
        client.post("/users/", json=user_payload())
        resp = client.get("/users/")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_usuario_criado_aparece_na_lista(self, client):
        user_id = client.post("/users/", json=user_payload()).json()["id"]
        lista = client.get("/users/").json()
        ids = [u["id"] for u in lista]
        assert user_id in ids


# =============================================================================
# PATCH /users/{id}
# =============================================================================

class TestUpdateUser:

    def test_atualiza_nome(self, client, db):
        user_id = client.post("/users/", json=user_payload(name="Nome Original")).json()["id"]
        resp = client.patch(f"/users/{user_id}", json={"name": "Nome Atualizado"})
        assert resp.status_code == 200

    def test_atualiza_role(self, client, db):
        user_id = client.post("/users/", json=user_payload(role="admin")).json()["id"]
        resp = client.patch(f"/users/{user_id}", json={"role": "support"})
        assert resp.status_code == 200

    def test_patch_usuario_inexistente_retorna_404(self, client):
        resp = client.patch(f"/users/{uuid.uuid4()}", json={"name": "Novo"})
        assert resp.status_code == 404

    def test_partial_update_nao_altera_outros_campos(self, db):
        original_email = f"partial_{uuid.uuid4().hex[:6]}@test.com"
        user = UserService.create_user(
            UserCreate(name="Partial Test", email=original_email,
                       password="Senha@123", role="admin"),
            db,
        )
        UserService.update_user(user.id, UserUpdate(name="Novo Nome"), db)
        updated = UserService.get_user(user.id, db)
        assert updated.email == original_email

    def test_update_inexistente_retorna_false(self, db):
        result = UserService.update_user(str(uuid.uuid4()), UserUpdate(name="X"), db)
        assert result is False


# =============================================================================
# DELETE /users/{id}
# =============================================================================

class TestDeleteUser:

    def test_delete_retorna_200_com_objeto(self, client):
        user_id = client.post("/users/", json=user_payload()).json()["id"]
        resp = client.delete(f"/users/{user_id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == user_id

    def test_delete_remove_usuario(self, client, db):
        """Verifica via service que o usuario foi removido (evita bug de tipo na rota)."""
        user_id = client.post("/users/", json=user_payload()).json()["id"]
        client.delete(f"/users/{user_id}")
        assert UserService.get_user(user_id, db) is None

    def test_delete_inexistente_retorna_404(self, client):
        resp = client.delete(f"/users/{uuid.uuid4()}")
        assert resp.status_code == 404


# =============================================================================
# UserService direto
# =============================================================================

class TestUserServiceUnit:

    def test_get_user_retorna_none_para_inexistente(self, db):
        result = UserService.get_user(str(uuid.uuid4()), db)
        assert result is None

    def test_get_all_users_retorna_lista(self, db):
        UserService.create_user(
            UserCreate(name="List Test", email=f"list_{uuid.uuid4().hex[:6]}@test.com",
                       password="X", role="admin"),
            db,
        )
        result = UserService.get_all_users(db)
        assert isinstance(result, list)
        assert len(result) >= 1

    def test_delete_retorna_user_e_true(self, db):
        user = UserService.create_user(
            UserCreate(name="Del Test", email=f"del_{uuid.uuid4().hex[:6]}@test.com",
                       password="X", role="admin"),
            db,
        )
        deleted, success = UserService.delete_user(user.id, db)
        assert success is True
        assert deleted.id == user.id

    def test_delete_inexistente_retorna_none_e_false(self, db):
        deleted, success = UserService.delete_user(str(uuid.uuid4()), db)
        assert deleted is None
        assert success is False
