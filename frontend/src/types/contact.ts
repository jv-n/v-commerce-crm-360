export type EngagementType = "Promotor" | "Neutro" | "Detrator" | "Nenhum NPS"

export interface Contact {
  id: string
  name: string | null
  lastPurchase: string | null
  purchases: number
  email: string | null
  phone: string | null
  engagement: EngagementType
  engagementScore: number
  createdAt: string | null
}
