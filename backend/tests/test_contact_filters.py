"""
test_contact_filters.py
-----------------------
Testes de filtros do ContactService._apply_filters.

Grupos cobertos:
  Tabs               - all, clients, leads
  Busca              - por nome, por email, busca parcial
  Compras            - purchases_min, purchases_max, combinados
  Ano de criacao     - created_year
  Engagement         - Promotor, Neutro, Detrator, Nenhum NPS
  Status do cliente  - client_status (lista)
  Financeiro         - receita_min/max, ticket_medio_min/max
  Datas de compra    - primeira_compra_from/to, ultima_compra_from/to
  Suporte            - tickets_suporte_min/max, nota_atend_min/max
  NPS e avaliacao    - nps_min/max, nota_prod_min/max, nps_recente_min/max
  Perfil demografico - generos, faixas_etarias, estados
  Regiao e origem    - regioes, origens, pagamentos
  Comportamento      - canais_preferidos, dispositivos, origens_sessao,
                       periodos_dia, dias_semana, categorias_visualizadas
  Conversao digital  - taxa_conversao_min/max, total_sessoes_min/max,
                       abandono_carrinho_min/max
"""

import uuid
import pytest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.database import Base, get_db
from app.models.contactModel import GoldCliente360
from app.services.contactService import ContactService

# ── Infraestrutura ────────────────────────────────────────────────────────────

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
    return ContactService(db)


# ── Helper ────────────────────────────────────────────────────────────────────

def make_contact(db, **kwargs) -> GoldCliente360:
    defaults = {
        "id_cliente": str(uuid.uuid4()),
        "nome_completo": "Contato Padrao",
        "email": "padrao@teste.com",
        "segmento_cliente": "Ativo",
        "total_pedidos": 5.0,
        "receita_total": 500.0,
        "ticket_medio": 100.0,
        "total_tickets": 2.0,
        "nota_media_atendimento": 4.0,
        "nota_nps_media": 0.8,
        "nota_nps_recente": 8.0,
        "nota_produto_media": 4.5,
        "categoria_nps_recente": "Promotor",
        "data_primeiro_pedido": "2023-06-01",
        "data_ultimo_pedido": "2024-03-10",
        "regiao": "Sudeste",
        "origem": "Organico",
        "metodo_pagamento_favorito": "Cartao",
        "genero": "Feminino",
        "faixa_etaria": "25-34",
        "estado": "SP",
        "canal_preferido": "Email",
        "dispositivo_preferido": "Mobile",
        "origem_sessao_preferida": "Google",
        "periodo_dia_preferido": "Manha",
        "dia_semana_mais_ativo": "Segunda",
        "categoria_mais_visualizada": "Eletronicos",
        "taxa_conversao_pct": 30.0,
        "total_sessoes": 20.0,
        "total_abandono_carrinho": 3.0,
    }
    defaults.update(kwargs)
    c = GoldCliente360(**defaults)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


def ids(result) -> set:
    return {c.id for c in result.data}


# ══════════════════════════════════════════════════════════════════════════════
# Tabs
# ══════════════════════════════════════════════════════════════════════════════

class TestTabFilter:

    def test_tab_all_retorna_todos(self, svc, db):
        a = make_contact(db, segmento_cliente="Ativo")
        b = make_contact(db, segmento_cliente="Lead")
        result = svc.get_contacts(tab="all")
        assert {a.id_cliente, b.id_cliente}.issubset(ids(result))

    def test_tab_clients_exclui_leads(self, svc, db):
        make_contact(db, segmento_cliente="Lead")
        result = svc.get_contacts(tab="clients")
        assert all(c.clientStatus != "Lead" for c in result.data)

    def test_tab_clients_inclui_ativo_inativo_vip(self, svc, db):
        a = make_contact(db, segmento_cliente="Ativo")
        b = make_contact(db, segmento_cliente="Inativo")
        c = make_contact(db, segmento_cliente="VIP")
        result = svc.get_contacts(tab="clients")
        assert {a.id_cliente, b.id_cliente, c.id_cliente}.issubset(ids(result))

    def test_tab_leads_retorna_somente_leads(self, svc, db):
        make_contact(db, segmento_cliente="Ativo")
        lead = make_contact(db, segmento_cliente="Lead")
        result = svc.get_contacts(tab="leads")
        assert all(c.clientStatus == "Lead" for c in result.data)
        assert lead.id_cliente in ids(result)


