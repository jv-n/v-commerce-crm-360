import type { Contact, EngagementType, ClientStatusType } from "@/types/contact"

export interface ContactsPage {
  data: Contact[]
  total: number
  page: number
  pageSize: number
}

interface ContactsParams {
  page: number
  pageSize: number
  tab: string
  search?: string
  purchasesMin?: number | null
  purchasesMax?: number | null
  createdFrom?: string
  createdTo?:   string
  engagements?: string[]
  clientStatuses?: string[]
  sortBy?: string | null
  sortDir?: "asc" | "desc"
  // advanced filters — compras / financeiro
  regioes?: string[]
  origens?: string[]
  pagamentos?: string[]
  receitaMin?: number
  receitaMax?: number
  ticketMedioMin?: number
  ticketMedioMax?: number
  primeiraCompraFrom?: string
  primeiraCompraTo?: string
  ultimaCompraFrom?: string
  ultimaCompraTo?: string
  ticketsSuporteMin?: number
  ticketsSuporteMax?: number
  notaAtendMin?: number
  notaAtendMax?: number
  npsMin?: number
  npsMax?: number
  notaProdMin?: number
  notaProdMax?: number
  // advanced filters — perfil
  generos?: string[]
  faixasEtarias?: string[]
  estados?: string[]
  // advanced filters — comportamento digital
  canaisPreferidos?: string[]
  dispositivos?: string[]
  origensSessao?: string[]
  periodosDia?: string[]
  diasSemana?: string[]
  categoriasVisualizadas?: string[]
  taxaConversaoMin?: number
  taxaConversaoMax?: number
  totalSessoesMin?: number
  totalSessoesMax?: number
  abandonoCarrinhoMin?: number
  abandonoCarrinhoMax?: number
  npsRecenteMin?: number
  npsRecenteMax?: number
}

interface RawContact {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  clientStatus: string | null
  region: string | null
  origin: string | null
  purchases: number
  distinctProducts: number
  totalRevenue: number
  avgTicket: number
  firstPurchase: string | null
  lastPurchase: string | null
  favPaymentMethod: string | null
  totalTickets: number
  resolutionRate: number
  avgSupportRating: number | null
  engagement: string
  engagementScore: number
  productRating: number | null
  createdAt: string | null
}

const VALID_ENGAGEMENTS = new Set<EngagementType>(["Promotor", "Neutro", "Detrator", "Nenhum NPS"])
const VALID_STATUSES    = new Set<ClientStatusType>(["Ativo", "Inativo", "VIP", "Lead", "Em risco"])

function toContact(raw: RawContact): Contact {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone,
    clientStatus: VALID_STATUSES.has(raw.clientStatus as ClientStatusType)
      ? (raw.clientStatus as ClientStatusType)
      : null,
    region: raw.region,
    origin: raw.origin,
    purchases: raw.purchases,
    distinctProducts: raw.distinctProducts,
    totalRevenue: raw.totalRevenue,
    avgTicket: raw.avgTicket,
    firstPurchase: raw.firstPurchase,
    lastPurchase: raw.lastPurchase,
    favPaymentMethod: raw.favPaymentMethod,
    totalTickets: raw.totalTickets,
    resolutionRate: raw.resolutionRate,
    avgSupportRating: raw.avgSupportRating,
    engagement: VALID_ENGAGEMENTS.has(raw.engagement as EngagementType)
      ? (raw.engagement as EngagementType)
      : "Nenhum NPS",
    engagementScore: raw.engagementScore,
    productRating: raw.productRating,
    createdAt: raw.createdAt,
  }
}

export interface ContactFormData {
  name: string
  email?: string
}

