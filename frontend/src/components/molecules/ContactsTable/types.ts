import type { Tab } from "@/components/organisms/DataTable/types"

export const TABS: Tab[] = [
  { id: "all",     label: "Todos os contatos" },
  { id: "clients", label: "Todos os clientes" },
  { id: "leads",   label: "Leads" },
]

export const DEFAULT_PAGE_SIZE = 10

export interface ServerFilters {
  purchasesMin:   number | null
  purchasesMax:   number | null
  createdYear:    string
  engagement:     string
  clientStatuses: string[]
}

export const EMPTY_FILTERS: ServerFilters = {
  purchasesMin: null, purchasesMax: null,
  createdYear: "", engagement: "", clientStatuses: [],
}
