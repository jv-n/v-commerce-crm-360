# Dashboard

## Visão Geral

Página de visão executiva do CRM, voltada à persona "Ricardo Alves — Diretor Comercial" descrita no case ("eu preciso saber, de forma rápida, como estão as minhas vendas"). Exibe **6 KPIs** com comparação ao período anterior e variação year-over-year, um **gráfico de barras de receita** com filtros por categoria/produto, um **card de pedidos** com distribuição de status, um **mapa coroplético do Brasil** por estado/região, e um **ranking de top categorias**. Todos os widgets reagem ao seletor de período global.

**Rota:** `/dashboard`
**Arquivo:** [src/Pages/Dashboard/index.tsx](frontend/src/Pages/Dashboard/index.tsx)
**Acesso:** somente `admin` (controlado por `<ProtectedRoute allowedRoles={["admin"]}>` em [src/App.tsx](frontend/src/App.tsx))

> **Período padrão:** o estado inicial é `{ type: "year" }` — ao abrir, o dashboard mostra os últimos 365 dias. Vide [decisão 9](../decisions-doc.md#9-janela-rolante-em-dias-para-o-seletor-de-período-do-dashboard) para o significado de "year" como janela rolante e não calendário.

---

## Componentes utilizados

| Componente | Arquivo | Tipo | Descrição |
|---|---|---|---|
| `PeriodSelector` | [molecules/PeriodSelector/index.tsx](frontend/src/components/molecules/PeriodSelector/index.tsx) | molecule | Seletor global (2 semanas / mês / 3 meses / semestre / ano / personalizado) |
| `MetricCard` | [molecules/MetricCard/index.tsx](frontend/src/components/molecules/MetricCard/index.tsx) | molecule | Card de KPI com valor atual, badge de tendência, comparação YoY e tooltip de período anterior |
| `OrdersCard` | [molecules/OrdersCard/index.tsx](frontend/src/components/molecules/OrdersCard/index.tsx) | molecule | Total de pedidos + barras horizontais com `%` de aprovados/processando/recusados/reembolsados |
| `TopCategoriesChart` | [molecules/TopCategoriesChart/index.tsx](frontend/src/components/molecules/TopCategoriesChart/index.tsx) | molecule | Ranking top categorias com seletor interno (`vendidos` / `receita` / `visualizacoes` / `abandono`) |
| `ModuleBarChart` | [molecules/ModuleBarChart/index.tsx](frontend/src/components/molecules/ModuleBarChart/index.tsx) | molecule | Gráfico de barras de receita; granularidade adaptativa por período; filtros por categoria/produto |
| `BrazilMapCard` | [organisms/BrazilMapCard/index.tsx](frontend/src/components/organisms/BrazilMapCard/index.tsx) | organism | SVG coroplético com toggle `estados` ↔ `regioes`, tooltip em hover, sem lib de mapas |
| `TrendBadge` (interno) | (dentro do MetricCard) | atom-like | Badge `▲ +X,X%` em verde ou vermelho conforme `trendPercent` |
| `CardInfoTooltip` (interno) | (dentro do MetricCard) | atom-like | Tooltip do `ℹ` exibindo `comparisonLabel` + `comparisonValue` |

> **Ícones** vêm de `@mui/icons-material`. **Gráficos** internos do `ModuleBarChart` usam `@mui/x-charts`. Vide [decisão 14](../decisions-doc.md#14-tailwind-v4--shadcnui--mui-v9--três-libs-visuais-coexistindo).

---

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard                                    [PeriodSelector]  │
│                                                                 │
│  ┌───────┬────────┬─────────┐  ┌────────────┐  ┌────────────┐  │
│  │  NPS  │ Vendas │ Sessões │  │ OrdersCard │  │TopCateg.   │  │
│  ├───────┼────────┼─────────┤  │            │  │  Chart     │  │
│  │Clien. │ Leads  │ Tickets │  │            │  │            │  │
│  └───────┴────────┴─────────┘  └────────────┘  └────────────┘  │
│                                                                 │
│  ┌──────────────────────────────┐  ┌────────────────────────┐  │
│  │        ModuleBarChart        │  │      BrazilMapCard      │  │
│  │     (Receita no período)     │  │   (Mapa por estado /   │  │
│  │                              │  │        região)          │  │
│  └──────────────────────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

- Grid responsivo: empilha em mobile, lado a lado em desktop.
- Os 6 `MetricCard` ocupam um sub-grid 3x2.

---

## Chamadas de API

### Direto na página

| Método | Endpoint | Disparo |
|---|---|---|
| `GET` | `/dashboard/metrics` | Montagem da página e a cada mudança de `period` |

### Disparadas pelos widgets (cada um faz fetch próprio — [decisão 18](../decisions-doc.md#18-cada-widget-do-dashboard-busca-seus-próprios-dados))

| Componente | Endpoint | Disparo |
|---|---|---|
| `OrdersCard` | `GET /dashboard/orders` | Recebe `period` via prop; busca em mount e ao mudar período |
| `TopCategoriesChart` | `GET /dashboard/top-categories?metric=...` | Recebe `period` via prop + metric interna |
| `ModuleBarChart` | `GET /dashboard/revenue?granularity=...&categories=...&product_ids=...` | Recebe `period` via prop + estado interno de granularidade/filtros |
| `BrazilMapCard` | `GET /dashboard/map?view=estados\|regioes` | Recebe `period` via prop + toggle interno |

> **Loading pattern.** Ao trocar o período, `setMetrics(null)` força esqueleto dos `MetricCard`s. Os widgets secundários gerenciam seu próprio loading internamente — cada um aparece em momentos ligeiramente diferentes (em geral 50-200 ms de diferença).

---

## Estados gerenciados

| Estado | Tipo | Onde | Descrição |
|---|---|---|---|
| `period` | `PeriodFilter` | `Dashboard` | Período selecionado; inicial `{ type: "year" }` |
| `metrics` | `DashboardMetrics \| null` | `Dashboard` | Dados de KPI; `null` enquanto carrega |
| `isLoading` | `boolean` (derivado) | `Dashboard` | `metrics === null` |
| `alive` (closure) | `boolean` | `useEffect` | Flag para evitar `setMetrics` após desmontagem ou mudança de período rápida |
| `view` | `"estados" \| "regioes"` | `BrazilMapCard` | Toggle do mapa, não afeta o restante da página |
| `metric` | `"vendidos" \| "receita" \| ...` | `TopCategoriesChart` | Métrica do ranking, não afeta o restante |
| `granularity` | `"total" \| "category" \| "product"` | `ModuleBarChart` | Granularidade do gráfico, não afeta o restante |

---

## MetricCards

A página constrói `cards: MetricCardData[]` (array de 6 objetos) que é mapeado para `<MetricCard>` em loop. Todos exibem esqueleto animado quando `isLoading = true`.

| Cartão | Ícone MUI | Campo da API | Formatação |
|---|---|---|---|
| NPS | `SpeedOutlinedIcon` | `metrics.nps` | `toFixed(1)` |
| Vendas | `ShoppingCartOutlinedIcon` | `metrics.vendas` | BRL sem decimais (`Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })`) |
| Sessões | `LanguageOutlinedIcon` | `metrics.sessoes` | pt-BR inteiro |
| Clientes | `PeopleAltOutlinedIcon` | `metrics.clientes` | pt-BR inteiro |
| Leads Convertidos | `PersonAddAltOutlinedIcon` | `metrics.leads_convertidos` | pt-BR inteiro |
| Tickets Solucionados | `ConfirmationNumberOutlinedIcon` | `metrics.tickets` | pt-BR inteiro |

Cada card expõe três comparações:
- **Tendência do período (`TrendBadge`):** variação `%` em relação ao período anterior (`trend_pct`).
- **Período anterior (`CardInfoTooltip`):** valor absoluto (`prev_value`).
- **YoY:** valor e variação `%` do mesmo período no ano anterior (`yoy_value`, `yoy_pct`).

> **Formatadores:** `ptBR`, `brl` são instâncias únicas de `Intl.NumberFormat` criadas no escopo do módulo e reutilizadas a cada render — evita instanciar em cada chamada.

---

## Formatação do rótulo YoY (`fmtYoyLabel`)

Calcula o rótulo do período YoY a partir de `metrics.period.yoy_start` e `metrics.period.yoy_end`:

| Caso | Exemplo de saída |
|---|---|
| Mesmo mês e mesmo ano | `Jan/2024` |
| Mesmo mês, anos diferentes | `Jan/2023-2024` |
| Meses diferentes | `Jan-Dez/2024` |

Usa `parseLocalDate` para evitar fuso horário UTC: `new Date(y, m-1, d)` em vez de `new Date(s)` (este último interpretaria `"2024-03-15"` como UTC).

---

## Receita e a divergência com o agente de IA

> Esta seção é importante por documentar uma inconsistência conhecida do projeto.

A receita do card "Vendas" é calculada no backend pela função `_vendas` em [backend/app/services/dashboardService.py:105](backend/app/services/dashboardService.py#L105). A regra atual:

```python
SELECT SUM(receita_bruta)
FROM gold_pedidos_detalhado
WHERE data_pedido BETWEEN ? AND ?
  AND status = 'Aprovado'
```

Reembolsos **não são subtraídos**: como pedidos `Reembolsado` têm status diferente de `Aprovado`, eles nunca entram na soma. Vide [decisão 10](../decisions-doc.md#10-receita-do-dashboard-considera-apenas-pedidos-aprovados-sem-subtrair-reembolsos).

O **agente de IA** ainda possui no `SYSTEM_PROMPT` ([ai-agent/prompts.py](ai-agent/prompts.py)) a fórmula antiga com subtração de `valor_reembolsado` — o que faz perguntas como "qual a receita do mês?" retornarem números levemente menores que o card. Pendência registrada na [decisão 23](../decisions-doc.md#23-fórmulas-do-dashboard-embutidas-no-system-prompt).

---

## Interações e comportamentos

| Ação | Comportamento |
|---|---|
| Mudar período no `PeriodSelector` | Zera `metrics` para `null` (esqueleto nos cards) e dispara nova busca em todos os componentes |
| Selecionar `personalizado` no `PeriodSelector` | Abre date range picker; os endpoints aceitam `start_date` e `end_date` em formato `YYYY-MM-DD` |
| Hover em ícone `ℹ` do `MetricCard` | Exibe tooltip com `comparisonLabel + comparisonValue` (período anterior) |
| Clicar em estado / região no mapa | Exibe tooltip com total de pedidos e valor; sem navegação |
| Alternar visão do mapa (estado ↔ região) | Controle interno do `BrazilMapCard` — não afeta o restante da página |
| Trocar métrica no `TopCategoriesChart` | Controle interno (vendidos / receita / visualizações / abandono) — não afeta o restante |
| Trocar granularidade / filtro no `ModuleBarChart` | Controle interno — não afeta o restante |
| Desmontar a página enquanto há fetch pendente | A flag `alive` no `useEffect` evita `setMetrics` em componente desmontado |

---

## Tipos relevantes

| Tipo | Local | Descrição |
|---|---|---|
| `PeriodFilter` | [src/types/dashboard.ts](frontend/src/types/dashboard.ts) | `{ type: "2weeks" \| "month" \| "3months" \| "semester" \| "year" \| "custom"; start?: string; end?: string }` |
| `DashboardMetrics` | [src/types/dashboard.ts](frontend/src/types/dashboard.ts) | Saída de `/dashboard/metrics` — inclui `period`, `nps`, `vendas`, `clientes`, `tickets`, `leads_convertidos`, `sessoes` |
| `MetricCardData` | [molecules/MetricCard/index.tsx](frontend/src/components/molecules/MetricCard/index.tsx) | Forma de cada item do array `cards` |

---

## Observações

- **Acesso restrito a `admin`.** Outros papéis (`sales`, `support`) caem em `/unauthorized` se tentarem acessar — controlado em [App.tsx](frontend/src/App.tsx) por `<ProtectedRoute allowedRoles={["admin"]}>`.
- **Período rolante, não calendário.** Quando o usuário escolhe "últimos 3 meses", o backend usa `date('now', '-90 days')`, não março+abril+maio. Se o usuário esperar comportamento calendário, os números vão divergir. O `personalizado` é o escape.
- **Cada widget é independente.** Falha em `/dashboard/map` (por exemplo, se o JOIN com `gold_cliente_360` retornar vazio) **não derruba o resto da página** — somente o mapa exibe o estado de erro. Mesma coisa para os outros widgets.
- **Race condition mitigada.** A flag `alive` no `useEffect` evita o caso clássico de o usuário trocar o período rapidamente e a primeira resposta chegar depois da segunda — sem `alive`, o estado final poderia ficar com dados do período "errado".
- **Formatadores no escopo do módulo.** `ptBR`, `brl`, `fmtBRL`, `fmtCount`, `fmtNPS` são definidos fora do componente para não serem recriados em cada render. Não há `useMemo` — `Intl.NumberFormat` é caro de instanciar mas barato de chamar.
- **Mapa do Brasil sem lib.** O `BrazilMapCard` usa SVG puro com paths embutidos. Não há zoom, pan nem mapa base. Para detalhes, vide [decisão 15](../decisions-doc.md#15-mapa-do-brasil-em-svg-puro-sem-biblioteca-de-mapas).
- **`status = 'Aprovado'` é obrigatório no `TopCategoriesChart`.** Top categorias filtra pedidos por aprovado para bater com a receita do card Vendas. Já o mapa **não filtra status** — soma todos os pedidos (incluindo Processando, Recusado, Reembolsado) usando `valor_pedido` (não `receita_bruta`). Essas regras estão repetidas no prompt do agente em [ai-agent/prompts.py](ai-agent/prompts.py).
- **Sem cache compartilhado.** Sair do dashboard e voltar refaz todos os fetches. Em produção valeria `react-query` ou `swr`.
