const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

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
