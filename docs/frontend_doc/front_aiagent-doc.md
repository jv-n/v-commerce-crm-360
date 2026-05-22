# Agente de IA — Tela de Chat (V.IA)

Documentação da interface de chat conversacional do V.IA, o agente Text-to-SQL integrado ao V-Commerce CRM 360.

O chat existe em **dois modos** que compartilham a mesma lógica de negócio:

| Modo | Componente | Rota | Quando usar |
|---|---|---|---|
| **Sidebar** | `AIChatSidebar` | nenhuma (sobrepõe a tela atual) | Consultas rápidas sem perder o contexto da tela |
| **Tela cheia** | `Pages/Chat` | `/chat` | Histórico completo e conversas longas |

---

## Sidebar (`AIChatSidebar`)

**Arquivo:** `frontend/src/components/molecules/AIChatSidebar/index.tsx`

Painel deslizante lateral ativado pelo botão do agente na `AppNavbar`. Disponível em todas as telas autenticadas via `AppFrame`.

### Como abrir

O `AppFrame` gerencia o estado `aiChatOpen` e o expõe via `useOutletContext`. Cada página pode chamar `openAIChat()` para abrir a sidebar, opcionalmente passando uma menção ou mensagem inicial:

```tsx
const { openAIChat } = useOutletContext<AppFrameContext>()

// Abrir vazio
openAIChat()

// Abrir com menção de produto inserida
openAIChat({ mention: { id: produto.id, label: produto.nome, kind: "product" } })

// Abrir com mensagem pré-preenchida
openAIChat({ initialMessage: "Qual é o ticket médio deste cliente?" })
```

### Expandir para tela cheia

O botão `⤢` (OpenInFull) na sidebar navega para `/chat` passando o estado atual via `location.state`:

```ts
navigate("/chat", {
  state: {
    messages,
    sessionId,
    inputValue,
    sessionStartedAt: sessionStartedAt.toISOString(),
    from: pathname,   // rota de origem para o botão "Minimizar"
  },
})
```

A tela `/chat` restaura o estado e exibe o botão "Minimizar" que retorna à rota de origem reabrindo a sidebar.

---

## Tela cheia (`Pages/Chat`)

**Arquivo:** `frontend/src/Pages/Chat/index.tsx`

**Rota:** `/chat` (protegida — acessível por todos os papéis)

Layout dividido em duas colunas:

```
┌─────────────────┬──────────────────────────────────┐
│  Histórico      │  Chat ativo                      │
│  (264px)        │                                  │
│                 │  Saudação / Mensagens             │
│  Busca          │  ─────────────────────────────   │
│  Lista de       │  Input (MentionInput)             │
│  conversas      │  Sugestões (grid 3 colunas)       │
│                 │  Footer                           │
└─────────────────┴──────────────────────────────────┘
```

---

## Estados da tela de chat

### 1. Chat vazio (estado inicial)

Exibe saudação personalizada com o nome do usuário (`"Olá {userName}, como posso te ajudar hoje?"`) e até 6 cartões de perguntas sugeridas em grid 3×2.

As sugestões vêm do endpoint `GET /agent/suggestions`. Em caso de falha, um fallback estático é exibido.

### 2. Chat em andamento

Exibe a lista de mensagens trocadas. Cada mensagem tem:

- **Usuário** (`role: "user"`) — balão roxo claro (`#ECCFFF`), alinhado à direita.
- **Agente** (`role: "assistant"`) — balão cinza claro com borda, alinhado à esquerda. Inclui avatar "V" roxo e, quando presentes, chips de **fontes consultadas** (tabelas Gold usadas pela query SQL).

Enquanto o agente processa, exibe três bolinhas roxas animadas (bounce staggerado).

### 3. Visualizando conversa salva

Ao clicar em uma conversa do histórico, a área de chat é substituída pela conversa salva (modo somente leitura). Um separador "continuar conversa" e um `ResumeInput` permitem retomar a conversa: o conteúdo salvo é restaurado na sessão atual e a nova mensagem é enviada continuando a partir dali.

---

## Coluna de histórico

Lista todas as conversas salvas em `GET /conversations`, com busca por título em tempo real.

