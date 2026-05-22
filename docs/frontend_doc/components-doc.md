# Componentes

Documentação da biblioteca de componentes do V-Commerce CRM 360, organizada segundo **Atomic Design** em três camadas: atoms, molecules e organisms. Todos os componentes ficam em `frontend/src/components/`.

---

## Atoms

Elementos visuais primitivos sem lógica de negócio própria. Ficam em `frontend/src/components/atoms/`.

---

### `TrendBadge`

**Arquivo:** `atoms/TrendBadge.tsx`

Badge colorido que exibe variação percentual com ícone de tendência.

**Props:**

| Prop | Tipo | Descrição |
|---|---|---|
| `value` | `number` | Percentual de variação (positivo, negativo ou zero) |
| `className` | `string?` | Classes extras do Tailwind |

**Comportamento:**
- Valor positivo → fundo verde, ícone de seta para cima (`TrendingUp`)
- Valor negativo → fundo vermelho, ícone de seta para baixo (`TrendingDown`)
- Valor zero → fundo cinza, ícone horizontal (`TrendingFlat`)

**Uso:**
```tsx
<TrendBadge value={12.5} />   // "+12.5% ↑" em verde
<TrendBadge value={-3.2} />   // "-3.2% ↓" em vermelho
<TrendBadge value={0} />      // "0%" em cinza
```

---

### `CardInfoTooltip`

**Arquivo:** `atoms/CardInfoTooltip.tsx`

Ícone de informação (`ⓘ`) que exibe tooltip ao passar o mouse. O tooltip é renderizado via `createPortal` diretamente no `body` para evitar clipping de overflow.

**Props:**

| Prop | Tipo | Descrição |
|---|---|---|
| `text` | `string` | Texto exibido no tooltip |

**Uso:**
```tsx
<CardInfoTooltip text="Período anterior: R$ 42.000" />
```

---

### `CopyIdButton`

**Arquivo:** `atoms/CopyIdButton.tsx`

Botão invisível (visível apenas no hover da linha) que copia um ID para a área de transferência. Exibe ícone de check por 1,5 s após a cópia.

**Props:**

| Prop | Tipo | Descrição |
|---|---|---|
| `id` | `string` | Valor a ser copiado |

---

### `avatar` · `button` · `checkbox` · `input` · `label` · `textarea`

