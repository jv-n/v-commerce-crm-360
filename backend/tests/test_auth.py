"""
test_auth.py
------------
Testes de autenticação do V-Commerce CRM 360.

Cobertura:
  Endpoint POST /auth/login
    - Login com credenciais válidas (admin)
    - Login com credenciais válidas (sales)
    - Senha incorreta → 401
    - E-mail inexistente → 401
    - Payload incompleto (sem senha) → 422
    - E-mail com formato inválido → 422

  Conteúdo do token JWT
    - Token contém os campos sub, role e name

  Funções utilitárias (security.py)
    - hash_password gera hash diferente do texto claro
    - verify_password valida corretamente
    - verify_password rejeita senha errada
    - decode_token retorna payload para token válido
    - decode_token levanta 401 para token expirado
    - decode_token levanta 401 para token com assinatura inválida
    - decode_token levanta 401 quando campo "sub" está ausente
"""

import pytest
from datetime import datetime, timedelta, timezone
from jose import jwt
from fastapi.testclient import TestClient

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token,
    ALGORTIHM,
)
from app.config import settings


# ══════════════════════════════════════════════════════════════════════════════
# Helpers
# ══════════════════════════════════════════════════════════════════════════════

def _login(client: TestClient, email: str, password: str):
    return client.post("/auth/login", json={"email": email, "password": password})


# ══════════════════════════════════════════════════════════════════════════════
# POST /auth/login — casos de sucesso
# ══════════════════════════════════════════════════════════════════════════════

class TestLoginSuccess:

    def test_retorna_200_com_token(self, client, test_user):
        resp = _login(client, test_user["email"], test_user["password"])
        assert resp.status_code == 200

    def test_resposta_contem_access_token(self, client, test_user):
        data = _login(client, test_user["email"], test_user["password"]).json()
        assert "access_token" in data
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 0

    def test_token_type_e_bearer(self, client, test_user):
        data = _login(client, test_user["email"], test_user["password"]).json()
        assert data["token_type"] == "bearer"

    def test_resposta_contem_dados_do_usuario(self, client, test_user):
        data = _login(client, test_user["email"], test_user["password"]).json()
        user_data = data["user"]
        assert user_data["email"] == test_user["email"]
        assert user_data["name"] == test_user["user"].name
        assert user_data["role"] == "admin"
        assert "id" in user_data

    def test_senha_nao_retornada_na_resposta(self, client, test_user):
        data = _login(client, test_user["email"], test_user["password"]).json()
        response_str = str(data)
        assert test_user["password"] not in response_str

    def test_login_usuario_com_role_sales(self, client, sales_user):
        data = _login(client, sales_user["email"], sales_user["password"]).json()
        assert data["user"]["role"] == "sales"


# ══════════════════════════════════════════════════════════════════════════════
# POST /auth/login — casos de erro
# ══════════════════════════════════════════════════════════════════════════════

class TestLoginFailure:

    def test_senha_incorreta_retorna_401(self, client, test_user):
        resp = _login(client, test_user["email"], "senha_errada")
        assert resp.status_code == 401

    def test_senha_incorreta_retorna_mensagem_correta(self, client, test_user):
        data = _login(client, test_user["email"], "senha_errada").json()
        assert "detail" in data

    def test_email_inexistente_retorna_401(self, client):
        resp = _login(client, "naoexiste@teste.com", "qualquersenha")
        assert resp.status_code == 401

    def test_email_invalido_retorna_422(self, client):
        resp = _login(client, "nao-e-um-email", "senha123")
        assert resp.status_code == 422

    def test_payload_sem_senha_retorna_422(self, client):
        resp = client.post("/auth/login", json={"email": "x@x.com"})
        assert resp.status_code == 422

    def test_payload_vazio_retorna_422(self, client):
        resp = client.post("/auth/login", json={})
        assert resp.status_code == 422

    def test_senha_vazia_retorna_401_ou_422(self, client, test_user):
        """Senha vazia deve ser rejeitada (422 por validação ou 401 por autenticação)."""
        resp = _login(client, test_user["email"], "")
        assert resp.status_code in (401, 422)


# ══════════════════════════════════════════════════════════════════════════════
# Conteúdo do token JWT
# ══════════════════════════════════════════════════════════════════════════════