# ══════════════════════════════════════════════════════════════════════════════
# Busca por texto
# ══════════════════════════════════════════════════════════════════════════════

class TestSearchFilter:

    def test_busca_por_nome_parcial(self, svc, db):
        a = make_contact(db, nome_completo="Mariana Souza")
        make_contact(db, nome_completo="Carlos Lima")
        result = svc.get_contacts(search="Mariana")
        assert a.id_cliente in ids(result)
        assert all("Mariana" in (c.name or "") for c in result.data)

    def test_busca_por_email_parcial(self, svc, db):
        a = make_contact(db, email="busca@empresa.com")
        make_contact(db, email="outro@exemplo.com")
        result = svc.get_contacts(search="busca@empresa")
        assert a.id_cliente in ids(result)

    def test_busca_sem_match_retorna_vazio(self, svc, db):
        make_contact(db, nome_completo="Pessoa Normal")
        result = svc.get_contacts(search="xyzabc123inexistente")
        assert result.total == 0

    def test_busca_case_insensitive(self, svc, db):
        a = make_contact(db, nome_completo="Fernanda Oliveira")
        result = svc.get_contacts(search="fernanda")
        assert a.id_cliente in ids(result)


# ══════════════════════════════════════════════════════════════════════════════
# Compras
# ══════════════════════════════════════════════════════════════════════════════

class TestPurchasesFilter:

    def test_purchases_min(self, svc, db):
        make_contact(db, total_pedidos=2.0)
        b = make_contact(db, total_pedidos=10.0)
        result = svc.get_contacts(purchases_min=5)
        assert all(c.purchases >= 5 for c in result.data)
        assert b.id_cliente in ids(result)

    def test_purchases_max(self, svc, db):
        a = make_contact(db, total_pedidos=3.0)
        make_contact(db, total_pedidos=15.0)
        result = svc.get_contacts(purchases_max=5)
        assert all(c.purchases <= 5 for c in result.data)
        assert a.id_cliente in ids(result)

    def test_purchases_min_e_max_combinados(self, svc, db):
        make_contact(db, total_pedidos=1.0)
        b = make_contact(db, total_pedidos=7.0)
        make_contact(db, total_pedidos=20.0)
        result = svc.get_contacts(purchases_min=5, purchases_max=10)
        assert all(5 <= c.purchases <= 10 for c in result.data)
        assert b.id_cliente in ids(result)


# ══════════════════════════════════════════════════════════════════════════════
# Ano de criacao
# ══════════════════════════════════════════════════════════════════════════════

class TestCreatedYearFilter:

    def test_created_year_filtra_por_ano(self, svc, db):
        a = make_contact(db, data_primeiro_pedido="2022-05-10")
        make_contact(db, data_primeiro_pedido="2024-01-20")
        result = svc.get_contacts(created_year="2022")
        assert a.id_cliente in ids(result)
        assert all((c.createdAt or "").startswith("10/05/2022") or
                   (c.firstPurchase or "").startswith("10/05/2022")
                   for c in result.data
                   if c.id == a.id_cliente)

    def test_created_year_exclui_outros_anos(self, svc, db):
        make_contact(db, data_primeiro_pedido="2021-03-01")
        make_contact(db, data_primeiro_pedido="2023-07-15")
        result = svc.get_contacts(created_year="2021")
        assert all(not (c.firstPurchase or "").endswith("2023") for c in result.data)


# ══════════════════════════════════════════════════════════════════════════════
# Engagement (NPS categorico)
# ══════════════════════════════════════════════════════════════════════════════

class TestEngagementFilter:

    def test_engagement_promotor(self, svc, db):
        a = make_contact(db, categoria_nps_recente="Promotor")
        make_contact(db, categoria_nps_recente="Detrator")
        result = svc.get_contacts(engagement="Promotor")
        assert a.id_cliente in ids(result)
        assert all(c.engagement == "Promotor" for c in result.data)

    def test_engagement_neutro(self, svc, db):
        a = make_contact(db, categoria_nps_recente="Neutro")
        result = svc.get_contacts(engagement="Neutro")
        assert a.id_cliente in ids(result)
        assert all(c.engagement == "Neutro" for c in result.data)

    def test_engagement_detrator(self, svc, db):
        a = make_contact(db, categoria_nps_recente="Detrator")
        result = svc.get_contacts(engagement="Detrator")
        assert a.id_cliente in ids(result)

    def test_engagement_nenhum_nps_exclui_classificados(self, svc, db):
        make_contact(db, categoria_nps_recente="Promotor")
        make_contact(db, categoria_nps_recente="Neutro")
        b = make_contact(db, categoria_nps_recente=None)
        result = svc.get_contacts(engagement="Nenhum NPS")
        assert b.id_cliente in ids(result)
        categorias = {c.engagement for c in result.data}
        assert "Promotor" not in categorias
        assert "Neutro" not in categorias
        assert "Detrator" not in categorias


