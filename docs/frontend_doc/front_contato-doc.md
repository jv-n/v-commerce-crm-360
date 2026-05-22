# Contatos

## Visão Geral

Página de listagem e gestão da base de clientes do CRM. Implementa a persona "Fernanda Souza — Diretora de Customer Success" do case ("preciso de uma tela onde, em segundos, eu veja o histórico completo de um cliente"). Renderiza uma tabela server-side com filtros avançados em 4 grupos (financeiro/compras, suporte+NPS, perfil, comportamento digital), busca por nome com debounce, ordenação por coluna, expansão de linha com resumo rápido, exportação CSV em streaming, histórico de undo dos filtros e criação de novos contatos.

A tabela é totalmente paginada no servidor — o frontend nunca carrega a base inteira no cliente. A única exceção é a exportação, que usa um endpoint dedicado de streaming.

**Rota:** `/contacts`
**Arquivo:** [src/Pages/Contacts/index.tsx](frontend/src/Pages/Contacts/index.tsx)
**Acesso:** `admin`, `sales` (controlado por `<ProtectedRoute allowedRoles={["admin", "sales"]}>` em [src/App.tsx](frontend/src/App.tsx))

---

## Mapa de arquivos envolvidos

| Camada | Arquivo | Papel |
|---|---|---|
| Página | [src/Pages/Contacts/index.tsx](frontend/src/Pages/Contacts/index.tsx) | Topo com botões flutuantes de undo/reset; monta o `ContactsTable` via `ref` |
| Componente principal | [src/components/molecules/ContactsTable/index.tsx](frontend/src/components/molecules/ContactsTable/index.tsx) | Estado, filtros, paginação, ordenação, seleção e exposição do handle imperativo |
| Drawer de filtros | [src/components/molecules/ContactsTable/AdvancedFiltersDrawer.tsx](frontend/src/components/molecules/ContactsTable/AdvancedFiltersDrawer.tsx) | Drawer lateral com 4 categorias de filtro avançado |
| Sheet de criação | [src/components/molecules/ContactsTable/ContactFormSheet.tsx](frontend/src/components/molecules/ContactsTable/ContactFormSheet.tsx) | Sheet de criação de novo contato |
| Popover de exportação | [src/components/molecules/ExportPopover/index.tsx](frontend/src/components/molecules/ExportPopover/index.tsx) | Opções "Exportar planilha completa" / "Exportar selecionados" |
| Linha expansível | [src/components/molecules/ContactsTable/ContactExpandedRow.tsx](frontend/src/components/molecules/ContactsTable/ContactExpandedRow.tsx) | Card com resumo rápido do contato dentro da linha |
| Hook de fetch | [src/components/molecules/ContactsTable/useContactsFetch.ts](frontend/src/components/molecules/ContactsTable/useContactsFetch.ts) | Encapsula chamada paginada e debounce do `nameSearch` |
| Hook de exportação | [src/components/molecules/ContactsTable/useContactExport.ts](frontend/src/components/molecules/ContactsTable/useContactExport.ts) | Encapsula export CSV completo e dos selecionados |
| Tabela base | [src/components/organisms/DataTable/index.tsx](frontend/src/components/organisms/DataTable/index.tsx) | Organismo genérico reutilizado em várias telas |
| Cliente HTTP | [src/lib/api/contacts.ts](frontend/src/lib/api/contacts.ts) | `listContacts`, `exportContacts`, `createContact`, `updateContact`, `fetchLastOrder` |

---

## Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ⏎ undo                                                                  │
│  ⟳ reset                                                                 │
│  Contatos                          [Filtros avançados (2)] [Exportar]    │
│                                    [+ Adicionar contato]                 │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ ▾ │ Nome   │ Status │ Última compra ℹ │ Compras │ Contatos │ NPS │  │
│  ├───┼────────┼────────┼─────────────────┼─────────┼──────────┼─────┤  │
│  │ ▸ │ Carlos │ Ativo  │ 10/03/2026      │ 12      │ email…   │ ▲   │  │
│  │   │ ─ expandido: card com resumo ─                                │  │
│  │ ▸ │ Maria  │ VIP    │ 22/02/2026      │ 5       │ email…   │ ▲   │  │
│  │ ▸ │ João   │ Lead   │ —               │ 0       │ email…   │ —   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│  Página 1 / 12         [10 / pág ▼]  [‹ 1 2 3 4 ›]                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Chamadas de API

