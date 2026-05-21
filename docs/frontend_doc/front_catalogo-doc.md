# Catálogo de Produtos

## Visão Geral

Página principal de gestão do catálogo. Permite listar, filtrar, ordenar, expandir, adicionar, editar, navegar e exportar produtos. A tabela é server-side: cada mudança de filtro, aba, ordenação ou página dispara uma nova chamada à API.

**Rota:** `/products`  
**Arquivo:** `src/Pages/Products/index.tsx`

---

## Componentes utilizados

| Componente | Arquivo | Descrição |
|---|---|---|
| `ProductsTable` | `molecules/ProductsTable/index.tsx` | Tabela principal com toda a lógica de filtros, paginação e exportação |
| `ProductFormModal` | `molecules/ProductsTable/ProductFormModal.tsx` | Modal de criação de novo produto |
| `AdvancedFiltersDrawer` | `molecules/ProductsTable/AdvancedFiltersDrawer.tsx` | Drawer lateral com filtros avançados |
| `ProductExpandedRow` | `molecules/ProductsTable/ProductExpandedRow.tsx` | Linha expansível com métricas Gold do produto |
| `ProductExportPopover` | `molecules/ProductsTable/ProductExportPopover.tsx` | Popover de opções de exportação CSV |
| `DataTable` | `organisms/DataTable/index.tsx` | Organismo base de tabela reutilizável |

---

## Chamadas de API

| Método | Endpoint | Quando |
|---|---|---|
| `GET` | `/products` | Montagem inicial e a cada mudança de filtro, aba, ordenação ou página |
| `GET` | `/products` (com `pageSize=99999`) | Ao exportar planilha completa |

> Chamadas com campos de texto (busca, ranges numéricos) têm debounce de **300ms**. Demais mudanças disparam imediatamente.

---

## Estados gerenciados (`ProductsTable`)

| Estado | Tipo | Descrição |
|---|---|---|
| `activeTab` | `string` | Tab ativa (`"all"` ou `"new"`) |
| `page` | `number` | Página atual |
| `pageSize` | `number` | Itens por página (padrão: 10) |
| `total` | `number` | Total de produtos retornado pela API |
| `loading` | `boolean` | Exibe skeleton durante carregamento |
| `products` | `Product[]` | Dados da página atual |
| `error` | `string \| null` | Mensagem de erro da API |
| `colFilters` | `ActiveFilters` | Filtros por coluna (categoria, preço, estoque, avaliação, vendas) |
| `advanced` | `AdvancedFilters` | Filtros do drawer avançado |
| `drawerOpen` | `boolean` | Controla abertura do `AdvancedFiltersDrawer` |
| `searchQuery` | `string` | Texto da busca |
| `sort` | `{ key, direction } \| null` | Coluna e direção de ordenação |
| `expandedRowIds` | `Set<string>` | IDs das linhas com detalhe expandido |
| `activeRowId` | `string \| null` | ID da última linha expandida (destaque visual) |
| `exportOpen` | `boolean` | Controla abertura do `ProductExportPopover` |
| `exportLoading` | `boolean` | Estado de carregamento durante exportação |
| `selectedIds` | `Set<string>` | IDs dos produtos selecionados via checkbox |

**Estados em `Products` (page):**

| Estado | Tipo | Descrição |
|---|---|---|
| `canUndo` | `boolean` | Habilita o botão de desfazer filtro (flutuante) |
| `modalOpen` | `boolean` | Abre/fecha o `ProductFormModal` |

---

## Colunas da tabela

| Coluna | Filtro | Ordenação | Descrição |
|---|---|---|---|
| *(expandir)* | — | — | Botão circular que expande/colapsa a linha |
| ID | — | — | ID do produto |
| Nome | — | Sim | Nome clicável que navega para `/products/:id` |
| Categoria | Multi-select | — | Badge colorido por categoria |
| Preço | Range numérico | Sim | Valor em R$ |
| Estoque disponível | Range numérico | Sim | Quantidade em estoque |
| Avaliação | Range numérico (0–10) | Sim | Badge com cor por faixa (verde ≥7, amarelo ≥5, vermelho <5) |
| Vendas totais | Range numérico | Sim | Total histórico de vendas |
| *(ação)* | — | — | Botão `→` que navega para `/products/:id` |

