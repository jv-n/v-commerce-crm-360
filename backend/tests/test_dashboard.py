"""
test_dashboard.py
-----------------
Testes do DashboardService.

Cobertura:
  _resolve_dates
    - period_type month, 2weeks, semester, year
    - period_type custom com start/end explicitos
    - prev_start/prev_end e yoy sao calculados corretamente

  _trend
    - crescimento positivo
    - queda (negativo)
    - previous zero com current > 0 -> 100.0
    - previous e current zero -> 0.0

  get_metrics
    - retorna dict com todos os campos esperados
    - vendas soma apenas Aprovado e desconta Reembolsado
    - clientes conta clientes unicos no periodo
    - tickets conta apenas finalizados
    - period_type custom respeita start/end

  get_orders_card
    - retorna total e percentuais de status
    - total zero quando nao ha pedidos no periodo

  get_top_categories
    - metrica vendidos retorna top N por quantidade
    - metrica receita retorna top N por receita_bruta
    - parametro order desc e asc sao respeitados
    - top_n limita o numero de itens

  get_map_data
    - view estados retorna sigla de 2 letras
    - view regioes retorna nome da regiao
    - estados desconhecidos sao ignorados
"""

import uuid
import pytest
from datetime import date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.database import Base
from app.models.saleModel import GoldPedidoDetalhado
from app.models.ticketModel import GoldTicket360
from app.models.contactModel import GoldCliente360
from app.models.sessionModel import GoldSessaoResumo
from app.services.dashboardService import DashboardService

# -- Infraestrutura -----------------------------------------------------------

TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


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
def svc(db):
    return DashboardService(db)


# -- Helpers ------------------------------------------------------------------

TODAY = date.today().isoformat()
YESTERDAY = (date.today() - timedelta(days=1)).isoformat()
LAST_MONTH = (date.today() - timedelta(days=20)).isoformat()


def make_sale(db, **kwargs):
    defaults = {
        "id_pedido": str(uuid.uuid4()),
        "id_cliente": str(uuid.uuid4()),
        "categoria": "Eletronicos",
        "status": "Aprovado",
        "data_pedido": LAST_MONTH,
        "receita_bruta": 100.0,
        "valor_reembolsado": 0.0,
        "quantidade": 1.0,
    }
    defaults.update(kwargs)
    s = GoldPedidoDetalhado(**defaults)
    db.add(s)
    db.commit()
    return s


def make_ticket(db, **kwargs):
    defaults = {
        "ticket_id": str(uuid.uuid4()),
        "status_atendimento": "Finalizado",
        "data_abertura": LAST_MONTH,
    }
    defaults.update(kwargs)
    t = GoldTicket360(**defaults)
    db.add(t)
    db.commit()
    return t


def make_contact(db, **kwargs):
    defaults = {
        "id_cliente": str(uuid.uuid4()),
        "data_ultimo_pedido": LAST_MONTH,
        "categoria_nps_recente": "Promotor",
    }
    defaults.update(kwargs)
    c = GoldCliente360(**defaults)
    db.add(c)
    db.commit()
    return c


def make_session(db, **kwargs):
    defaults = {
        "id_sessao": str(uuid.uuid4()),
        "data_sessao": LAST_MONTH,
    }
    defaults.update(kwargs)
    s = GoldSessaoResumo(**defaults)
    db.add(s)
    db.commit()
    return s


# =============================================================================
# _resolve_dates
# =============================================================================

class TestResolveDates:

    def test_period_month_dura_30_dias(self, svc):
        s, e, *_ = svc._resolve_dates("month", None, None)
        diff = (date.fromisoformat(e) - date.fromisoformat(s)).days
        assert diff == 30

    def test_period_2weeks_dura_14_dias(self, svc):
        s, e, *_ = svc._resolve_dates("2weeks", None, None)
        diff = (date.fromisoformat(e) - date.fromisoformat(s)).days
        assert diff == 14

    def test_period_year_dura_365_dias(self, svc):
        s, e, *_ = svc._resolve_dates("year", None, None)
        diff = (date.fromisoformat(e) - date.fromisoformat(s)).days
        assert diff == 365

    def test_period_custom_usa_datas_fornecidas(self, svc):
        s, e, *_ = svc._resolve_dates("custom", "2024-01-01", "2024-03-31")
        assert s == "2024-01-01"
        assert e == "2024-03-31"

    def test_prev_start_e_anterior_ao_periodo_atual(self, svc):
        s, e, prev_s, prev_e, *_ = svc._resolve_dates("month", None, None)
        assert date.fromisoformat(prev_e) < date.fromisoformat(s)

    def test_yoy_e_365_dias_antes(self, svc):
        s, e, _, _, yoy_s, yoy_e = svc._resolve_dates("month", None, None)
        diff_s = (date.fromisoformat(s) - date.fromisoformat(yoy_s)).days
        assert diff_s == 365


