import type { Ticket, TicketProblem, TicketStatus, TicketEvaluationStatus } from "@/types/ticket"
import { mockTickets } from "@/lib/mocks/tickets"

export interface TicketsPage {
  data: Ticket[]
  total: number
  page: number
  pageSize: number
}

interface TicketsParams {
  page: number
  pageSize: number
  tab: string
  responsible?: string
  status?: string
  problem?: string
  evaluation?: string
}

function repeatMockData(): Ticket[] {
  return Array.from({ length: 100 }, (_, index) => {
    const ticket = mockTickets[index % mockTickets.length]

    return {
      ...ticket,
      id: `${ticket.id}-${index + 1}`,
    }
  })
}

export async function fetchTickets(params: TicketsParams): Promise<TicketsPage> {
  const allTickets = repeatMockData()

  let filtered = allTickets

  if (params.tab === "contacts") {
    filtered = filtered
  }

  if (params.tab === "clients") {
    filtered = filtered
  }

  if (params.tab === "leads") {
    filtered = filtered
  }

  if (params.responsible) {
    filtered = filtered.filter(ticket => ticket.responsible.name === params.responsible)
  }

  if (params.status) {
    filtered = filtered.filter(ticket => ticket.status === params.status as TicketStatus)
  }

  if (params.problem) {
    filtered = filtered.filter(ticket => ticket.problem === params.problem as TicketProblem)
  }

  if (params.evaluation) {
    filtered = filtered.filter(ticket => ticket.evaluation.label === params.evaluation as TicketEvaluationStatus)
  }

  const start = (params.page - 1) * params.pageSize
  const end = start + params.pageSize

  await new Promise(resolve => setTimeout(resolve, 300))

  return {
    data: filtered.slice(start, end),
    total: filtered.length,
    page: params.page,
    pageSize: params.pageSize,
  }
}