- **Conversa ativa** (em andamento) aparece no topo com indicador roxo e título baseado na primeira mensagem do usuário.
- **Conversas salvas** mostram título truncado e timestamp da última mensagem.
- Botão de lixeira (visível no hover) chama `DELETE /conversations/{id}`.

### Salvamento automático

Uma conversa é salva (via `POST /conversations`) quando o usuário cria uma nova conversa (`+`) ou expande para tela cheia, desde que já exista ao menos uma mensagem. O título é gerado a partir dos primeiros 60 caracteres da primeira mensagem do usuário.

---

## `MentionInput`

**Arquivo:** `frontend/src/components/molecules/MentionInput/index.tsx`

Input textarea com suporte a menções `@`. Usado tanto na sidebar quanto na tela cheia.

### Fluxo de menção

1. Usuário digita `@` — abre dropdown de busca.
2. Dropdown busca em `GET /mentions?kind=<tipo>&query=<texto>` com debounce.
3. Usuário seleciona um item — vira chip colorido inline no editor.
4. Ao enviar, o texto é serializado como:

```
[texto livre] \n\n[Menções: @cliente:uuid1, @produto:uuid2]
```

O backend do agente recebe as menções como contexto adicional para a query SQL.

### Tipos de chip

| Tipo | Cor | Prefixo |
|---|---|---|
| `contact` | Azul | `@cliente` |
| `product` | Verde | `@produto` |
| `order` | Laranja | `@pedido` |

### Atalhos de teclado

| Tecla | Ação |
|---|---|
| `Enter` | Envia a mensagem |
| `Shift + Enter` | Quebra de linha |
| `Seta ↑ / ↓` | Navega no dropdown de menções |
| `Enter` (dropdown aberto) | Seleciona a menção destacada |
| `Escape` | Fecha o dropdown |

---

## Integração com o backend

| Ação | Endpoint |
|---|---|
| Carregar sugestões | `GET /agent/suggestions` |
| Enviar mensagem | `POST /agent/chat` |
| Limpar sessão RAM | `DELETE /agent/session/{session_id}` |
| Carregar histórico | `GET /conversations` |
| Ver conversa | `GET /conversations/{id}/messages` |
| Salvar conversa | `POST /conversations` |
| Deletar conversa | `DELETE /conversations/{id}` |
| Autocomplete `@` | `GET /mentions?kind=&query=` |

Cada sessão é identificada por um `session_id` UUID gerado no frontend via `crypto.randomUUID()`. O backend mantém o histórico da sessão em memória RAM (até 20 mensagens — vide [decisão 24](../decisions-doc.md#24-memória-de-conversa-em-dicionário-em-memória-limite-20-mensagens)).

---

## Resposta do agente

Cada resposta de `POST /agent/chat` retorna:

```json
{
  "answer": "Os 5 produtos mais vendidos foram...",
  "sources": ["gold_pedidos_detalhado"],
  "queries": ["SELECT nome_produto, SUM(quantidade)..."],
  "session_id": "abc123"
}
```

- `answer` é renderizado como Markdown via `MarkdownText` (`lib/renderMarkdown.tsx`), suportando tabelas, listas e negrito.
- `sources` aparecem como chips roxos abaixo da resposta ("Fontes consultadas").
- `queries` são incluídas no estado da mensagem mas não exibidas na UI (disponíveis para debug).

---

## Papéis com acesso

Acessível por todos os papéis autenticados (`admin`, `sales`, `support`).

---

## Arquivos relacionados

| Arquivo | Descrição |
|---|---|
| `Pages/Chat/index.tsx` | Página de chat em tela cheia |
| `components/molecules/AIChatSidebar/index.tsx` | Sidebar de chat |
| `components/molecules/MentionInput/index.tsx` | Input com suporte a `@menções` |
| `lib/api/agent.ts` | Funções de API (`sendMessage`, `fetchSuggestions`, `clearSession`, etc.) |
| `lib/api/mentions.ts` | Função `searchMentions` para autocomplete |
| `lib/renderMarkdown.tsx` | Renderizador de Markdown para respostas do agente |
| `types/home.ts` | Tipos `ChatMessage`, `ConversationSummary`, `ConversationDetail` |

---

## Documentação do módulo de IA

Para detalhes do agente backend (PydanticAI, Text-to-SQL, guardrails, testes), consulte a [documentação do AI Agent](../ai-agent_doc/README.md).
