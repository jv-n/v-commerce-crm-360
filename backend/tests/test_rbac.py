"""
test_rbac.py
------------
Testes das dependencias de autenticacao e autorizacao.

O modulo app.core.dependencies fornece:
  - get_current_user: valida o JWT e retorna o payload
  - require_roles(*roles): dependencia que aceita apenas certas roles

Cobertura:
  get_current_user
    - token valido retorna payload com sub, role e name
    - sem token -> 401
    - token expirado -> 401
    - token adulterado -> 401
    - token sem campo sub -> 401

  require_roles
    - admin com require_roles("admin") -> 200
    - sales com require_roles("admin") -> 403
    - support com require_roles("admin") -> 403
    - sales com require_roles("admin", "sales") -> 200
    - admin com require_roles("admin", "sales") -> 200
    - support com require_roles("admin", "sales") -> 403
    - qualquer role valida com require_roles variados

  Integracao com endpoint real
    - endpoint protegido retorna 401 sem token
    - endpoint protegido retorna 403 com role errada
    - endpoint protegido retorna 200 com role correta
    - endpoint multi-role aceita qualquer das roles permitidas
"""

import pytest
from datetime import datetime, timedelta, timezone
from jose import jwt
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient

from app.core.security import create_access_token, ALGORTIHM
from app.core.dependencies import get_current_user, require_roles
from app.config import settings

# -- App de teste com endpoints protegidos ------------------------------------

_app = FastAPI()


@_app.get("/somente-admin")
def rota_admin(user: dict = Depends(require_roles("admin"))):
    return {"role": user["role"]}


@_app.get("/admin-ou-sales")
def rota_admin_sales(user: dict = Depends(require_roles("admin", "sales"))):
    return {"role": user["role"]}


@_app.get("/somente-support")
def rota_support(user: dict = Depends(require_roles("support"))):
    return {"role": user["role"]}


@_app.get("/autenticado")
def rota_autenticada(user: dict = Depends(get_current_user)):
    return {"sub": user["sub"], "role": user["role"]}


client = TestClient(_app, raise_server_exceptions=False)


# -- Helpers ------------------------------------------------------------------

def make_token(role: str, name: str = "Usuario Teste", sub: str = "user-123") -> str:
    return create_access_token({"sub": sub, "role": role, "name": name})


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# =============================================================================
# get_current_user — validacao do token
# =============================================================================

