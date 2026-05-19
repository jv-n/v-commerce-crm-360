import type { Sale, SaleStatus } from "@/types/sale"

export interface SalesPage {
  data: Sale[]
  total: number
  page: number
  pageSize: number
}

interface SalesParams {
  page: number
  pageSize: number
  tab: string
  status?: string
  metodo_pagamento?: string
  categoria?: string
  data_from?: string
  data_to?: string
  search?: string
  search_field?: string
  nome_cliente?: string
  nome_produto?: string
  sortKey?: string
  sortDir?: "asc" | "desc"
}

interface RawSale {
  id_pedido: string
  nome_produto: string | null
  nome_cliente: string | null
  categoria: string | null
  quantidade: number | null
  valor_pedido: number | null
  data_pedido: string | null
  metodo_pagamento: string | null
  status: string | null
}

const VALID_STATUSES = new Set<SaleStatus>([
  "Aprovado", "Processando", "Recusado", "Reembolsado",
  "Em rota", "Entregue", "Entregue com Atraso", "Cancelado",
])

function formatDate(raw: string | null): string {
  if (!raw) return ""
  try {
    const [y, m, d] = raw.split("-")
    return `${d}/${m}/${y}`
  } catch {
    return raw
  }
}

function toSale(raw: RawSale): Sale {
  return {
    id:             raw.id_pedido,
    product:        raw.nome_produto ?? "",
    client:         raw.nome_cliente ?? "",
    categoria:      raw.categoria,
    amount:         raw.quantidade ?? 0,
    value:          raw.valor_pedido ?? 0,
    date:           formatDate(raw.data_pedido),
    status:         VALID_STATUSES.has(raw.status as SaleStatus)
                      ? (raw.status as SaleStatus)
                      : "Processando",
    payment_method: raw.metodo_pagamento ?? "",
  }
}

export interface SaleFormData {
  id_cliente?:      string
  id_produto?:      string
  nome_cliente:     string
  nome_produto:     string
  categoria:        string
  quantidade:       number
  valor_pedido:     number
  metodo_pagamento: string
  status:           string
  data_pedido:      string
}

export interface SaleUpdateData {
  nome_cliente?:     string
  nome_produto?:     string
  categoria?:        string
  quantidade?:       number
  valor_pedido?:     number
  metodo_pagamento?: string
  status?:           string
  data_pedido?:      string
}

export async function updateSale(id: string, data: SaleUpdateData, userName = "Sistema"): Promise<void> {
  const res = await fetch(`/api/sales/${id}`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json", "X-User-Name": userName },
    body:    JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Erro ao atualizar pedido: ${res.status}`)
}

export interface SaleActivity {
  id:            number
  id_pedido:     string
  user_name:     string
  field_name:    string
  old_value:     string | null
  new_value:     string | null
  change_method: string
  changed_at:    string
}

export async function fetchSaleActivities(id: string, limit = 50): Promise<SaleActivity[]> {
  const res = await fetch(`/api/sales/${id}/activities?limit=${limit}`)
  if (!res.ok) throw new Error(`Erro ao buscar histórico: ${res.status}`)
  return res.json()
}

export async function createSale(data: SaleFormData): Promise<void> {
  const [y, m] = data.data_pedido.split("-")
  const body = {
    id_pedido:     crypto.randomUUID(),
    ano_mes:       `${y}-${m}`,
    receita_bruta: data.valor_pedido,
    ...data,
  }
  const res = await fetch("/api/sales/", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Erro ao criar pedido: ${res.status}`)
}

export async function fetchSales(params: SalesParams): Promise<SalesPage> {
  const query = new URLSearchParams({
    page:     String(params.page),
    pageSize: String(params.pageSize),
    tab:      params.tab,
    ...(params.status           ? { status:           params.status           } : {}),
    ...(params.metodo_pagamento ? { metodo_pagamento: params.metodo_pagamento } : {}),
    ...(params.categoria        ? { categoria:        params.categoria        } : {}),
    ...(params.data_from        ? { data_from:        params.data_from        } : {}),
    ...(params.data_to          ? { data_to:          params.data_to          } : {}),
    ...(params.search           ? { search:           params.search           } : {}),
    ...(params.search_field && params.search_field !== "all" ? { search_field: params.search_field } : {}),
    ...(params.nome_cliente     ? { nome_cliente:     params.nome_cliente     } : {}),
    ...(params.nome_produto     ? { nome_produto:     params.nome_produto     } : {}),
    ...(params.sortKey          ? { sort_key:         params.sortKey          } : {}),
    ...(params.sortDir          ? { sort_dir:         params.sortDir          } : {}),
  })

  const res = await fetch(`/api/sales/?${query}`)
  if (!res.ok) throw new Error(`Erro ao buscar pedidos: ${res.status}`)

  const json = await res.json()
  return {
    data:     (json.data as RawSale[]).map(toSale),
    total:    json.total,
    page:     json.page,
    pageSize: json.pageSize,
  }
}
