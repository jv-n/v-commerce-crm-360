import type {
  ContactDetails,
  ContactMetrics,
  ContactOrdersPage,
  ContactTicketsPage,
  ContactViewedProduct,
} from "@/types/contactDetails"

interface PageParams {
  page?: number
  pageSize?: number
}

function buildPageQuery(params?: PageParams) {
  const query = new URLSearchParams()

  query.set("page", String(params?.page ?? 1))
  query.set("pageSize", String(params?.pageSize ?? 10))

  return query.toString()
}

export async function fetchContactDetails(id: string): Promise<ContactDetails> {
  const res = await fetch(`/api/contacts/${id}/details`)

  if (!res.ok) {
    throw new Error(`Erro ao buscar detalhes do contato: ${res.status}`)
  }

  return res.json() as Promise<ContactDetails>
}

export async function fetchContactMetrics(
  id: string,
  anoMes?: string
): Promise<ContactMetrics> {
  const query = new URLSearchParams()

  if (anoMes) {
    query.set("ano_mes", anoMes)
  }

  const suffix = query.toString() ? `?${query.toString()}` : ""
  const res = await fetch(`/api/contacts/${id}/metrics${suffix}`)

  if (!res.ok) {
    throw new Error(`Erro ao buscar métricas do contato: ${res.status}`)
  }

  return res.json() as Promise<ContactMetrics>
}

export async function fetchContactOrders(
  id: string,
  params?: PageParams
): Promise<ContactOrdersPage> {
  const query = buildPageQuery(params)
  const res = await fetch(`/api/contacts/${id}/orders?${query}`)

  if (!res.ok) {
    throw new Error(`Erro ao buscar pedidos do contato: ${res.status}`)
  }

  return res.json() as Promise<ContactOrdersPage>
}

export async function fetchContactTickets(
  id: string,
  params?: PageParams
): Promise<ContactTicketsPage> {
  const query = buildPageQuery(params)
  const res = await fetch(`/api/contacts/${id}/tickets?${query}`)

  if (!res.ok) {
    throw new Error(`Erro ao buscar tickets do contato: ${res.status}`)
  }

  return res.json() as Promise<ContactTicketsPage>
}

export async function fetchContactViewedProducts(
  id: string
): Promise<ContactViewedProduct[]> {
  const res = await fetch(`/api/contacts/${id}/viewed-products`)

  if (!res.ok) {
    throw new Error(`Erro ao buscar produtos visualizados: ${res.status}`)
  }

  return res.json() as Promise<ContactViewedProduct[]>
}