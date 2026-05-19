"""
dependencies.py
---------------
Dependencias de autenticacao e autorizacao para injecao via FastAPI Depends().

Uso em routers:

    from app.core.dependencies import get_current_user, require_roles

    @router.get("/admin-only")
    def admin_route(user = Depends(require_roles("admin"))):
        ...

    @router.get("/sales-or-admin")
    def mixed_route(user = Depends(require_roles("admin", "sales"))):
        ...
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode_token

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict:
    """
    Extrai e valida o JWT do header Authorization: Bearer <token>.
    Retorna o payload do token (dict com sub, role, name, exp).
    Levanta 401 se o token estiver ausente, expirado ou invalido.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticacao nao fornecido",
        )
    return decode_token(credentials.credentials)


def require_roles(*roles: str):
    """
    Fabrica de dependencias: retorna um Depends() que aceita apenas
    usuarios com a role especificada.

    Levanta 403 se o usuario autenticado nao tiver a role exigida.
    """
    def dependency(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso negado. Role exigida: {', '.join(roles)}",
            )
        return user
    return dependency
