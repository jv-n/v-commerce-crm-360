import { useEffect, useRef, useState } from "react";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import CloseFullscreenOutlinedIcon from "@mui/icons-material/CloseFullscreenOutlined";
import OpenInFullOutlinedIcon from "@mui/icons-material/OpenInFullOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import AlternateEmailOutlinedIcon from "@mui/icons-material/AlternateEmailOutlined";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import { fetchSuggestions, sendMessage, clearSession, type ChatMessage } from "@/lib/api/agent";

// ── Tipos ───────────────────────────────────────────────────────────────────

interface Conversation {
  id: string;
  sessionId: string;
  title: string;
  messages: ChatMessage[];
  startedAt: Date;
}

interface AIChatSidebarProps {
  open: boolean;
  onClose: () => void;
  userName?: string;
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

// ── Componente ───────────────────────────────────────────────────────────────

export default function AIChatSidebar({
  open,
  onClose,
  userName = "você",
  isExpanded = false,
  onExpandedChange,
}: AIChatSidebarProps) {
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Histórico: lista de conversas encerradas
  const [history, setHistory] = useState<Conversation[]>([]);
  // null = chat ativo; Conversation = visualizando histórico de uma sessão
  const [viewing, setViewing] = useState<Conversation | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Efeitos ──────────────────────────────────────────────────────────────

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

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [inputValue]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setShowHistory(false);
    setViewing(null);

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
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
      const errorMsg: ChatMessage = {
        role: "assistant",
        content:
          err instanceof Error
            ? `⚠️ ${err.message}`
            : "⚠️ Erro inesperado. Tente novamente.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  /** Encerra a sessão atual, salva no histórico e abre uma nova */
  const handleNewConversation = async () => {
    if (messages.length > 0) {
      const firstUserMsg = messages.find((m) => m.role === "user");
      const title = firstUserMsg
        ? firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? "…" : "")
        : "Conversa sem título";

      setHistory((prev) => [
        {
          id: crypto.randomUUID(),
          sessionId,
          title,
          messages,
          startedAt: new Date(),
        },
        ...prev,
      ]);

      await clearSession(sessionId).catch(() => {});
    }

    setSessionId(crypto.randomUUID());
    setMessages([]);
    setInputValue("");
    setShowHistory(false);
    setViewing(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  const toggleHistory = () => {
    setShowHistory((p) => !p);
    setViewing(null);
  };

  const openConversation = (conv: Conversation) => {
    setViewing(conv);
    setShowHistory(false);
  };

  const backToChat = () => {
    setViewing(null);
    setShowHistory(false);
  };

  // ── Derivados ─────────────────────────────────────────────────────────────

  const showSuggestions =
    !showHistory && !viewing && messages.length === 0 && suggestions.length > 0;

  const sidebarWidth = isExpanded ? "w-[640px]" : "w-[480px]";

  const activeMessages = viewing ? viewing.messages : messages;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className={`
        fixed top-0 right-0 h-full z-[60] flex flex-col
        bg-white shadow-2xl
        transition-all duration-300 ease-in-out
        ${open ? "translate-x-0" : "translate-x-full"}
        ${sidebarWidth}
      `}
      style={{ borderLeft: "1px solid #e5e7eb" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
        {/* Badge V.IA */}
        <div
          className="px-3 py-1 rounded-full text-white text-sm font-semibold select-none"
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #74FF60 100%)",
          }}
        >
          V.IA
        </div>

        {/* Ações do header */}
        <div className="flex items-center gap-1">
          {/* Histórico de conversas */}
          <button
            onClick={toggleHistory}
            className={`w-8 h-8 flex items-center justify-center rounded-md transition
              ${showHistory
                ? "bg-purple-100 text-purple-600"
                : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              }`}
            title="Histórico de conversas"
          >
            <HistoryOutlinedIcon sx={{ fontSize: 18 }} />
          </button>

          {/* Expandir / Reduzir */}
          <button
            onClick={() => onExpandedChange?.(!isExpanded)}
            className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            title={isExpanded ? "Reduzir" : "Expandir"}
          >
            {isExpanded
              ? <CloseFullscreenOutlinedIcon sx={{ fontSize: 16 }} />
              : <OpenInFullOutlinedIcon sx={{ fontSize: 16 }} />
            }
          </button>

          {/* Fechar */}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            title="Fechar"
          >
            <CloseOutlinedIcon sx={{ fontSize: 18 }} />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          PAINEL: HISTÓRICO DE CONVERSAS
      ══════════════════════════════════════════════════ */}
      {showHistory && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-5 pb-3 shrink-0">
            <h3 className="text-sm font-semibold text-gray-700">Histórico de conversas</h3>
            <p className="text-xs text-gray-400 mt-0.5">Conversas desta sessão</p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 space-y-2 min-h-0">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 32, color: "#d1d5db" }} />
                <p className="text-sm text-gray-400 mt-3">Nenhuma conversa anterior</p>
                <p className="text-xs text-gray-300 mt-1">
                  Inicie uma nova conversa para começar
                </p>
              </div>
            ) : (
              history.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all duration-150 group"
                >
                  <p className="text-sm text-gray-700 font-medium group-hover:text-purple-700 line-clamp-2 leading-snug">
                    {conv.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {conv.messages.length / 2 | 0} trocas ·{" "}
                    {conv.startedAt.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Nova conversa */}
          <div className="px-5 py-4 shrink-0 border-t border-gray-100">
            <button
              onClick={handleNewConversation}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-purple-300 text-purple-600 text-sm font-medium hover:bg-purple-50 transition"
            >
              <AddOutlinedIcon sx={{ fontSize: 16 }} />
              Nova conversa
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          PAINEL: VISUALIZANDO CONVERSA DO HISTÓRICO
      ══════════════════════════════════════════════════ */}
      {viewing && !showHistory && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Sub-header */}
          <div className="flex items-center gap-2 px-5 pb-3 shrink-0">
            <button
              onClick={backToChat}
              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              title="Voltar ao chat"
            >
              <ArrowBackOutlinedIcon sx={{ fontSize: 16 }} />
            </button>
            <p className="text-sm font-medium text-gray-600 truncate">{viewing.title}</p>
          </div>

          {/* Mensagens da conversa histórica (read-only) */}
          <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4 min-h-0">
            {viewing.messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
          </div>

          {/* Aviso de leitura */}
          <div className="px-5 py-4 shrink-0 border-t border-gray-100">
            <p className="text-xs text-center text-gray-400">
              Esta conversa está encerrada.{" "}
              <button
                onClick={handleNewConversation}
                className="text-purple-500 hover:text-purple-700 underline"
              >
                Iniciar uma nova
              </button>
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          PAINEL: CHAT ATIVO
      ══════════════════════════════════════════════════ */}
      {!showHistory && !viewing && (
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
            {activeMessages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}

            {/* Loading */}
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
            <div
              className="rounded-2xl p-[2px]"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 40%, #74FF60 100%)",
              }}
            >
              <div className="bg-white rounded-[14px] px-4 pt-3 pb-2">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Me diga como posso te ajudar..."
                  rows={1}
                  className="w-full resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none leading-relaxed"
                  style={{ maxHeight: "160px", overflowY: "auto" }}
                  disabled={isLoading}
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <button
                      className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                      title="Anexar arquivo"
                    >
                      <AttachFileOutlinedIcon sx={{ fontSize: 16 }} />
                    </button>
                    <button
                      className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                      title="Mencionar"
                    >
                      <AlternateEmailOutlinedIcon sx={{ fontSize: 16 }} />
                    </button>
                  </div>

                  <button
                    onClick={() => handleSend(inputValue)}
                    disabled={!inputValue.trim() || isLoading}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-black transition disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
                    style={{ background: "#74FF60" }}
                    title="Enviar"
                  >
                    <ArrowUpwardRoundedIcon sx={{ fontSize: 18 }} />
                  </button>
                </div>
              </div>
            </div>
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
          <div className="px-5 pb-4 flex items-center justify-between shrink-0">
            <p className="text-xs text-gray-400">
              Toda I.A pode cometer erros, sempre verifique os dados.
            </p>
            {messages.length > 0 && (
              <button
                onClick={handleNewConversation}
                className="ml-2 flex-shrink-0 flex items-center gap-1 text-xs text-gray-400 hover:text-purple-600 hover:bg-purple-50 px-2 py-1 rounded-md transition"
                title="Nova conversa"
              >
                <AddOutlinedIcon sx={{ fontSize: 14 }} />
                Nova
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Sub-componentes auxiliares ────────────────────────────────────────────────

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
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          msg.role === "user"
            ? "text-white rounded-tr-sm"
            : "bg-gray-50 text-gray-800 rounded-tl-sm border border-gray-100"
        }`}
        style={
          msg.role === "user"
            ? { background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" }
            : undefined
        }
      >
        {msg.content.split("\n").map((line, j, arr) => (
          <span key={j}>
            {line}
            {j < arr.length - 1 && <br />}
          </span>
        ))}

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
