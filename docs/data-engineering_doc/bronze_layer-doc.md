# Camada Bronze

## Visão Geral

A camada Bronze é o primeiro estágio da Arquitetura Medalhão. Seu papel é **ingerir os dados exatamente como vieram da fonte** — sem nenhuma transformação de negócio — e armazená-los como tabelas Delta no Databricks. Essa camada é a fonte de verdade imutável: qualquer problema encontrado nos dados pode ser rastreado até aqui.

Além da ingestão dos CSVs operacionais, a camada Bronze também realiza uma ingestão via API: a cotação do dólar (PTAX) do Banco Central, coletada para o período de operação da V-Commerce (2018 até hoje), e armazenada como tabela Delta adicional.

**Notebook:** `01_bronze_vcommerce.ipynb`  
**Destino:** `vcommerce_catalog.vcommerce_bronze.*` (Delta Lake no Databricks)  
**Landing Zone:** Volume Databricks `vcommerce_vol` (`/Volumes/vcommerce_catalog/vcommerce_bronze/vcommerce_vol/`)

---

## Infraestrutura criada pelo notebook

O notebook é idempotente: todas as operações usam `CREATE ... IF NOT EXISTS`, portanto pode ser re-executado sem efeitos colaterais.

| Recurso | Nome | Tipo |
|---|---|---|
| Catálogo | `vcommerce_catalog` | Unity Catalog |
| Schema | `vcommerce_bronze` | Schema Delta |
| Volume | `vcommerce_vol` | Volume Databricks (landing zone) |

---

## Tabelas ingeridas

| Tabela Bronze | Arquivo CSV de origem | Volume aprox. |
|---|---|---|
| `bronze.clientes` | `clientes.csv` | 60.000 registros |
| `bronze.pedidos` | `pedidos.csv` | 310.000 registros |
| `bronze.catalogo_produtos` | `catalogo_produtos.csv` | 500 registros |
| `bronze.suporte_tickets` | `tickets_suporte.csv` | 35.000 registros |
| `bronze.clickstream` | `clickstream.csv` | 500.000 eventos |
| `bronze.avaliacoes` | `avaliacoes.csv` | 150.000 registros |
| `bronze.ptax` | API Banco Central (PTAX) | Cotações diárias desde 2018 |

---

## Localização dos CSVs no DBFS

Os arquivos devem ser carregados manualmente no Volume antes da execução do notebook:

```
/Volumes/vcommerce_catalog/vcommerce_bronze/vcommerce_vol/clientes.csv
/Volumes/vcommerce_catalog/vcommerce_bronze/vcommerce_vol/pedidos.csv
/Volumes/vcommerce_catalog/vcommerce_bronze/vcommerce_vol/catalogo_produtos.csv
/Volumes/vcommerce_catalog/vcommerce_bronze/vcommerce_vol/tickets_suporte.csv
/Volumes/vcommerce_catalog/vcommerce_bronze/vcommerce_vol/clickstream.csv
/Volumes/vcommerce_catalog/vcommerce_bronze/vcommerce_vol/avaliacoes.csv
```

**Como fazer o upload:** No workspace do Databricks, acesse Catalog → vcommerce_catalog → vcommerce_bronze → vcommerce_vol → Upload to this volume.

---

## Tratamentos aplicados na Bronze

A Bronze é a única camada que permite ajustes técnicos de ingestão (não de negócio). Dois tratamentos são aplicados a todos os arquivos:

### 1. Sanitização de nomes de colunas

O Delta Lake não aceita certos caracteres especiais em nomes de colunas (espaços, parênteses, vírgulas, ponto-e-vírgulas, chaves, colchetes etc.). A função `sanitize_column_names()` substitui qualquer caractere inválido por `_` e remove underscores duplicados, iniciais e finais:

```python
def clean(name: str) -> str:
    cleaned = re.sub(r"[^\w]", "_", name)      # substitui inválidos por _
    cleaned = re.sub(r"_+", "_", cleaned)       # remove underscores duplos
    return cleaned.strip("_")
```

Isso é aplicado automaticamente a todos os DataFrames antes da escrita Delta.

### 2. Adição de `timestamp_ingestion`

Toda tabela Bronze recebe a coluna `timestamp_ingestion` com o instante exato de carga:

```python
df = df.withColumn("timestamp_ingestion", F.current_timestamp())
```

Essa coluna é fundamental para a **deduplicação na camada Silver**: quando um arquivo é reingerido, a Silver usa `row_number()` ordenado por `timestamp_ingestion DESC` para manter apenas a versão mais recente de cada registro.

### 3. Modo de escrita `append` + `overwriteSchema`

Todas as tabelas usam modo `append` para suportar reprocessamentos sem perda de histórico. O `overwriteSchema=true` permite que mudanças de schema (ex: novas colunas) não causem erro.

### 4. Ingestão da API PTAX

O notebook consulta a API pública do Banco Central do Brasil para obter as cotações diárias do dólar (venda) desde a fundação da V-Commerce (01/01/2018). Os parâmetros `data_inicio` e `data_fim` podem ser sobrescritos via widgets ou Jobs no Databricks:

```python
data_inicio = '01-01-2018'
data_fim    = datetime.today().strftime('%m-%d-%Y')
```

---

## Opções de leitura dos CSVs

| Opção | Valor | Motivo |
|---|---|---|
| `header` | `true` | Primeira linha é o cabeçalho |
| `inferSchema` | `true` | Tipos inferidos automaticamente — aceitável na Bronze |
| `multiLine` | `true` | Tolera quebras de linha dentro de campos de texto |
| `escape` | `"` | Trata aspas escapadas corretamente |
| `encoding` | `UTF-8` | Charset padrão dos CSVs |

---

## Como adicionar uma nova tabela

1. Faça o upload do CSV para o Volume `vcommerce_vol` no Databricks
2. Adicione uma entrada no dicionário de configuração de ingestão do notebook, com o nome do arquivo e o nome da tabela Delta de destino
3. Execute a célula de ingestão — a sanitização de colunas e o `timestamp_ingestion` são aplicados automaticamente
4. Verifique a tabela criada em `vcommerce_catalog.vcommerce_bronze.<nome_tabela>`