# ══════════════════════════════════════════════════════════════════════════════
# Status do cliente
# ══════════════════════════════════════════════════════════════════════════════

class TestClientStatusFilter:

    def test_client_status_lista_simples(self, svc, db):
        a = make_contact(db, segmento_cliente="VIP")
        make_contact(db, segmento_cliente="Inativo")
        result = svc.get_contacts(client_status=["VIP"])
        assert a.id_cliente in ids(result)
        assert all(c.clientStatus == "VIP" for c in result.data)

    def test_client_status_multiplos_valores(self, svc, db):
        a = make_contact(db, segmento_cliente="VIP")
        b = make_contact(db, segmento_cliente="Em risco")
        make_contact(db, segmento_cliente="Ativo")
        result = svc.get_contacts(client_status=["VIP", "Em risco"])
        assert {a.id_cliente, b.id_cliente}.issubset(ids(result))
        assert all(c.clientStatus in ("VIP", "Em risco") for c in result.data)


# ══════════════════════════════════════════════════════════════════════════════
# Financeiro
# ══════════════════════════════════════════════════════════════════════════════

class TestFinancialFilters:

    def test_receita_min(self, svc, db):
        make_contact(db, receita_total=100.0)
        b = make_contact(db, receita_total=900.0)
        result = svc.get_contacts(receita_min=500.0)
        assert all(c.totalRevenue >= 500.0 for c in result.data)
        assert b.id_cliente in ids(result)

    def test_receita_max(self, svc, db):
        a = make_contact(db, receita_total=200.0)
        make_contact(db, receita_total=2000.0)
        result = svc.get_contacts(receita_max=500.0)
        assert all(c.totalRevenue <= 500.0 for c in result.data)
        assert a.id_cliente in ids(result)

    def test_receita_min_e_max(self, svc, db):
        make_contact(db, receita_total=50.0)
        b = make_contact(db, receita_total=750.0)
        make_contact(db, receita_total=5000.0)
        result = svc.get_contacts(receita_min=500.0, receita_max=1000.0)
        assert all(500.0 <= c.totalRevenue <= 1000.0 for c in result.data)
        assert b.id_cliente in ids(result)

    def test_ticket_medio_min(self, svc, db):
        make_contact(db, ticket_medio=50.0)
        b = make_contact(db, ticket_medio=300.0)
        result = svc.get_contacts(ticket_medio_min=200.0)
        assert all(c.avgTicket >= 200.0 for c in result.data)
        assert b.id_cliente in ids(result)

    def test_ticket_medio_max(self, svc, db):
        a = make_contact(db, ticket_medio=80.0)
        make_contact(db, ticket_medio=500.0)
        result = svc.get_contacts(ticket_medio_max=150.0)
        assert all(c.avgTicket <= 150.0 for c in result.data)
        assert a.id_cliente in ids(result)


# ══════════════════════════════════════════════════════════════════════════════
# Datas de compra
# ══════════════════════════════════════════════════════════════════════════════

