/**
 * MentionInput
 * Input de chat com suporte a menções (@) com chips coloridos.
 *
 * Tipos de menção:
 *  - contact → chip azul,    display = id_cliente
 *  - product → chip verde,   display = id do produto
 *  - agent   → chip roxo,    display = nome do agente
 *
 * Uso:
 *   <MentionInput ref={ref} onSend={handleSend} disabled={isLoading} />
 *   ref.current.clear()      — limpa o editor após envio
 *   ref.current.focus()      — foca o editor
 *   ref.current.setValue(t)  — restaura texto inicial
 */

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import AlternateEmailOutlinedIcon from "@mui/icons-material/AlternateEmailOutlined";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import { searchMentions, type MentionItem, type MentionType } from "@/lib/api/mentions";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface MentionInputHandle {
  clear: () => void;
  focus: () => void;
  setValue: (text: string) => void;
  isEmpty: () => boolean;
  insertChip: (item: MentionItem) => void;
}

interface Props {
  onSend: (text: string, mentions: MentionItem[]) => void;
  disabled?: boolean;
  placeholder?: string;
  initialValue?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Prefixo visível no chip e no texto enviado ao agente
const TYPE_PREFIX: Record<MentionType, string> = {
  contact: "cliente",
  lead:    "lead",
  product: "produto",
  order:   "pedido",
  agent:   "agente",
};

// Badge no dropdown
const TYPE_LABELS: Record<MentionType, string> = {
  contact: "CLIENTE",
  lead:    "LEAD",
  product: "PRODUTO",
  order:   "PEDIDO",
  agent:   "AGENTE",
};

const CHIP_CLASS: Record<MentionType, string> = {
  contact:
    "inline-flex items-center mx-0.5 px-1.5 py-0.5 rounded border text-xs font-medium bg-blue-50 text-blue-700 border-blue-200 cursor-default select-none",
  lead:
    "inline-flex items-center mx-0.5 px-1.5 py-0.5 rounded border text-xs font-medium bg-red-50 text-red-700 border-red-200 cursor-default select-none",
  product:
    "inline-flex items-center mx-0.5 px-1.5 py-0.5 rounded border text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default select-none",
  order:
    "inline-flex items-center mx-0.5 px-1.5 py-0.5 rounded border text-xs font-medium bg-orange-50 text-orange-700 border-orange-200 cursor-default select-none",
  agent:
    "inline-flex items-center mx-0.5 px-1.5 py-0.5 rounded border text-xs font-medium bg-purple-50 text-purple-700 border-purple-200 cursor-default select-none",
};

const BADGE_CLASS: Record<MentionType, string> = {
  contact: "text-[10px] font-bold px-1 py-0.5 rounded bg-blue-100 text-blue-600",
  lead:    "text-[10px] font-bold px-1 py-0.5 rounded bg-red-100 text-red-600",
  product: "text-[10px] font-bold px-1 py-0.5 rounded bg-emerald-100 text-emerald-600",
  order:   "text-[10px] font-bold px-1 py-0.5 rounded bg-orange-100 text-orange-600",
  agent:   "text-[10px] font-bold px-1 py-0.5 rounded bg-purple-100 text-purple-600",
};

/** Texto antes do cursor no contenteditable */
function getTextBeforeCursor(el: HTMLElement): string {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return "";
  const range = sel.getRangeAt(0).cloneRange();
  range.selectNodeContents(el);
  range.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
  return range.toString();
}

/** Extrai as menções presentes no editor */
function extractMentions(el: HTMLElement): MentionItem[] {
  return Array.from(el.querySelectorAll<HTMLElement>("[data-mention-id]")).map(
    (span) => ({
      id: span.dataset.mentionId!,
      type: span.dataset.mentionType as MentionType,
      display: span.dataset.mentionDisplay!,
      label: span.dataset.mentionLabel!,
      sublabel: span.dataset.mentionSublabel,
    })
  );
}

/** Constrói o texto plano + contexto de menções para enviar ao agente */
function buildMessageText(el: HTMLElement): {
  text: string;
  mentions: MentionItem[];
} {
  const mentions = extractMentions(el);
  let text = "";

  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += (node.textContent ?? "").replace(/ /g, " ");
    } else if (
      node instanceof HTMLElement &&
      node.dataset.mentionId
    ) {
      const prefix = TYPE_PREFIX[node.dataset.mentionType as MentionType] ?? node.dataset.mentionType;
      text += `@${prefix}: ${node.dataset.mentionDisplay}`;
    } else {
      text += node.textContent ?? "";
    }
  });

  text = text.trim();

  // Contexto adicional para o agente de IA
  if (mentions.length > 0) {
    const ctx = mentions
      .map((m) => {
        const type = TYPE_LABELS[m.type].toLowerCase();
        const sub = m.sublabel ? ` (${m.sublabel})` : "";
        return `@${m.display} = ${m.label}${sub} [${type}]`;
      })
      .join("; ");
    text += `\n\n[Menções: ${ctx}]`;
  }

  return { text, mentions };
}

