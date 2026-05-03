export type ContactStatus =
  | "Cliente Ativo"
  | "Cliente VIP"
  | "Em risco"
  | "Lead"
  | "Cliente Inativo"
  | "Desativado"

export type EngagementType = "Promotor" | "Neutro" | "Detrator" | "Nenhum NPS"

export interface Responsible {
  initials: string
  name: string
  bgColor: string
}

export interface Contact {
  id: string
  name: string
  responsible: Responsible
  status: ContactStatus
  lastPurchase: string | null
  purchases: number
  email: string
  phone: string
  engagement: EngagementType
  engagementScore: number
  createdAt: string // "DD/MM/YYYY"
}
