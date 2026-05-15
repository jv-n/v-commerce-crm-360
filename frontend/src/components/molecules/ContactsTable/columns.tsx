import type { Column } from "@/components/organisms/DataTable/types"
import { RowExpandButton } from "@/components/organisms/DataTable/atoms/RowExpandButton"
import { CellText }        from "@/components/organisms/DataTable/atoms/CellText"
import { CellDouble }      from "@/components/organisms/DataTable/atoms/CellDouble"
import { CellTag }         from "@/components/organisms/DataTable/atoms/CellTag"
import AccessTimeOutlinedIcon  from "@mui/icons-material/AccessTimeOutlined"
import ArrowForwardIosIcon     from "@mui/icons-material/ArrowForwardIos"
import { ClientStatusBadge, ALL_CLIENT_STATUSES } from "./ClientStatusBadge"
import type { Contact, EngagementType, ClientStatusType } from "@/types/contact"

const ENGAGEMENT_COLORS: Record<EngagementType, string> = {
  "Promotor":     "bg-green-50 text-green-700",
  "Neutro":       "bg-yellow-50 text-yellow-700",
  "Detrator":     "bg-red-50 text-red-600",
  "Nenhum NPS":   "bg-gray-100 text-gray-500",
}

export function makeContactColumns(
  expandedRowId: string | null,
  onToggle: (id: string) => void,
  onNavigate: (id: string) => void,
): Column<Contact>[] {
  return [
  // ── Expand ─────────────────────────────────────────────────────────────────
  {
    key: "info",
    header: "",
    render: (c) => <RowExpandButton expanded={expandedRowId === c.id} />,
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
      <span className="text-sm text-[#06121C] truncate block max-w-[200px]">
        {c.name}
      </span>
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
          <AccessTimeOutlinedIcon sx={{ fontSize: 13, color: "#9CA3AF" }} />
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
        bottom={c.phone ?? undefined}
      />
    ),
  },

  // ── Data de criação (filtro oculto) ────────────────────────────────────────
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
    sortable: true,
    sortValue: (c) => c.engagementScore,
    filter: {
      type: "select",
      label: "Engajamento",
      options: ["Promotor", "Neutro", "Detrator", "Nenhum NPS"],
      filterFn: (c, value) => c.engagement === (value as EngagementType),
    },
    render: (c) => (
      <CellTag
        label={c.engagement}
        colorClasses={ENGAGEMENT_COLORS[c.engagement]}
      />
    ),
  },

  // ── Navegar para detalhe ───────────────────────────────────────────────────
  {
    key: "navigate",
    header: "",
    render: (c) => (
      <button
        onClick={(e) => { e.stopPropagation(); onNavigate(c.id) }}
        className="p-1.5 rounded-md hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors"
        title="Ver detalhe do contato"
      >
        <ArrowForwardIosIcon sx={{ fontSize: 13 }} />
      </button>
    ),
  },
  ]
}
