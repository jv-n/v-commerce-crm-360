# Tickets

## Visão Geral

Página principal de gestão de tickets de suporte. Permite listar, filtrar, ordenar, expandir e exportar tickets. A tabela é server-side: cada mudança de filtro, aba, ordenação, busca ou página dispara uma nova chamada à API.

**Rota:** `/tickets`  
**Arquivo:** `src/Pages/Tickets/index.tsx`

---

## Componentes utilizados

| Componente | Arquivo | Descrição |
|---|---|---|
| `TicketsTable` | `organisms/TicketsTable/ticketsTable.tsx` | Tabela principal com lógica de filtros, paginação, seleção e exportação |
| `TicketExpandedRow` | `organisms/TicketsTable/TicketExpandedRow.tsx` | Linha expansível com timeline visual do ticket |
| `ExportPopover` | `molecules/ExportPopover/index.tsx` | Popover de opções de exportação CSV |
| `DataTable` | `organisms/DataTable/index.tsx` | Organismo base de tabela reutilizável |

---

## Chamadas de API

| Método | Endpoint | Quando |
|---|---|---|
| `GET` | `/tickets/` | Montagem inicial e a cada mudança de filtro, aba, ordenação, busca ou página |
| `GET` | `/tickets/` com `pageSize=100000` | Ao exportar a planilha completa |
| `GET` | `/tickets/responsibles` | Ao carregar as opções do filtro de responsável |

---

## Estados gerenciados (`TicketsTable`)

| Estado | Tipo | Descrição |
|---|---|---|
| `activeTab` | `string` | Tab ativa (`"all"`, `"my-attending"`, `"waiting"`) |
| `page` | `number` | Página atual |
| `pageSize` | `number` | Itens por página (padrão: 10) |
| `tickets` | `Ticket[]` | Dados da página atual |
| `responsibleOptions` | `string[]` | Responsáveis disponíveis para filtro |
| `total` | `number` | Total de tickets retornado pela API |
| `loading` | `boolean` | Exibe carregamento durante a busca dos dados |
| `serverFilters` | `ServerFilters` | Filtros ativos por responsável, status, problema e nota |
| `dateFilters` | `DateFilters` | Filtros de período de abertura |
| `filterHistory` | `FilterSnapshot[]` | Pilha de snapshots para desfazer filtros |
| `searchQuery` | `string` | Texto da busca |
| `expandedRowIds` | `Set<string>` | IDs das linhas expandidas |
| `sort` | `TicketSort \| null` | Coluna e direção de ordenação |
| `exportOpen` | `boolean` | Controla abertura do `ExportPopover` |
| `exportLoading` | `boolean` | Estado de carregamento durante exportação |
| `selectedIds` | `Set<string>` | IDs dos tickets selecionados via checkbox |

**Estados em `Tickets` (page):**

| Estado | Tipo | Descrição |
|---|---|---|
| `canUndo` | `boolean` | Habilita o botão de desfazer filtro |

---

## Colunas da tabela

| Coluna | Filtro | Ordenação | Descrição |
|---|---|---|---|
| *(expandir)* | — | — | Botão circular que expande ou colapsa a linha |
| ID Ticket | — | — | Identificador do ticket |
| Data abertura | Date-range | Sim | Data e horário de abertura do ticket |
| Cliente | — | Sim | Nome clicável que navega para `/contacts/:id` |
| Pedido | — | — | Identificador do pedido relacionado |
| Responsável Ticket | Multi-select | Sim | Agente responsável pelo atendimento |
| Problema | Multi-select | — | Tipo de problema registrado |
| Status | Multi-select | — | Status atual do ticket |
| Nota | Multi-select | Sim | Nota da avaliação ou indicação de ausência de avaliação |

---

## Tabs

| Tab | ID | Comportamento |
|---|---|---|
| Todos os Tickets | `all` | Exibe todos os tickets, respeitando os filtros aplicados |
| Meus Tickets em Atendimento | `my-attending` | Filtra tickets do usuário autenticado com status `Em atendimento` |
| Tickets Aguardando | `waiting` | Filtra tickets com status `Aguardando` |