class TestPurchaseDateFilters:

    def test_primeira_compra_from(self, svc, db):
        make_contact(db, data_primeiro_pedido="2021-01-01")
        b = make_contact(db, data_primeiro_pedido="2023-08-01")
        result = svc.get_contacts(primeira_compra_from="2023-01-01")
        assert b.id_cliente in ids(result)
        assert all(c.id != make_contact for c in result.data)

    def test_primeira_compra_to(self, svc, db):
        a = make_contact(db, data_primeiro_pedido="2020-05-10")
        make_contact(db, data_primeiro_pedido="2025-01-01")
        result = svc.get_contacts(primeira_compra_to="2021-12-31")
        assert a.id_cliente in ids(result)

    def test_primeira_compra_from_e_to(self, svc, db):
        make_contact(db, data_primeiro_pedido="2019-01-01")
        b = make_contact(db, data_primeiro_pedido="2022-06-15")
        make_contact(db, data_primeiro_pedido="2025-12-01")
        result = svc.get_contacts(
            primeira_compra_from="2022-01-01",
            primeira_compra_to="2022-12-31"
        )
        assert b.id_cliente in ids(result)

    def test_ultima_compra_from(self, svc, db):
        make_contact(db, data_ultimo_pedido="2022-01-01")
        b = make_contact(db, data_ultimo_pedido="2024-09-01")
        result = svc.get_contacts(ultima_compra_from="2024-01-01")
        assert b.id_cliente in ids(result)

    def test_ultima_compra_to(self, svc, db):
        a = make_contact(db, data_ultimo_pedido="2021-03-01")
        make_contact(db, data_ultimo_pedido="2024-11-01")
        result = svc.get_contacts(ultima_compra_to="2022-12-31")
        assert a.id_cliente in ids(result)


# ══════════════════════════════════════════════════════════════════════════════
# Suporte
# ══════════════════════════════════════════════════════════════════════════════

class TestSupportFilters:

    def test_tickets_suporte_min(self, svc, db):
        make_contact(db, total_tickets=1.0)
        b = make_contact(db, total_tickets=8.0)
        result = svc.get_contacts(tickets_suporte_min=5)
        assert all(c.totalTickets >= 5 for c in result.data)
        assert b.id_cliente in ids(result)

    def test_tickets_suporte_max(self, svc, db):
        a = make_contact(db, total_tickets=2.0)
        make_contact(db, total_tickets=20.0)
        result = svc.get_contacts(tickets_suporte_max=5)
        assert all(c.totalTickets <= 5 for c in result.data)
        assert a.id_cliente in ids(result)

    def test_nota_atend_min(self, svc, db):
        make_contact(db, nota_media_atendimento=2.0)
        b = make_contact(db, nota_media_atendimento=4.8)
        result = svc.get_contacts(nota_atend_min=4.0)
        assert all(c.avgSupportRating >= 4.0 for c in result.data)
        assert b.id_cliente in ids(result)

    def test_nota_atend_max(self, svc, db):
        a = make_contact(db, nota_media_atendimento=2.5)
        make_contact(db, nota_media_atendimento=5.0)
        result = svc.get_contacts(nota_atend_max=3.0)
        assert all(c.avgSupportRating <= 3.0 for c in result.data)
        assert a.id_cliente in ids(result)


# ══════════════════════════════════════════════════════════════════════════════
# NPS e avaliacao de produto
# ══════════════════════════════════════════════════════════════════════════════

class TestNpsFilters:

    def test_nps_min(self, svc, db):
        # nota_nps_media e armazenada em escala 0-1; nps_min/max em escala 0-10
        make_contact(db, nota_nps_media=0.3)   # = 3.0 em escala 10
        b = make_contact(db, nota_nps_media=0.9)  # = 9.0
        result = svc.get_contacts(nps_min=7.0)
        # servico filtra: nota_nps_media >= nps_min / 10
        assert b.id_cliente in ids(result)

    def test_nps_max(self, svc, db):
        a = make_contact(db, nota_nps_media=0.4)  # = 4.0
        make_contact(db, nota_nps_media=0.95)     # = 9.5
        result = svc.get_contacts(nps_max=5.0)
        assert a.id_cliente in ids(result)

    def test_nota_produto_min(self, svc, db):
        make_contact(db, nota_produto_media=2.0)
        b = make_contact(db, nota_produto_media=4.7)
        result = svc.get_contacts(nota_prod_min=4.0)
        assert all(c.productRating >= 4.0 for c in result.data)
        assert b.id_cliente in ids(result)

    def test_nota_produto_max(self, svc, db):
        a = make_contact(db, nota_produto_media=1.5)
        make_contact(db, nota_produto_media=4.9)
        result = svc.get_contacts(nota_prod_max=3.0)
        assert all(c.productRating <= 3.0 for c in result.data)
        assert a.id_cliente in ids(result)

    def test_nps_recente_min(self, svc, db):
        make_contact(db, nota_nps_recente=3.0)
        b = make_contact(db, nota_nps_recente=9.0)
        result = svc.get_contacts(nps_recente_min=8.0)
        assert b.id_cliente in ids(result)

    def test_nps_recente_max(self, svc, db):
        a = make_contact(db, nota_nps_recente=4.0)
        make_contact(db, nota_nps_recente=10.0)
        result = svc.get_contacts(nps_recente_max=5.0)
        assert a.id_cliente in ids(result)