| Método | Endpoint | Quando |
|---|---|---|
| `GET` | `/contacts` | Montagem inicial e a cada mudança de filtro, aba, ordenação, página, ou `refetchKey` |
| `GET` | `/contacts/export` | Exportação CSV completa (streaming, content-type `text/csv`) |
| `GET` | `/contacts/{contact_id}/pedidos` | Hover na coluna "Última compra" (busca lazy do pedido mais recente) |
| `POST` | `/contacts/` | Criação de contato no `ContactFormSheet` |
| `PUT` | `/contacts/{contact_id}` | Edição inline (não usada atualmente) |

**Debounce:** o `nameSearch` é debounced em **300 ms** dentro do `useContactsFetch`. Mudanças de outros filtros disparam fetch imediato.

**Header `X-User-Name`:** o backend espera o nome do usuário no header para logar a edição em `ft_contact_activities`. O frontend envia o nome do `useAuth().user`, com fallback `"Sistema"` se não houver usuário (situação só possível em testes locais sem login).

---

## Tabs e abas

| Tab | Filtro server-side aplicado |
|---|---|
| `all` (única atualmente) | Nenhum — retorna todos os contatos |

A estrutura de tabs está preparada para expansão futura (e.g., `vip`, `inativos`), mas hoje só há uma aba. O componente `Tabs` segue sendo renderizado para manter consistência visual com outras telas (Pedidos, Tickets).

---

## Estados gerenciados (em `ContactsTable`)

| Estado | Tipo | Descrição |
|---|---|---|
| `activeTab` | `string` | Tab ativa (`"all"`) |
| `page` | `number` | Página atual (1-indexed) |
| `pageSize` | `number` | Itens por página (padrão: `10`) |
| `serverFilters` | `ServerFilters` | Filtros básicos de coluna (compras, data criação, engajamento, status) |
| `advanced` | `ContactAdvancedFilters` | Filtros avançados em 4 categorias |
| `drawerOpen` | `boolean` | Abre/fecha o `AdvancedFiltersDrawer` |
| `expandedRowId` | `string \| null` | ID da linha atualmente expandida (apenas uma de cada vez) |
| `sortBy` | `string \| null` | Coluna de ordenação |
| `sortDir` | `"asc" \| "desc"` | Direção de ordenação |
| `formOpen` | `boolean` | Abre/fecha o `ContactFormSheet` |
| `nameSearch` | `string` | Texto de busca por nome (debounced 300 ms) |
| `filterHistory` | `FilterSnapshot[]` | Pilha LIFO de snapshots de filtro para undo |
| `refetchKey` | `number` | Contador incrementado após criação de contato para forçar re-busca |
| `selectedCache` | `Map<string, ContactRow>` | Cache acumulativo de selecionados entre páginas (vive no `useContactExport`) |

### Estados em `Contacts` (page wrapper)

| Estado | Tipo | Descrição |
|---|---|---|
| `canUndo` | `boolean` | Espelha `filterHistory.length > 0` para habilitar o botão flutuante de undo |

---

## Colunas da tabela

| Coluna | Filtro | Ordenação | Descrição |
|---|---|---|---|
| *(expandir)* | — | — | Botão circular que expande/colapsa `ContactExpandedRow` |
| Nome | — | Sim (`name`) | Nome clicável que navega para `/contacts/:id`; exibe botão de cópia do ID |
| Status | Multi-select | — | Badge do `clientStatus` (Ativo, VIP, Lead, Em risco, Inativo) |
| Última compra | — | Sim (`lastPurchase`) | Data formatada `dd/MM/yyyy`; tooltip lazy via `fetchLastOrder` no primeiro hover |
| Compras | Range numérico | Sim (`purchases`) | Total histórico de pedidos (`total_pedidos`) |
| Contatos | — | — | E-mail (linha 1) e telefone formatado (linha 2) via `CellDouble` |
| Data de criação | Date range (oculta) | — | Coluna invisível usada apenas como filtro |
| Engajamento | Multi-select | Sim (`engagementScore`) | Badge NPS: Promotor / Neutro / Detrator / Nenhum |
| *(navegar)* | — | — | Botão `→` que navega para `/contacts/:id` |

### Cores do badge de engajamento

| Categoria | Cor |
|---|---|
| Promotor | verde |
| Neutro | amarelo |
| Detrator | vermelho |
| Nenhum NPS | cinza |

---

## Filtros avançados (`AdvancedFiltersDrawer`)

