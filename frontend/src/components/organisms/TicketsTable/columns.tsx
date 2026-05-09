import type { ReactNode } from "react"

import type { Column } from "@/components/organisms/DataTable/types"
import type { Ticket, TicketProblem, TicketStatus } from "@/types/ticket"
import { ScoreBadge, TicketStatusBadge } from "./tableComponents/badge"

import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked"
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
  "block truncate rounded-md px-3 py-1 text-sm font-medium text-gray-900 transition-colors hover:bg-[#F0DDFD]"

function getProblemIcon(problem: TicketProblem): ReactNode {
  const iconStyle = { fontSize: 20, color: "#A855F7" }

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
  responsibleOptions: string[]
): Column<Ticket>[] {
  return [
    {
      key: "open",
      header: "",
      minWidth: "34px",
      render: () => (
        <RadioButtonUncheckedIcon sx={{ fontSize: 17, color: "#111827" }} />
      ),
    },
    {
      key: "id",
      header: "ID Ticket",
      minWidth: "145px",
      render: ticket => (
        <button
          type="button"
          className={`${idButtonClassName} max-w-[145px]`}
          title={ticket.id}
        >
          {ticket.id}
        </button>
      ),
    },
    {
      key: "client",
      header: "Cliente",
      minWidth: "145px",
      render: ticket => (
        <button
          type="button"
          className={`${idButtonClassName} max-w-[145px]`}
          title={ticket.client}
        >
          {ticket.client}
        </button>
      ),
    },
    {
      key: "orderId",
      header: "Pedido",
      minWidth: "135px",
      render: ticket => (
        <button
          type="button"
          className={`${idButtonClassName} max-w-[135px]`}
          title={ticket.orderId}
        >
          {ticket.orderId}
        </button>
      ),
    },
    {
      key: "responsible",
      header: "Responsavel Ticket",
      minWidth: "155px",
      filter: {
        type: "select",
        label: "Responsavel",
        options: responsibleOptions,
        filterFn: (ticket, value) => ticket.responsible.name === value,
      },
      render: ticket => (
        <button
          type="button"
          className="flex max-w-[155px] items-center gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-[#F0DDFD]"
          title={ticket.responsible.name}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F0DDFD] text-xs text-[#6F2B90]">
            {ticket.responsible.initials}
          </span>

          <span className="truncate text-sm font-medium text-gray-900">
            {ticket.responsible.name}
          </span>
        </button>
      ),
    },
    {
      key: "problem",
      header: "Problema",
      minWidth: "115px",
      filter: {
        type: "select",
        label: "Problema",
        options: ALL_PROBLEMS,
        filterFn: (ticket, value) => ticket.problem === value,
      },
      render: ticket => (
        <div className="flex items-center gap-2">
          {getProblemIcon(ticket.problem)}
          <span className="text-sm font-medium text-gray-900">
            {ticket.problem}
          </span>
        </div>
      ),
    },
    {
      key: "openedAt",
      header: "Data abertura",
      minWidth: "140px",
      render: ticket => (
        <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-gray-900">
                {formatTicketDate(ticket.openedAt)}
            </span>

            <span className="text-xs font-medium text-gray-500">
                {formatTicketTime(ticket.openedAt)}
            </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      minWidth: "125px",
      filter: {
        type: "select",
        label: "Status",
        options: ALL_STATUSES,
        filterFn: (ticket, value) => ticket.status === value,
      },
      render: ticket => <TicketStatusBadge status={ticket.status} />,
    },
    {
      key: "score",
      header: "Nota",
      minWidth: "90px",
      filter: {
        type: "select",
        label: "Nota",
        options: ALL_SCORES,
        filterFn: (ticket, value) => {
          if (value === "Sem avaliação") {
            return ticket.score === null
          }

          return ticket.score === Number(value)
        },
      },
      render: ticket => (
        <div className="flex items-center gap-2">
          <ScoreBadge score={ticket.score} />

          {ticket.score === null && (
            <span className="inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-[#F0DDFD] text-[#6B4A7A] whitespace-nowrap">
              Sem avaliação
            </span>
          )}
        </div>
      ),
    },
    {
      key: "forward",
      header: "",
      minWidth: "36px",
      render: () => (
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D1B1E5] bg-[#F7EBFF] transition-colors hover:bg-[#F0DDFD]"
        >
          <ArrowForwardIcon sx={{ fontSize: 20, color: "#111827" }} />
        </button>
      ),
    },
  ]
}