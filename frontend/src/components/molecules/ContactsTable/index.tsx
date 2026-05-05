import { useState, useEffect } from "react"
import { DataTable } from "@/components/organisms/DataTable"
import { contactColumns } from "./columns"
import { fetchContacts } from "@/lib/api/contacts"
import type { Contact } from "@/types/contact"
import type { Tab, ActiveFilters } from "@/components/organisms/DataTable/types"

const TABS: Tab[] = [
  { id: "all",     label: "Todos os contatos" },
  { id: "clients", label: "Todos os clientes" },
  { id: "leads",   label: "Todos os Leads" },
]

const DEFAULT_PAGE_SIZE = 10

interface ServerFilters {
  status:       string
  purchasesMin: number | null
  purchasesMax: number | null
  createdYear:  string
  engagement:   string
}

const EMPTY_FILTERS: ServerFilters = { status: "", purchasesMin: null, purchasesMax: null, createdYear: "", engagement: "" }

export function ContactsTable() {
  const [activeTab, setActiveTab]         = useState("all")
  const [page, setPage]                   = useState(1)
  const [pageSize, setPageSize]           = useState(DEFAULT_PAGE_SIZE)
  const [contacts, setContacts]           = useState<Contact[]>([])
  const [total, setTotal]                 = useState(0)
  const [loading, setLoading]             = useState(true)
  const [serverFilters, setServerFilters] = useState<ServerFilters>(EMPTY_FILTERS)

  const { status, purchasesMin, purchasesMax, createdYear, engagement } = serverFilters

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetchContacts({ page, pageSize, tab: activeTab, status, purchasesMin, purchasesMax, createdYear, engagement })
      .then((res) => {
        if (cancelled) return
        setContacts(res.data)
        setTotal(res.total)
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [page, pageSize, activeTab, status, purchasesMin, purchasesMax, createdYear, engagement])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }

  const handleFiltersChange = (active: ActiveFilters) => {
    const sf = active["status"]
    const pf = active["purchases"]
    const cf = active["createdAt"]
    const ef = active["engagement"]
    setServerFilters({
      status:       sf?.type === "select"       && sf.value !== ""  ? sf.value      : "",
      purchasesMin: pf?.type === "number-range"                     ? pf.min        : null,
      purchasesMax: pf?.type === "number-range"                     ? pf.max        : null,
      createdYear:  cf?.type === "select"       && cf.value !== ""  ? cf.value      : "",
      engagement:   ef?.type === "select"       && ef.value !== ""  ? ef.value      : "",
    })
    setPage(1)
  }

  return (
    <DataTable
      data={loading ? [] : contacts}
      columns={contactColumns}
      getRowId={(c) => c.id}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onFiltersChange={handleFiltersChange}
      rightFilterKey="status"
      rowsPerPageOptions={[10, 25, 50]}
      serverPagination={{
        total,
        page,
        pageSize,
        onPageChange: handlePageChange,
        onPageSizeChange: handlePageSizeChange,
      }}
    />
  )
}