Drawer lateral (à direita) com filtros agrupados em 4 seções. Aplicados ao clicar em "Aplicar filtros" — não disparam fetch enquanto o drawer está aberto.

### Compras / Financeiro
| Campo | Tipo |
|---|---|
| Região | Multi-select |
| Estado | Multi-select |
| Origem | Multi-select |
| Método de pagamento | Multi-select |
| Receita total (R$) | Range numérico |
| Ticket médio (R$) | Range numérico |
| Primeira compra | Intervalo de datas |
| Última compra | Intervalo de datas |

### Suporte & NPS
| Campo | Tipo |
|---|---|
| Tickets de suporte | Range numérico |
| Nota de atendimento | Range numérico |
| NPS médio | Range numérico |
| NPS recente | Range numérico |
| Nota de produto | Range numérico |

### Perfil
| Campo | Tipo |
|---|---|
| Gênero | Multi-select |
| Faixa etária | Multi-select |

### Comportamento Digital
| Campo | Tipo |
|---|---|
| Canal preferido | Multi-select |
| Dispositivo | Multi-select |
| Origem da sessão | Multi-select |
| Período do dia | Multi-select |
| Dia da semana | Multi-select |
| Categorias visualizadas | Multi-select |
| Taxa de conversão (%) | Range numérico |
| Total de sessões | Range numérico |
| Abandono de carrinho | Range numérico |

O botão "Filtros avançados" na barra da tabela exibe o número de grupos ativos (`contactAdvancedActiveCount`). Quando há pelo menos um filtro avançado ativo, o botão muda para estilo "aplicado" (fundo destacado).

---

## Handle imperativo (`ContactsTableHandle`)

A tabela expõe métodos via `ref` para que a página possa acioná-los a partir dos botões fora do componente:

| Método | Comportamento |
|---|---|
| `undo()` | Pop do último snapshot de `filterHistory` (LIFO); restaura `serverFilters` + `advanced` |
| `reset()` | Empilha snapshot atual e zera todos os filtros ao estado inicial |
| `openAdd()` | Abre o `ContactFormSheet` para criação de novo contato |
| `openExport()` | Abre o `ExportPopover` com as duas opções de exportação |

A página `/contacts` segura uma `tableRef = useRef<ContactsTableHandle>()` e chama esses métodos nos handlers dos botões flutuantes/cabeçalho.

---

## Exportação CSV

Acionada pelo botão "Exportar", que abre o `ExportPopover` com duas opções:

| Opção | Comportamento |
|---|---|
| Exportar planilha completa | Chama `GET /contacts/export` com os filtros atuais; o backend faz streaming `text/csv; charset=utf-8`; download via `Content-Disposition: attachment; filename=contatos.csv` |
| Exportar selecionados | Gera CSV apenas com os contatos marcados via checkbox; usa o cache acumulativo `selectedCache` (acumula entre páginas até reset/refresh) |

O endpoint de export aceita os mesmos query params que `GET /contacts` (incluindo todos os filtros avançados), mas com `pageSize` interpretado como ilimitado.

---

## Criação de contato

O `ContactFormSheet` abre quando `tableRef.current?.openAdd()` é chamado. Após submit bem-sucedido (`POST /contacts/` retornar 201), o sheet fecha e a tabela incrementa `refetchKey` — o `useEffect` que observa `refetchKey` dispara novo fetch e o contato aparece na lista.

Campos obrigatórios: apenas `name`. Demais campos (`email`, `phone`, `clientStatus`, `region`, `origin`) são opcionais — o backend aceita `null` para qualquer um deles em `ContactCreate`.

---

## Interações e comportamentos