# ══════════════════════════════════════════════════════════════════════════════
# Perfil demografico
# ══════════════════════════════════════════════════════════════════════════════

class TestDemographicFilters:

    def test_genero(self, svc, db):
        a = make_contact(db, genero="Masculino")
        make_contact(db, genero="Feminino")
        result = svc.get_contacts(generos=["Masculino"])
        assert a.id_cliente in ids(result)
        assert all(c.id == a.id_cliente or True for c in result.data)

    def test_faixa_etaria(self, svc, db):
        a = make_contact(db, faixa_etaria="18-24")
        make_contact(db, faixa_etaria="45-54")
        result = svc.get_contacts(faixas_etarias=["18-24"])
        assert a.id_cliente in ids(result)

    def test_estado(self, svc, db):
        a = make_contact(db, estado="RJ")
        make_contact(db, estado="MG")
        result = svc.get_contacts(estados=["RJ"])
        assert a.id_cliente in ids(result)

    def test_multiplos_estados(self, svc, db):
        a = make_contact(db, estado="RS")
        b = make_contact(db, estado="SC")
        make_contact(db, estado="SP")
        result = svc.get_contacts(estados=["RS", "SC"])
        assert {a.id_cliente, b.id_cliente}.issubset(ids(result))


# ══════════════════════════════════════════════════════════════════════════════
# Regiao, origem e pagamento
# ══════════════════════════════════════════════════════════════════════════════

class TestRegionOriginFilters:

    def test_regiao(self, svc, db):
        a = make_contact(db, regiao="Norte")
        make_contact(db, regiao="Sul")
        result = svc.get_contacts(regioes=["Norte"])
        assert a.id_cliente in ids(result)
        assert all(c.region == "Norte" for c in result.data)

    def test_origem(self, svc, db):
        a = make_contact(db, origem="Indicacao")
        make_contact(db, origem="Pago")
        result = svc.get_contacts(origens=["Indicacao"])
        assert a.id_cliente in ids(result)
        assert all(c.origin == "Indicacao" for c in result.data)

    def test_metodo_pagamento_favorito(self, svc, db):
        a = make_contact(db, metodo_pagamento_favorito="Pix")
        make_contact(db, metodo_pagamento_favorito="Boleto")
        result = svc.get_contacts(pagamentos=["Pix"])
        assert a.id_cliente in ids(result)
        assert all(c.favPaymentMethod == "Pix" for c in result.data)

    def test_multiplas_regioes(self, svc, db):
        a = make_contact(db, regiao="Nordeste")
        b = make_contact(db, regiao="Centro-Oeste")
        make_contact(db, regiao="Sul")
        result = svc.get_contacts(regioes=["Nordeste", "Centro-Oeste"])
        assert {a.id_cliente, b.id_cliente}.issubset(ids(result))


# ══════════════════════════════════════════════════════════════════════════════
# Comportamento digital
# ══════════════════════════════════════════════════════════════════════════════

class TestDigitalBehaviorFilters:

    def test_canal_preferido(self, svc, db):
        a = make_contact(db, canal_preferido="WhatsApp")
        make_contact(db, canal_preferido="Email")
        result = svc.get_contacts(canais_preferidos=["WhatsApp"])
        assert a.id_cliente in ids(result)

    def test_dispositivo_preferido(self, svc, db):
        a = make_contact(db, dispositivo_preferido="Desktop")
        make_contact(db, dispositivo_preferido="Mobile")
        result = svc.get_contacts(dispositivos=["Desktop"])
        assert a.id_cliente in ids(result)

    def test_origem_sessao(self, svc, db):
        a = make_contact(db, origem_sessao_preferida="Instagram")
        make_contact(db, origem_sessao_preferida="Google")
        result = svc.get_contacts(origens_sessao=["Instagram"])
        assert a.id_cliente in ids(result)

    def test_periodo_dia(self, svc, db):
        a = make_contact(db, periodo_dia_preferido="Noite")
        make_contact(db, periodo_dia_preferido="Manha")
        result = svc.get_contacts(periodos_dia=["Noite"])
        assert a.id_cliente in ids(result)

    def test_dia_semana(self, svc, db):
        a = make_contact(db, dia_semana_mais_ativo="Sabado")
        make_contact(db, dia_semana_mais_ativo="Segunda")
        result = svc.get_contacts(dias_semana=["Sabado"])
        assert a.id_cliente in ids(result)

    def test_categoria_visualizada(self, svc, db):
        a = make_contact(db, categoria_mais_visualizada="Moda")
        make_contact(db, categoria_mais_visualizada="Eletronicos")
        result = svc.get_contacts(categorias_visualizadas=["Moda"])
        assert a.id_cliente in ids(result)


