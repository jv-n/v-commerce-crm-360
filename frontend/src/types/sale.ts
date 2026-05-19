export type SaleStatus =
  | "Aprovado" | "Processando" | "Recusado" | "Reembolsado"
  | "Em rota" | "Entregue" | "Entregue com Atraso" | "Cancelado"

export interface Sale {
  id: string
  product: string
  client: string
  categoria: string | null
  amount: number
  value: number
  date: string
  status: SaleStatus
  payment_method: string
}