// ── Componente ────────────────────────────────────────────────────────────────

const MentionInput = forwardRef<MentionInputHandle, Props>(
  ({ onSend, disabled = false, placeholder = "Me diga como posso te ajudar...", initialValue }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [results, setResults] = useState<MentionItem[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeIdx, setActiveIdx] = useState(0);
    const [isEmpty, setIsEmpty] = useState(true);

    // ── Imperativo ──────────────────────────────────────────────────────────

    useImperativeHandle(ref, () => ({
      clear: () => {
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
          setIsEmpty(true);
        }
      },
      focus: () => editorRef.current?.focus(),
      setValue: (text: string) => {
        if (editorRef.current) {
          editorRef.current.innerText = text;
          setIsEmpty(!text.trim());
        }
      },
      isEmpty: () => isEmpty,
      insertChip: (item: MentionItem) => {
        const el = editorRef.current;
        if (!el) return;
        const chip = document.createElement("span");
        chip.className = CHIP_CLASS[item.type];
        chip.contentEditable = "false";
        chip.dataset.mentionId = item.id;
        chip.dataset.mentionType = item.type;
        chip.dataset.mentionDisplay = item.display;
        chip.dataset.mentionLabel = item.label;
        if (item.sublabel) chip.dataset.mentionSublabel = item.sublabel;
        chip.textContent = `@${TYPE_PREFIX[item.type]}: ${item.display}`;
        el.appendChild(chip);
        const space = document.createTextNode(" ");
        el.appendChild(space);
        setIsEmpty(false);
        el.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStartAfter(space);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
      },
    }));

    // Valor inicial (restaurado da navegação)
    useEffect(() => {
      if (initialValue && editorRef.current) {
        editorRef.current.innerText = initialValue;
        setIsEmpty(!initialValue.trim());
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Busca debounced ─────────────────────────────────────────────────────

    const triggerSearch = (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const items = await searchMentions(q, 5);
        setResults(items);
        setShowDropdown(items.length > 0);
        setActiveIdx(0);
      }, 150);
    };

    // ── Inserção do chip ────────────────────────────────────────────────────

    const insertMention = (item: MentionItem) => {
      const el = editorRef.current;
      if (!el) return;

      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;

      const range = sel.getRangeAt(0);
      const textBefore = getTextBeforeCursor(el);
      const match = textBefore.match(/@\w*$/);
      if (!match) return;

      // Remove @query antes do cursor
      const deleteRange = range.cloneRange();
      deleteRange.setStart(
        range.endContainer,
        range.endOffset - match[0].length
      );
      deleteRange.deleteContents();

      // Cria o chip
      const chip = document.createElement("span");
      chip.className = CHIP_CLASS[item.type];
      chip.contentEditable = "false";
      chip.dataset.mentionId = item.id;
      chip.dataset.mentionType = item.type;
      chip.dataset.mentionDisplay = item.display;
      chip.dataset.mentionLabel = item.label;
      if (item.sublabel) chip.dataset.mentionSublabel = item.sublabel;
      chip.textContent = `@${TYPE_PREFIX[item.type]}: ${item.display}`;

      deleteRange.insertNode(chip);

      // Espaço após chip e reposiciona cursor
      const space = document.createTextNode(" ");
      deleteRange.setStartAfter(chip);
      deleteRange.insertNode(space);
      deleteRange.setStartAfter(space);
      deleteRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(deleteRange);

      setShowDropdown(false);
      setResults([]);
      setIsEmpty(false);
      el.focus();
    };

    // ── Envio ───────────────────────────────────────────────────────────────

    const handleSend = () => {
      const el = editorRef.current;
      if (!el || disabled) return;
      const { text, mentions } = buildMessageText(el);
      if (!text.replace(/\[Menções:.*\]$/s, "").trim()) return;
      onSend(text, mentions);
    };

    // ── Eventos ─────────────────────────────────────────────────────────────

    const onInput = () => {
      const el = editorRef.current;
      if (!el) return;
      setIsEmpty(!el.innerText.trim() && !el.querySelector("[data-mention-id]"));

      const textBefore = getTextBeforeCursor(el);
      const match = textBefore.match(/@(\w*)$/);
      if (match) {
        triggerSearch(match[1]);
      } else {
        setShowDropdown(false);
        if (debounceRef.current) clearTimeout(debounceRef.current);
      }
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (showDropdown && results.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveIdx((i) => Math.min(i + 1, results.length - 1));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveIdx((i) => Math.max(i - 1, 0));
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          insertMention(results[activeIdx]);
          return;
        }
        if (e.key === "Escape") {
          setShowDropdown(false);
          return;
        }
      }

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
    };

    // Abre dropdown ao clicar no botão @
    const handleAtButton = () => {
      const el = editorRef.current;
      if (!el || disabled) return;
      el.focus();
      document.execCommand("insertText", false, "@");
      triggerSearch("");
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
      <div className="relative">
        {/* Dropdown */}
        {showDropdown && results.length > 0 && (
          <div className="absolute bottom-full mb-2 left-0 right-0 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-[9999]">
            {results.map((item, i) => (
              <button
                key={`${item.type}-${item.id}`}
                onMouseDown={(e) => { e.preventDefault(); insertMention(item); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === activeIdx ? "bg-gray-50" : "hover:bg-gray-50"
                }`}
              >
                <span className={BADGE_CLASS[item.type]}>
                  {TYPE_LABELS[item.type]}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-gray-800 truncate">{item.label}</span>
                  {item.sublabel && (
                    <span className="block text-xs text-gray-400 truncate">{item.sublabel}</span>
                  )}
                </span>
                <span className={`shrink-0 text-xs font-mono ${
                  item.type === "contact" ? "text-blue-500" :
                  item.type === "lead"    ? "text-sky-500" :
                  item.type === "product" ? "text-emerald-500" :
                  item.type === "order"   ? "text-orange-500" : "text-purple-500"
                }`}>
                  @{item.display}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div
          className="rounded-2xl p-[2px]"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 40%, #74FF60 100%)" }}
        >
          <div className="bg-white rounded-[14px] px-4 pt-3 pb-2">
            {/* Editor contenteditable */}
            <div className="relative">
              <div
                ref={editorRef}
                contentEditable={!disabled}
                suppressContentEditableWarning
                onInput={onInput}
                onKeyDown={onKeyDown}
                onPaste={onPaste}
                className="w-full min-h-[20px] max-h-40 overflow-y-auto text-sm text-gray-800 outline-none leading-relaxed break-words"
                style={{ wordBreak: "break-word" }}
              />
              {/* Placeholder */}
              {isEmpty && (
                <div className="absolute inset-0 text-sm text-gray-400 pointer-events-none select-none leading-relaxed">
                  {placeholder}
                </div>
              )}
            </div>

            {/* Barra inferior */}
            <div className="flex items-center justify-between mt-2">
              <button
                onMouseDown={(e) => { e.preventDefault(); handleAtButton(); }}
                className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                title="Mencionar"
                disabled={disabled}
              >
                <AlternateEmailOutlinedIcon sx={{ fontSize: 16 }} />
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); handleSend(); }}
                disabled={isEmpty || disabled}
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
    );
  }
);

MentionInput.displayName = "MentionInput";
export default MentionInput;
