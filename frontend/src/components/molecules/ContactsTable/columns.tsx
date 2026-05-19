import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import type { Column } from "@/components/organisms/DataTable/types"
import { OpenCircleButton } from "@/components/atoms/open-circle-button"
import { CellText }        from "@/components/organisms/DataTable/atoms/CellText"
import { CellDouble }      from "@/components/organisms/DataTable/atoms/CellDouble"
import { CellTag }         from "@/components/organisms/DataTable/atoms/CellTag"
import InfoOutlinedIcon    from "@mui/icons-material/InfoOutlined"
import ArrowForwardIcon    from "@mui/icons-material/ArrowForward"
import { ClientStatusBadge, ALL_CLIENT_STATUSES } from "./ClientStatusBadge"
import type { Contact, EngagementType, ClientStatusType } from "@/types/contact"
import { fetchContactPedidos, type ContactPedido } from "@/lib/api/contacts"

function LastPurchaseTooltip({ contactId }: { contactId: string }) {
  const [open, setOpen]       = useState(false)
  const [pedido, setPedido]   = useState<ContactPedido | null>(null)
  const [loading, setLoading] = useState(false)
  const [pos, setPos]         = useState({ top: 0, left: 0 })
  const anchorRef             = useRef<HTMLDivElement>(null)
  const fetched               = useRef(false)

  const handleEnter = async () => {
    if (anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect()
      setPos({ top: r.top + window.scrollY, left: r.left + r.width / 2 + window.scrollX })
    }
    setOpen(true)
    if (fetched.current) return
    fetched.current = true
    setLoading(true)
    try {
      const list = await fetchContactPedidos(contactId, 1)
      setPedido(list[0] ?? null)
    } catch {
      setPedido(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    const onScroll = () => setOpen(false)
    window.addEventListener("scroll", onScroll, true)
    return () => window.removeEventListener("scroll", onScroll, true)
  }, [open])

  const formatBRL = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  const tooltip = open ? createPortal(
    <div
      className="pointer-events-none fixed z-[9999]"
      style={{ top: pos.top, left: pos.left, transform: "translate(-50%, calc(-100% - 10px))" }}
    >
      <div className="bg-[#222] text-white rounded-2xl px-3.5 py-2.5 text-sm whitespace-nowrap shadow-xl">
        {loading ? (
          <span className="text-gray-400 text-xs">Carregando...</span>
        ) : pedido ? (
          <>
            <p className="font-medium leading-snug">
              {pedido.quantidade && pedido.quantidade > 1 ? `${pedido.quantidade}x ` : ""}
              {pedido.nome_produto ?? "—"}
            </p>
            <p className="text-green-400 font-semibold leading-snug">
              {pedido.valor_pedido != null ? formatBRL(pedido.valor_pedido) : "—"}
            </p>
          </>
        ) : (
          <span className="text-gray-400 text-xs">Sem dados</span>
        )}
      </div>
      <div className="flex justify-center -mt-1.5">
        <div className="w-3 h-3 bg-[#222] rotate-45" />
      </div>
    </div>,
    document.body
  ) : null

  return (
    <div
      ref={anchorRef}
      className="inline-flex items-center"
      onMouseEnter={handleEnter}
      onMouseLeave={() => setOpen(false)}
    >
      <InfoOutlinedIcon sx={{ fontSize: 14, color: "#9CA3AF" }} className="cursor-default" />
      {tooltip}
    </div>
  )
}

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "")
  if (d.length === 11) return `(${d.slice(0,2)})${d.slice(2,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,2)})${d.slice(2,6)}-${d.slice(6)}`
  return phone
}

const ENGAGEMENT_COLORS: Record<EngagementType, string> = {
  "Promotor":   "bg-green-50 text-green-700",
  "Neutro":     "bg-yellow-50 text-yellow-700",
  "Detrator":   "bg-red-50 text-red-600",
  "Nenhum NPS": "bg-gray-100 text-gray-500",
}


