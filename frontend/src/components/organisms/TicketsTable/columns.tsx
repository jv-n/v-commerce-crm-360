import type { Column } from "@/components/organisms/DataTable/types"
import type { Ticket, TicketEvaluationStatus, TicketProblem, TicketStatus } from "@/types/ticket"
import { EvaluationBadge, ScoreBadge, TicketStatusBadge } from "./tableComponents/badge"

import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked"
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined"
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined"
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined"
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined"

const ALL_RESPONSIBLES = ["Luana Ferragut"]

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

const ALL_EVALUATIONS: TicketEvaluationStatus[] = [
  "Solucionado",
  "Não Solucionado",
  "Sem avaliação",
  "Não respondido",
]

function ProblemIcon({ problem }: { problem: TicketProblem }) {
  const iconStyle = { fontSize: 20, color: "#A855F7" }

  const icons: Record<TicketProblem, JSX.Element> = {
    Produto: <ShoppingCartOutlinedIcon sx={iconStyle} />,
    Entrega: <LocalShippingOutlinedIcon sx={iconStyle} />,
    Pagamento: <PaymentsOutlinedIcon sx={iconStyle} />,
    Reembolso: <ReplayOutlinedIcon sx={iconStyle} />,
  }

  return icons[problem]
}

export const ticketColumns: Column<Ticket>[] = [
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
    minWidth: "160px",
    render: ticket => (
      <span className="font-medium text-gray-900 truncate block max-w-[160px]">
        {ticket.id}
      </span>
    ),
  },
  {
    key: "client",
    header: "Cliente",
    minWidth: "170px",
    render: ticket => (
      <span className="font-medium text-gray-900 truncate block max-w-[170px]">
        {ticket.client}
      </span>
    ),
  },
  {
    key: "orderId",
    header: "Pedido",
    minWidth: "140px",
    render: ticket => (
      <span className="font-medium text-gray-900 truncate block max-w-[140px]">
        {ticket.orderId}
      </span>
    ),
  },
  {
    key: "responsible",
    header: "Responsavel Ticket",
    minWidth: "170px",
    filter: {
      type: "select",
      label: "Responsavel",
      options: ALL_RESPONSIBLES,
      filterFn: (ticket, value) => ticket.responsible.name === value,
    },
    render: ticket => (
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F0DDFD] text-xs text-[#6F2B90]">
          {ticket.responsible.initials}
        </span>
        <span className="text-sm font-medium text-gray-900">
          {ticket.responsible.name}
        </span>
      </div>
    ),
  },
  {
    key: "problem",
    header: "Problema",
    minWidth: "130px",
    filter: {
      type: "select",
      label: "Problema",
      options: ALL_PROBLEMS,
      filterFn: (ticket, value) => ticket.problem === value,
    },
    filterOptional: true,
    render: ticket => (
      <div className="flex items-center gap-2">
        <ProblemIcon problem={ticket.problem} />
        <span className="text-sm font-medium text-gray-900">
          {ticket.problem}
        </span>
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    minWidth: "150px",
    filter: {
      type: "select",
      label: "Status",
      options: ALL_STATUSES,
      filterFn: (ticket, value) => ticket.status === value,
    },
    filterOptional: true,
    render: ticket => <TicketStatusBadge status={ticket.status} />,
  },
  {
    key: "evaluation",
    header: "Avaliação",
    minWidth: "190px",
    filter: {
      type: "select",
      label: "Avaliação",
      options: ALL_EVALUATIONS,
      filterFn: (ticket, value) => ticket.evaluation.label === value,
    },
    filterOptional: true,
    render: ticket => (
      <div className="flex items-center gap-2">
        <EvaluationBadge label={ticket.evaluation.label} />
        <ScoreBadge score={ticket.evaluation.score} />
      </div>
    ),
  },
  {
    key: "forward",
    header: "",
    minWidth: "40px",
    render: () => (
      <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D1B1E5] bg-[#F7EBFF] hover:bg-[#F0DDFD] transition-colors">
        <ArrowForwardIcon sx={{ fontSize: 20, color: "#111827" }} />
      </button>
    ),
  },
]