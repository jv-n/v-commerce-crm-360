import type { Product, ProductCategory, ProductState } from "@/types/product"

export interface ProductsPage {
  data: Product[]
  total: number
  page: number
  pageSize: number
}

export interface ProductsParams {
  page?: number
  pageSize?: number
  search?: string
  category?: string
  status?: string
  uf?: string
  price_min?: number
  price_max?: number
  stock_min?: number
  stock_max?: number
  rating_min?: number
  rating_max?: number
  sales_min?: number
  sales_max?: number
  date_from?: string
  date_to?: string
  sort_by?: string
  sort_dir?: "asc" | "desc"
}

interface RawProduct {
  id: string
  name: string
  price: number | null
  supplier: string | null
  weight_kg: number | null
  stock: number
  category: string | null
  status: string | null
  uf: string | null
  created_at: string | null
  rating: number | null
  total_sales: number | null
}

const VALID_CATEGORIES = new Set<ProductCategory>([
  "Automotivo", "Beleza", "Brinquedos", "Casa", "Eletronicos",
  "Esportes", "Indefinida", "Moveis", "Vestuario",
])

const VALID_STATES = new Set<ProductState>(["Ativo", "Novo", "Inativo", "Descontinuado"])

function toProduct(raw: RawProduct): Product {
  return {
    id: raw.id,
    name: raw.name,
    category: VALID_CATEGORIES.has(raw.category as ProductCategory)
      ? (raw.category as ProductCategory)
      : "Indefinida",
    price: raw.price,
    supplier: raw.supplier ?? null,
    weightKg: raw.weight_kg ?? null,
    stock: raw.stock,
    rating: raw.rating ?? 0,
    totalSales: raw.total_sales ?? 0,
    state: VALID_STATES.has(raw.status as ProductState)
      ? (raw.status as ProductState)
      : "Inativo",
    uf: raw.uf ?? "",
    createdAt: raw.created_at ?? "",
  }
}

export interface ProductCreatePayload {
  name: string
  category?: string
  price?: number | null
  supplier?: string | null
  weight_kg?: number | null
  stock?: number
  status?: string
}

export interface ProductOrder {
  id_pedido: string
  id_cliente: string | null
  nome_cliente: string | null
  data_pedido: string | null
  status: string | null
  valor_pedido: number | null
  metodo_pagamento: string | null
  quantidade: number | null
}

export interface ProductTicket {
  ticket_id: string
  id_pedido: string | null
  tipo_problema: string | null
  data_abertura: string | null
  data_resolucao: string | null
  resolvido: boolean
  agente_suporte: string | null
  nota_avaliacao: number | null
}

export interface MonthlyRevenue {
  ano_mes: string
  receita: number
}

export async function fetchProductById(id: string): Promise<Product> {
  const res = await fetch(`/api/products/${id}`)
  if (!res.ok) throw new Error(`Produto não encontrado: ${res.status}`)
  return toProduct(await res.json() as RawProduct)
}

export async function fetchProductOrders(id: string): Promise<ProductOrder[]> {
  const res = await fetch(`/api/products/${id}/orders`)
  if (!res.ok) throw new Error(`Erro ao buscar pedidos: ${res.status}`)
  return res.json()
}

export async function fetchProductTickets(id: string): Promise<ProductTicket[]> {
  const res = await fetch(`/api/products/${id}/tickets`)
  if (!res.ok) throw new Error(`Erro ao buscar tickets: ${res.status}`)
  return res.json()
}

export async function fetchProductMonthlyRevenue(id: string): Promise<MonthlyRevenue[]> {
  const res = await fetch(`/api/products/${id}/monthly-revenue`)
  if (!res.ok) throw new Error(`Erro ao buscar receita: ${res.status}`)
  return res.json()
}

export async function fetchSuppliers(): Promise<string[]> {
  const res = await fetch("/api/products/suppliers")
  if (!res.ok) throw new Error(`Erro ao buscar fornecedores: ${res.status}`)
  return res.json()
}

export async function createProduct(payload: ProductCreatePayload): Promise<Product> {
  const res = await fetch("/api/products/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload.name,
      category: payload.category ?? null,
      price: payload.price ?? null,
      supplier: payload.supplier ?? null,
      weight_kg: payload.weight_kg ?? null,
      stock: payload.stock ?? 0,
      status: payload.status ?? "Ativo",
    }),
  })
  if (!res.ok) throw new Error(`Erro ao criar produto: ${res.status}`)
  return toProduct(await res.json() as RawProduct)
}

export interface ProductUpdatePayload {
  name?: string
  category?: string | null
  price?: number | null
  supplier?: string | null
  weight_kg?: number | null
  stock?: number
  status?: string
}

export interface ProductResumo {
  receita_total: number | null
  melhor_mes: string | null
  metodo_pagamento_favorito: string | null
  problema_mais_frequente: string | null
}

export async function fetchProductResumo(id: string): Promise<ProductResumo> {
  const res = await fetch(`/api/products/${id}/resumo`)
  if (!res.ok) throw new Error(`Erro ao buscar resumo: ${res.status}`)
  return res.json()
}

export interface ProductActivity {
  id: number
  id_produto: string
  user_name: string
  field_name: string
  old_value: string | null
  new_value: string | null
  change_method: string
  changed_at: string
}

export async function updateProduct(
  id: string,
  payload: ProductUpdatePayload,
  userName = "Sistema",
): Promise<Product> {
  const res = await fetch(`/api/products/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-User-Name": userName,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Erro ao atualizar produto: ${res.status}`)
  return toProduct(await res.json() as RawProduct)
}

export async function fetchProductActivities(id: string, limit = 50): Promise<ProductActivity[]> {
  const res = await fetch(`/api/products/${id}/activities?limit=${limit}`)
  if (!res.ok) throw new Error(`Erro ao buscar atividades: ${res.status}`)
  return res.json()
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`Erro ao remover produto: ${res.status}`)
}

export async function fetchProducts(params: ProductsParams = {}): Promise<ProductsPage> {
  const query = new URLSearchParams({
    page:     String(params.page     ?? 1),
    pageSize: String(params.pageSize ?? 10),
  })

  if (params.search)             query.set("search",     params.search)
  if (params.category)           query.set("category",   params.category)
  if (params.status)             query.set("status",     params.status)
  if (params.uf)                 query.set("uf",         params.uf)
  if (params.price_min  != null) query.set("price_min",  String(params.price_min))
  if (params.price_max  != null) query.set("price_max",  String(params.price_max))
  if (params.stock_min  != null) query.set("stock_min",  String(params.stock_min))
  if (params.stock_max  != null) query.set("stock_max",  String(params.stock_max))
  if (params.rating_min != null) query.set("rating_min", String(params.rating_min))
  if (params.rating_max != null) query.set("rating_max", String(params.rating_max))
  if (params.sales_min  != null) query.set("sales_min",  String(params.sales_min))
  if (params.sales_max  != null) query.set("sales_max",  String(params.sales_max))
  if (params.date_from)          query.set("date_from",  params.date_from)
  if (params.date_to)            query.set("date_to",    params.date_to)
  if (params.sort_by)            query.set("sort_by",    params.sort_by)
  if (params.sort_dir)           query.set("sort_dir",   params.sort_dir)

  const res = await fetch(`/api/products?${query}`)
  if (!res.ok) throw new Error(`Erro ao buscar produtos: ${res.status}`)

  const json = await res.json()
  return {
    data:     (json.data as RawProduct[]).map(toProduct),
    total:    json.total,
    page:     json.page,
    pageSize: json.pageSize,
  }
}
