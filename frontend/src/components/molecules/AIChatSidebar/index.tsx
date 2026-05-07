import { useEffect, useRef, useState } from "react";
import CloseFullscreenOutlinedIcon from "@mui/icons-material/CloseFullscreenOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import OpenInFullOutlinedIcon from "@mui/icons-material/OpenInFullOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import AlternateEmailOutlinedIcon from "@mui/icons-material/AlternateEmailOutlined";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import { fetchSuggestions, sendMessage, clearSession, type ChatMessage } from "@/lib/api/agent";

interface AIChatSidebarProps {
  open: boolean;
  onClose: () => void;
  userName?: string;
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

export default function AIChatSidebar({
  open,
  onClose,
  userName = "você",
  isExpanded = false,
  onExpandedChange,
}: AIChatSidebarProps) {
  const [sessionId] = useState<string>(() => crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Carrega sugestões ao abrir
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

  // Scroll automático para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [inputValue]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

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

  const handleClear = async () => {
    await clearSession(sessionId).catch(() => {});
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  const showSuggestions = messages.length === 0 && suggestions.length > 0;

  const sidebarWidth = isExpanded ? "w-[640px]" : "w-[480px]";

  return (
    <>
      {/* Backdrop sutil */}
      <div
        className={`fixed inset-0 z-30 transition-opacity duration-300 pointer-events-none ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Painel */}
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
            <button
              onClick={() => {}}
              className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              title="Chat"
            >
              <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 18 }} />
            </button>
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
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              title="Fechar"
            >
              <CloseOutlinedIcon sx={{ fontSize: 18 }} />
            </button>
          </div>
        </div>

        {/* ── Saudação ── */}
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

        {/* ── Área de mensagens ── */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4 min-h-0">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 mr-2 mt-0.5 flex items-center justify-center text-white text-xs font-bold"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                  }}
                >
                  V
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "text-white rounded-tr-sm"
                    : "bg-gray-50 text-gray-800 rounded-tl-sm border border-gray-100"
                }`}
                style={
                  msg.role === "user"
                    ? {
                        background:
                          "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                      }
                    : undefined
                }
              >
                {/* Renderiza quebras de linha no texto do assistente */}
                {msg.content.split("\n").map((line, j) => (
                  <span key={j}>
                    {line}
                    {j < msg.content.split("\n").length - 1 && <br />}
                  </span>
                ))}

                {/* Sources */}
                {msg.role === "assistant" &&
                  msg.sources &&
                  msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-400 font-medium mb-1">
                        Fontes consultadas:
                      </p>
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
          ))}

          {/* Indicador de carregamento */}
          {isLoading && (
            <div className="flex justify-start">
              <div
                className="w-7 h-7 rounded-full flex-shrink-0 mr-2 mt-0.5 flex items-center justify-center text-white text-xs font-bold"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                }}
              >
                V
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input ── */}
        <div className="px-5 py-4 shrink-0">
          <div
            className="rounded-2xl p-[2px]"
            style={{
              background:
                "linear-gradient(135deg, #7c3aed 0%, #a855f7 40%, #74FF60 100%)",
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
                    onClick={() => {}}
                  >
                    <AttachFileOutlinedIcon sx={{ fontSize: 16 }} />
                  </button>
                  <button
                    className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                    title="Mencionar"
                    onClick={() => {}}
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

        {/* ── Sugestões ── */}
        {showSuggestions && (
          <div className="px-5 pb-4 shrink-0">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Por onde começar?
            </p>
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

        {/* ── Footer ── */}
        <div className="px-5 pb-4 flex items-center justify-between shrink-0">
          <p className="text-xs text-gray-400">
            Toda I.A pode cometer erros, sempre verifique os dados.
          </p>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="ml-2 flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              title="Limpar conversa"
            >
              <AutorenewRoundedIcon sx={{ fontSize: 16 }} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