Wrappers finos sobre primitivos do **shadcn/ui** (baseados em Radix UI), com estilização via Tailwind. Seguem a API padrão do shadcn — consulte a documentação em [ui.shadcn.com](https://ui.shadcn.com) para props completas.

---

### `CustomScrollArea`

**Arquivo:** `atoms/CustomScrollArea.tsx`

Área com scroll estilizado (barra customizada) baseada em `@radix-ui/react-scroll-area`.

---

### `dropdown-menu`

**Arquivo:** `atoms/dropdown-menu.tsx`

Re-exporta primitivos do `@radix-ui/react-dropdown-menu` (`DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`, etc.) com estilização padrão do projeto.

---

### `sheet`

**Arquivo:** `atoms/sheet.tsx`

Painel lateral deslizante (`Sheet`, `SheetTrigger`, `SheetContent`, etc.) baseado em Radix UI. Usado pelos drawers de filtros avançados de Contatos e Produtos.

---

### `skeleton`

**Arquivo:** `atoms/skeleton.tsx`

Bloco animado (pulse) para estados de carregamento.

---

### `tooltip`

**Arquivo:** `atoms/tooltip.tsx`

Tooltip nativo do shadcn/ui (`Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`).

---

### `separator`

**Arquivo:** `atoms/separator.tsx`

Linha divisória horizontal/vertical baseada em `@radix-ui/react-separator`.

---

### `field` · `input-group`

**Arquivos:** `atoms/field.tsx`, `atoms/input-group.tsx`

Contêineres de layout para agrupar label + input com espaçamento e mensagem de erro padronizados.

---

### `horizontal-scroll`

**Arquivo:** `atoms/horizontal-scroll.tsx`

Wrapper para scroll horizontal sem scrollbar visível, usado em listas de filtros e chips.

---

### `add-circle-button-icon` · `open-circle-button`

**Arquivos:** `atoms/add-circle-button-icon.tsx`, `atoms/open-circle-button.tsx`

Botões de ação circular usados nas tabelas de contatos/produtos para abrir detalhes ou adicionar itens.

---

## Molecules

Combinações de atoms com lógica de apresentação própria. Ficam em `frontend/src/components/molecules/`.

---

### `MetricCard`

**Arquivo:** `molecules/MetricCard/index.tsx`

Card de KPI do dashboard com valor atual, badge de tendência e comparação YoY (ano a ano).

**Props (`MetricCardData`):**

| Prop | Tipo | Descrição |
|---|---|---|
| `title` | `string` | Nome do KPI |
| `icon` | `ReactNode` | Ícone exibido ao lado do título |
| `currentValue` | `string` | Valor principal formatado (ex: `"R$ 1,2M"`) |
| `trendPercent` | `number` | Variação % vs período anterior |
| `comparisonLabel` | `string` | Rótulo da comparação (ex: `"Mês anterior"`) |
| `comparisonValue` | `string` | Valor do período de comparação |
| `yoyPercent` | `number?` | Variação % vs mesmo período do ano anterior |
| `yoyLabel` | `string?` | Rótulo da comparação YoY |
| `yoyValue` | `string?` | Valor do período YoY |
| `isLoading` | `boolean?` | Exibe skeleton quando `true` |
| `isMock` | `boolean?` | Exibe badge "Em breve" e reduz opacidade |

**Dependências de atoms:** `TrendBadge`, `CardInfoTooltip`

---

### `PeriodSelector`

**Arquivo:** `molecules/PeriodSelector/index.tsx`

Dropdown para selecionar período de análise do dashboard. Suporta períodos predefinidos e intervalo customizado com validação de data inicial > data final.

**Props:**

| Prop | Tipo | Descrição |
|---|---|---|
| `value` | `PeriodFilter` | Estado atual do período selecionado |
| `onChange` | `(p: PeriodFilter) => void` | Callback ao mudar período |

**Períodos disponíveis:** `2weeks`, `month`, `3months`, `semester`, `year`, `custom` (com campos de data inicial e final).

---

### `AIChatSidebar`

**Arquivo:** `molecules/AIChatSidebar/index.tsx`

Painel de chat lateral do agente V.IA. Pode ser aberto sobre qualquer tela sem navegar para a rota `/chat`.

**Props:**

| Prop | Tipo | Descrição |
|---|---|---|
| `open` | `boolean` | Controla visibilidade do painel |
| `onClose` | `() => void` | Callback ao fechar |
| `userName` | `string?` | Nome do usuário para a saudação |
| `pendingMention` | `MentionItem \| null?` | Item de menção a ser inserido no input |
| `onMentionInserted` | `() => void?` | Callback após inserir a menção |
| `initialMessage` | `string?` | Mensagem pré-preenchida no input |
| `onInitialMessageSent` | `() => void?` | Callback após enviar a mensagem inicial |

Internamente gerencia histórico de conversas, sessões, sugestões e o `MentionInput`. Ao clicar em "expandir" navega para a rota `/chat` passando o estado atual via `location.state`.

---

### `MentionInput`

**Arquivo:** `molecules/MentionInput/index.tsx`

Input de chat com suporte a menções via `@`. Ao digitar `@` abre dropdown com sugestões de entidades (clientes, produtos, pedidos) buscadas em `/mentions`. Entidades selecionadas viram chips coloridos no input.

**Props:**

| Prop | Tipo | Descrição |
|---|---|---|
| `onSend` | `(text, mentions) => void` | Chamado ao enviar a mensagem |
| `disabled` | `boolean?` | Bloqueia input durante carregamento |
| `placeholder` | `string?` | Texto de placeholder |
| `initialValue` | `string?` | Valor inicial do campo |

**Handle (via `ref`):**

| Método | Descrição |
|---|---|
| `clear()` | Limpa o editor após envio |
| `focus()` | Foca o editor |
| `setValue(text)` | Restaura texto (ex: ao retornar da tela cheia) |
| `isEmpty()` | Verifica se o campo está vazio |
| `insertChip(item)` | Insere um chip de menção programaticamente |

**Tipos de chips:**
- `contact` → chip azul (prefixo `@cliente`)
- `product` → chip verde (prefixo `@produto`)
- `order` → chip laranja (prefixo `@pedido`)

---

### `AppNavbar`

**Arquivo:** `molecules/AppNavbar/index.tsx`

Barra superior da aplicação com nome da página atual e botões de ação contextuais (ex: abrir chat do agente).

---

### `ContactsTable`

**Diretório:** `molecules/ContactsTable/`

Tabela especializada de contatos com filtros avançados, busca, paginação e exportação CSV.

**Arquivos internos:**

| Arquivo | Função |
|---|---|
| `index.tsx` | Componente raiz da tabela |
| `columns.tsx` | Definição das colunas (nome, status, compras, NPS, etc.) |
| `types.ts` | Tipos locais (`ContactRow`, etc.) |
| `useContactsFetch.ts` | Hook de busca com debounce dos filtros |
| `useContactExport.ts` | Hook de exportação CSV via streaming |
| `AdvancedFiltersDrawer.tsx` | Sheet com filtros avançados (perfil, financeiro, comportamento digital) |
| `ClientStatusBadge.tsx` | Badge colorido por status do cliente (`Lead`, `Ativo`, `Inativo`, etc.) |
| `ContactExpandedRow.tsx` | Linha expandida com últimas compras e resumo |
| `ContactFormSheet.tsx` | Sheet de criação/edição de contato |
| `ContactModal.tsx` | Modal com navegação rápida para detalhes do contato |
| `ContactResumoCard.tsx` | Card de resumo do contato no tooltip de hover |

---

### `ProductsTable`

**Diretório:** `molecules/ProductsTable/`

Tabela especializada de produtos, análoga à `ContactsTable`.

**Arquivos internos:**

| Arquivo | Função |
|---|---|
| `index.tsx` | Componente raiz |
| `columns.tsx` | Colunas (nome, categoria, preço, estoque, rating, vendas) |
| `AdvancedFiltersDrawer.tsx` | Filtros avançados de produtos |
| `ProductExpandedRow.tsx` | Linha expandida com métricas do produto |
| `ProductExportPopover.tsx` | Popover de exportação |
| `ProductFormModal.tsx` | Modal de criação/edição de produto |
| `GroupedUFDropdown.tsx` | Dropdown de seleção de UF agrupada por região |

---

### `ModuleBarChart`

**Arquivo:** `molecules/ModuleBarChart/index.tsx`

Gráfico de barras de receita do dashboard com seletor de granularidade (`total`, `category`, `product`) e filtros por categoria/produto. Consome o endpoint `GET /dashboard/revenue`.

---

### `TopCategoriesChart`

**Arquivo:** `molecules/TopCategoriesChart/index.tsx`

Gráfico horizontal de barras com o ranking das top categorias por quantidade vendida ou receita. Consome `GET /dashboard/top-categories`.

---

### `OrdersCard`

**Arquivo:** `molecules/OrdersCard/index.tsx`

Card do dashboard com total de pedidos e distribuição de status em barras de progresso (`Aprovado`, `Processando`, `Reembolsado`, `Recusado`). Consome `GET /dashboard/orders`.

---

### `SearchInput`

**Arquivo:** `molecules/SearchInput/index.tsx`

Campo de busca com debounce e ícone de lupa, usado nas tabelas de listagem.

---

### `Dropdown`

**Arquivo:** `molecules/Dropdown/index.tsx`

Dropdown genérico de seleção única baseado em `DropdownMenu`.

---

### `ExportPopover`

**Arquivo:** `molecules/ExportPopover/index.tsx`

Popover com opções de exportação (CSV) reutilizado nos módulos de Contatos e Pedidos.

---

### `Sidebar`

**Arquivo:** `molecules/Sidebar/sidebar.tsx`

Menu lateral de navegação (links para Dashboard, Contatos, Catálogo, Pedidos, Tickets, Agente IA) com indicador de rota ativa. Consumido pelo `AppFrame`.

---

### `UserMenu`

**Arquivo:** `molecules/UserMenu/index.tsx`

Menu de perfil do usuário logado (nome, cargo, botão de logout).

---

## Organisms

Componentes complexos com lógica de negócio e composição de múltiplas molecules. Ficam em `frontend/src/components/organisms/`.

---

### `DataTable`

**Diretório:** `organisms/DataTable/`

Tabela genérica e extensível usada como base para as tabelas de Pedidos e Tickets. Suporta paginação server-side, múltiplos tipos de filtro, seleção de linhas e expansão de linhas.

**Props principais (`DataTableProps<T>`):**

| Prop | Tipo | Descrição |
|---|---|---|
| `columns` | `Column<T>[]` | Definição das colunas (label, accessor, filtros, sort) |
| `rows` | `T[]` | Dados da página atual |
| `totalRows` | `number` | Total de registros para paginação |
| `page` / `pageSize` | `number` | Estado de paginação |
| `onPageChange` | `fn` | Callback de mudança de página |
| `expandedRowContent` | `(row: T) => ReactNode?` | Componente da linha expandida |
| `tabs` | `Tab[]?` | Abas de filtro rápido no topo |

**Tipos de filtro suportados** (definidos em `types.ts`):

| Tipo | Componente | Uso típico |
|---|---|---|
| `select` | `SelectDropdown` | Status único |
| `multi-select` | `MultiSelectDropdown` | Status múltiplo, categorias |
| `number-range` | `NumberRangeDropdown` | Faixas de preço, nota, etc. |
| `date-range` | `DateRangeDropdown` | Período de datas |
| `search-select` | `SearchSelectDropdown` | Busca de entidade por nome |
| `toggle` | `TogglePill` | Filtros booleanos |

**Hooks internos:**

| Hook | Responsabilidade |
|---|---|
| `useFilterState` | Gerencia estado dos filtros ativos |
| `usePagination` | Controla página e tamanho de página |
| `useRowSelection` | Checkbox de seleção múltipla de linhas |

---

### `AppFrame`

**Arquivo:** `organisms/AppFrame/index.tsx`

Layout raiz da aplicação autenticada. Compõe `Sidebar` + `AppNavbar` + área de conteúdo (`<Outlet />`). Também gerencia o estado de abertura do `AIChatSidebar` e expõe o contexto de abertura do chat via `useOutletContext`.

---

### `BrazilMapCard`

**Diretório:** `organisms/BrazilMapCard/`

Mapa coroplético do Brasil em **SVG puro** (sem biblioteca de mapas — vide [decisão 15](../decisions-doc.md#15-mapa-do-brasil-em-svg-puro-sem-biblioteca-de-mapas)), colorido por intensidade de pedidos ou receita por estado/região.

**Arquivos internos:**

| Arquivo | Função |
|---|---|
| `index.tsx` | Componente raiz com fetch de dados e lógica de escala de cor |
| `molecules/BrazilSvgMap.tsx` | Renderização do SVG com paths dos estados |
| `molecules/StateRankingList.tsx` | Lista lateral com ranking dos estados |
| `atoms/MapLegend.tsx` | Legenda de gradiente de cor |
| `atoms/MapTooltip.tsx` | Tooltip ao hover do estado |
| `atoms/PeriodToggle.tsx` | Toggle `estados` / `regiões` |
| `brazilPaths.ts` | Paths SVG de todos os 27 estados |
| `utils.ts` | Funções de escala de cor e formatação |

Consome `GET /dashboard/map`. O toggle `estados`/`regiões` envia o parâmetro `view` ao endpoint.

---

### `SalesTable`

**Diretório:** `organisms/SalesTable/`

Tabela de pedidos baseada no `DataTable` com colunas e filtros específicos de vendas.

**Arquivos internos:**

| Arquivo | Função |
|---|---|
| `salesTable.tsx` | Componente raiz |
| `columns.tsx` | Definição de colunas (ID, data, valor, status, método de pagamento) |
| `SaleExpandedRow.tsx` | Linha expandida com detalhes do pedido e log de atividades |
| `SaleForms.tsx` | Formulário de edição de pedido (status, método de pagamento) |
| `tableComponents/badge.tsx` | Badge de status do pedido |

---

### `TicketsTable`

**Diretório:** `organisms/TicketsTable/`

Tabela de tickets de suporte baseada no `DataTable`.

**Arquivos internos:**

| Arquivo | Função |
|---|---|
| `ticketsTable.tsx` | Componente raiz |
| `columns.tsx` | Definição de colunas (ID, tipo, agente, status, data de abertura) |
| `TicketExpandedRow.tsx` | Linha expandida com detalhes do ticket |
| `ticketConstants.ts` | Constantes de status e tipo de problema |
| `ticketExport.ts` | Lógica de exportação de tickets |
| `ticketFilters.ts` | Definição dos filtros do módulo |
| `tableComponents/badge.tsx` | Badge de status/tipo do ticket |

---

### `ProtectedRoute`

**Arquivo:** `organisms/ProtectedRoute/index.tsx`

Guarda de rota baseada em papel (`role`). Redireciona para `/unauthorized` se o usuário não tiver permissão para a rota solicitada. Vide [decisão 16](../decisions-doc.md#16-roteamento-e-autorização-via-protectedroute-por-papel).
