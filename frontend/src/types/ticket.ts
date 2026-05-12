export type TicketStatus = "Finalizado" | "Em atendimento" | "Aguardando"

export type TicketProblem = "Produto" | "Entrega" | "Pagamento" | "Reembolso"

export interface Ticket {
  id: string
  client: string
  clientId: string
  orderId: string
  openedAt: string
  responsible: {
    initials: string
    name: string
  }
  problem: TicketProblem
  status: TicketStatus
  score: number | null
}