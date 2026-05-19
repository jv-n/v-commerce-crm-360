import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import MentionInput, { type MentionInputHandle } from "@/components/molecules/MentionInput";
import type { MentionItem } from "@/lib/api/mentions";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import CloseFullscreenOutlinedIcon from "@mui/icons-material/CloseFullscreenOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import {
  fetchSuggestions,
  sendMessage,
  clearSession,
  fetchConversations,
  fetchConversation,
  saveConversation,
  deleteConversation,
  type ChatMessage,
  type ConversationSummary,
  type ConversationDetail,
} from "@/lib/api/agent";
import { MarkdownText } from "@/lib/renderMarkdown";
import { useAuth } from "@/contexts/auth/useAuth";

// ── Sub-componentes ───────────────────────────────────────────────────────────

function VAvatar() {
  return (
    <div
      className="w-7 h-7 rounded-full flex-shrink-0 mr-2 mt-0.5 flex items-center justify-center text-white text-xs font-bold"
      style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
    >
      V
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
      {msg.role === "assistant" && <VAvatar />}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          msg.role === "user"
            ? "text-gray-900 rounded-tr-sm"
            : "bg-gray-50 text-gray-800 rounded-tl-sm border border-gray-100"
        }`}
        style={
          msg.role === "user"
            ? { background: "#ECCFFF" }
            : undefined
        }
      >
        <MarkdownText content={msg.content} />
        {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-400 font-medium mb-1">Fontes consultadas:</p>
            <div className="flex flex-wrap gap-1">
              {msg.sources.map((s) => (
                <span key={s} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-100">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResumeInput({ onSend, onBackToChat }: { onSend: (t: string) => void; onBackToChat: () => void }) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  return (
    <div className="py-4 shrink-0">
      <div className="rounded-2xl p-[2px]" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 40%, #74FF60 100%)" }}>
        <div className="bg-white rounded-[14px] px-4 pt-3 pb-2">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (value.trim()) onSend(value); } }}
            placeholder="Continue a partir daqui..."
            rows={1}
            className="w-full resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none leading-relaxed"
            style={{ maxHeight: "120px", overflowY: "auto" }}
          />
          <div className="flex items-center justify-end mt-2">
            <button
              onClick={() => { if (value.trim()) onSend(value); }}
              disabled={!value.trim()}
              className="w-8 h-8 rounded-full flex items-center justify-center text-black transition disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
              style={{ background: "#74FF60" }}
            >
              <ArrowUpwardRoundedIcon sx={{ fontSize: 18 }} />
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center mt-3">
        <button onClick={onBackToChat} className="text-xs text-gray-400 hover:text-purple-600 transition">
          Voltar ao chat atual
        </button>
      </div>
    </div>
  );
}

// ── Tipo do estado de navegação ───────────────────────────────────────────────

interface ChatRouteState {
  messages?: ChatMessage[];
  sessionId?: string;
  inputValue?: string;
  sessionStartedAt?: string;
  from?: string;
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state ?? {}) as ChatRouteState;
  const { user } = useAuth();
  const userName = user?.name ?? "você";

  // ── Estado do chat ativo ──────────────────────────────────────────────────
  const [sessionId, setSessionId] = useState(() => routeState.sessionId ?? crypto.randomUUID());
  const [sessionStartedAt] = useState(() =>
    routeState.sessionStartedAt ? new Date(routeState.sessionStartedAt) : new Date()
  );
  const [messages, setMessages] = useState<ChatMessage[]>(() => routeState.messages ?? []);
  const [lastMessageAt, setLastMessageAt] = useState<Date | null>(() => routeState.messages?.length ? new Date() : null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Estado do histórico ───────────────────────────────────────────────────
  const [history, setHistory] = useState<ConversationSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [viewing, setViewing] = useState<ConversationDetail | null>(null);
  const [viewingLoading, setViewingLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mentionInputRef = useRef<MentionInputHandle>(null);

  // ── Efeitos ───────────────────────────────────────────────────────────────

  // Foca o input e rola ao fim quando vem da sidebar com estado
  useEffect(() => {
    if (routeState.messages?.length) {
      mentionInputRef.current?.focus();
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchSuggestions()
      .then(setSuggestions)
      .catch(() =>
        setSuggestions([
          "Quantas compras foram feitas mês passado?",
          "Em quanto está o estoque do produto mais vendido?",
          "Quais os produtos mais rentáveis esse mês?",
          "Quem são os principais clientes VIPs?",
          "Como está a média do NPS mensal?",
          "Exporte os tickets em aberto em CSV",
        ])
      );
  }, []);

  useEffect(() => {
    if (!viewing) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, viewing]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try { setHistory(await fetchConversations()); }
    catch { /* silencioso */ }
    finally { setHistoryLoading(false); }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleSend = async (text: string, _mentions?: MentionItem[]) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setViewing(null);
    const displayText = trimmed.replace(/\n\n\[Menções:.*\]$/s, "").trim();
    setMessages((prev) => [...prev, { role: "user", content: displayText }]);
    setLastMessageAt(new Date());
    mentionInputRef.current?.clear();
    setIsLoading(true);
    try {
      const res = await sendMessage(trimmed, sessionId);
      setMessages((prev) => [...prev, { role: "assistant", content: res.answer, sources: res.sources, queries: res.queries }]);
      setLastMessageAt(new Date());
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: err instanceof Error ? `⚠️ ${err.message}` : "⚠️ Erro inesperado. Tente novamente." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = async () => {
    if (messages.length > 0) {
      const firstUser = messages.find((m) => m.role === "user");
      const title = firstUser
        ? firstUser.content.slice(0, 60) + (firstUser.content.length > 60 ? "…" : "")
        : "Conversa sem título";
      try { await saveConversation({ session_id: sessionId, title, messages, started_at: sessionStartedAt.toISOString() }); }
      catch { /* silencioso */ }
      await clearSession(sessionId).catch(() => {});
    }
    setSessionId(crypto.randomUUID());
    setMessages([]);
    setLastMessageAt(null);
    mentionInputRef.current?.clear();
    setViewing(null);
    await loadHistory();
  };

  const openConversation = async (conv: ConversationSummary) => {
    setViewingLoading(true);
    try { setViewing(await fetchConversation(conv.id)); }
    catch { setViewing(null); }
    finally { setViewingLoading(false); }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await deleteConversation(id);
      setHistory((prev) => prev.filter((c) => c.id !== id));
      if (viewing?.id === id) setViewing(null);
    } catch { /* silencioso */ }
  };

  const handleResumeAndSend = async (text: string) => {
    if (!viewing || !text.trim()) return;
    if (messages.length > 0) {
      const firstUser = messages.find((m) => m.role === "user");
      const title = firstUser ? firstUser.content.slice(0, 60) + "…" : "Conversa sem título";
      try { await saveConversation({ session_id: sessionId, title, messages, started_at: sessionStartedAt.toISOString() }); }
      catch { /* silencioso */ }
      await clearSession(sessionId).catch(() => {});
    }
    const newId = crypto.randomUUID();
    const restored = [...viewing.messages];
    setSessionId(newId);
    setMessages([...restored, { role: "user", content: text.trim() }]);
    setViewing(null);
    setIsLoading(true);
    try {
      const res = await sendMessage(text.trim(), newId);
      setMessages((prev) => [...prev, { role: "assistant", content: res.answer, sources: res.sources, queries: res.queries }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: err instanceof Error ? `⚠️ ${err.message}` : "⚠️ Erro inesperado." }]);
    } finally { setIsLoading(false); }
  };

  // Formata data/hora: só hora se hoje, DD/MM + hora se outro dia
  const fmtTime = (d: Date | string | null) => {
    if (!d) return null;
    const date = typeof d === "string" ? new Date(d) : d;
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    return isToday
      ? date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  // Conversa ativa como item sintético (id=-1) para exibir no topo do histórico
  const activeConvTitle = messages.find((m) => m.role === "user")?.content.slice(0, 60) ?? "Conversa em andamento";
  const activeConvSummary: ConversationSummary | null = messages.length > 0
    ? { id: -1, session_id: sessionId, title: activeConvTitle, message_count: messages.length, started_at: sessionStartedAt.toISOString(), ended_at: "" }
    : null;

  const filteredHistory = [
    ...(activeConvSummary && activeConvTitle.toLowerCase().includes(historySearch.toLowerCase()) ? [activeConvSummary] : []),
    ...history.filter((c) => c.title.toLowerCase().includes(historySearch.toLowerCase())),
  ];

  const showSuggestions = !viewing && messages.length === 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex bg-white rounded-xl overflow-hidden">

      {/* ══ COLUNA ESQUERDA — Histórico ══ */}
      <div className="w-64 border-r border-gray-100 flex flex-col shrink-0">
        {/* Busca */}
        <div className="px-3 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
            <SearchOutlinedIcon sx={{ fontSize: 15, color: "#9ca3af" }} />
            <input
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Pesquisar..."
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>
        </div>

        {/* Lista de conversas */}
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5 min-h-0">
          {historyLoading ? (
            <div className="flex items-center justify-center h-24">
              <span className="text-xs text-gray-400">Carregando...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center px-4">
              <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 28, color: "#e5e7eb" }} />
              <p className="text-xs text-gray-400 mt-2">
                {historySearch ? "Nenhum resultado" : "Nenhuma conversa salva"}
              </p>
            </div>
          ) : (
            filteredHistory.map((conv) => {
              const isActive = conv.id === -1;
              const isViewing = !isActive && viewing?.id === conv.id;
              const isCurrent = isActive && !viewing;
              return (
                <button
                  key={conv.id}
                  onClick={() => isActive ? setViewing(null) : openConversation(conv)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 group relative ${
                    isCurrent || isViewing
                      ? "bg-purple-50 text-purple-700"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isActive && (
                      <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-purple-500" />
                    )}
                    <p className="text-sm leading-snug line-clamp-1 pr-5">{conv.title}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 pl-0.5">
                    {isActive ? fmtTime(lastMessageAt) : fmtTime(conv.ended_at)}
                  </p>
                  {!isActive && (
                    <button
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      title="Remover"
                    >
                      <DeleteOutlineOutlinedIcon sx={{ fontSize: 13 }} />
                    </button>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ══ COLUNA DIREITA — Chat ══ */}
      <div className="flex-1 flex flex-col min-h-0">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 shrink-0">
          <div
            className="px-3 py-1 rounded-full text-white text-sm font-semibold select-none"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #74FF60 100%)" }}
          >
            V.IA
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={handleNewConversation}
                className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                title="Nova conversa"
              >
                <AddOutlinedIcon sx={{ fontSize: 18 }} />
              </button>
            )}
            {routeState.from && (
              <button
                onClick={() => navigate(routeState.from!, { state: { reopenAI: true } })}
                className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                title="Minimizar"
              >
                <CloseFullscreenOutlinedIcon sx={{ fontSize: 16 }} />
              </button>
            )}
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              title="Fechar"
            >
              <CloseOutlinedIcon sx={{ fontSize: 18 }} />
            </button>
          </div>
        </div>

        {/* Conteúdo centralizado */}
        <div className="flex-1 flex flex-col min-h-0 w-full max-w-4xl mx-auto px-6">

          {/* ══ VISUALIZANDO CONVERSA ══ */}
          {viewing && (
            <div className="flex-1 flex flex-col min-h-0 pt-6">
              <div className="flex items-center gap-2 pb-4 shrink-0">
                <button
                  onClick={() => setViewing(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 transition"
                  title="Voltar ao chat"
                >
                  <ArrowBackOutlinedIcon sx={{ fontSize: 16 }} />
                </button>
                <p className="text-sm font-medium text-gray-600 truncate">{viewing.title}</p>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 min-h-0 py-2">
                {viewingLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <span className="text-sm text-gray-400">Carregando mensagens...</span>
                  </div>
                ) : (
                  <>
                    {viewing.messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-xs text-gray-300 whitespace-nowrap">continuar conversa</span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                  </>
                )}
              </div>
              <ResumeInput onSend={handleResumeAndSend} onBackToChat={() => setViewing(null)} />
            </div>
          )}

          {/* ══ CHAT ATIVO ══ */}
          {!viewing && (
            <>
              {messages.length === 0 && (
                <div className="pt-12 pb-8 shrink-0 text-center">
                  <h2
                    className="text-4xl font-bold leading-tight"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 60%, #6d28d9 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Olá {userName}, como posso te ajudar hoje?
                  </h2>
                </div>
              )}

              <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">
                {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
                {isLoading && (
                  <div className="flex justify-start">
                    <VAvatar />
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="py-4 shrink-0">
                <MentionInput
                  ref={mentionInputRef}
                  onSend={handleSend}
                  disabled={isLoading}
                />
              </div>

              {/* Sugestões */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="pb-6 shrink-0">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Por onde começar?</p>
                  <div className="grid grid-cols-3 gap-2">
                    {suggestions.slice(0, 6).map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(s)}
                        className="text-left text-xs text-gray-600 bg-white border border-gray-200 rounded-xl px-3 py-2.5 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition-all duration-150 leading-snug line-clamp-2"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="pb-4 shrink-0 text-center">
                <p className="text-xs text-gray-400">Toda I.A pode cometer erros, sempre verifique os dados.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
