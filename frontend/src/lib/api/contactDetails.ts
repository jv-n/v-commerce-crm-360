import type {
  ContactDashboard,
  ContactDetails,
  ContactMetrics,
  ContactOrdersPage,
  ContactPeriod,
  ContactTicketsPage,
  ContactViewedProduct,
} from "@/types/contactDetails"

interface PageParams {
  page?: number
  pageSize?: number
  period?: ContactPeriod
}

function buildQuery(params: Record<string, string | number | undefined | null>) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value))
    }
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ""
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Erro na requisição ${url}: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function fetchContactDetails(
  contactId: string
): Promise<ContactDetails> {
  return getJson<ContactDetails>(`/api/contact-details/${contactId}/details`)
}

export async function fetchContactDashboard(
  contactId: string,
  params: PageParams = {}
): Promise<ContactDashboard> {
  const query = buildQuery({
    period: params.period ?? "current_month",
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 5,
  })

  return getJson<ContactDashboard>(
    `/api/contact-details/${contactId}/dashboard${query}`
  )
}

export async function fetchContactMetrics(
  contactId: string,
  period: ContactPeriod = "current_month"
): Promise<ContactMetrics> {
  const query = buildQuery({ period })

  return getJson<ContactMetrics>(
    `/api/contact-details/${contactId}/metrics${query}`
  )
}

export async function fetchContactOrders(
  contactId: string,
  params: PageParams = {}
): Promise<ContactOrdersPage> {
  const query = buildQuery({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    period: params.period ?? "current_month",
  })

  return getJson<ContactOrdersPage>(
    `/api/contact-details/${contactId}/orders${query}`
  )
}

export async function fetchContactTickets(
  contactId: string,
  params: PageParams = {}
): Promise<ContactTicketsPage> {
  const query = buildQuery({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    period: params.period ?? "current_month",
  })

  return getJson<ContactTicketsPage>(
    `/api/contact-details/${contactId}/tickets${query}`
  )
}

export async function fetchContactViewedProducts(
  contactId: string,
  period: ContactPeriod = "current_month"
): Promise<ContactViewedProduct[]> {
  const query = buildQuery({ period })

  return getJson<ContactViewedProduct[]>(
    `/api/contact-details/${contactId}/viewed-products${query}`
  )
}