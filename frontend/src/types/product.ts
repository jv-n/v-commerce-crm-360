export type ProductCategory =
  | "Perfumaria"
  | "Artes"
  | "Esportes"
  | "Infantil"
  | "Utilidades"
  | "Instrumentos"
  | "Derivados"
  | "Mobiliário"
  | "Eletrodomésticos"
  | "Construção"
  | "Alimentos"
  | "Saúde"
  | "Tecnologia"

export type ProductState = "Ativo" | "Novo" | "Inativo" | "Descontinuado"

export interface Product {
  id: string
  name: string
  category: ProductCategory
  price: number | null
  stock: number
  rating: number
  totalSales: number
  state: ProductState
  uf: string
  createdAt: string
}