export async function createContact(data: ContactFormData): Promise<Contact> {
  const res = await fetch("/api/contacts/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Erro ao criar contato: ${res.status}`)
  return toContact(await res.json() as RawContact)
}

export async function updateContact(id: string, data: Partial<ContactFormData & { clientStatus?: string }>): Promise<Contact> {
  const res = await fetch(`/api/contacts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Erro ao atualizar contato: ${res.status}`)
  return toContact(await res.json() as RawContact)
}

export interface ContactResumo {
  categoria_mais_comprada: string | null
  produto_mais_caro: string | null
  produto_mais_caro_valor: number | null
  metodo_pagamento_favorito: string | null
  produto_mais_comprado: string | null
  produto_mais_comprado_qty: number | null
}

export async function fetchContactById(id: string): Promise<Contact> {
  const res = await fetch(`/api/contacts/${id}`)
  if (!res.ok) throw new Error(`Erro ao buscar contato: ${res.status}`)
  return toContact(await res.json() as RawContact)
}

export interface ContactPedido {
  id_pedido: string
  nome_produto: string | null
  quantidade: number | null
  valor_pedido: number | null
  metodo_pagamento: string | null
  data_pedido: string | null
}

export async function fetchContactPedidos(id: string, limit = 3): Promise<ContactPedido[]> {
  const res = await fetch(`/api/contacts/${id}/pedidos?limit=${limit}`)
  if (!res.ok) throw new Error(`Erro ao buscar pedidos: ${res.status}`)
  return res.json() as Promise<ContactPedido[]>
}

export async function fetchContactResumo(id: string): Promise<ContactResumo> {
  const res = await fetch(`/api/contacts/${id}/resumo`)
  if (!res.ok) throw new Error(`Erro ao buscar resumo: ${res.status}`)
  return res.json() as Promise<ContactResumo>
}

export async function fetchContacts(params: ContactsParams): Promise<ContactsPage> {
  const query = new URLSearchParams({
    page:     String(params.page),
    pageSize: String(params.pageSize),
    tab:      params.tab,
    ...(params.search                    ? { search:           params.search                    } : {}),
    ...(params.purchasesMin != null      ? { purchases_min:    String(params.purchasesMin)      } : {}),
    ...(params.purchasesMax != null      ? { purchases_max:    String(params.purchasesMax)      } : {}),
    ...(params.createdFrom               ? { created_from:     params.createdFrom               } : {}),
    ...(params.createdTo                 ? { created_to:       params.createdTo                 } : {}),
    ...(params.sortBy                    ? { sort_by:    params.sortBy    } : {}),
    ...(params.sortBy && params.sortDir  ? { sort_dir:   params.sortDir   } : {}),
    ...(params.receitaMin != null            ? { receita_min:          String(params.receitaMin)       } : {}),
    ...(params.receitaMax != null            ? { receita_max:          String(params.receitaMax)       } : {}),
    ...(params.ticketMedioMin != null        ? { ticket_medio_min:     String(params.ticketMedioMin)   } : {}),
    ...(params.ticketMedioMax != null        ? { ticket_medio_max:     String(params.ticketMedioMax)   } : {}),
    ...(params.primeiraCompraFrom            ? { primeira_compra_from: params.primeiraCompraFrom       } : {}),
    ...(params.primeiraCompraTo              ? { primeira_compra_to:   params.primeiraCompraTo         } : {}),
    ...(params.ultimaCompraFrom              ? { ultima_compra_from:   params.ultimaCompraFrom         } : {}),
    ...(params.ultimaCompraTo                ? { ultima_compra_to:     params.ultimaCompraTo           } : {}),
    ...(params.ticketsSuporteMin != null     ? { tickets_suporte_min:  String(params.ticketsSuporteMin)} : {}),
    ...(params.ticketsSuporteMax != null     ? { tickets_suporte_max:  String(params.ticketsSuporteMax)} : {}),
    ...(params.notaAtendMin != null          ? { nota_atend_min:       String(params.notaAtendMin)     } : {}),
    ...(params.notaAtendMax != null          ? { nota_atend_max:       String(params.notaAtendMax)     } : {}),
    ...(params.npsMin != null                ? { nps_min:              String(params.npsMin)           } : {}),
    ...(params.npsMax != null                ? { nps_max:              String(params.npsMax)           } : {}),
    ...(params.notaProdMin != null           ? { nota_prod_min:        String(params.notaProdMin)      } : {}),
    ...(params.notaProdMax != null           ? { nota_prod_max:        String(params.notaProdMax)      } : {}),
    ...(params.taxaConversaoMin != null      ? { taxa_conversao_min:   String(params.taxaConversaoMin) } : {}),
    ...(params.taxaConversaoMax != null      ? { taxa_conversao_max:   String(params.taxaConversaoMax) } : {}),
    ...(params.totalSessoesMin != null       ? { total_sessoes_min:    String(params.totalSessoesMin)  } : {}),
    ...(params.totalSessoesMax != null       ? { total_sessoes_max:    String(params.totalSessoesMax)  } : {}),
    ...(params.abandonoCarrinhoMin != null   ? { abandono_carrinho_min: String(params.abandonoCarrinhoMin) } : {}),
    ...(params.abandonoCarrinhoMax != null   ? { abandono_carrinho_max: String(params.abandonoCarrinhoMax) } : {}),
    ...(params.npsRecenteMin != null         ? { nps_recente_min:      String(params.npsRecenteMin)    } : {}),
    ...(params.npsRecenteMax != null         ? { nps_recente_max:      String(params.npsRecenteMax)    } : {}),
  })

  params.engagements?.forEach(e  => query.append("engagement",    e))
  params.clientStatuses?.forEach(s => query.append("client_status", s))
  params.regioes?.forEach(r   => query.append("regioes",    r))
  params.origens?.forEach(o   => query.append("origens",    o))
  params.pagamentos?.forEach(p => query.append("pagamentos", p))
  params.generos?.forEach(g            => query.append("generos",              g))
  params.faixasEtarias?.forEach(f      => query.append("faixas_etarias",       f))
  params.estados?.forEach(e            => query.append("estados",              e))
  params.canaisPreferidos?.forEach(c   => query.append("canais_preferidos",    c))
  params.dispositivos?.forEach(d       => query.append("dispositivos",         d))
  params.origensSessao?.forEach(o      => query.append("origens_sessao",       o))
  params.periodosDia?.forEach(p        => query.append("periodos_dia",         p))
  params.diasSemana?.forEach(d         => query.append("dias_semana",          d))
  params.categoriasVisualizadas?.forEach(c => query.append("categorias_visualizadas", c))

  const res = await fetch(`/api/contacts/?${query}`)
  if (!res.ok) throw new Error(`Erro ao buscar contatos: ${res.status}`)

  const json = await res.json()
  return {
    data:     (json.data as RawContact[]).map(toContact),
    total:    json.total,
    page:     json.page,
    pageSize: json.pageSize,
  }
}

export async function exportContactsCSV(params: Omit<ContactsParams, "page" | "pageSize" | "sortBy" | "sortDir">): Promise<void> {
  const query = new URLSearchParams({
    tab: params.tab,
    ...(params.search                    ? { search:                params.search                    } : {}),
    ...(params.purchasesMin != null      ? { purchases_min:         String(params.purchasesMin)      } : {}),
    ...(params.purchasesMax != null      ? { purchases_max:         String(params.purchasesMax)      } : {}),
    ...(params.createdFrom               ? { created_from:           params.createdFrom               } : {}),
    ...(params.createdTo                 ? { created_to:             params.createdTo                 } : {}),
    ...(params.receitaMin != null        ? { receita_min:           String(params.receitaMin)        } : {}),
    ...(params.receitaMax != null        ? { receita_max:           String(params.receitaMax)        } : {}),
    ...(params.ticketMedioMin != null    ? { ticket_medio_min:      String(params.ticketMedioMin)    } : {}),
    ...(params.ticketMedioMax != null    ? { ticket_medio_max:      String(params.ticketMedioMax)    } : {}),
    ...(params.primeiraCompraFrom        ? { primeira_compra_from:  params.primeiraCompraFrom        } : {}),
    ...(params.primeiraCompraTo          ? { primeira_compra_to:    params.primeiraCompraTo          } : {}),
    ...(params.ultimaCompraFrom          ? { ultima_compra_from:    params.ultimaCompraFrom          } : {}),
    ...(params.ultimaCompraTo            ? { ultima_compra_to:      params.ultimaCompraTo            } : {}),
    ...(params.ticketsSuporteMin != null ? { tickets_suporte_min:   String(params.ticketsSuporteMin) } : {}),
    ...(params.ticketsSuporteMax != null ? { tickets_suporte_max:   String(params.ticketsSuporteMax) } : {}),
    ...(params.notaAtendMin != null      ? { nota_atend_min:        String(params.notaAtendMin)      } : {}),
    ...(params.notaAtendMax != null      ? { nota_atend_max:        String(params.notaAtendMax)      } : {}),
    ...(params.npsMin != null            ? { nps_min:               String(params.npsMin)            } : {}),
    ...(params.npsMax != null            ? { nps_max:               String(params.npsMax)            } : {}),
    ...(params.notaProdMin != null       ? { nota_prod_min:         String(params.notaProdMin)       } : {}),
    ...(params.notaProdMax != null       ? { nota_prod_max:         String(params.notaProdMax)       } : {}),
    ...(params.taxaConversaoMin != null  ? { taxa_conversao_min:    String(params.taxaConversaoMin)  } : {}),
    ...(params.taxaConversaoMax != null  ? { taxa_conversao_max:    String(params.taxaConversaoMax)  } : {}),
    ...(params.totalSessoesMin != null   ? { total_sessoes_min:     String(params.totalSessoesMin)   } : {}),
    ...(params.totalSessoesMax != null   ? { total_sessoes_max:     String(params.totalSessoesMax)   } : {}),
    ...(params.abandonoCarrinhoMin != null ? { abandono_carrinho_min: String(params.abandonoCarrinhoMin) } : {}),
    ...(params.abandonoCarrinhoMax != null ? { abandono_carrinho_max: String(params.abandonoCarrinhoMax) } : {}),
    ...(params.npsRecenteMin != null     ? { nps_recente_min:       String(params.npsRecenteMin)     } : {}),
    ...(params.npsRecenteMax != null     ? { nps_recente_max:       String(params.npsRecenteMax)     } : {}),
  })
  params.engagements?.forEach(e              => query.append("engagement",              e))
  params.clientStatuses?.forEach(s          => query.append("client_status",           s))
  params.regioes?.forEach(r                 => query.append("regioes",                 r))
  params.origens?.forEach(o                 => query.append("origens",                 o))
  params.pagamentos?.forEach(p              => query.append("pagamentos",              p))
  params.generos?.forEach(g                 => query.append("generos",                 g))
  params.faixasEtarias?.forEach(f           => query.append("faixas_etarias",          f))
  params.estados?.forEach(e                 => query.append("estados",                 e))
  params.canaisPreferidos?.forEach(c        => query.append("canais_preferidos",        c))
  params.dispositivos?.forEach(d            => query.append("dispositivos",             d))
  params.origensSessao?.forEach(o           => query.append("origens_sessao",           o))
  params.periodosDia?.forEach(p             => query.append("periodos_dia",             p))
  params.diasSemana?.forEach(d              => query.append("dias_semana",              d))
  params.categoriasVisualizadas?.forEach(c  => query.append("categorias_visualizadas",  c))

  const res = await fetch(`/api/contacts/export?${query}`)
  if (!res.ok) throw new Error(`Erro ao exportar contatos: ${res.status}`)

  const blob = await res.blob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  const date = new Date().toISOString().slice(0, 10)
  a.href = url; a.download = `contatos_${date}.csv`; a.click()
  URL.revokeObjectURL(url)
}
