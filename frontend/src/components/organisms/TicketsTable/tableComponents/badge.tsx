import type {TicketStatus } from "@/types/ticket"

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const styles: Record<TicketStatus, string> = {
    "Finalizado": "bg-[#CFF5C2] text-[#267A2B]",
    "Em atendimento": "bg-[#FFF1B8] text-[#B99022]",
    "Aguardando": "bg-[#FFE7EA] text-[#E5394F]",
  }

  const dotStyles: Record<TicketStatus, string> = {
    "Finalizado": "bg-[#34A853]",
    "Em atendimento": "bg-[#E8B931]",
    "Aguardando": "bg-[#FF5A6E]",
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-[9.38px] font-medium ${styles[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[status]}`} />
      {status}
    </span>
  )
}

export function ScoreBadge({ score }: { score?: number | null }) {
  if (score === undefined || score === null) return null

  const style =
    score <= 1
      ? "bg-[#FF8B94] text-[#9B1C2E]"
      : score <= 3
        ? "bg-[#FFF176] text-[#8A6D00]"
        : "bg-[#CFF5C2] text-[#267A2B]"

  return (
    <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${style}`}>
      {score}
    </span>
  )
}