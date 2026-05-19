# Camada Bronze

## Visão Geral

> Descreva brevemente o objetivo da camada Bronze no pipeline da V-Commerce.

**Notebook:** `01_bronze_vcommerce.ipynb`  
**Destino:** `bronze.*` (Delta Lake no Databricks)

---

## Tabelas ingeridas

| Tabela | Arquivo CSV de origem | Volume aprox. |
|---|---|---|
| `bronze.catalogo_produtos` | `catalogo_produtos.csv` | |
| `bronze.clientes` | `clientes.csv` | |
| `bronze.pedidos` | `pedidos.csv` | |
| `bronze.tickets_suporte` | `tickets_suporte.csv` | |
| `bronze.clickstream` | `clickstream.csv` | |
| `bronze.avaliacoes` | `avaliacoes.csv` | |

---

## Localização dos arquivos no DBFS

```
# Preencha com o caminho real utilizado pelo time
dbfs:/FileStore/...
```

---

## Tratamentos aplicados na Bronze

> A Bronze não transforma dados — descreva apenas os ajustes necessários para a ingestão (ex: sanitização de nomes de colunas, adição de timestamp).

| Ajuste | Motivo |
|---|---|
| Sanitização de nomes de colunas | Caracteres especiais incompatíveis com Delta Lake |
| Adição de `timestamp_ingestion` | Rastreabilidade da carga |

---

## Como adicionar uma nova tabela

> Descreva o passo a passo para incluir um novo CSV no pipeline Bronze.

1.
2.
3.