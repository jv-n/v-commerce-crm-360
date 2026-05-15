export type ProductCategory =
  | "Automotivo"
  | "Beleza"
  | "Brinquedos"
  | "Casa"
  | "Eletronicos"
  | "Esportes"
  | "Indefinida"
  | "Moveis"
  | "Vestuario"

export type ProductState = "Ativo" | "Novo" | "Inativo" | "Descontinuado"

export interface Product {
  id: string
  name: string
  category: ProductCategory
  price: number | null
  supplier: string | null
  weightKg: number | null
  stock: number
  rating: number
  totalSales: number
  state: ProductState
  uf: string
  createdAt: string
}
