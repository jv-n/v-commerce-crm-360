import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import type { Contact } from "@/types/contact"
import { fetchContactPedidos, type ContactPedido } from "@/lib/api/contacts"
import AddIcon             from "@mui/icons-material/Add"
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined"
import MoreHorizIcon       from "@mui/icons-material/MoreHoriz"

function fmtBRL(value: number | null): string {
  if (value == null) return "—"
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

type TimelineEntry =
  | { type: "purchase"; pedido: ContactPedido }
  | { type: "more";     count: number }
  | { type: "created" }

export function ContactExpandedRow({ contact }: { contact: Contact }) {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState<ContactPedido[]>([])

  useEffect(() => {
    fetchContactPedidos(contact.id, 3)
      .then(setPedidos)
      .catch(() => {})
  }, [contact.id])

  const hiddenCount = Math.max(0, contact.purchases - pedidos.length)
  const showMore = hiddenCount > 0

  const timeline: TimelineEntry[] = [
    ...pedidos.map(p => ({ type: "purchase" as const, pedido: p })),
    ...(showMore ? [{ type: "more" as const, count: hiddenCount }] : []),
    { type: "created" as const },
  ]

  return (
    <div className="bg-purple-50/40 px-8 py-5 flex gap-8 border-t border-purple-100">
      <div className="flex-1 flex flex-col">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Últimas compras</p>
        {timeline.map((entry, i) => (
          <div key={i} className="flex gap-3">
            {/* Indicador + linha vertical */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                entry.type === "created"
                  ? "border-2 border-dashed border-gray-300 bg-transparent"
                  : entry.type === "more"
                  ? "border border-gray-300 bg-white shadow-sm"
                  : "bg-white border border-purple-200 shadow-sm",
              )}>
                {entry.type === "purchase" && <ShoppingCartOutlinedIcon sx={{ fontSize: 12, color: "#7C3AED" }} />}
                {entry.type === "more"     && <MoreHorizIcon            sx={{ fontSize: 14, color: "#9CA3AF" }} />}
                {entry.type === "created"  && <AddIcon                  sx={{ fontSize: 13, color: "#9CA3AF" }} />}
              </div>
              {i < timeline.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
            </div>

            {/* Conteúdo do marco */}
            <div className="pb-5 flex flex-col justify-center">
              {entry.type === "purchase" && (
                <div>
                  <p className="text-sm font-semibold text-gray-800 leading-snug">
                    {entry.pedido.quantidade != null
                      ? `${Math.round(entry.pedido.quantidade)}x ${entry.pedido.nome_produto ?? "Produto desconhecido"}`
                      : (entry.pedido.nome_produto ?? "Produto desconhecido")}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap text-xs text-gray-500">
                    <span className="font-medium text-gray-700">{fmtBRL(entry.pedido.valor_pedido)}</span>
                    <span className="text-gray-300">·</span>
                    <span>{entry.pedido.metodo_pagamento ?? "—"}</span>
                    <span className="text-gray-300">·</span>
                    <span>{entry.pedido.data_pedido ?? "—"}</span>
                  </div>
                </div>
              )}

              {entry.type === "more" && (
                <button
                  onClick={() => navigate("/sales", { state: { search: contact.id, searchField: "client_id" } })}
                  className="text-sm text-purple-700 font-medium underline hover:bg-[#CFA7FF] rounded-lg px-2 py-0.5 transition-colors text-left"
                >
                  e mais {entry.count} {entry.count === 1 ? "pedido anterior" : "pedidos anteriores"} →
                </button>
              )}

              {entry.type === "created" && (
                <div className="flex items-center gap-1 flex-wrap text-sm">
                  <span className="font-semibold text-gray-800">{contact.name}</span>
                  <span className="text-gray-500">foi cadastrado como cliente</span>
                  <span className="text-xs text-gray-400 ml-0.5">- {contact.createdAt ?? "—"}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
