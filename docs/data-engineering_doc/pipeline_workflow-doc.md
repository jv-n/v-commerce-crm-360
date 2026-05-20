# Pipeline e Workflow

## Orquestração — Databricks Workflow

O pipeline é automatizado por um **Databricks Job** com três tasks sequenciais, uma por camada da Arquitetura Medalhão. O Job garante que o pipeline seja reprodutível, rastreável e executado na ordem correta.

**Visualização do Workflow:**

![Orquestração](orquestracao.png)

**Arquivo de configuração do Job:**

| Arquivo | Descrição |
|---|---|
| [`orquestracao.yaml`](./orquestracao.yaml) | Configuração completa do Databricks Job (tasks, dependências, agendamento) |

---

## Estrutura do Job

```
Job: vcommerce-pipeline
├── Task 1: bronze_ingestion
│     Notebook: 01_bronze_vcommerce
│     Depende de: (nenhuma)
│
├── Task 2: silver_transformation
│     Notebook: 02_silver_vcommerce
│     Depende de: bronze_ingestion
│
└── Task 3: gold_aggregation
      Notebook: 03_gold_vcommerce
      Depende de: silver_transformation
```

As tasks são conectadas sequencialmente via dependências de `depends_on` no YAML. A Task 2 só inicia após a Task 1 ser concluída com sucesso, e a Task 3 só inicia após a Task 2.

---

## Agendamento

O Job está configurado para execução **diária automática**, garantindo que os dados no banco local possam ser atualizados regularmente a partir do Databricks.

---

## Fluxo completo de dados

```
CSVs brutos (Google Drive)
         ↓
   Upload para o Volume Databricks
   /Volumes/vcommerce_catalog/vcommerce_bronze/vcommerce_vol/
         ↓
   [Task 1] 01_bronze_vcommerce.ipynb
   - Sanitização de nomes de colunas
   - Adição de timestamp_ingestion
   - Ingestão da API PTAX
   - Grava: vcommerce_catalog.vcommerce_bronze.*
         ↓
   [Task 2] 02_silver_vcommerce.ipynb
   - Deduplicação via row_number()
   - Limpeza e padronização de valores
   - Criação de colunas derivadas
   - Modelagem dimensional (dims + fatos)
   - Grava: vcommerce_catalog.vcommerce_silver.*
         ↓
   [Task 3] 03_gold_vcommerce.ipynb
   - Agregações orientadas ao negócio
   - Cálculo de métricas (KPIs, NPS, ratios)
   - Desnormalização para consumo direto
   - Exporta CSVs → data-engineering/gold-data-csvs/
   - Grava: vcommerce_catalog.vcommerce_gold.*
         ↓
   seed.py
   - Lê CSVs da pasta gold-data-csvs/
   - Popula backend/database/vcommerce.db (SQLite)
         ↓
   Backend FastAPI + Agente de IA
   - Consomem vcommerce.db para endpoints e queries
```

---

## Como executar o pipeline

### Execução completa no Databricks (recomendado)

1. Faça o upload dos CSVs do dataset para o Volume `vcommerce_vol` (veja instrução na [documentação Bronze](./bronze_layer-doc.md))
2. No workspace Databricks, acesse o Job configurado e clique em **Run now**
3. Aguarde a execução das três tasks (o log de cada task fica disponível na interface do Job)
4. Após conclusão, exporte os CSVs gerados da pasta `gold-data-csvs` do Databricks para a pasta local `data-engineering/gold-data-csvs/`
5. Execute o seed do banco: `python backend/database/seed.py`

### Execução manual de um notebook específico

Caso precise re-executar apenas uma camada:
1. Abra o notebook correspondente no Databricks (`01_bronze_vcommerce`, `02_silver_vcommerce` ou `03_gold_vcommerce`)
2. Clique em **Run All** ou execute as células individualmente
3. Todos os notebooks são idempotentes — podem ser re-executados sem efeitos colaterais

---

## Configuração do YAML do Job

O arquivo `orquestracao.yaml` define o Job completo. Os campos principais são:

| Campo | Descrição |
|---|---|
| `name` | Nome do Job (ex: `vcommerce-pipeline`) |
| `tasks` | Lista das tasks com nome, notebook path e dependências |
| `depends_on` | Define a ordem de execução entre tasks |
| `schedule` | Expressão cron para execução automática diária |
| `cluster` | Configuração do cluster Databricks (tipo de instância, runtime) |

---

## Decisões de projeto do pipeline

**Por que append + deduplicação em vez de overwrite?**
O modo `append` na Bronze garante que ingestões anteriores nunca sejam perdidas — o histórico de cargas fica preservado no Delta. A deduplicação na Silver (via `row_number()` por `timestamp_ingestion DESC`) neutraliza os duplicados antes de gravar nas camadas superiores.

**Por que SQLite e não manter no Databricks?**
O SQLite elimina a dependência do Databricks para rodar o backend localmente. As tabelas Gold já chegam desnormalizadas e otimizadas, com um volume final compatível com SQLite. A troca para PostgreSQL exige apenas alterar a connection string no backend.

**Por que desnormalizar na Gold?**
As tabelas Gold são consumidas tanto pelo backend FastAPI (endpoints síncronos) quanto pelo agente de IA (que gera queries em tempo real). Tabelas desnormalizadas eliminam JOINs em tempo de consulta, simplificam os endpoints e melhoram a performance das queries do agente — que trabalha com `SELECT` simples sobre as tabelas Gold.
