# Camada Silver

## Visão Geral

A camada Silver transforma os dados brutos da Bronze em tabelas limpas, padronizadas e organizadas segundo a **modelagem dimensional** (esquema estrela). Cada tabela lê de `bronze.*`, aplica as transformações necessárias e grava em `silver.*`.

Esta é a camada onde acontece o trabalho pesado de qualidade de dados: deduplicação, correção de formatos, mapeamento de variações inconsistentes para valores canônicos, remoção de registros inválidos e criação de colunas derivadas relevantes para o negócio.

**Notebook:** `02_silver_vcommerce.ipynb`  
**Origem:** `vcommerce_catalog.vcommerce_bronze.*`  
**Destino:** `vcommerce_catalog.vcommerce_silver.*`

---

## Princípios aplicados em todas as tabelas

| Princípio | Como é feito |
|---|---|
| **Deduplicação** | `row_number()` sobre a chave primária, ordenado por `timestamp_ingestion DESC` — a última ingestão de cada registro vence |
| **Tipagem explícita** | Colunas lidas como `string` na Bronze recebem o tipo correto (`timestamp`, `decimal`, `boolean`, `int`) via cast explícito |
| **Sanitização textual** | Valores categóricos recebem `LOWER()` + `TRIM()` antes de qualquer mapeamento |
| **Nulos documentados** | Nulos legítimos (ex: tickets ainda abertos) são mantidos; nulos por problema de qualidade são corrigidos ou sinalizados |
| **Colunas derivadas** | Campos calculados relevantes para o negócio são adicionados na Silver, não na Gold |

---

## Tabelas produzidas

| Tabela | Tipo | Origem Bronze |
|---|---|---|
| `silver.dim_clientes` | Dimensão | `bronze.clientes` |
| `silver.dim_produtos` | Dimensão | `bronze.catalogo_produtos` |
| `silver.dim_categorias_produto` | Dimensão | `bronze.catalogo_produtos` |
| `silver.dim_status_pedido` | Dimensão | `bronze.pedidos` |
| `silver.dim_tipos_problema` | Dimensão | `bronze.suporte_tickets` |
| `silver.dim_agentes_suporte` | Dimensão | `bronze.suporte_tickets` |
| `silver.ft_pedidos` | Fato | `bronze.pedidos` |
| `silver.ft_avaliacoes` | Fato | `bronze.avaliacoes` |
| `silver.ft_tickets_suporte` | Fato | `bronze.suporte_tickets` |
| `silver.ft_clickstream` | Fato | `bronze.clickstream` |

---

## Tratamento por tabela

---

### `dim_clientes`

**Origem:** `bronze.clientes`

**Problemas identificados e tratamentos:**

| Coluna | Problema | Tratamento |
|---|---|---|
| `nome`, `sobrenome` | Variações de case (`JOAO`, `joao`, `João`) | `INITCAP()` + `TRIM()` |
| `email` | Case misto (`Joao@Gmail.com`) | `LOWER()` + `TRIM()` |
| `genero` | ~10 variações para 3 valores (`M`, `male`, `MASC`, `F`, `female`, `FEM`, `O`, `outro`) | Mapeamento canônico via `WHEN` → `Masculino`, `Feminino`, `Outro` |
| `origem` | Variações de case e sinônimos (`app`, `APP`, `App Mobile`, `web`, `WEB`, `Indicação`) | `LOWER()` + `TRIM()` + mapeamento canônico |
| `cidade` | Case misto | `INITCAP()` + `TRIM()` |
| `estado` | Case misto e variações (`RIO DE JANEIRO`, `rio de janeiro`) | `INITCAP()` com preposições em minúsculas |
| `regiao` | Variações de case | Normalização para `Norte`, `Nordeste`, `Centro-Oeste`, `Sudeste`, `Sul` |

**Colunas derivadas adicionadas:**

| Coluna | Lógica |
|---|---|
| `nome_completo` | Concatenação de `nome` + `sobrenome` |

---

### `dim_produtos` + `dim_categorias_produto`

**Origem:** `bronze.catalogo_produtos`

**Problemas identificados e tratamentos:**

| Coluna | Problema | Tratamento |
|---|---|---|
| `categoria` | 27 nulos + ~40 variações para 8 categorias reais (`cas@`, `Cas4`, `M0VEIS`, `3sportes`, `automotiv3`, `B3LEZA`, `BR1NQUEDOS`, `vest`, `elet`...) | Mapeamento canônico → 8 categorias; nulos → `'Indefinida'` |
| `ativo` | 10 formas para verdadeiro/falso (`S`, `SIM`, `Sim`, `1`, `True` / `N`, `NAO`, `0`, `False`) | Normalização para booleano |
| `preco` | 23 nulos + valores negativos (mín = -100.00) + valores zero | Nulos mantidos; valores ≤ 0 → `null` |
| `avaliacao_interna` | 100% nulo | Coluna removida — sem valor analítico |
| `peso_kg` / `estoque_disponivel` | 23 nulos cada | Mantidos como `null` |

**As 8 categorias canônicas de `dim_categorias_produto`:**
`Vestuário`, `Eletrônicos`, `Casa`, `Esportes`, `Automotivo`, `Beleza`, `Brinquedos`, `Móveis`

---

### `ft_pedidos`

**Origem:** `bronze.pedidos`

**Problemas identificados e tratamentos:**

