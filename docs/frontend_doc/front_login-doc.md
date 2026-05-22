# Login

## Visão Geral

Tela pública de autenticação do CRM. É a única rota (junto com `/unauthorized`) acessível sem usuário autenticado: qualquer outra URL conhecida está envelopada por `<ProtectedRoute>` e cai em `/login` quando o `AuthContext` não tem `user`. Qualquer rota desconhecida (`*`) também é redirecionada para `/login`.

O componente renderiza um formulário centralizado (e-mail + senha), chama `POST /api/auth/login`, persiste o token JWT e o usuário em `sessionStorage` e, em sucesso, navega para `/` (Home). Não há cadastro nem recuperação de senha funcional.

**Rota:** `/login`
**Arquivo:** [src/Pages/Login/index.tsx](frontend/src/Pages/Login/index.tsx)
**Acesso:** público

---

## Mapa de arquivos envolvidos

| Camada | Arquivo | Papel |
|---|---|---|
| Página | [src/Pages/Login/index.tsx](frontend/src/Pages/Login/index.tsx) | Layout (background, card, form) e handler de submit |
| Provider | [src/contexts/auth/AuthContext.tsx](frontend/src/contexts/auth/AuthContext.tsx) | `AuthProvider` que mantém `user` em `useState`, expõe `login`/`logout` |
| Context | [src/contexts/auth/context.ts](frontend/src/contexts/auth/context.ts) | `createContext<AuthContextValue \| null>(null)` e tipo `AuthContextValue` |
| Hook | [src/contexts/auth/useAuth.tsx](frontend/src/contexts/auth/useAuth.tsx) | `useAuth()` — dispara erro se usado fora do `AuthProvider` |
| API client | [src/lib/api/auth.ts](frontend/src/lib/api/auth.ts) | `loginUser`, `getToken`, `getStoredUser`, `clearSession`, tipo `AuthUser` |
| Guard de rotas | [src/components/organisms/ProtectedRoute/index.tsx](frontend/src/components/organisms/ProtectedRoute/index.tsx) | Bloqueia rotas privadas e por papel |
| Roteador raiz | [src/App.tsx](frontend/src/App.tsx) | Aninhamento das rotas com `<ProtectedRoute allowedRoles={...}>` |

> A página de login **não** consome `atoms/`, `molecules/` ou `organisms/`. Inputs, labels e botão são `<input>` / `<label>` / `<button>` nativos estilizados via classes Tailwind embutidas no JSX. A paleta verde-escura é exclusiva desta tela.

---

## Layout

```
┌─────────────────────────────────────────────┐
│  (background radial verde-escuro → preto)   │
│                                             │
│                  [ Logo ]                   │
│                                             │
│           ┌──────────────────────┐          │
│           │  Login                │          │
│           │  Credenciais da...    │          │
│           │                       │          │
│           │  E-mail               │          │
│           │  [ input            ] │          │
│           │                       │          │
│           │  Senha                │          │
│           │  [ input            ] │          │
│           │            Recuperar… │          │
│           │                       │          │
│           │  [ ⚠ erro opcional ]  │          │
│           │                       │          │
│           │       [ Acessar ]     │          │
│           └──────────────────────┘          │
│                                             │
│       @2026 V-Commerce, Inc. · Política     │
└─────────────────────────────────────────────┘
```

- Background: `radial-gradient(ellipse 60% 80% at 15% 50%, #143520 0%, #0c2418 28%, #07101e 58%, #030a12 100%)` aplicado por `style` inline.
- Card: `bg-white rounded-2xl shadow-2xl max-w-sm px-8 py-8`.
- Logo: `/public/logo_login.png` servido estaticamente pelo Vite.
- Cor de foco dos inputs: `#74FF60`. Borda do botão: `#D1B1E5`. Fundo do botão: `#F7EBFF`.

---

## Fluxo de submit

1. Usuário preenche `email` e `password` e envia o form (`Enter` ou clique em `Acessar`).
2. `handleSubmit()` chama `await login(email, password)` do `useAuth`.
3. `AuthProvider.login()` chama `loginUser(email, password)` em [src/lib/api/auth.ts](frontend/src/lib/api/auth.ts).
4. `loginUser` faz `POST /api/auth/login`:
   - **Sucesso (200):** grava `access_token` em `sessionStorage["crm_token_v360"]` e `user` em `sessionStorage["crm_user_v360"]`, retorna `AuthUser`.
   - **Falha (401):** lê `err.detail` do body e lança `new Error(err.detail ?? "Email ou sernha incorretos.")`.
