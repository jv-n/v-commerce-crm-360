# Documentação Data Engineering

Documentação do pipeline de dados do V-Commerce CRM 360, desenvolvido no **Databricks** com **PySpark** seguindo a **Arquitetura Medalhão**.

---

## Arquivos

| Arquivo | Descrição |
|---|---|
| [Camada Bronze](./bronze_layer-doc.md) | Ingestão dos CSVs brutos sem transformação |
| [Camada Silver](./silver_layer-doc.md) | Limpeza, padronização e enriquecimento dos dados |
| [Camada Gold](./gold_layer-doc.md) | Data Marts agregados prontos para o CRM e o agente |
| [Pipeline e Workflow](./pipeline-workflow-doc.md) | Orquestração, agendamento e execução no Databricks |

---

## Notebooks

| Notebook | Camada | Descrição |
|---|---|---|
| `01_bronze_vcommerce.ipynb` | Bronze | Ingestão de todos os CSVs como tabelas Delta |
| `02_silver_vcommerce.ipynb` | Silver | Limpeza e padronização de todas as tabelas |
| `03_gold_vcommerce.ipynb` | Gold | Construção dos Data Marts analíticos |

---

## Tabelas por camada

**Bronze** — espelho exato dos CSVs de origem:
`catalogo_produtos`, `clientes`, `pedidos`, `tickets_suporte`, `clickstream`, `avaliacoes`

**Silver** — dados limpos e enriquecidos:
`dim_produtos`, `dim_clientes`, `dim_categorias_produto`, `dim_status_pedido`, `dim_tipos_problema`, `dim_agentes_suporte`, `ft_pedidos`, `ft_avaliacoes`, `ft_tickets_suporte`, `ft_clickstream`

**Gold** — agregações prontas para consumo:
`gold_cliente_360`, `gold_kpis_vendas_mensal`, `gold_vendas_por_dimensao`, `gold_desempenho_produto`, `gold_analise_suporte_por_tipo`, `gold_analise_suporte_por_agente`, `gold_satisfacao_nps`

---

## Stack

- Databricks (PySpark)
- Delta Lake
- Databricks Workflows