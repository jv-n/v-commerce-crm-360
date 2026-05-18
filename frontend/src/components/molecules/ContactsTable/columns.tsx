import type { Column } from "@/components/organisms/DataTable/types"
import { OpenCircleButton } from "@/components/atoms/open-circle-button"
import { CellText }        from "@/components/organisms/DataTable/atoms/CellText"
import { CellDouble }      from "@/components/organisms/DataTable/atoms/CellDouble"
import { CellTag }         from "@/components/organisms/DataTable/atoms/CellTag"
import AccessTimeOutlinedIcon  from "@mui/icons-material/AccessTimeOutlined"
import ArrowForwardIcon         from "@mui/icons-material/ArrowForward"
import { ClientStatusBadge, ALL_CLIENT_STATUSES } from "./ClientStatusBadge"
import type { Contact, EngagementType, ClientStatusType } from "@/types/contact"

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "")
  if (d.length === 11) return `(${d.slice(0,2)})${d.slice(2,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,2)})${d.slice(2,6)}-${d.slice(6)}`
  return phone
}

const ENGAGEMENT_COLORS: Record<EngagementType, string> = {
  "Promotor":     "bg-green-50 text-green-700",
  "Neutro":       "bg-yellow-50 text-yellow-700",
  "Detrator":     "bg-red-50 text-red-600",
  "Nenhum NPS":   "bg-gray-100 text-gray-500",
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
        className="text-left hover:bg-[#F7EBFF] rounded-full px-2 py-0.5 transition-colors"
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
