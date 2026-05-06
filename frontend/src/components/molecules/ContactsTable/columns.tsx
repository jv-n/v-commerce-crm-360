import type { Column } from "@/components/organisms/DataTable/types"
import type { Contact, ContactStatus, EngagementType } from "@/types/contact"
import { StatusBadge } from "@/components/atoms/badge"
import { cn } from "@/lib/utils"
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"


const ENGAGEMENT: Record<EngagementType, { bar: string; text: string; width: string }> = {
  Promotor:      { bar: "bg-green-500",  text: "text-green-700",  width: "80%" },
  Neutro:        { bar: "bg-yellow-400", text: "text-yellow-600", width: "50%" },
  Detrator:      { bar: "bg-red-500",    text: "text-red-600",    width: "22%" },
  "Nenhum NPS":  { bar: "bg-gray-200",   text: "text-gray-400",   width: "0%"  },
}

const ALL_STATUSES: ContactStatus[] = [
  "Cliente Ativo", "Cliente VIP", "Em risco", "Lead", "Cliente Inativo", "Desativado",
]

export function makeContactColumns(
  expandedRowId: string | null,
  onToggle: (id: string) => void,
): Column<Contact>[] {
  return [
  // ── Info icon ──────────────────────────────────────────────────────────────
  {
    key: "info",
    header: "",
    render: (c) => (
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(c.id) }}
        className="flex items-center justify-center"
      >
        <InfoOutlinedIcon sx={{
          fontSize: 15,
          color: expandedRowId === c.id ? "#7C3AED" : "#D1D5DB",
        }} />
      </button>
    ),
  },

  // ── Nome ───────────────────────────────────────────────────────────────────
  {
    key: "name",
    header: "Nome",
    minWidth: "160px",
    render: (c) => (
      <button
        onClick={() => onToggle(c.id)}
        className="font-medium text-gray-900 truncate block max-w-[200px] text-left hover:text-purple-700 transition-colors"
      >
        {c.name}
      </button>
    ),
  },

  // ── Status — select filter (used as rightFilterKey) ─────────────────────────
  {
    key: "status",
    header: "Status",
    minWidth: "130px",
    filter: {
      type: "select",
      label: "Todos os estados",
      options: ALL_STATUSES,
      filterFn: (c, value) => c.status === (value as ContactStatus),
    },
    render: (c) => <StatusBadge status={c.status ?? "Cliente Ativo"} />,
  },

  // ── Última compra ──────────────────────────────────────────────────────────
  {
    key: "lastPurchase",
    header: "Última compra",
    minWidth: "130px",
    render: (c) =>
      c.lastPurchase ? (
        <div className="flex items-center gap-1.5 text-gray-600">
          <AccessTimeOutlinedIcon sx={{ fontSize: 14, color: "#9CA3AF" }} />
          <span className="text-xs">{c.lastPurchase}</span>
        </div>
      ) : (
        <span className="text-xs text-gray-400">Nenhuma compra</span>
      ),
  },

  // ── Compras — number-range filter ──────────────────────────────────────────
  {
    key: "purchases",
    header: "Compras",
    minWidth: "80px",
    filter: {
      type: "number-range",
      label: "Compras",
      filterFn: (c, min, max) => {
        if (min != null && c.purchases < min) return false
        if (max != null && c.purchases > max) return false
        return true
      },
    },
    render: (c) => <span className="text-gray-800 font-medium">{c.purchases}</span>,
  },

  // ── Contatos ───────────────────────────────────────────────────────────────
  {
    key: "contacts",
    header: "Contatos",
    minWidth: "160px",
    render: (c) => (
      <div className="text-xs text-gray-500 space-y-0.5">
        <div>{c.email}</div>
        <div>{c.phone}</div>
      </div>
    ),
  },

  // ── Data de criação — select filter (hidden column) ────────────────────────
  {
    key: "createdAt",
    header: "",
    visible: false,
    filter: {
      type: "select",
      label: "Data de criação",
      options: ["2024", "2025", "2026"],
      filterFn: (c, value) => (c.createdAt ?? "").endsWith(value),
    },
    render: () => null,
  },

  // ── Engajamento ────────────────────────────────────────────────────────────
  {
    key: "engagement",
    header: "Engajamento",
    minWidth: "140px",
    filterOptional: true,
    filter: {
      type: "select",
      label: "Engajamento",
      options: ["Promotor", "Neutro", "Detrator", "Nenhum NPS"],
      filterFn: (c, value) => c.engagement === (value as EngagementType),
    },
    render: (c) => {
      const eng = ENGAGEMENT[c.engagement]
      return (
        <div className="flex flex-col gap-1 min-w-[110px]">
          <span className={cn("text-xs font-medium", eng.text)}>{c.engagement}</span>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className={cn("h-1.5 rounded-full", eng.bar)} style={{ width: `${c.engagementScore}%` }} />
          </div>
        </div>
      )
    },
  },
  ]
}
