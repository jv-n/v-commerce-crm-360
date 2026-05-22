# Pedidos

## Visão Geral

Página principal de gestão de pedidos. Permite listar, filtrar, ordenar, expandir, adicionar, editar e exportar pedidos. A tabela é server-side: cada mudança de filtro, aba, ordenação, busca ou página dispara uma nova chamada à API.

**Rota:** `/sales`  
**Arquivo:** `src/Pages/Sales/index.tsx`

---

## Componentes utilizados

| Componente | Arquivo | Descrição |
|---|---|---|
| `SalesTable` | `organisms/SalesTable/salesTable.tsx` | Tabela principal com toda a lógica de filtros, paginação e exportação |
| `SaleFormSheet` | `organisms/SalesTable/SaleForms.tsx` | Sheet lateral de criação e edição de pedido |
| `SaleExpandedRow` | `organisms/SalesTable/SaleExpandedRow.tsx` | Linha expansível com histórico de edições do pedido |
| `ExportPopover` | `molecules/ExportPopover/index.tsx` | Popover de opções de exportação CSV |
| `DataTable` | `organisms/DataTable/index.tsx` | Organismo base de tabela reutilizável |

---

## Chamadas de API

| Método | Endpoint | Quando |
|---|---|---|
| `GET` | `/sales` | Montagem inicial e a cada mudança de filtro, aba, ordenação, busca ou página |
| `GET` | `/sales` (com `pageSize=500000`) | Ao exportar planilha completa |
| `GET` | `/sales/:id/activities` | Ao expandir uma linha (histórico de edições) |
| `GET` | `/contacts` | Filtro search-select de cliente e combobox do formulário |
| `GET` | `/products` | Filtro search-select de produto e combobox do formulário |
| `POST` | `/sales` | Ao criar um novo pedido |
| `PUT` | `/sales/:id` | Ao salvar edição de um pedido existente |

> Chamadas disparadas pela busca têm debounce de **300ms**. Demais mudanças disparam imediatamente.

---

## Estados gerenciados (`SalesTable`)

| Estado | Tipo | Descrição |
|---|---|---|
| `activeTab` | `string` | Tab ativa (`"all"`, `"concluded"`, `"pending"`, `"failed"`) |
| `page` | `number` | Página atual |
| `pageSize` | `number` | Itens por página (padrão: 10) |
| `sales` | `Sale[]` | Dados da página atual |
| `total` | `number` | Total de pedidos retornado pela API |
| `loading` | `boolean` | Exibe skeleton durante carregamento |
| `serverFilters` | `ServerFilters` | Filtros ativos por coluna |
| `filterHistory` | `FilterSnapshot[]` | Pilha de snapshots para desfazer filtros |
| `formOpen` | `boolean` | Controla abertura do `SaleFormSheet` |
| `editSale` | `Sale \| undefined` | Pedido sendo editado (undefined = criação) |
| `refetchKey` | `number` | Incrementado após salvar formulário para forçar refetch |
| `search` | `string` | Texto da busca |
| `searchScope` | `"all" \| "client" \| "product"` | Escopo do campo de busca |
| `expandedRowIds` | `Set<string>` | IDs das linhas com detalhe expandido |
| `sort` | `SaleSort \| null` | Coluna e direção de ordenação |
| `exportOpen` | `boolean` | Controla abertura do `ExportPopover` |
| `exportLoading` | `boolean` | Estado de carregamento durante exportação |
| `selectedIds` | `Set<string>` | IDs dos pedidos selecionados via checkbox |

**Estados em `Sales` (page):**

| Estado | Tipo | Descrição |
|---|---|---|
| `canUndo` | `boolean` | Habilita o botão de desfazer filtro (flutuante) |

---

## Colunas da tabela

| Coluna | Filtro | Ordenação | Descrição |
|---|---|---|---|
| *(expandir)* | — | — | Botão circular que expande/colapsa a linha |
| ID do Pedido | — | — | ID do pedido (copiável ao clicar) |
| Cliente | Search-select | Sim | Nome clicável que navega para `/contacts/:id` |
| Produto | Search-select | Sim | Nome do produto |
| Categoria | Select | — | Badge colorido por categoria |
| Quantidade | — | Sim | Quantidade de itens |
| Valor | — | Sim | Valor total em R$ |
| Data do pedido | Date-range | Sim | Data no formato `DD/MM/YYYY` |
| Status | Select | — | Badge de status com cor |
| Tipo de pagamento | Select | — | Método de pagamento (Boleto, Pix, Cartão) |

---

## Tabs

| Tab | ID | Comportamento |
|---|---|---|
| Todos os pedidos | `all` | Sem filtro de status adicional |
| Pedidos concluídos | `concluded` | Filtra por status `Entregue` |
| Pedidos pendentes | `pending` | Filtra por status `Processando` / `Aprovado` / `Em rota` |
| Pedidos falhos | `failed` | Filtra por status `Recusado` / `Cancelado` / `Reembolsado` |

> Ao trocar de tab, todos os filtros de coluna, busca, ordenação e página são resetados.

---

## Busca

O campo de busca possui um seletor de escopo à esquerda com três opções:

| Opção | Escopo |
|---|---|
| Todos | Busca por cliente ou produto |
| Cliente | Busca apenas pelo nome do cliente |
| Produto | Busca apenas pelo nome do produto |

A troca de escopo reseta para a página 1. O texto do placeholder se adapta ao escopo selecionado. Debounce de **300ms**.