5. `AuthProvider.login()` chama `setUser(authUser)` — o Context re-renderiza qualquer consumidor.
6. `navigate("/")` leva o usuário para `Home`.
7. Em qualquer exceção, `setError(err.message)` exibe o card vermelho e os inputs ganham borda vermelha.

```
┌────────┐ submit ┌──────────────┐ login() ┌──────────────┐
│ Login  ├───────▶│   useAuth    ├────────▶│   AuthCtx    │
└────────┘        └──────────────┘         └──────┬───────┘
                                                  │ loginUser()
                                                  ▼
                                       ┌────────────────────┐
                                       │ POST /api/auth/    │
                                       │ login              │
                                       └────────┬───────────┘
                                                ▼
                                  ┌─────────────────────────┐
                                  │ sessionStorage.setItem  │
                                  │  - crm_token_v360       │
                                  │  - crm_user_v360        │
                                  └─────────────────────────┘
```

---

## Chamadas de API

| Método | Endpoint | Quando | Origem |
|---|---|---|---|
| `POST` | `/api/auth/login` | Submit do formulário | [src/lib/api/auth.ts:17](frontend/src/lib/api/auth.ts#L17) |

### Corpo da requisição

```json
{ "email": "string", "password": "string" }
```

### Resposta `200 OK` (`LoginResponse` em [src/lib/api/auth.ts:11](frontend/src/lib/api/auth.ts#L11))

```json
{
  "access_token": "jwt...",
  "token_type": "bearer",
  "user": { "id": 1, "name": "...", "email": "...", "role": "admin" }
}
```

### Erros

| Status | Causa | Tratamento no frontend |
|---|---|---|
| `401` | Credenciais inválidas | Mensagem do `detail` exibida no card; inputs ganham borda vermelha |
| `422` | E-mail mal-formado (validação `EmailStr` no Pydantic) | Cai no fallback `"Email ou sernha incorretos."` (mensagem genérica) |
| Rede / 5xx | Falha de conexão / erro do servidor | Cai no mesmo fallback |

---

## Estados gerenciados

| Estado | Tipo | Localização | Descrição |
|---|---|---|---|
| `email` | `string` | `Login` (page) | Valor controlado do input de e-mail |
| `password` | `string` | `Login` (page) | Valor controlado do input de senha |
| `error` | `string` | `Login` (page) | Mensagem de erro exibida abaixo dos campos (vazio = oculto) |
| `user` | `AuthUser \| null` | `AuthProvider` | Usuário autenticado; hidratado de `sessionStorage` no boot via `getStoredUser()` |

---

## Persistência da sessão

| Chave | Onde | Valor | Quem escreve / limpa |
|---|---|---|---|
| `crm_token_v360` | `sessionStorage` | JWT retornado pelo backend | Escreve: `loginUser`. Limpa: `clearSession()` |
| `crm_user_v360` | `sessionStorage` | `JSON.stringify(AuthUser)` | Escreve: `loginUser`. Limpa: `clearSession()` |

- A escolha de `sessionStorage` (em vez de `localStorage`) é intencional: fechar a aba derruba a sessão (vide [decisão 17](../decisions-doc.md#17-estado-de-autenticação-em-context--sessionstorage)).
- `AuthProvider` reidrata o estado `user` no boot lendo `getStoredUser()` — caso o usuário recarregue a página, ele continua logado.
- O token vive 8 horas (configurado em [backend/app/config.py](backend/app/config.py)). Após expirar, qualquer chamada a `/goals` ou `/bookmarks` (únicos endpoints que validam o JWT) retornará 401, mas o frontend não trata isso automaticamente — o usuário precisa relogar manualmente.

---

## Controle de acesso

O fluxo de autorização é montado em [src/App.tsx](frontend/src/App.tsx) com `ProtectedRoute`:

| Rota | Acesso |
|---|---|
| `/login`, `/unauthorized` | Públicas |
| `/`, `/products`, `/products/:id`, `/contacts/:id` | Qualquer usuário autenticado |
| `/contacts`, `/sales` | `admin`, `sales` |
| `/dashboard`, `/chat` | `admin` |
| `/tickets` | `admin`, `support` |
| `*` (qualquer outra) | Redireciona para `/login` |

- `ProtectedRoute` redireciona para `/login` quando `user === null`.
- `ProtectedRoute` redireciona para `/unauthorized` quando `allowedRoles` é passado e `user.role` não está incluído.

---

## Interações e comportamentos

| Ação | Comportamento |
|---|---|
| Digitar em `E-mail` ou `Senha` | Atualiza o estado e zera `error` (remove borda vermelha imediatamente) |
| Submit (Enter ou botão `Acessar`) | Chama `login(email, password)` e, em sucesso, navega para `/` |
| Resposta `401` | Define `error` com a mensagem do backend; inputs ficam com borda vermelha |
| Resposta `422` ou erro de rede | Define `error` com a string fallback `"Email ou sernha incorretos."` |
| Clique em `Recuperar senha` | Botão sem `onClick` — placeholder visual, nenhuma ação |
| Acessar `/login` já autenticado | A rota permanece pública; após submit o `navigate("/")` leva à home |
| Fechar a aba | Sessão expira automaticamente (sessionStorage) |
| Token expirar enquanto a aba está aberta | Frontend não detecta — usuário só descobre quando uma chamada autenticada falhar |

---

## Observações

- **A página é uma ilha visual.** Não consome `atoms/molecules/organisms` reutilizáveis — toda estilização é Tailwind inline. Substituir os inputs por `Input` de `atoms/` quebra a identidade visual desta tela (paleta verde-escura `#030a12` → `#143520` e foco `#74FF60` não existem em nenhuma outra tela).
- **Logout não chama o backend.** `clearSession()` apenas remove as duas chaves do `sessionStorage`. O JWT continua tecnicamente válido até o `exp` (8 horas) — não há blacklist server-side. Se o token vazar, ele continua usável fora da sessão.
- **O JWT não é enviado automaticamente.** Apenas [src/lib/api/goals.ts:5-6](frontend/src/lib/api/goals.ts#L5-L6) e [src/lib/api/bookmarks.ts:5-6](frontend/src/lib/api/bookmarks.ts#L5-L6) usam `getToken()` para anexar `Authorization: Bearer ...`. Os demais clientes (`dashboard`, `sales`, `contacts`, `products`, `tickets`, `agent`) batem no backend sem credenciais — a proteção atual é apenas o `ProtectedRoute` do frontend.
- **Token em texto plano no DOM.** As chaves `crm_token_v360` e `crm_user_v360` ficam acessíveis a qualquer script com `document.access`. Mover para `httpOnly` cookie exigiria mudar o backend para setar o cookie no login.
- **Typo preservado no fallback.** A mensagem `"Email ou sernha incorretos."` em [src/lib/api/auth.ts:26](frontend/src/lib/api/auth.ts#L26) tem `sernha` em vez de `senha`. Como ela só aparece em erros não-401 (rede, 422), passa despercebida na maioria dos testes.
- **Validação de e-mail é frouxa.** O input tem `type="email"` (validação HTML5 nativa) e `required`, mas não há validação JS. O backend valida via `EmailStr` ([backend/app/schemas/authSchemas.py:3](backend/app/schemas/authSchemas.py#L3)) e retorna 422 com mensagem genérica do Pydantic, que cai no fallback enganoso.
- **`Recuperar senha` é decorativo.** Não tem `onClick`, não tem rota associada, não existe feature backend correspondente. Manter na UI sem implementação cria expectativa frustrada.
- **Login não respeita o papel ao redirecionar.** Todo usuário cai em `/` (Home) após o login, independente da role. Um usuário `support` cai numa Home sem itens relevantes para ele — redirecionar por papel (`admin` → `/dashboard`, `support` → `/tickets`, `sales` → `/contacts`) seria mais útil.
- **Não há rate limiting.** Tanto o frontend quanto o backend aceitam tentativas ilimitadas. Combinado com o hash `argon2id` (lento por design), o impacto de um ataque de força bruta é mitigado mas não bloqueado.
