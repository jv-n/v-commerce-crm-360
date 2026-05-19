export type EngagementType = "Promotor" | "Neutro" | "Detrator" | "Nenhum NPS"

export type ClientStatusType = "Ativo" | "Inativo" | "VIP" | "Lead" | "Em risco"

export interface Contact {
  // Identidade
  id: string
  name: string | null
  email: string | null
  phone: string | null        // gold_cliente_360.telefone

  // Segmentação
  clientStatus: ClientStatusType | null
  region: string | null
  origin: string | null

  // Pedidos / compras
  purchases: number
  distinctProducts: number
  totalRevenue: number
  avgTicket: number
  firstPurchase: string | null
  lastPurchase: string | null
  favPaymentMethod: string | null

  // Suporte
  totalTickets: number
  resolutionRate: number
  avgSupportRating: number | null

  // NPS / engajamento
  engagement: EngagementType
  engagementScore: number
  productRating: number | null

  // Compat. com a tabela atual
  createdAt: string | null
}