---

## Status de pedido

| Status | Descrição |
|---|---|
| Processando | Pedido recém-criado, aguardando aprovação |
| Aprovado | Pedido aprovado, em preparação |
| Em rota | Pedido a caminho do cliente |
| Entregue | Pedido entregue com sucesso |
| Entregue com Atraso | Entregue fora do prazo |
| Recusado | Pedido recusado |
| Cancelado | Pedido cancelado |
| Reembolsado | Valor reembolsado ao cliente |

---

## Cores de categoria

| Categoria | Estilo |
|---|---|
| Automotivo | `bg-slate-100 text-slate-700` |
| Beleza | `bg-pink-100 text-pink-700` |
| Brinquedos | `bg-violet-100 text-violet-700` |
| Casa | `bg-amber-100 text-amber-700` |
| Eletronicos | `bg-blue-100 text-blue-700` |
| Esportes | `bg-green-100 text-green-700` |
| Indefinida | `bg-gray-100 text-gray-600` |
| Moveis | `bg-orange-100 text-orange-700` |
| Vestuario | `bg-teal-100 text-teal-700` |

---

## Formulário de pedido (`SaleFormSheet`)

Sheet deslizante pela direita, usado tanto para criação quanto para edição.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Cliente | Search-combobox | Sim | Busca em `/contacts`; selecionar preenche `id_cliente` |
| Produto | Search-combobox | Sim | Busca em `/products`; selecionar preenche `id_produto` e `categoria` automaticamente |
| Categoria | Select | — | Preenchida automaticamente ao selecionar produto |
| Quantidade | Number | — | Inteiro ≥ 0 |
| Valor (R$) | Number | — | Decimal ≥ 0, step 0.01 |
| Método de pagamento | Select | — | Boleto, Pix, Cartão |
| Status | Select | — | Os 8 status possíveis |
| Data do pedido | Date | — | Padrão: data de hoje |

- Em **criação**: chama `POST /sales`.
- Em **edição**: chama `PUT /sales/:id`; o campo `user.name` do contexto de autenticação é enviado como autor da alteração.
- Após salvar com sucesso: chama `onSuccess()` (incrementa `refetchKey` para refetch) e fecha o sheet.

---

## Linha expandida (`SaleExpandedRow`)

Exibida abaixo da linha ao clicar nela. Busca o histórico via `GET /sales/:id/activities` ao montar.

**Timeline de edições:**
- Cada entrada mostra: campo alterado, valor anterior (tachado em vermelho), novo valor (em roxo), método de alteração, autor e data/hora.
- No final da timeline, sempre aparece a entrada original de criação do pedido (data do pedido + nome do cliente).
- Se não houver edições, exibe "Nenhuma edição registrada."

**Botão "Editar pedido"** no canto superior direito do painel abre o `SaleFormSheet` em modo edição para aquele pedido.

---

## Exportação CSV

Acionada pelo botão "Exportar" no header da página → abre `ExportPopover` com duas opções:

| Opção | Comportamento |
|---|---|
| Exportar planilha completa | Busca todos os pedidos com os filtros ativos (`pageSize=500000`) e gera CSV |
| Exportar selecionados | Gera CSV apenas com os pedidos marcados via checkbox (cache acumulativo entre páginas) |

O CSV inclui: ID, Produto, Cliente, Categoria, Quantidade, Valor, Data, Status, Pagamento.  
Nome do arquivo: `pedidos_YYYY-MM-DD.csv` / `pedidos_selecionados_YYYY-MM-DD.csv`.

---

## Handle exposto via `ref` (`SalesTableHandle`)

| Método | Comportamento |
|---|---|
| `undo()` | Restaura o snapshot anterior de filtros, tab, página e ordenação |
| `reset()` | Salva snapshot atual e reseta tab, filtros, busca, ordenação e página |
| `openAdd()` | Abre o `SaleFormSheet` em modo criação |
| `openExport()` | Abre o `ExportPopover` |

---

## Interações e comportamentos

| Ação | Comportamento |
|---|---|
| Botão "Exportar" | Abre `ExportPopover` via `tableRef.current?.openExport()` |
| Botão "Adicionar Pedido" | Abre `SaleFormSheet` em modo criação via `tableRef.current?.openAdd()` |
| Botão "Desfazer" (flutuante) | Chama `tableRef.current?.undo()` — habilitado quando `canUndo = true` |
| Botão "Resetar" (flutuante) | Chama `tableRef.current?.reset()` — limpa todos os filtros |
| Clicar no nome do cliente | Navega para `/contacts/:id` |
| Clicar em uma linha | Expande/colapsa `SaleExpandedRow` |
| Trocar de aba | Reseta filtros, busca, ordenação e página |
| Ordenar coluna | Envia `sort_by` e `sort_dir` para a API; reseta para página 1 |
| Trocar escopo da busca | Reseta para página 1; placeholder do input se adapta |

---

## Observações

- A seleção via checkbox é **acumulativa entre páginas**: pedidos selecionados em páginas anteriores são mantidos em cache (`selectedCache`) mesmo após virar a página.
- O filtro de exportação respeita a aba ativa e todos os filtros de coluna no momento da exportação.
- O `ExportPopover` exibe pills com os filtros ativos para facilitar a conferência antes de exportar.
- Ao selecionar um produto no formulário, a categoria é preenchida automaticamente com a categoria do produto.
- O histórico de edições registra o `user.name` do usuário autenticado como autor da alteração ao editar via formulário.
