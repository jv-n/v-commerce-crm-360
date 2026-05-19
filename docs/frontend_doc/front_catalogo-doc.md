# Catálogo de Produtos

## Visão Geral

> Descreva o objetivo da página e o que o usuário consegue fazer nela.

**Rota:** `/products`  
**Arquivo:** `src/Pages/Products/index.tsx`

---

## Componentes utilizados

| Componente | Arquivo | Descrição |
|---|---|---|
| `ProductsTable` | `molecules/ProductsTable/index.tsx` | Tabela principal com filtros e paginação |
| `AdvancedFiltersDrawer` | `molecules/ProductsTable/AdvancedFiltersDrawer.tsx` | Drawer de filtros avançados |
| `ProductExpandedRow` | `molecules/ProductsTable/ProductExpandedRow.tsx` | Linha expandida com detalhes do produto |

---

## Chamadas de API

| Método | Endpoint | Quando |
|---|---|---|
| `GET` | `/products` | Carregamento inicial e ao aplicar filtros |
| `GET` | `/products/{id}` | Ao expandir um produto |

---

## Estados gerenciados

| Estado | Tipo | Descrição |
|---|---|---|
| `canUndo` | `boolean` | Controla se o botão de desfazer filtro está ativo |

---

## Interações e comportamentos

| Ação | Comportamento |
|---|---|
| Botão "Adicionar produto" | |
| Botão "Desfazer filtro" (undo) | Reverte o último filtro aplicado via `tableRef.current?.undo()` |
| Botão "Resetar tabela" | Remove todos os filtros via `tableRef.current?.reset()` |
| Expandir linha | Exibe `ProductExpandedRow` com métricas Gold do produto |

---

## Observações

>