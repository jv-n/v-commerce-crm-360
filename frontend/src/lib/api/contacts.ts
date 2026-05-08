import type { Contact, ContactStatus, EngagementType } from "@/types/contact"

export interface ContactsPage {
  data: Contact[]
  total: number
  page: number
  pageSize: number
}

interface ContactsParams {
  page: number
  pageSize: number
  tab: string
  search?: string
  status?: string
  purchasesMin?: number | null
  purchasesMax?: number | null
  createdYear?: string
  engagement?: string
  sortBy?: string | null
  sortDir?: "asc" | "desc"
  excludeInactive?: boolean
}

interface RawContact {
  id: string
  name: string | null
  status: string | null
  email: string | null
  phone: string | null
  lastPurchase: string | null
  purchases: number
  engagement: string
  engagementScore: number
  createdAt: string | null
}

const VALID_STATUSES = new Set<ContactStatus>([
  "Cliente Ativo", "Cliente VIP", "Em risco", "Lead", "Cliente Inativo", "Desativado",
])

const VALID_ENGAGEMENTS = new Set<EngagementType>(["Promotor", "Neutro", "Detrator", "Nenhum NPS"])

function toContact(raw: RawContact): Contact {
  return {
    id: raw.id,
    name: raw.name,
    status: VALID_STATUSES.has(raw.status as ContactStatus) ? (raw.status as ContactStatus) : null,
    email: raw.email,
    phone: raw.phone,
    lastPurchase: raw.lastPurchase,
    purchases: raw.purchases,
    engagement: VALID_ENGAGEMENTS.has(raw.engagement as EngagementType)
      ? (raw.engagement as EngagementType)
      : "Nenhum NPS",
    engagementScore: raw.engagementScore,
    createdAt: raw.createdAt,
  }
}

export interface ContactFormData {
  name: string
  email?: string
  phone?: string
  status: string
}

export async function createContact(data: ContactFormData): Promise<Contact> {
  const res = await fetch("/api/contacts/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Erro ao criar contato: ${res.status}`)
  return toContact(await res.json() as RawContact)
}

export async function updateContact(id: string, data: Partial<ContactFormData>): Promise<Contact> {
  const res = await fetch(`/api/contacts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Erro ao atualizar contato: ${res.status}`)
  return toContact(await res.json() as RawContact)
}

export async function fetchContacts(params: ContactsParams): Promise<ContactsPage> {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    tab: params.tab,
    ...(params.search                  ? { search:        params.search                        } : {}),
    ...(params.status                  ? { status:        params.status                        } : {}),
    ...(params.purchasesMin != null    ? { purchases_min: String(params.purchasesMin)          } : {}),
    ...(params.purchasesMax != null    ? { purchases_max: String(params.purchasesMax)          } : {}),
    ...(params.createdYear             ? { created_year:  params.createdYear                   } : {}),
    ...(params.engagement              ? { engagement:    params.engagement                     } : {}),
    ...(params.sortBy                  ? { sort_by:          params.sortBy                      } : {}),
    ...(params.sortBy && params.sortDir ? { sort_dir:        params.sortDir                     } : {}),
    ...(params.excludeInactive === false ? { exclude_inactive: "false" }                        : {}),
  })

  const res = await fetch(`/api/contacts/?${query}`)
  if (!res.ok) throw new Error(`Erro ao buscar contatos: ${res.status}`)

  const json = await res.json()
  return {
    data: (json.data as RawContact[]).map(toContact),
    total: json.total,
    page: json.page,
    pageSize: json.pageSize,
  }
}