| Ação | Comportamento |
|---|---|
| Digitar na busca por nome | Atualiza `nameSearch`; depois de 300 ms dispara novo fetch e volta para `page = 1` |
| Aplicar filtro server (column header) | Empilha snapshot em `filterHistory`, dispara fetch, volta para `page = 1` |
| Aplicar filtros avançados (drawer → Aplicar) | Mesmo comportamento + fecha o drawer |
| Botão "Exportar" | Chama `tableRef.current?.openExport()` |
| Botão "Adicionar contato" | Chama `tableRef.current?.openAdd()` |
| Botão undo flutuante (`UndoIcon`) | `tableRef.current?.undo()` — habilitado quando `canUndo = true` |
| Botão reset flutuante (`RefreshIcon`) | `tableRef.current?.reset()` — limpa todos os filtros e empilha um snapshot do estado anterior |
| Clicar no nome | Navega para `/contacts/:id` (página `ContactDetail`) |
| Clicar no botão `→` da linha | Mesma navegação |
| Clicar em qualquer outra área da linha | Expande/colapsa o `ContactExpandedRow` |
| Hover em "Última compra" (`InfoOutlinedIcon`) | Tooltip lazy via `fetchLastOrder(contact_id)`; busca apenas no primeiro hover, com cache em memória |
| Marcar checkbox da linha | Adiciona ao `selectedCache`; conta cumulativa exibida no botão "Exportar selecionados" |
| Trocar página | Mantém filtros, ordenação e `selectedCache`; faz fetch da nova página |
| Trocar `pageSize` | Volta para `page = 1` e dispara novo fetch |

---

## Tipos relevantes

| Tipo | Local | Descrição |
|---|---|---|
| `ServerFilters` | [ContactsTable/index.tsx](frontend/src/components/molecules/ContactsTable/index.tsx) | Filtros básicos de coluna (compras, data, engajamento, status) |
| `ContactAdvancedFilters` | [AdvancedFiltersDrawer.tsx](frontend/src/components/molecules/ContactsTable/AdvancedFiltersDrawer.tsx) | Tipos para os 4 grupos de filtro avançado |
| `FilterSnapshot` | [ContactsTable/index.tsx](frontend/src/components/molecules/ContactsTable/index.tsx) | `{ serverFilters, advanced, nameSearch, sortBy, sortDir }` — empilhado em `filterHistory` |
| `ContactsTableHandle` | [ContactsTable/index.tsx](frontend/src/components/molecules/ContactsTable/index.tsx) | `{ undo, reset, openAdd, openExport }` |
| `ContactRow` | [src/types/contacts.ts](frontend/src/types/contacts.ts) | Forma de cada item da resposta `/contacts` |
| `ContactsPageOut` | (server, ver [docs/backend_doc/models-doc.md](docs/backend_doc/models-doc.md)) | `{ data, total, page, pageSize }` |

---

## Observações

- **Histórico de undo é LIFO.** Cada operação que altera filtros empilha um snapshot; `undo()` desempilha o último. A seta fica desabilitada (`text-gray-300 cursor-not-allowed`) quando a pilha está vazia. `reset()` também empilha — então é possível desfazer um reset acidental.
- **Snapshots são cópias por valor.** `filterHistory` inclui cópias profundas de `serverFilters` e `advanced` no momento do push, evitando que mutações posteriores afetem o histórico.
- **Seleção é acumulativa entre páginas.** O `selectedCache` (mantido em `useContactExport`) usa `Map<id, ContactRow>` para deduplicar; navegar para outra página e voltar mantém a seleção. Reset ou refresh esvaziam o cache.
- **Tooltip de última compra usa `createPortal`.** Renderiza no `document.body` para evitar clipping por `overflow: hidden` da célula. O fetch é lazy — só executa no primeiro hover, depois fica cached em escopo de componente.
- **Tab única hoje.** Apesar da estrutura suportar várias tabs, só existe `"all"` em produção. Removê-las simplificaria o código, mas mantemos por consistência visual com Pedidos e Tickets.
- **Permissão `sales` ≠ visão limitada.** Um usuário `sales` enxerga **a mesma lista** que um `admin`. Não há filtro de "vendedor responsável" implementado — uma evolução natural seria adicionar `responsavel_id` no backend e filtrar automaticamente.
- **Backend sem autenticação.** O endpoint `/contacts` não exige JWT (vide [decisão 6](../decisions-doc.md#6-jwt-verificado-apenas-em-endpoints-de-personalização)). Qualquer cliente HTTP pode listar a base inteira — a proteção é só o `ProtectedRoute`.
- **Export pode ser pesado.** "Exportar planilha completa" sem filtros baixa 60k+ contatos. O backend faz streaming, então o uso de memória do servidor é constante, mas o browser pode segurar ~5-10 MB de CSV em memória até o download terminar.
- **`pageSize` máximo no backend é 500.000.** Combinado com filtros pesados, é possível causar timeout. O frontend limita a 100 nos seletores visíveis.
- **A coluna "Data de criação" é invisível.** Existe apenas como filtro (intervalo de datas) — não é exibida na grade. Decisão para reduzir poluição visual; a data aparece em `ContactExpandedRow` quando o usuário expande a linha.