class TestJWTContent:

    def _decode_raw(self, token: str) -> dict:
        """Decodifica sem verificar expiração, para inspecionar o payload."""
        return jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORTIHM],
        )

    def test_token_contem_sub(self, client, test_user):
        token = _login(client, test_user["email"], test_user["password"]).json()["access_token"]
        payload = self._decode_raw(token)
        assert "sub" in payload
        assert payload["sub"] == str(test_user["user"].id)

    def test_token_contem_role(self, client, test_user):
        token = _login(client, test_user["email"], test_user["password"]).json()["access_token"]
        payload = self._decode_raw(token)
        assert payload["role"] == "admin"

    def test_token_contem_name(self, client, test_user):
        token = _login(client, test_user["email"], test_user["password"]).json()["access_token"]
        payload = self._decode_raw(token)
        assert payload["name"] == test_user["user"].name

    def test_token_contem_exp(self, client, test_user):
        token = _login(client, test_user["email"], test_user["password"]).json()["access_token"]
        payload = self._decode_raw(token)
        assert "exp" in payload

    def test_token_expira_no_futuro(self, client, test_user):
        token = _login(client, test_user["email"], test_user["password"]).json()["access_token"]
        payload = self._decode_raw(token)
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        assert exp > datetime.now(timezone.utc)


# ══════════════════════════════════════════════════════════════════════════════
# Funções utilitárias — hash_password / verify_password
# ══════════════════════════════════════════════════════════════════════════════

class TestPasswordHashing:

    def test_hash_diferente_do_texto_claro(self):
        hashed = hash_password("minha_senha")
        assert hashed != "minha_senha"

    def test_hash_nao_e_vazio(self):
        hashed = hash_password("abc")
        assert len(hashed) > 0

    def test_dois_hashes_da_mesma_senha_sao_diferentes(self):
        """Argon2 usa salt aleatório — dois hashes nunca devem ser iguais."""
        h1 = hash_password("mesma_senha")
        h2 = hash_password("mesma_senha")
        assert h1 != h2

    def test_verify_password_correta_retorna_true(self):
        senha = "Senha@Segura99"
        assert verify_password(senha, hash_password(senha)) is True

    def test_verify_password_errada_retorna_false(self):
        hashed = hash_password("correta")
        assert verify_password("errada", hashed) is False

    def test_verify_password_case_sensitive(self):
        hashed = hash_password("Senha")
        assert verify_password("senha", hashed) is False


# ══════════════════════════════════════════════════════════════════════════════
# Funções utilitárias — create_access_token / decode_token
# ══════════════════════════════════════════════════════════════════════════════

class TestTokenDecode:

    def test_decode_token_valido_retorna_payload(self):
        token = create_access_token({"sub": "user-123", "role": "admin", "name": "Fulano"})
        payload = decode_token(token)
        assert payload["sub"] == "user-123"
        assert payload["role"] == "admin"

    def test_decode_token_expirado_levanta_401(self):
        from fastapi import HTTPException
        payload = {
            "sub": "user-123",
            "exp": datetime.now(timezone.utc) - timedelta(seconds=1),
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORTIHM)
        with pytest.raises(HTTPException) as exc_info:
            decode_token(token)
        assert exc_info.value.status_code == 401

    def test_decode_token_assinatura_invalida_levanta_401(self):
        from fastapi import HTTPException
        token = create_access_token({"sub": "user-123"})
        token_adulterado = token[:-4] + "XXXX"
        with pytest.raises(HTTPException) as exc_info:
            decode_token(token_adulterado)
        assert exc_info.value.status_code == 401

    def test_decode_token_sem_sub_levanta_401(self):
        from fastapi import HTTPException
        # Token válido mas sem campo "sub"
        payload = {"role": "admin", "exp": datetime.now(timezone.utc) + timedelta(hours=1)}
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORTIHM)
        with pytest.raises(HTTPException) as exc_info:
            decode_token(token)
        assert exc_info.value.status_code == 401

    def test_decode_token_string_invalida_levanta_401(self):
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            decode_token("isso.nao.e.um.jwt")
        assert exc_info.value.status_code == 401
