/**
 * renderMarkdown.tsx
 * Renderizador leve de Markdown para o chat do agente V.IA.
 *
 * Suporte:
 *  - **negrito**
 *  - *itálico*
 *  - `código inline`
 *  - Listas com * ou -
 *  - Linhas em branco como separadores de parágrafo
 */

import React from "react";

// ── Inline ────────────────────────────────────────────────────────────────────

function parseInline(text: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  // Ordem importa: ** antes de * para não engolir o bold como dois itálicos
  const regex = /(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*|`[^`\n]+?`)/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) tokens.push(text.slice(last, m.index));

    const t = m[0];
    if (t.startsWith("**")) {
      tokens.push(
        <strong key={key++} className="font-semibold">
          {t.slice(2, -2)}
        </strong>
      );
    } else if (t.startsWith("*")) {
      tokens.push(<em key={key++}>{t.slice(1, -1)}</em>);
    } else if (t.startsWith("`")) {
      tokens.push(
        <code
          key={key++}
          className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-xs font-mono border border-purple-100"
        >
          {t.slice(1, -1)}
        </code>
      );
    }

    last = m.index + t.length;
  }

  if (last < text.length) tokens.push(text.slice(last));
  return tokens;
}

// ── Componente principal ──────────────────────────────────────────────────────

export function MarkdownText({ content }: { content: string }) {
  if (!content) return null;
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Lista com * ou -
    if (/^[*-] /.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[*-] /.test(lines[i])) {
        items.push(
          <li key={i} className="ml-1">
            {parseInline(lines[i].slice(2))}
          </li>
        );
        i++;
      }
      elements.push(
        <ul key={key++} className="list-disc list-inside space-y-0.5 my-1">
          {items}
        </ul>
      );
      continue;
    }

    // Linha vazia → pequeno espaço entre parágrafos
    if (line.trim() === "") {
      // Ignora múltiplas linhas em branco consecutivas
      if (elements.length > 0) {
        elements.push(<div key={key++} className="h-1.5" />);
      }
      i++;
      continue;
    }

    // Linha normal
    elements.push(
      <span key={key++} className="block">
        {parseInline(line)}
      </span>
    );
    i++;
  }

  return <>{elements}</>;
}
