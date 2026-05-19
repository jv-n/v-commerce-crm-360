export type ContactPeriod =
  | "current_month"
  | "last_3_months"
  | "current_semester"
  | "current_year"
  | "all_time"

export interface ContactDetails {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  gender: string | null
  birthDate: string | null
  age: number | null
  ageRange: string | null
  createdAt: string | null
  city: string | null
  state: string | null
  region: string | null
  country: string | null
  origin: string | null
  clientStatus: string | null
  contactType: string
}

export interface ContactCategoryMetric {
  categoria: string
  quantidade_total: number
  receita_total: number
  total_pedidos: number
}

export interface ContactMetrics {
  contactType: string

  period: ContactPeriod
  periodLabel: string
  periodStart: string | null
  periodEnd: string | null

  comprasMes: number
  mediaNps: number | null
  categoriaNpsRecente: string | null

  origemLead: string | null
  produtoMaisVisualizado: string | null
  categoriaMaisVisualizada: string | null

  totalSessoes: number
  totalVisualizacoes: number
  totalCarrinho: number
  totalCheckouts: number
  totalAbandonoCarrinho: number
  taxaConversaoPct: number

  categoriasMaisCompradas: ContactCategoryMetric[]
}

export interface ContactOrderProduct {
  id_produto: string | null
  nome_produto: string | null
  categoria: string | null
  quantidade: number
  valor: number
}

export interface ContactOrder {
  id_pedido: string
  id_cliente: string | null
  data_pedido: string | null
  ano_mes: string | null
  status: string | null
  metodo_pagamento: string | null
  valor_total: number
  receita_bruta: number
  valor_reembolsado: number
  quantidade_total: number
  produtos_resumo: string
  produtos: ContactOrderProduct[]
}

export interface ContactOrdersPage {
  data: ContactOrder[]
  total: number
  page: number
  pageSize: number
}

export interface ContactTicket {
  ticket_id: string
  id_cliente: string | null
  id_pedido: string | null
  status_atendimento: string | null
  tipo_problema: string | null
  data_abertura: string | null
  hora_abertura: string | null
  agente_suporte: string | null
  tempo_resolucao_horas: number | null
  nota_avaliacao: number | null
}

export interface ContactTicketsPage {
  data: ContactTicket[]
  total: number
  page: number
  pageSize: number
}

export interface ContactViewedProduct {
  id_produto: string | null
  nome_produto: string | null
  categoria: string | null
  data_ultima_visualizacao: string | null
  tempo_medio_pagina_seg: number | null
  origem: string | null
  canal: string | null
  dispositivo: string | null
  observacao: string | null
}

export interface ContactDashboard {
  metrics: ContactMetrics
  orders: ContactOrdersPage
  tickets: ContactTicketsPage
  viewedProducts: ContactViewedProduct[]
}

export type ContactDetailsPatch = Partial<
  Pick<
    ContactDetails,
    | "name"
    | "email"
    | "phone"
    | "gender"
    | "birthDate"
    | "age"
    | "createdAt"
    | "city"
    | "state"
    | "region"
    | "country"
    | "origin"
    | "clientStatus"
  >
>