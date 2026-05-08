import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import OpenInFullOutlinedIcon from "@mui/icons-material/OpenInFullOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import MentionInput, { type MentionInputHandle } from "@/components/molecules/MentionInput";
import type { MentionItem } from "@/lib/api/mentions";
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

// ── Tipos ────────────────────────────────────────────────────────────────────

interface AIChatSidebarProps {
  open: boolean;
  onClose: () => void;
  userName?: string;
}

// ── Componente ───────────────────────────────────────────────────────────────

export default function AIChatSidebar({
  open,
  onClose,
  userName = "você",
}: AIChatSidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // ── Estado do chat ativo ──────────────────────────────────────────────────
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  const [sessionStartedAt] = useState<Date>(() => new Date());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Estado do histórico ───────────────────────────────────────────────────
  const [history, setHistory] = useState<ConversationSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [viewing, setViewing] = useState<ConversationDetail | null>(null);
  const [viewingLoading, setViewingLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mentionInputRef = useRef<MentionInputHandle>(null);

  // ── Carregar histórico do backend ─────────────────────────────────────────

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await fetchConversations();
      setHistory(data);
    } catch {
      // silencioso — histórico não é crítico
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && suggestions.length === 0) {
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
    }
  }, [open]);

  useEffect(() => {
    if (!showHistory && !viewing) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, showHistory, viewing]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSend = async (text: string, _mentions?: MentionItem[]) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setShowHistory(false);
    setViewing(null);

    // Exibe só o texto antes do bloco [Menções:] na bolha do usuário
    const displayText = trimmed.replace(/\n\n\[Menções:.*\]$/s, "").trim();
    const userMsg: ChatMessage = { role: "user", content: displayText };
    setMessages((prev) => [...prev, userMsg]);
    mentionInputRef.current?.clear();
    setIsLoading(true);

    try {
      const res = await sendMessage(trimmed, sessionId);
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: res.answer,
        sources: res.sources,
        queries: res.queries,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err instanceof Error
              ? `⚠️ ${err.message}`
              : "⚠️ Erro inesperado. Tente novamente.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /** Salva a conversa atual no backend e abre uma nova sessão. */
  const handleNewConversation = async () => {
    if (messages.length > 0) {
      const firstUserMsg = messages.find((m) => m.role === "user");
      const title = firstUserMsg
        ? firstUserMsg.content.slice(0, 60) +
          (firstUserMsg.content.length > 60 ? "…" : "")
        : "Conversa sem título";

      try {
        await saveConversation({
          session_id: sessionId,
          title,
          messages,
          started_at: sessionStartedAt.toISOString(),
        });
        // Atualiza a lista localmente sem nova requisição
        await loadHistory();
      } catch {
        // Falha silenciosa — não bloqueia nova conversa
      }

      await clearSession(sessionId).catch(() => {});
    }

    setSessionId(crypto.randomUUID());
    setMessages([]);
    mentionInputRef.current?.clear();
    setShowHistory(false);
    setViewing(null);
  };

  const toggleHistory = () => {
    const next = !showHistory;
    setShowHistory(next);
    setViewing(null);
    if (next) {
      setHistorySearch("");
      loadHistory();
    }
  };

  const openConversation = async (summary: ConversationSummary) => {
    setViewingLoading(true);
    setShowHistory(false);
    try {
      const detail = await fetchConversation(summary.id);
      setViewing(detail);
    } catch {
      setViewing(null);
      setShowHistory(true);
    } finally {
      setViewingLoading(false);
    }
  };

  const handleDeleteConversation = async (
    e: React.MouseEvent,
    id: number
  ) => {
    e.stopPropagation();
    try {
      await deleteConversation(id);
      setHistory((prev) => prev.filter((c) => c.id !== id));
      if (viewing?.id === id) setViewing(null);
    } catch {
      // silencioso
    }
  };

  const backToHistory = () => {
    setViewing(null);
    setShowHistory(true);
  };

  const backToChat = () => {
    setViewing(null);
    setShowHistory(false);
  };

  /**
   * Retoma uma conversa do histórico: restaura as mensagens no chat ativo
   * e envia a nova pergunta do usuário, iniciando uma sessão nova.
   */
  const handleResumeAndSend = async (text: string) => {
    if (!viewing || !text.trim()) return;

    // Salva a conversa ativa atual antes de substituí-la (se houver mensagens)
    if (messages.length > 0) {
      const firstUserMsg = messages.find((m) => m.role === "user");
      const title = firstUserMsg
        ? firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? "…" : "")
        : "Conversa sem título";
      try {
        await saveConversation({
          session_id: sessionId,
          title,
          messages,
          started_at: sessionStartedAt.toISOString(),
        });
      } catch { /* silencioso */ }
      await clearSession(sessionId).catch(() => {});
    }

    // Restaura as mensagens da conversa histórica + nova mensagem do usuário
    const restored = [...viewing.messages];
    const newSessionId = crypto.randomUUID();
    const userMsg: ChatMessage = { role: "user", content: text.trim() };

    setSessionId(newSessionId);
    setMessages([...restored, userMsg]);
    mentionInputRef.current?.clear();
    setViewing(null);
    setShowHistory(false);
    setIsLoading(true);

    try {
      const res = await sendMessage(text.trim(), newSessionId);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.answer,
          sources: res.sources,
          queries: res.queries,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err instanceof Error ? `⚠️ ${err.message}` : "⚠️ Erro inesperado. Tente novamente.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Derivados ─────────────────────────────────────────────────────────────

  const filteredHistory = history.filter((c) =>
    c.title.toLowerCase().includes(historySearch.toLowerCase())
  );

  const showSuggestions =
    !showHistory && !viewing && messages.length === 0 && suggestions.length > 0 && (mentionInputRef.current?.isEmpty() ?? true);

  // ── Render ────────────────────────────────────────────────────────────────

  // Botões do header — iguais nos dois modos
  const headerActions = (
    <div className="flex items-center gap-1">
      {messages.length > 0 && (
        <button onClick={handleNewConversation} className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition" title="Nova conversa">
          <AddOutlinedIcon sx={{ fontSize: 18 }} />
        </button>
      )}
      <button onClick={toggleHistory} className={`w-8 h-8 flex items-center justify-center rounded-md transition ${showHistory ? "bg-purple-100 text-purple-600" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`} title="Histórico de conversas">
        <HistoryOutlinedIcon sx={{ fontSize: 18 }} />
      </button>
      <button
        onClick={() => {
          navigate("/chat", {
            state: {
              messages,
              sessionId,
              sessionStartedAt: sessionStartedAt.toISOString(),
              from: pathname,
            },
          });
          onClose();
        }}
        className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
        title="Abrir em tela cheia"
      >
        <OpenInFullOutlinedIcon sx={{ fontSize: 16 }} />
      </button>
      <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition" title="Fechar">
        <CloseOutlinedIcon sx={{ fontSize: 18 }} />
      </button>
    </div>
  );

  const viaBadge = (
    <div className="px-3 py-1 rounded-full text-white text-sm font-semibold select-none" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #74FF60 100%)" }}>
      V.IA
    </div>
  );

  // ── Modo sidebar ───────────────────────────────────────────────────────────

  return (
    <div className={`fixed top-0 right-0 h-full z-[60] flex flex-col bg-white shadow-2xl transition-all duration-300 ease-in-out w-[480px] ${open ? "translate-x-0" : "translate-x-full"}`} style={{ borderLeft: "1px solid #e5e7eb" }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
        {viaBadge}
        {headerActions}
      </div>

      {/* ══════════════════════════════════════════════════
          PAINEL: HISTÓRICO
      ══════════════════════════════════════════════════ */}
      {showHistory && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Campo de busca */}
          <div className="px-5 pb-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
              <SearchOutlinedIcon sx={{ fontSize: 15, color: "#9ca3af" }} />
              <input
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Pesquisar conversas..."
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
              {historySearch && (
                <button
                  onClick={() => setHistorySearch("")}
                  className="text-gray-300 hover:text-gray-500 transition"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 space-y-2 min-h-0">
            {historyLoading ? (
              <div className="flex items-center justify-center h-32">
                <span className="text-sm text-gray-400">Carregando...</span>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 32, color: "#d1d5db" }} />
                <p className="text-sm text-gray-400 mt-3">
                  {historySearch ? "Nenhum resultado" : "Nenhuma conversa salva"}
                </p>
                {!historySearch && (
                  <p className="text-xs text-gray-300 mt-1">
                    Inicie e encerre uma conversa para ela aparecer aqui
                  </p>
                )}
              </div>
            ) : (
              filteredHistory.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all duration-150 group relative"
                >
                  <p className="text-sm text-gray-700 font-medium group-hover:text-purple-700 line-clamp-2 leading-snug pr-6">
                    {conv.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {conv.message_count} mensagens ·{" "}
                    {new Date(conv.ended_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {/* Botão deletar */}
                  <button
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    title="Remover conversa"
                  >
                    <DeleteOutlineOutlinedIcon sx={{ fontSize: 14 }} />
                  </button>
                </button>
              ))
            )}
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════
          PAINEL: VISUALIZANDO CONVERSA SALVA
      ══════════════════════════════════════════════════ */}
      {viewing && !showHistory && (
        <ViewingPanel
          viewing={viewing}
          viewingLoading={viewingLoading}
          onBack={backToHistory}
          onResumeAndSend={handleResumeAndSend}
          onBackToChat={backToChat}
        />
      )}

      {/* ══════════════════════════════════════════════════
          PAINEL: CHAT ATIVO
      ══════════════════════════════════════════════════ */}
      {!showHistory && !viewing && !viewingLoading && (
        <>
          {/* Saudação */}
          <div className="px-5 pb-4 shrink-0">
            <h2
              className="text-2xl font-bold leading-snug"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 60%, #6d28d9 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Olá {userName}, como posso
              <br />
              te ajudar hoje?
            </h2>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4 min-h-0">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}

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
          <div className="px-5 py-4 shrink-0">
            <MentionInput
              ref={mentionInputRef}
              onSend={handleSend}
              disabled={isLoading}
            />
          </div>

          {/* Sugestões */}
          {showSuggestions && (
            <div className="px-5 pb-4 shrink-0">
              <p className="text-sm font-semibold text-gray-700 mb-3">Por onde começar?</p>
              <div className="grid grid-cols-2 gap-2">
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
          <div className="px-5 pb-4 shrink-0">
            <p className="text-xs text-gray-400">
              Toda I.A pode cometer erros, sempre verifique os dados.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

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

function MessageBubble({ msg, expanded = false }: { msg: ChatMessage; expanded?: boolean }) {
  return (
    <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
      {msg.role === "assistant" && <VAvatar />}
      <div
        className={`${expanded ? "max-w-[75%]" : "max-w-[85%]"} rounded-2xl px-4 py-3 text-sm leading-relaxed ${
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
                <span
                  key={s}
                  className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-100"
                >
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

// ── ViewingPanel ──────────────────────────────────────────────────────────────

function ViewingPanel({
  viewing,
  viewingLoading,
  onBack,
  onResumeAndSend,
  onBackToChat,
}: {
  viewing: ConversationDetail;
  viewingLoading: boolean;
  onBack: () => void;
  onResumeAndSend: (text: string) => void;
  onBackToChat: () => void;
}) {
  const [resumeInput, setResumeInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [resumeInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (resumeInput.trim()) onResumeAndSend(resumeInput);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Sub-header */}
      <div className="flex items-center gap-2 px-5 pb-3 shrink-0">
        <button
          onClick={onBack}
          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          title="Voltar ao histórico"
        >
          <ArrowBackOutlinedIcon sx={{ fontSize: 16 }} />
        </button>
        <p className="text-sm font-medium text-gray-600 truncate">{viewing.title}</p>
      </div>

      {/* Mensagens da conversa (read-only) */}
      <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4 min-h-0">
        {viewingLoading ? (
          <div className="flex items-center justify-center h-32">
            <span className="text-sm text-gray-400">Carregando mensagens...</span>
          </div>
        ) : (
          <>
            {viewing.messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {/* Divisor visual entre histórico e nova pergunta */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-300 whitespace-nowrap">continuar conversa</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
          </>
        )}
      </div>

      {/* Input para retomar */}
      <div className="px-5 py-4 shrink-0">
        <div
          className="rounded-2xl p-[2px]"
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 40%, #74FF60 100%)",
          }}
        >
          <div className="bg-white rounded-[14px] px-4 pt-3 pb-2">
            <textarea
              ref={textareaRef}
              value={resumeInput}
              onChange={(e) => setResumeInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Continue a partir daqui..."
              rows={1}
              className="w-full resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none leading-relaxed"
              style={{ maxHeight: "120px", overflowY: "auto" }}
            />
            <div className="flex items-center justify-end mt-2">
              <button
                onClick={() => { if (resumeInput.trim()) onResumeAndSend(resumeInput); }}
                disabled={!resumeInput.trim()}
                className="w-8 h-8 rounded-full flex items-center justify-center text-black transition disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
                style={{ background: "#74FF60" }}
                title="Enviar"
              >
                <ArrowUpwardRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
          </div>
        </div>

        {/* Ação secundária */}
        <div className="flex items-center justify-center mt-3">
          <button
            onClick={onBackToChat}
            className="text-xs text-gray-400 hover:text-purple-600 transition"
          >
            Voltar ao chat atual
          </button>
        </div>
      </div>
    </div>
  );
}