export function makeContactColumns(
  expandedRowId: string | null,
  _onToggle: (id: string) => void,
  onNavigate: (id: string) => void,
): Column<Contact>[] {
  return [
  // ── Expand ─────────────────────────────────────────────────────────────────
  {
    key: "info",
    header: "",
    minWidth: "30px",
    render: (c) => (
      <div className={expandedRowId === c.id ? "inline-flex rotate-90 transition-transform duration-200" : "inline-flex transition-transform duration-200"}>
        <OpenCircleButton title={expandedRowId === c.id ? "Fechar detalhes do contato" : "Abrir detalhes do contato"} />
      </div>
    ),
  },

  // ── Nome ───────────────────────────────────────────────────────────────────
  {
    key: "name",
    header: "Nome",
    minWidth: "160px",
    sortable: true,
    sortValue: (c) => c.name ?? "",
    copyId: (c) => c.id,
    render: (c) => (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onNavigate(c.id) }}
        className="text-left hover:bg-[#CFA7FF] rounded-lg px-2 py-0.5 transition-colors"
      >
        <CellText value={c.name} truncate maxWidth="200px" />
      </button>
    ),
  },

  // ── Status do cliente ──────────────────────────────────────────────────────
  {
    key: "clientStatus",
    header: "Status",
    minWidth: "140px",
    filter: {
      type: "multi-select" as const,
      label: "Status",
      options: ALL_CLIENT_STATUSES,
      renderOption: (value) => <ClientStatusBadge status={value as ClientStatusType} />,
    },
    render: (c) => <ClientStatusBadge status={c.clientStatus} />,
  },

  // ── Última compra ──────────────────────────────────────────────────────────
  {
    key: "lastPurchase",
    header: "Última compra",
    minWidth: "130px",
    sortable: true,
    sortValue: (c) => c.lastPurchase ?? "",
    render: (c) =>
      c.lastPurchase ? (
        <div className="flex items-center gap-1.5">
          <LastPurchaseTooltip contactId={c.id} />
          <CellText value={c.lastPurchase} variant="primary" />
        </div>
      ) : (
        <CellText value="Nenhuma compra" variant="muted" />
      ),
  },

  // ── Compras ────────────────────────────────────────────────────────────────
  {
    key: "purchases",
    header: "Compras",
    minWidth: "80px",
    sortable: true,
    sortValue: (c) => c.purchases,
    filter: {
      type: "number-range",
      label: "Compras",
      filterFn: (c, min, max) => {
        if (min != null && c.purchases < min) return false
        if (max != null && c.purchases > max) return false
        return true
      },
    },
    render: (c) => <CellText value={c.purchases} />,
  },

  // ── Contatos (duas linhas) ─────────────────────────────────────────────────
  {
    key: "contacts",
    header: "Contatos",
    minWidth: "160px",
    render: (c) => (
      <CellDouble
        top={c.email ?? "—"}
        bottom={
          c.phone
            ? <span className="text-[#06121C]">{formatPhone(c.phone)}</span>
            : "—"
        }
      />
    ),
  },

  // ── Data de criação (filtro oculto) ────────────────────────────────────────
  {
    key: "createdAt",
    header: "",
    visible: false,
    filter: {
      type: "date-range" as const,
      label: "Data de criação",
      filterFn: (c, from, to) => {
        if (!c.createdAt) return true
        const [d, m, y] = c.createdAt.split("/")
        const iso = `${y}-${m}-${d}`
        if (from && iso < from) return false
        if (to   && iso > to)   return false
        return true
      },
    },
    render: () => null,
  },

  // ── Engajamento ────────────────────────────────────────────────────────────
  {
    key: "engagement",
    header: "Engajamento",
    minWidth: "140px",
    sortable: true,
    sortValue: (c) => c.engagementScore,
    filter: {
      type: "multi-select",
      label: "Engajamento",
      options: ["Promotor", "Neutro", "Detrator", "Nenhum NPS"],
      filterFn: (c, values) => values.length === 0 || values.includes(c.engagement),
    },
    render: (c) => (
      <CellTag
        label={c.engagement}
        colorClasses={ENGAGEMENT_COLORS[c.engagement]}
        variant="badge"
      />
    ),
  },

  // ── Navegar para detalhe ───────────────────────────────────────────────────
  {
    key: "navigate",
    header: "",
    render: (c) => (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onNavigate(c.id) }}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D1B1E5] bg-[#F7EBFF] transition-colors hover:bg-[#F0DDFD]"
        title="Ver detalhe do contato"
      >
        <ArrowForwardIcon sx={{ fontSize: 16, color: "#06121C" }} />
      </button>
    ),
  },
  ]
}
