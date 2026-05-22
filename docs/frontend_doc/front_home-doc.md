# Home — Favoritos e Metas

**Arquivo:** `frontend/src/Pages/Home/index.tsx`

**Rota:** `/` (raiz da aplicação autenticada, protegida — acessível por todos os papéis)

Página inicial exibida após o login. Centraliza dois módulos de personalização por usuário: **Bookmarks** (favoritos de contatos e produtos) e **Goals** (metas de negócio com progresso automático). Todo o estado é persistido por usuário via JWT (endpoints autenticados).

---

## Layout

```
┌────────────────────────────────────────────────┐
│  Saudação personalizada + horário              │
├───────────────────────┬────────────────────────┤
│  Bookmarks            │  Metas                 │
│  ┌───┐ ┌───┐ ┌───┐   │  ┌──────────────────┐  │
│  │ C │ │ P │ │ + │   │  │ Meta 1           │  │
│  └───┘ └───┘ └───┘   │  │ Progresso ██░░░  │  │
│                       │  └──────────────────┘  │
│                       │  ┌──────────────────┐  │
│                       │  │ Meta 2           │  │
│                       │  └──────────────────┘  │
│                       │  [ + Nova meta ]        │
└───────────────────────┴────────────────────────┘
```

- **C** = `ContactBookmarkCard` — contato favoritado
- **P** = `ProductBookmarkCard` — produto favoritado
- **+** = `AddBookmarkButton` — abre modal para adicionar favorito

---

## Bookmarks (Favoritos)

Permite que o usuário salve atalhos para contatos e produtos de interesse. Os bookmarks são globais por usuário — não filtram por período.

### Tipos de bookmark

| Tipo | Campos salvos | Card exibido |
|---|---|---|
| `contact` | `id`, `name`, `email` | `ContactBookmarkCard` — nome, e-mail, botão "Ver perfil" |
| `product` | `id`, `name`, `price`, `totalSales`, `category` | `ProductBookmarkCard` — nome, categoria (com ícone), preço, total de vendas |

Ao clicar no card, o usuário é navegado para o detalhe do contato (`/contacts/{id}`) ou produto (`/products/{id}`).

### Adicionar bookmark

O botão `+` abre `AddBookmarkModal`. O usuário informa um ID (de contato ou produto). A modal resolve o tipo automaticamente: tenta `GET /contacts/{id}` primeiro e, em caso de 404, tenta `GET /products/{id}`. Se nenhum for encontrado, exibe erro.

Ao confirmar, chama `POST /bookmarks` com os campos do item encontrado.

### Remover bookmark

O ícone de lixeira no card chama `DELETE /bookmarks/{id}`.

### Endpoints utilizados

| Ação | Endpoint |
|---|---|
| Listar bookmarks | `GET /bookmarks` |
| Criar bookmark | `POST /bookmarks` |
| Remover bookmark | `DELETE /bookmarks/{id}` |
| Resolver contato | `GET /contacts/{id}` |
| Resolver produto | `GET /products/{id}` |

Todos exigem `Authorization: Bearer <jwt>`.

---

## Goals (Metas)

Permite ao usuário definir metas de negócio com progresso calculado automaticamente a partir dos dados do banco. O progresso é atualizado mensalmente (mês de referência calculado pelo backend).

### Tipos de meta (`GoalKind`)

| Tipo | Descrição | Parâmetro adicional |
|---|---|---|
| `product_sales` | Unidades vendidas de um produto específico | `productId` (UUID) |
| `new_clients` | Novos clientes cadastrados no mês | — |
| `category_sales` | Unidades vendidas de uma categoria | `category` (string) |

### `GoalCard`

Exibe para cada meta:
- Tipo e rótulo (ex: `"Venda de Eletrônicos"`)
- Período de referência (`referenceMonth` no formato `MM/YYYY`)
- Barra de progresso visual: `current / target` (capped em 100%)
- Valor atual vs meta (ex: `"142 / 200"`)
- Botão de remoção

### `AddGoalModal`

Modal de criação de meta. Campos:

| Campo | Tipo | Quando exibido |
|---|---|---|
| Tipo de meta | Select (`GoalKind`) | Sempre |
| ID do produto | Text input | `kind = "product_sales"` |
| Categoria | Text input | `kind = "category_sales"` |
| Meta (valor alvo) | Number input | Sempre |

Ao confirmar, o frontend resolve o nome do produto via `GET /products/{id}` (quando `kind = "product_sales"`) antes de salvar, para exibir o nome no card.

### Carregamento do progresso

O progresso é carregado em duas etapas:

1. **Batch inicial:** `GET /goals/progress` retorna o progresso atual de todas as metas do usuário de uma só vez, junto com o `_reference_month`.
2. **Individual (após criar):** `GET /goals/{id}/progress` para a meta recém-criada.

### Endpoints utilizados

| Ação | Endpoint |
|---|---|
| Listar metas | `GET /goals` |
| Criar meta | `POST /goals` |
| Remover meta | `DELETE /goals/{id}` |
| Progresso de todas as metas | `GET /goals/progress` |
| Progresso de uma meta | `GET /goals/{id}/progress` |

Todos exigem `Authorization: Bearer <jwt>`.

---

## Saudação

O topo da página exibe uma saudação personalizada com o primeiro nome do usuário logado e o período do dia (bom dia / boa tarde / boa noite), calculado a partir do horário local.

---

## Integração com o Agente IA

A Home recebe `onOpenAI` via `useOutletContext` (exposto pelo `AppFrame`). Qualquer ação futura que precise abrir o chat do agente a partir da Home (ex: analisar progresso de uma meta) pode chamar `onOpenAI(mensagem)` diretamente.

---

## Papéis com acesso

Acessível por todos os papéis autenticados (`admin`, `sales`, `support`). Bookmarks e goals são isolados por `user_id` — cada usuário vê apenas os seus próprios.

---

## Arquivos relacionados

| Arquivo | Descrição |
|---|---|
| `Pages/Home/index.tsx` | Componente principal da página |
| `lib/api/bookmarks.ts` | Funções de API de bookmarks |
| `lib/api/goals.ts` | Funções de API de goals e progresso |
| `types/home.ts` | Tipos `Bookmark`, `ContactBookmark`, `ProductBookmark`, `Goal`, `GoalKind` |