| Coluna | Problema | Tratamento |
|---|---|---|
| `valor_pedido` | Valores em string com símbolos monetários (`R`, `r`, `$`), espaços, vírgula decimal e valores negativos. Inconsistência entre valor informado e valor calculado (qtd × preço) | Limpeza de string → cast para `decimal`; valores negativos → `null` |
| `status` | Variações de case e sinônimos | Mapeamento canônico para valores padronizados |
| `data_pedido` | Formato ISO 8601 com timezone lido como `string` | Cast para `timestamp` |

**Colunas derivadas adicionadas:**

| Coluna | Lógica |
|---|---|
| `ano_mes` | `DATE_FORMAT(data_pedido, 'yyyy-MM')` — usada para agregações mensais na Gold |

**Decisão de projeto:** Não foram encontradas duplicatas reais por `id_pedido` na Bronze, mas a deduplicação preventiva via `row_number()` foi mantida para robustez.

---

### `ft_tickets_suporte`

**Origem:** `bronze.suporte_tickets`

**Problemas identificados e tratamentos:**

| Coluna | Problema | Tratamento |
|---|---|---|
| `tipo_problema` | ~25 variações para 4 categorias reais (`pro`, `p3oduto`, `PRODUCT`, `DELAY`, `reemb`, `REFUND`, `pag`, `PAYMENT`) | Mapeamento canônico → `Entrega`, `Reembolso`, `Produto`, `Pagamento` |
| `data_resolucao` | 2.072 nulos — tickets ainda abertos | Mantidos como `null`; coluna derivada `resolvido = false` |
| `nota_avaliacao` | 2.072 nulos — sem avaliação para tickets abertos | Mantidos como `null` |
| `tempo_resolucao_horas` | 2.072 nulos (tickets abertos) + valores inconsistentes com a diferença real entre datas | Nulos mantidos; recalculado via `(unix_timestamp(data_resolucao) - unix_timestamp(data_abertura)) / 3600` |
| `data_abertura`, `data_resolucao` | Formato ISO 8601 com timezone | Cast para `timestamp` |

**Colunas derivadas adicionadas:**

| Coluna | Lógica |
|---|---|
| `resolvido` | `data_resolucao IS NOT NULL` |
| `hora_abertura` | `HOUR(data_abertura)` — para análises de volume por turno |
| `tempo_resolucao_horas` | Recalculado via diferença de timestamps (substitui valor original) |

**Tabelas-dimensão geradas a partir dos tickets:**
- `dim_tipos_problema` — os 4 tipos canônicos com categoria (`Logística`, `Financeiro`, `Produto`, `Pagamento`)
- `dim_agentes_suporte` — lista dos agentes únicos encontrados nos tickets

---

### `ft_avaliacoes`

**Origem:** `bronze.avaliacoes`

**Problemas identificados e tratamentos:**

| Coluna | Problema | Tratamento |
|---|---|---|
| `nota_produto` | Valores fora do range 1–5 (`-1`, `0`, `6`) e textos (`bom`, `ruim`, `péssimo`, `ótimo`) | Textos mapeados para numérico; valores fora de 1–5 → `null` |
| `nota_nps` | Valores fora do range 0–10 (`-1`, `11`) e mesmos textos acima | Textos mapeados para numérico; valores fora de 0–10 → `null` |
| `recomenda` | ~12 variações (`S`, `sim`, `SIM`, `yes`, `1` / `N`, `Nao`, `NAO`, `no`, `0`) | Normalização para booleano (`true` / `false`) |
| `data_avaliacao` | 3.174 nulos; formato `datetime com espaço` (ex: `2024-01-15 10:30:00`) | Cast para `timestamp`; nulos mantidos como `null` |
| Duplicatas | Registros duplicados por `id_avaliacao` | Deduplicação via `row_number()` |

**Colunas derivadas adicionadas:**

| Coluna | Lógica |
|---|---|
| `categoria_nps` | `Promotor` (9–10), `Neutro` (7–8), `Detrator` (0–6), `null` se `nota_nps` for nula |

---

### `ft_clickstream`

**Origem:** `bronze.clickstream`

**Problemas identificados e tratamentos:**

| Coluna | Problema | Tratamento |
|---|---|---|
| `tipo_evento` | Múltiplas variações para as mesmas categorias (`view`, `VISUALIZACAO`, `page_view`, `clique`, `CLICK`) | Mapeamento para 6 valores canônicos |
| `dispositivo` | Inconsistências de case e sinônimos (`MOBILE`, `celular`, `smartphone`) | Normalização → `Desktop`, `Mobile`, `Tablet` |
| `origem_sessao` | Variações em inglês/português e case (`organic`, `ORGANICO`, `cpc`, `CPC`) | Normalização para 6 canais canônicos |
| `timestamp_evento` | Formato ISO 8601 com timezone lido como `string` na Bronze | Cast para `timestamp` |
| `tempo_pagina_seg` | Possíveis valores negativos ou zero (sessões inválidas) | Valores ≤ 0 → `null` |

---

### `dim_status_pedido`

**Origem:** `bronze.pedidos` (extraída dos valores únicos após normalização)

Dimensão auxiliar com os status canônicos de pedidos. Criada a partir dos valores normalizados na `ft_pedidos`, garantindo consistência entre as duas tabelas.

| Coluna | Descrição |
|---|---|
| `status` | Valor canônico do status (ex: `Entregue`, `Cancelado`, `Pendente`) |
| `status_normalizado` | Versão lowercase sem espaços nas extremidades |