class TestGetCurrentUser:

    def test_token_valido_retorna_payload(self):
        token = make_token("admin")
        resp = client.get("/autenticado", headers=bearer(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == "admin"
        assert data["sub"] == "user-123"

    def test_sem_token_retorna_401(self):
        resp = client.get("/autenticado")
        assert resp.status_code == 401

    def test_token_expirado_retorna_401(self):
        payload = {
            "sub": "user-123",
            "role": "admin",
            "exp": datetime.now(timezone.utc) - timedelta(seconds=1),
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORTIHM)
        resp = client.get("/autenticado", headers=bearer(token))
        assert resp.status_code == 401

    def test_token_adulterado_retorna_401(self):
        token = make_token("admin")
        adulterado = token[:-4] + "XXXX"
        resp = client.get("/autenticado", headers=bearer(adulterado))
        assert resp.status_code == 401

    def test_token_sem_sub_retorna_401(self):
        payload = {
            "role": "admin",
            "name": "Sem Sub",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORTIHM)
        resp = client.get("/autenticado", headers=bearer(token))
        assert resp.status_code == 401

    def test_string_invalida_retorna_401(self):
        resp = client.get("/autenticado", headers={"Authorization": "Bearer isso.nao.e.jwt"})
        assert resp.status_code == 401

    def test_header_sem_bearer_retorna_401(self):
        token = make_token("admin")
        resp = client.get("/autenticado", headers={"Authorization": token})
        assert resp.status_code == 401


# =============================================================================
# require_roles — controle de acesso por role
# =============================================================================

class TestRequireRoles:

    # ── admin ------------------------------------------------------------
    def test_admin_acessa_rota_admin(self):
        resp = client.get("/somente-admin", headers=bearer(make_token("admin")))
        assert resp.status_code == 200

    def test_sales_nao_acessa_rota_admin(self):
        resp = client.get("/somente-admin", headers=bearer(make_token("sales")))
        assert resp.status_code == 403

    def test_support_nao_acessa_rota_admin(self):
        resp = client.get("/somente-admin", headers=bearer(make_token("support")))
        assert resp.status_code == 403

    # ── admin ou sales ---------------------------------------------------
    def test_admin_acessa_rota_admin_sales(self):
        resp = client.get("/admin-ou-sales", headers=bearer(make_token("admin")))
        assert resp.status_code == 200

    def test_sales_acessa_rota_admin_sales(self):
        resp = client.get("/admin-ou-sales", headers=bearer(make_token("sales")))
        assert resp.status_code == 200

    def test_support_nao_acessa_rota_admin_sales(self):
        resp = client.get("/admin-ou-sales", headers=bearer(make_token("support")))
        assert resp.status_code == 403

    # ── support ----------------------------------------------------------
    def test_support_acessa_rota_support(self):
        resp = client.get("/somente-support", headers=bearer(make_token("support")))
        assert resp.status_code == 200

    def test_admin_nao_acessa_rota_somente_support(self):
        resp = client.get("/somente-support", headers=bearer(make_token("admin")))
        assert resp.status_code == 403

    def test_sales_nao_acessa_rota_somente_support(self):
        resp = client.get("/somente-support", headers=bearer(make_token("sales")))
        assert resp.status_code == 403

    # ── sem token --------------------------------------------------------
    def test_sem_token_em_rota_protegida_retorna_401(self):
        resp = client.get("/somente-admin")
        assert resp.status_code == 401

    def test_token_expirado_em_rota_protegida_retorna_401(self):
        payload = {
            "sub": "user-1",
            "role": "admin",
            "exp": datetime.now(timezone.utc) - timedelta(seconds=1),
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORTIHM)
        resp = client.get("/somente-admin", headers=bearer(token))
        assert resp.status_code == 401

    # ── resposta contem a role retornada ---------------------------------
    def test_payload_retornado_contem_role_correta(self):
        resp = client.get("/admin-ou-sales", headers=bearer(make_token("sales")))
        assert resp.json()["role"] == "sales"


# =============================================================================
# require_roles como funcao pura (sem HTTP)
# =============================================================================

class TestRequireRolesUnit:

    def test_require_roles_retorna_callable(self):
        dep = require_roles("admin")
        assert callable(dep)

    def test_dependency_aceita_user_com_role_correta(self):
        from fastapi import HTTPException
        dep = require_roles("admin")
        user = {"sub": "u1", "role": "admin", "name": "Admin"}
        # Chama a funcao interna diretamente (sem FastAPI DI)
        result = dep.__wrapped__(user) if hasattr(dep, "__wrapped__") else dep(user)
        assert result == user

    def test_dependency_rejeita_role_incorreta(self):
        from fastapi import HTTPException
        dep = require_roles("admin")
        user = {"sub": "u1", "role": "sales", "name": "Sales"}
        with pytest.raises(HTTPException) as exc_info:
            dep(user)
        assert exc_info.value.status_code == 403

    def test_dependency_aceita_multiplas_roles(self):
        dep = require_roles("admin", "sales")
        for role in ("admin", "sales"):
            user = {"sub": "u1", "role": role, "name": "User"}
            result = dep(user)
            assert result["role"] == role

    def test_dependency_rejeita_role_fora_da_lista(self):
        from fastapi import HTTPException
        dep = require_roles("admin", "sales")
        user = {"sub": "u1", "role": "support", "name": "Support"}
        with pytest.raises(HTTPException) as exc_info:
            dep(user)
        assert exc_info.value.status_code == 403
