import type { Ticket, TicketProblem, TicketStatus } from "@/types/ticket"

interface TicketApi {
  ticket_id: string
  id_cliente: string | null
  nome_cliente: string | null
  id_pedido: string | null
  tipo_problema: TicketProblem | null
  data_abertura: string | null
  data_resolucao: string | null
  tempo_resolucao_minutos: number | null
  tempo_resolucao_horas: number | null
  agente_suporte: string | null
  nota_avaliacao: number | null
  resolvido: "True" | "False" | null
  hora_abertura: number | null
  dia_semana_abertura: string | null
}

interface TicketsApiResponse {
  data: TicketApi[]
  total: number
  page: number
  pageSize: number
}

export interface TicketsPage {
  data: Ticket[]
  total: number
  page: number
  pageSize: number
}

interface TicketsParams {
  page: number
  pageSize: number
  tab?: string
  search?: string
  responsible?: string
  status?: string
  problem?: string
  score?: string
}

const API_BASE_URL = "http://127.0.0.1:8000"

function getInitials(name?: string | null) {
  if (!name) return "NI"

  const parts = name.trim().split(" ")

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function mapStatus(
  resolvido: TicketApi["resolvido"],
  agenteSuporte: string | null
): TicketStatus {
  if (resolvido === "True") {
    return "Finalizado"
  }

  if (resolvido === "False" && agenteSuporte?.trim()) {
    return "Em atendimento"
  }

  return "Aguardando"
}

function mapTicketFromApi(ticket: TicketApi): Ticket {
  const responsibleName = ticket.agente_suporte || "Não informado"

  return {
    id: ticket.ticket_id,
    client: ticket.nome_cliente || "Cliente não informado",
    clientId: ticket.id_cliente || "ID não informado",
    orderId: ticket.id_pedido || "Pedido não informado",
    openedAt: ticket.data_abertura || "",
    responsible: {
      initials: getInitials(responsibleName),
      name: responsibleName,
    },
    problem: ticket.tipo_problema || "Produto",
    status: mapStatus(ticket.resolvido, ticket.agente_suporte),
    score: ticket.nota_avaliacao,
  }
}

export async function fetchTickets(params: TicketsParams): Promise<TicketsPage> {
  const queryParams = new URLSearchParams()

  queryParams.set("page", String(params.page))
  queryParams.set("pageSize", String(params.pageSize))

  if (params.search) {
    queryParams.set("search", params.search)
  }

  if (params.responsible) {
    queryParams.set("responsible", params.responsible)
  }

  if (params.problem) {
    queryParams.set("problem", params.problem)
  }

  if (params.status) {
    queryParams.set("status", params.status)
  }

  if (params.score) {
    queryParams.set("score", params.score)
  }

  const response = await fetch(
    `${API_BASE_URL}/tickets/?${queryParams.toString()}`
  )

  if (!response.ok) {
    throw new Error("Erro ao buscar tickets")
  }

  const result: TicketsApiResponse = await response.json()

  return {
    data: result.data.map(mapTicketFromApi),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  }
}

export async function fetchTicketResponsibles(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/tickets/responsibles`)

  if (!response.ok) {
    throw new Error("Erro ao buscar responsáveis dos tickets")
  }

  return response.json()
}