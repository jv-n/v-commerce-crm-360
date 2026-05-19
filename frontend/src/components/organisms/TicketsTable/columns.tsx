import type { ReactNode } from "react"

import { OpenCircleButton } from "@/components/atoms/open-circle-button"
import type { Column } from "@/components/organisms/DataTable/types"
import type { Ticket, TicketProblem, TicketStatus } from "@/types/ticket"
import { ScoreBadge, TicketStatusBadge } from "./tableComponents/badge"

import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined"
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined"
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined"
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined"

const ALL_STATUSES: TicketStatus[] = [
  "Finalizado",
  "Em atendimento",
  "Aguardando",
]

const ALL_PROBLEMS: TicketProblem[] = [
  "Produto",
  "Entrega",
  "Pagamento",
  "Reembolso",
]

const ALL_SCORES = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "Sem avaliação",
]

const idButtonClassName =
  "block truncate rounded-lg px-2 py-0.5 text-[13px] font-medium text-gray-900 transition-colors hover:bg-[#CFA7FF]"

function getProblemIcon(problem: TicketProblem): ReactNode {
  const iconStyle = { fontSize: 18, color: "#A855F7" }

  const icons: Record<TicketProblem, ReactNode> = {
    Produto: <ShoppingCartOutlinedIcon sx={iconStyle} />,
    Entrega: <LocalShippingOutlinedIcon sx={iconStyle} />,
    Pagamento: <PaymentsOutlinedIcon sx={iconStyle} />,
    Reembolso: <ReplayOutlinedIcon sx={iconStyle} />,
  }

  return icons[problem]
}

function parseDateTime(value?: string) {
  if (!value) return null

  const normalizedValue = value.replace(" ", "T")
  const date = new Date(normalizedValue)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function formatTicketTime(value?: string) {
  const date = parseDateTime(value)

  if (!date) return "--:--"

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function formatTicketDate(value?: string) {
  const date = parseDateTime(value)

  if (!date) return value || "-"

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

export function getTicketColumns(
  responsibleOptions: string[],
  expandedRowIds: Set<string>,
  onToggleExpand: (id: string) => void,
  onNavigateContact: (clientId: string) => void,
): Column<Ticket>[] {
  return [
    {
      key: "open",
      header: "",
      minWidth: "30px",
      render: ticket => {
        const isExpanded = expandedRowIds.has(ticket.id)

        return (
          <div
            onClick={(e) => e.stopPropagation()}
            className={
              isExpanded
                ? "inline-flex rotate-90 transition-transform duration-200"
                : "inline-flex transition-transform duration-200"
            }
          >
            <OpenCircleButton
              title={
                isExpanded
                  ? "Fechar histórico do ticket"
                  : "Abrir histórico do ticket"
              }
              onClick={() => onToggleExpand(ticket.id)}
            />
          </div>
        )
      },
    },
    {
      key: "id",
      header: "ID Ticket",
      minWidth: "125px",
      render: ticket => (
        <button
          type="button"
          className={`${idButtonClassName} max-w-[125px]`}
          title={ticket.id}
        >
          {ticket.id}
        </button>
      ),
    },
    {
      key: "openedAt",
      header: "Data abertura",
      sortable: true,
      sortValue: ticket => ticket.openedAt,
      minWidth: "115px",
      render: ticket => (
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-semibold text-gray-900">
            {formatTicketDate(ticket.openedAt)}
          </span>

          <span className="text-[11px] font-medium text-gray-500">
            {formatTicketTime(ticket.openedAt)}
          </span>
        </div>
      ),
    },
    {
      key: "client",
      header: "Cliente",
      sortable: true,
      sortValue: ticket => ticket.client,
      minWidth: "130px",
      render: ticket => (
        <button
          type="button"
          className={`${idButtonClassName} max-w-[130px]`}
          title={ticket.clientId}
          onClick={(e) => { e.stopPropagation(); onNavigateContact(ticket.clientId) }}
        >
          {ticket.client}
        </button>
      ),
    },
    {
      key: "orderId",
      header: "Pedido",
      minWidth: "120px",
      render: ticket => (
        <button
          type="button"
          className={`${idButtonClassName} max-w-[120px]`}
          title={ticket.orderId}
        >
          {ticket.orderId}
        </button>
      ),
    },
    {
      key: "responsible",
      header: "Responsavel Ticket",
      sortable: true,
      sortValue: ticket => ticket.responsible.name,
      minWidth: "140px",
      filter: {
        type: "multi-select",
        label: "Responsavel",
        options: responsibleOptions,
        filterFn: (ticket, values) => values.includes(ticket.responsible.name),
      },
      render: ticket => (
        <button
          type="button"
          className="flex max-w-[140px] items-center gap-1.5 rounded-lg px-1.5 py-0.5 text-left transition-colors hover:bg-[#CFA7FF]"
          title={ticket.responsible.name}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F0DDFD] text-[11px] text-[#6F2B90]">
            {ticket.responsible.initials}
          </span>

          <span className="truncate text-[13px] font-medium text-gray-900">
            {ticket.responsible.name}
          </span>
        </button>
      ),
    },
    {
      key: "problem",
      header: "Problema",
      minWidth: "105px",
      filter: {
        type: "multi-select",
        label: "Problema",
        options: ALL_PROBLEMS,
        filterFn: (ticket, values) => values.includes(ticket.problem),
      },
      render: ticket => (
        <div className="flex items-center gap-1.5">
          {getProblemIcon(ticket.problem)}
          <span className="text-[13px] font-medium text-gray-900">
            {ticket.problem}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      minWidth: "110px",
      filter: {
        type: "multi-select",
        label: "Status",
        options: ALL_STATUSES,
        filterFn: (ticket, values) => values.includes(ticket.status),
      },
      render: ticket => <TicketStatusBadge status={ticket.status} />,
    },
    {
      key: "score",
      header: "Nota",
      sortable: true,
      sortValue: ticket => ticket.score ?? -1,
      minWidth: "70px",
      filter: {
        type: "multi-select",
        label: "Nota",
        options: ALL_SCORES,
        filterFn: (ticket, values) => {
          const scoreValue =
            ticket.score === null ? "Sem avaliação" : String(ticket.score)

          return values.includes(scoreValue)
        },
      },
      render: ticket => (
        <div className="flex items-center gap-1.5">
          <ScoreBadge score={ticket.score} />

          {ticket.score === null && (
            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-[#F0DDFD] text-[#6B4A7A] whitespace-nowrap">
              Sem avaliação
            </span>
          )}
        </div>
      ),
    },
    {
      key: "forward",
      header: "",
      minWidth: "32px",
      render: () => (
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D1B1E5] bg-[#F7EBFF] transition-colors hover:bg-[#F0DDFD]"
        >
          <ArrowForwardIcon sx={{ fontSize: 16, color: "#06121C" }} />
        </button>
      ),
    },
  ]
}