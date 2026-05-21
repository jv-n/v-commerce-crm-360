# Menu / Sidebar

## Visão Geral

> O menu lateral é o principal mecanismo de navegação do aplicativo e inclui um header superior com dropdown de usuário.

A tela de Menu é composta pelo layout global do `AppFrame`, que combina um `Sidebar` responsivo com o conteúdo principal (`SidebarInset`) e a barra superior (`AppNavbar`). A navegação exibe botões de atalho em formato de ícone, com tooltips, e controla visibilidade por papel do usuário.

**Arquivos principais:**
- `src/components/organisms/AppFrame/index.tsx`
- `src/components/molecules/Sidebar/sidebar.tsx`
- `src/components/molecules/AppNavbar/index.tsx`
- `src/components/molecules/UserMenu/index.tsx`

---

## Componentes utilizados

| Componente | Arquivo | Descrição |
|---|---|---|
| `AppFrame` | `src/components/organisms/AppFrame/index.tsx` | Layout global que monta a sidebar, o conteúdo de rota e o painel de chat AI |
| `SidebarProvider` | `src/components/molecules/Sidebar/sidebar.tsx` | Contexto de estado da sidebar (expandido/colapsado, mobile) |
| `Sidebar` | `src/components/molecules/Sidebar/sidebar.tsx` | Container da navegação lateral com variantes responsivas |
| `SidebarMenu` / `SidebarMenuItem` / `SidebarMenuButton` | `src/components/molecules/Sidebar/sidebar.tsx` | Estrutura de itens do menu com botões de navegação e tooltips |
| `SidebarSeparator` | `src/components/molecules/Sidebar/sidebar.tsx` | Separa blocos de itens do menu |
| `SidebarInset` | `src/components/molecules/Sidebar/sidebar.tsx` | Área principal de conteúdo ao lado do sidebar |
| `AppNavbar` | `src/components/molecules/AppNavbar/index.tsx` | Barra superior contendo ações globais e `UserMenu` |
| `UserMenu` | `src/components/molecules/UserMenu/index.tsx` | Dropdown de perfil com logout e badge de papel |

---

## Layout

![tela_menu](image.png)

---

## Rotas e visibilidade

| Item | Rota | Visível para |
|---|---|---|
| Menu | `/` | Todos |
| Contatos | `/contacts` | `admin`, `sales` |
| Pedidos | `/sales` | `admin`, `sales` |
| Produtos | `/products` | Todos |
| Dashboard | `/dashboard` | `admin` |
| Tickets | `/tickets` | `admin`, `support` |
| Assistente V.IA | internal chat | `admin` |

---

## Estados gerenciados

| Estado | Localização | Descrição |
|---|---|---|
| `open` / `collapsed` | `SidebarProvider` | Controla se o sidebar está expandido ou colapsado |
| `openMobile` | `SidebarProvider` | Controla se o sidebar mobile está aberto como sheet |
| `isAIOpen` | `AppFrame` | Controla abertura do painel de assistente AI |
| `pendingMention` | `AppFrame` | Guarda menção para pré-carregar mensagem no chat |
| `initialMessage` | `AppFrame` | Mensagem inicial enviada ao abrir o chat AI |
| `user` | `useAuth` | Define visibilidade de rotas e dados exibidos no `UserMenu` |

---

## Interações e comportamentos

| Ação | Comportamento |
|---|---|
| Clique em item do sidebar | Navega para a rota correspondente via `NavLink` |
| Hover em item do sidebar | Exibe `Tooltip` com o nome do item |
| Tecla `Ctrl+B` / `⌘+B` | Alterna o sidebar entre expandido e colapsado |
| Item `Chat` | Abre ou fecha o `AIChatSidebar` quando não está em `/chat` |
| Logout no user menu | Executa `logout()` e redireciona para `/login` |
| Tela mobile | Sidebar é exibido como drawer (`Sheet`) e não fixo |

---

## Observações

- A barra superior (`AppNavbar`) não contém navegação principal; ela exibe apenas o dropdown de usuário e separador visual.
- O sidebar está configurado como variante `inset` dentro de `AppFrame`, mantendo o conteúdo principal destacado.
- O app utiliza ícones do Material UI para cada item de menu e classes dinâmicas para estilo ativo.
- A visibilidade dos itens do menu é filtrada por função do usuário (`roles.includes(user.role)` ou `roles.length === 0`).
- Não há chamadas de API específicas no componente de menu; a navegação é puramente local/cliente.