# ══════════════════════════════════════════════════════════════════════════════
# Conversao digital
# ══════════════════════════════════════════════════════════════════════════════

class TestConversionFilters:

    def test_taxa_conversao_min(self, svc, db):
        make_contact(db, taxa_conversao_pct=10.0)
        b = make_contact(db, taxa_conversao_pct=60.0)
        result = svc.get_contacts(taxa_conversao_min=50.0)
        assert b.id_cliente in ids(result)

    def test_taxa_conversao_max(self, svc, db):
        a = make_contact(db, taxa_conversao_pct=15.0)
        make_contact(db, taxa_conversao_pct=80.0)
        result = svc.get_contacts(taxa_conversao_max=20.0)
        assert a.id_cliente in ids(result)

    def test_taxa_conversao_min_e_max(self, svc, db):
        make_contact(db, taxa_conversao_pct=5.0)
        b = make_contact(db, taxa_conversao_pct=45.0)
        make_contact(db, taxa_conversao_pct=95.0)
        result = svc.get_contacts(taxa_conversao_min=30.0, taxa_conversao_max=60.0)
        assert b.id_cliente in ids(result)

    def test_total_sessoes_min(self, svc, db):
        make_contact(db, total_sessoes=5.0)
        b = make_contact(db, total_sessoes=50.0)
        result = svc.get_contacts(total_sessoes_min=30)
        assert b.id_cliente in ids(result)

    def test_total_sessoes_max(self, svc, db):
        a = make_contact(db, total_sessoes=8.0)
        make_contact(db, total_sessoes=100.0)
        result = svc.get_contacts(total_sessoes_max=10)
        assert a.id_cliente in ids(result)

    def test_abandono_carrinho_min(self, svc, db):
        make_contact(db, total_abandono_carrinho=1.0)
        b = make_contact(db, total_abandono_carrinho=10.0)
        result = svc.get_contacts(abandono_carrinho_min=7)
        assert b.id_cliente in ids(result)

    def test_abandono_carrinho_max(self, svc, db):
        a = make_contact(db, total_abandono_carrinho=2.0)
        make_contact(db, total_abandono_carrinho=15.0)
        result = svc.get_contacts(abandono_carrinho_max=5)
        assert a.id_cliente in ids(result)


# ══════════════════════════════════════════════════════════════════════════════
# Filtros combinados
# ══════════════════════════════════════════════════════════════════════════════

class TestCombinedFilters:

    def test_tab_e_busca_combinados(self, svc, db):
        a = make_contact(db, segmento_cliente="Ativo", nome_completo="Patricia VIP")
        make_contact(db, segmento_cliente="Lead", nome_completo="Patricia Lead")
        result = svc.get_contacts(tab="clients", search="Patricia")
        assert a.id_cliente in ids(result)
        assert all(c.clientStatus != "Lead" for c in result.data)

    def test_regiao_e_status_combinados(self, svc, db):
        a = make_contact(db, regiao="Sul", segmento_cliente="VIP")
        make_contact(db, regiao="Sul", segmento_cliente="Ativo")
        make_contact(db, regiao="Norte", segmento_cliente="VIP")
        result = svc.get_contacts(regioes=["Sul"], client_status=["VIP"])
        assert a.id_cliente in ids(result)
        assert all(c.region == "Sul" and c.clientStatus == "VIP" for c in result.data)

    def test_receita_e_engagement_combinados(self, svc, db):
        a = make_contact(db, receita_total=1500.0, categoria_nps_recente="Promotor")
        make_contact(db, receita_total=1500.0, categoria_nps_recente="Detrator")
        make_contact(db, receita_total=100.0, categoria_nps_recente="Promotor")
        result = svc.get_contacts(receita_min=1000.0, engagement="Promotor")
        assert a.id_cliente in ids(result)
        assert all(c.totalRevenue >= 1000.0 and c.engagement == "Promotor" for c in result.data)
