export type SaleStatus = "Em andamento" | "Concluída" | "Falha" | "Reembolsada" | "Cancelada"

export interface Sale {
  id: string
  product: string
  client_name: string
  amount: number
  date: string 
  status: SaleStatus
  payment_method: string
}