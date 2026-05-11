import type { Column } from "@/components/organisms/DataTable/types"
import type { Contact, EngagementType, ClientStatusType } from "@/types/contact"
import { cn } from "@/lib/utils"
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import { ClientStatusBadge, ALL_CLIENT_STATUSES } from "./ClientStatusBadge"


const ENGAGEMENT: Record<EngagementType, { text: string }> = {
  Promotor:      { text: "text-green-700"  },
  Neutro:        { text: "text-yellow-600" },
  Detrator:      { text: "text-red-600"    },
  "Nenhum NPS":  { text: "text-gray-400"   },
}

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
        <ChevronRightIcon sx={{
          fontSize: 16,
          color: expandedRowId === c.id ? "#7C3AED" : "#9CA3AF",
          transform: expandedRowId === c.id ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease, color 0.2s ease",
        }} />
      </button>
    ),
  },

  // ── Nome ───────────────────────────────────────────────────────────────────
  {
    key: "name",
    header: "Nome",
    minWidth: "160px",
    sortable: true,
    sortValue: (c) => c.name ?? "",
    render: (c) => (
      <button
        onClick={() => onToggle(c.id)}
        className="font-medium text-gray-900 truncate block max-w-[200px] text-left hover:text-purple-700 transition-colors"
      >
        {c.name}
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

  // ── Telefone — toggle filter (hidden column) ──────────────────────────────
  {
    key: "phone",
    header: "",
    visible: false,
    filter: {
      type: "toggle",
      label: "Com telefone",
      filterFn: (c) => c.phone != null,
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
      type: "select",
      label: "Engajamento",
      options: ["Promotor", "Neutro", "Detrator", "Nenhum NPS"],
      filterFn: (c, value) => c.engagement === (value as EngagementType),
    },
    render: (c) => {
      const eng = ENGAGEMENT[c.engagement]
      return <span className={cn("text-xs font-medium", eng.text)}>{c.engagement}</span>
    },
  },
  ]
}
