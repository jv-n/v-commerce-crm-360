import type { Tab } from "@/components/organisms/DataTable/types"

export const TABS: Tab[] = [
  { id: "all", label: "Todos os Tickets" },
  { id: "my-attending", label: "Meus Tickets em Atendimento" },
  { id: "waiting", label: "Tickets Aguardando..." },
]

export const DEFAULT_PAGE_SIZE = 10
export const EXPORT_PAGE_SIZE = 100000

export interface ServerFilters {
  responsible: string[]
  status: string[]
  problem: string[]
  score: string[]
}

export interface DateFilters {
  openedFrom: string
  openedTo: string
}

export type TicketSort = {
  key: string
  direction: "asc" | "desc"
} | null

export type FilterSnapshot = {
  tab: string
  page: number
  serverFilters: ServerFilters
  dateFilters: DateFilters
  sort: TicketSort
  searchQuery: string
}

export const EMPTY_FILTERS: ServerFilters = {
  responsible: [],
  status: [],
  problem: [],
  score: [],
}

export const EMPTY_DATE_FILTERS: DateFilters = {
  openedFrom: "",
  openedTo: "",
}