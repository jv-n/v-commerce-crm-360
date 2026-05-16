import type { Ticket, TicketProblem, TicketStatus } from "@/types/ticket"

interface TicketApi {
  ticket_id: string
  id_cliente: string | null
  status_atendimento: TicketStatus | null
  tipo_problema: TicketProblem | null
  data_abertura: string | null
  hora_abertura: string | null
  agente_suporte: string | null
  nome_cliente: string | null
  regiao_cliente: string | null
  estado_cliente: string | null
  faixa_etaria: string | null
  id_pedido: string | null
  tempo_resolucao_horas: number | null
  nota_avaliacao: number | null
  timestamp_ingestion: string | null
  resolvido?: "True" | "False" | null
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
  search?: string
  responsible?: string[]
  status?: string[]
  problem?: string[]
  score?: string[]
  openedFrom?: string
  openedTo?: string
  sortKey?: string
  sortDir?: "asc" | "desc"
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

function normalizeStatus(status?: string | null): TicketStatus {
  if (status === "Finalizado") {
    return "Finalizado"
  }

  if (status === "Em atendimento") {
    return "Em atendimento"
  }

  return "Aguardando"
}

function normalizeProblem(problem?: string | null): TicketProblem {
  if (
    problem === "Produto" ||
    problem === "Entrega" ||
    problem === "Pagamento" ||
    problem === "Reembolso"
  ) {
    return problem
  }

  return "Produto"
}

function mapTicketFromApi(ticket: TicketApi): Ticket {
  const responsibleName = ticket.agente_suporte?.trim() || "Não informado"

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
    problem: normalizeProblem(ticket.tipo_problema),
    status: normalizeStatus(ticket.status_atendimento),
    score: ticket.nota_avaliacao,

    region: ticket.regiao_cliente || "Não informado",
    state: ticket.estado_cliente || "Não informado",
    ageRange: ticket.faixa_etaria || "Não informado",
    resolutionTimeHours: ticket.tempo_resolucao_horas,
    ingestionTimestamp: ticket.timestamp_ingestion || "",
  }
}

function appendArrayParam(
  queryParams: URLSearchParams,
  key: string,
  values?: string[]
) {
  values?.forEach(value => {
    if (value) {
      queryParams.append(key, value)
    }
  })
}

export async function fetchTickets(params: TicketsParams): Promise<TicketsPage> {
  const queryParams = new URLSearchParams()

  queryParams.set("page", String(params.page))
  queryParams.set("pageSize", String(params.pageSize))

  if (params.search) {
    queryParams.set("search", params.search)
  }

  if (params.openedFrom) {
    queryParams.set("openedFrom", params.openedFrom)
  }

  if (params.openedTo) {
    queryParams.set("openedTo", params.openedTo)
  }

  if (params.sortKey) {
    queryParams.set("sortKey", params.sortKey)
  }

  if (params.sortDir) {
    queryParams.set("sortDir", params.sortDir)
  }

  appendArrayParam(queryParams, "responsible", params.responsible)
  appendArrayParam(queryParams, "problem", params.problem)
  appendArrayParam(queryParams, "status", params.status)
  appendArrayParam(queryParams, "score", params.score)

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