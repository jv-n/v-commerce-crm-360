export type ContactStatus =
  | "Cliente Ativo"
  | "Cliente VIP"
  | "Em risco"
  | "Lead"
  | "Cliente Inativo"
  | "Desativado"

export type EngagementType = "Promotor" | "Neutro" | "Detrator" | "Nenhum NPS"

export interface Contact {
  id: string
  name: string | null
  status: ContactStatus | null
  lastPurchase: string | null
  purchases: number
  email: string | null
  phone: string | null
  engagement: EngagementType
  engagementScore: number
  createdAt: string | null
}
