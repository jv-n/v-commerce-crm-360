export type TicketStatus = "Finalizado" | "Em atendimento" | "Aguardando"

export type TicketProblem = "Produto" | "Entrega" | "Pagamento" | "Reembolso"

export type TicketEvaluationStatus =
  | "Solucionado"
  | "Não Solucionado"
  | "Sem avaliação"
  | "Não respondido"

export interface Ticket {
  id: string
  client: string
  orderId: string
  responsible: {
    initials: string
    name: string
  }
  problem: TicketProblem
  status: TicketStatus
  evaluation: {
    label: TicketEvaluationStatus
    score?: number
  }
}