const BASE_URL = "http://localhost:8000";

export type MentionType = "contact" | "lead" | "product" | "order" | "agent";

export interface MentionItem {
  id: string;
  type: MentionType;
  display: string;   // texto do chip
  label: string;     // nome completo
  sublabel?: string; // email / telefone
}

export async function searchMentions(q: string, limit = 5): Promise<MentionItem[]> {
  if (!q.trim()) return [];
  const res = await fetch(
    `${BASE_URL}/mentions/search?q=${encodeURIComponent(q)}&limit=${limit}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.results as MentionItem[];
}
