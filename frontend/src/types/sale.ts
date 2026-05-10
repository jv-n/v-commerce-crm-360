export type SaleStatus = "Aprovado" | "Processando" | "Recusado" | "Reembolsado"

export interface Sale {
  id: string
  product: string
  categoria: string | null
  amount: number
  value: number
  date: string
  status: SaleStatus
  payment_method: string
}
