import uuid
import pytest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import FastAPI
from fastapi.testclient import TestClient

from database.database import Base, get_db
from app.models.userModel import User
from app.core.security import hash_password
from app.routes.authRouter import router as auth_router
from app.routes.userRouter import router as user_router

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI(title="Test App")
app.include_router(auth_router)
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
    session = TestingSessionLocal(bind=connection)
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
def test_user(db):
    plain_password = "Senha@123"
    user = User(
        id=str(uuid.uuid4()),
        name="Admin Teste",
        email="admin@teste.com",
        password=hash_password(plain_password),
        role="admin",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"user": user, "email": user.email, "password": plain_password}


@pytest.fixture()
def sales_user(db):
    plain_password = "Sales@456"
    user = User(
        id=str(uuid.uuid4()),
        name="Vendedor Teste",
        email="vendedor@teste.com",
        password=hash_password(plain_password),
        role="sales",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"user": user, "email": user.email, "password": plain_password}