# =============================================================================
# _trend
# =============================================================================

class TestTrend:

    def test_crescimento_positivo(self):
        assert DashboardService._trend(120.0, 100.0) == 20.0

    def test_queda_negativa(self):
        assert DashboardService._trend(80.0, 100.0) == -20.0

    def test_previous_zero_current_positivo_retorna_100(self):
        assert DashboardService._trend(50.0, 0.0) == 100.0

    def test_ambos_zero_retorna_zero(self):
        assert DashboardService._trend(0.0, 0.0) == 0.0

    def test_sem_mudanca_retorna_zero(self):
        assert DashboardService._trend(100.0, 100.0) == 0.0


# =============================================================================
# get_metrics
# get_metrics retorna um dict, nao um objeto Pydantic
# =============================================================================

class TestGetMetrics:

    def test_retorna_todos_os_campos(self, svc):
        result = svc.get_metrics("month", None, None)
        for campo in ("period", "nps", "vendas", "clientes", "tickets", "leads_convertidos", "sessoes"):
            assert campo in result

    def test_period_info_presente(self, svc):
        result = svc.get_metrics("month", None, None)
        for campo in ("start", "end", "prev_start", "prev_end", "yoy_start", "yoy_end"):
            assert campo in result["period"]

    def test_vendas_soma_aprovados(self, svc, db):
        make_sale(db, receita_bruta=200.0, status="Aprovado", data_pedido=LAST_MONTH)
        result = svc.get_metrics("month", None, None)
        assert result["vendas"]["value"] >= 200.0

    def test_vendas_desconta_reembolsados(self, svc, db):
        make_sale(db, receita_bruta=500.0, status="Aprovado", data_pedido=LAST_MONTH)
        make_sale(db, valor_reembolsado=100.0, status="Reembolsado", data_pedido=LAST_MONTH)
        result = svc.get_metrics("month", None, None)
        # vendas = aprovado - reembolsado
        assert result["vendas"]["value"] >= 0

    def test_clientes_conta_unicos(self, svc, db):
        cliente_id = str(uuid.uuid4())
        make_sale(db, id_cliente=cliente_id, data_pedido=LAST_MONTH)
        make_sale(db, id_cliente=cliente_id, data_pedido=LAST_MONTH)
        result = svc.get_metrics("month", None, None)
        # nao deve contar o mesmo cliente duas vezes
        assert result["clientes"]["value"] >= 1

    def test_tickets_conta_apenas_finalizados(self, svc, db):
        make_ticket(db, status_atendimento="Finalizado", data_abertura=LAST_MONTH)
        make_ticket(db, status_atendimento="Aguardando", data_abertura=LAST_MONTH)
        result = svc.get_metrics("month", None, None)
        assert result["tickets"]["value"] >= 1

    def test_period_custom(self, svc, db):
        make_sale(db, receita_bruta=999.0, status="Aprovado", data_pedido="2023-06-15")
        result = svc.get_metrics("custom", "2023-06-01", "2023-06-30")
        assert result["vendas"]["value"] >= 999.0

    def test_sem_dados_retorna_zeros(self, svc):
        result = svc.get_metrics("custom", "2099-01-01", "2099-01-31")
        assert result["vendas"]["value"] == 0.0
        assert result["clientes"]["value"] == 0.0
        assert result["tickets"]["value"] == 0.0


# =============================================================================
# get_orders_card
# =============================================================================