---

## Tabs

| Tab | ID | Comportamento |
|---|---|---|
| Todos os produtos | `all` | Sem filtro de data adicional |
| Novos produtos | `new` | Filtra automaticamente por `date_from = hoje − 1 ano` |

> Ao trocar de tab, busca e filtros de coluna são resetados.

---

## Filtros avançados (`AdvancedFiltersDrawer`)

Drawer lateral (direita) com os seguintes campos, aplicados via botão "Aplicar filtros":

| Campo | Tipo |
|---|---|
| Status | Checkboxes múltiplos (Ativo, Novo, Inativo, Descontinuado) |
| Preço (R$) | Range numérico (Mín / Máx) |
| Avaliação (0–10) | Range numérico com step 0.1 |
| Estoque | Range numérico |
| Data de criação | Intervalo de datas (De / Até) |

O botão "Filtros avançados" na barra da tabela exibe o número de grupos de filtro ativos (`advancedActiveCount`). Quando ativo, muda para o estilo de filtro aplicado (`bg-[#EACAFF] border-[#B899CC]`).

---

## Exportação CSV

Acionada pelo botão "Exportar" no header da página → abre `ProductExportPopover` com duas opções:

| Opção | Comportamento |
|---|---|
| Exportar planilha completa | Busca todos os produtos com os filtros ativos (`pageSize=99999`) e gera CSV |
| Exportar selecionados | Gera CSV apenas com os produtos marcados via checkbox (cache acumulativo entre páginas) |

O CSV inclui: ID, Nome, Categoria, Preço, Fornecedor, Peso (kg), Estoque, Avaliação, Total Vendas, Status, UF, Cadastrado em. Nome do arquivo: `catalogo_YYYY-MM-DD.csv`.

---

## Handle exposto via `ref` (`ProductsTableHandle`)

| Método | Comportamento |
|---|---|
| `undo()` | Reservado — atualmente sem implementação |
| `reset()` | Reseta tab, filtros avançados, filtros de coluna, busca, ordenação, página e pageSize |
| `openExport()` | Abre o `ProductExportPopover` |

---

## Interações e comportamentos

| Ação | Comportamento |
|---|---|
| Botão "Exportar" | Abre `ProductExportPopover` via `tableRef.current?.openExport()` |
| Botão "Adicionar produto" | Abre `ProductFormModal`; ao salvar chama `tableRef.current?.reset()` |
| Botão "Desfazer filtro" (flutuante) | Chama `tableRef.current?.undo()` — habilitado quando `canUndo = true` |
| Botão "Resetar tabela" (flutuante) | Chama `tableRef.current?.reset()` — limpa todos os filtros |
| Clicar no nome do produto | Navega para `/products/:id` |
| Clicar no botão `→` | Navega para `/products/:id` |
| Clicar na linha | Expande/colapsa `ProductExpandedRow` |
| Expandir linha | Exibe métricas Gold do produto; linha ativa recebe fundo `#EACAFF` |
| Trocar de aba | Reseta busca e filtros de coluna; aplica corte de data automático na aba "Novos" |
| Ordenar coluna | Envia `sort_by` e `sort_dir` para a API; reseta para página 1 |

---

## Observações

- A seleção via checkbox é **acumulativa entre páginas**: produtos selecionados em páginas anteriores são mantidos em cache (`selectedCache`) mesmo após virar a página.
- O filtro de data da aba "Novos produtos" usa `hoje − 1 ano` calculado no cliente. Se o filtro avançado `dateFrom` estiver preenchido, ele prevalece sobre o corte da aba.
- Filtros de coluna e filtros avançados são independentes e combinados no `buildParams` antes de cada chamada à API.
