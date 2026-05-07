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
  date_from?: string
  date_to?: string
}

interface RawProduct {
  id: number
  name: string
  description: string | null
  price: number | null
  stock: number
  category: { id: number; name: string } | null
  status: string | null
  uf: string | null
  created_at: string | null
  rating: number | null
  total_sales: number | null
}

const VALID_CATEGORIES = new Set<ProductCategory>([
  "Perfumaria", "Artes", "Esportes", "Infantil", "Utilidades",
  "Instrumentos", "Derivados", "Mobiliário", "Eletrodomésticos",
  "Construção", "Alimentos", "Saúde", "Tecnologia",
])

const VALID_STATES = new Set<ProductState>(["Ativo", "Novo", "Inativo", "Descontinuado"])

function toProduct(raw: RawProduct): Product {
  return {
    id: String(raw.id),
    name: raw.name,
    category: VALID_CATEGORIES.has(raw.category?.name as ProductCategory)
      ? (raw.category!.name as ProductCategory)
      : "Tecnologia",
    price: raw.price,
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
  if (params.date_from)          query.set("date_from",  params.date_from)
  if (params.date_to)            query.set("date_to",    params.date_to)

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