> Ao trocar de tab, os filtros, busca, ordenação, seleção, expansão de linhas e página são resetados.

---

## Busca

O campo de busca permite pesquisar tickets utilizando o texto informado pelo usuário.

A busca considera informações como:

| Campo pesquisável |
|---|
| ID do ticket |
| Nome do cliente |
| ID do cliente |
| ID do pedido |
| Responsável |
| Problema |
| Status |
| Região |
| Estado |
| Faixa etária |

Ao alterar a busca, a tabela retorna para a página 1.

---

## Status de ticket

| Status | Descrição |
|---|---|
| Aguardando | Ticket registrado e aguardando atendimento |
| Em atendimento | Ticket sendo acompanhado por um responsável |
| Finalizado | Atendimento concluído |

---

## Tipos de problema

| Problema | Descrição |
|---|---|
| Produto | Problemas relacionados ao produto adquirido |
| Entrega | Problemas relacionados ao envio ou recebimento |
| Pagamento | Problemas relacionados à cobrança ou forma de pagamento |
| Reembolso | Problemas relacionados à devolução de valores |

---

## Linha expandida (`TicketExpandedRow`)

Exibida abaixo da linha ao clicar no botão de expansão do ticket.

A timeline apresenta informações visuais relacionadas ao atendimento:

- criação do ticket pelo cliente;
- vínculo do agente responsável, quando disponível;
- finalização do ticket, quando o status for `Finalizado`.

A timeline é montada a partir dos dados já carregados do ticket, sem realizar uma chamada adicional à API.

---

## Exportação CSV

Acionada pelo botão `"Exportar"` no header da página, que abre o `ExportPopover` com duas opções:

| Opção | Comportamento |
|---|---|
| Exportar planilha completa | Busca todos os tickets com os filtros ativos (`pageSize=100000`) e gera o CSV |
| Exportar selecionados | Gera CSV apenas com os tickets marcados via checkbox |

O CSV inclui: ID Ticket, Cliente, ID Cliente, ID Pedido, Data de abertura, Responsável, Problema, Status e Nota.  
Nome do arquivo: `tickets_YYYY-MM-DD.csv` / `tickets_selecionados_YYYY-MM-DD.csv`.

---

## Handle exposto via `ref` (`TicketsTableHandle`)

| Método | Comportamento |
|---|---|
| `undo()` | Restaura o snapshot anterior de filtros, tab, página, ordenação e busca |
| `reset()` | Salva o estado atual e reseta tab, filtros, busca, ordenação e página |
| `openExport()` | Abre o `ExportPopover` |
| `openAdd()` | Aciona o fluxo de adicionar ticket, ainda não implementado na interface |

---

## Interações e comportamentos

| Ação | Comportamento |
|---|---|
| Botão `"Exportar"` | Abre `ExportPopover` via `tableRef.current?.openExport()` |
| Botão `"Adicionar Ticket"` | Chama `tableRef.current?.openAdd()`, mas ainda não abre formulário |
| Botão `"Desfazer"` flutuante | Chama `tableRef.current?.undo()` |
| Botão `"Resetar"` flutuante | Chama `tableRef.current?.reset()` e limpa os filtros |
| Clicar no nome do cliente | Navega para `/contacts/:id` |
| Clicar no botão de expansão | Expande ou colapsa `TicketExpandedRow` |
| Trocar de aba | Reseta filtros, busca, ordenação e página |
| Ordenar coluna | Envia a ordenação para a API e retorna para a página 1 |

---

## Observações

- A seleção via checkbox permite exportar apenas os tickets selecionados.
- A exportação completa respeita os filtros, aba, busca e ordenação ativos.
- A aba `"Meus Tickets em Atendimento"` utiliza o nome do usuário autenticado.
- O botão `"Adicionar Ticket"` está presente na interface, mas o formulário de criação ainda não foi implementado.
- O nome do cliente na tabela direciona para a tela de cliente específico.