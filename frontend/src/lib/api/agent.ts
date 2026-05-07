const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ── Agent chat ────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  queries?: string[];
}

export interface ChatRequest {
  message: string;
  session_id: string;
}

export interface ChatResponse {
  answer: string;
  sources: string[];
  queries: string[];
  session_id: string;
}

export interface SuggestionsResponse {
  suggestions: string[];
}

export async function fetchSuggestions(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/agent/suggestions`);
  if (!res.ok) throw new Error("Falha ao buscar sugestões");
  const data: SuggestionsResponse = await res.json();
  return data.suggestions;
}

export async function sendMessage(
  message: string,
  sessionId: string
): Promise<ChatResponse> {
  const res = await fetch(`${BASE_URL}/agent/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId } satisfies ChatRequest),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { detail?: string }).detail ?? "Erro ao se comunicar com o agente"
    );
  }
  return res.json() as Promise<ChatResponse>;
}

export async function clearSession(sessionId: string): Promise<void> {
  await fetch(`${BASE_URL}/agent/session/${sessionId}`, { method: "DELETE" });
}

// ── Conversation history ──────────────────────────────────────────────────────

export interface ConversationSummary {
  id: number;
  session_id: string;
  title: string;
  message_count: number;
  started_at: string;
  ended_at: string;
}

export interface ConversationDetail extends ConversationSummary {
  messages: ChatMessage[];
}

export interface ConversationCreatePayload {
  session_id: string;
  title: string;
  messages: ChatMessage[];
  started_at: string; // ISO 8601
}

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const res = await fetch(`${BASE_URL}/conversations/?limit=100`);
  if (!res.ok) throw new Error("Falha ao carregar histórico");
  const data = await res.json() as { conversations: ConversationSummary[]; total: number };
  return data.conversations;
}

export async function fetchConversation(id: number): Promise<ConversationDetail> {
  const res = await fetch(`${BASE_URL}/conversations/${id}`);
  if (!res.ok) throw new Error("Conversa não encontrada");
  return res.json() as Promise<ConversationDetail>;
}

export async function saveConversation(
  payload: ConversationCreatePayload
): Promise<ConversationSummary> {
  const res = await fetch(`${BASE_URL}/conversations/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Falha ao salvar conversa");
  return res.json() as Promise<ConversationSummary>;
}

export async function deleteConversation(id: number): Promise<void> {
  await fetch(`${BASE_URL}/conversations/${id}`, { method: "DELETE" });
}