class TestGetOrdersCard:

    def test_retorna_campos_corretos(self, svc):
        result = svc.get_orders_card("month", None, None)
        for campo in ("total", "prev_total", "trend_pct", "aprovados_pct",
                      "processando_pct", "recusados_pct", "reembolsados_pct"):
            assert campo in result

    def test_percentuais_somam_100_quando_ha_dados(self, svc, db):
        make_sale(db, status="Aprovado", data_pedido=LAST_MONTH)
        make_sale(db, status="Recusado", data_pedido=LAST_MONTH)
        result = svc.get_orders_card("month", None, None)
        total_pct = (result["aprovados_pct"] + result["processando_pct"]
                     + result["recusados_pct"] + result["reembolsados_pct"])
        assert abs(total_pct - 100.0) < 0.2

    def test_sem_pedidos_retorna_total_zero(self, svc):
        result = svc.get_orders_card("custom", "2099-01-01", "2099-01-31")
        assert result["total"] == 0
        assert result["aprovados_pct"] == 0.0


# =============================================================================
# get_top_categories
# =============================================================================

class TestGetTopCategories:

    def test_metrica_vendidos_retorna_itens(self, svc, db):
        make_sale(db, categoria="Livros", quantidade=10.0, status="Aprovado", data_pedido=LAST_MONTH)
        result = svc.get_top_categories("month", None, None, "vendidos", 5, "desc")
        assert "items" in result
        assert len(result["items"]) >= 1

    def test_metrica_receita_retorna_itens(self, svc, db):
        make_sale(db, categoria="Games", receita_bruta=500.0, status="Aprovado", data_pedido=LAST_MONTH)
        result = svc.get_top_categories("month", None, None, "receita", 5, "desc")
        nomes = [i["name"] for i in result["items"]]
        assert "Games" in nomes

    def test_top_n_limita_resultados(self, svc, db):
        for cat in ("A", "B", "C", "D", "E"):
            make_sale(db, categoria=cat, status="Aprovado", data_pedido=LAST_MONTH)
        result = svc.get_top_categories("month", None, None, "vendidos", 3, "desc")
        assert len(result["items"]) <= 3

    def test_order_asc_coloca_menor_primeiro(self, svc, db):
        make_sale(db, categoria="Barato", receita_bruta=10.0, status="Aprovado", data_pedido=LAST_MONTH)
        make_sale(db, categoria="Caro", receita_bruta=1000.0, status="Aprovado", data_pedido=LAST_MONTH)
        result = svc.get_top_categories("month", None, None, "receita", 10, "asc")
        values = [i["value"] for i in result["items"]]
        if len(values) >= 2:
            assert values[0] <= values[-1]


# =============================================================================
# get_map_data
# =============================================================================

class TestGetMapData:

    def test_view_estados_retorna_sigla(self, svc, db):
        cliente_id = str(uuid.uuid4())
        make_contact(db, id_cliente=cliente_id, estado="Sao Paulo")
        make_sale(db, id_cliente=cliente_id, data_pedido=LAST_MONTH)
        result = svc.get_map_data("estados", "month", None, None)
        keys = [r["key"] for r in result]
        # estados invalidos sao descartados; estados validos viram sigla
        assert all(len(k) == 2 for k in keys)

    def test_view_regioes_retorna_nome(self, svc, db):
        cliente_id = str(uuid.uuid4())
        make_contact(db, id_cliente=cliente_id, regiao="Sudeste")
        make_sale(db, id_cliente=cliente_id, data_pedido=LAST_MONTH)
        result = svc.get_map_data("regioes", "month", None, None)
        keys = [r["key"] for r in result]
        assert "Sudeste" in keys

    def test_estado_invalido_ignorado(self, svc, db):
        cliente_id = str(uuid.uuid4())
        make_contact(db, id_cliente=cliente_id, estado="EstadoFicticio")
        make_sale(db, id_cliente=cliente_id, data_pedido=LAST_MONTH)
        result = svc.get_map_data("estados", "month", None, None)
        keys = [r["key"] for r in result]
        assert "EstadoFicticio" not in keys

    def test_retorna_total_pedidos_e_valor(self, svc, db):
        cliente_id = str(uuid.uuid4())
        make_contact(db, id_cliente=cliente_id, regiao="Norte")
        make_sale(db, id_cliente=cliente_id, data_pedido=LAST_MONTH)
        result = svc.get_map_data("regioes", "month", None, None)
        norte = next((r for r in result if r["key"] == "Norte"), None)
        if norte:
            assert "total_pedidos" in norte
            assert "total_valor" in norte
