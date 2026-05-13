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

const VALID_STATUSES = new Set<SaleStatus>(["Aprovado", "Processando", "Recusado", "Reembolsado"])

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
                      : "Aprovado",
    payment_method: raw.metodo_pagamento ?? "",
  }
}

export async function fetchSales(params: SalesParams): Promise<SalesPage> {
  const query = new URLSearchParams({
    page:     String(params.page),
    pageSize: String(params.pageSize),
    tab:      params.tab,
    ...(params.status           ? { status:           params.status           } : {}),
    ...(params.metodo_pagamento ? { metodo_pagamento: params.metodo_pagamento } : {}),
    ...(params.categoria        ? { categoria:        params.categoria        } : {}),
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
