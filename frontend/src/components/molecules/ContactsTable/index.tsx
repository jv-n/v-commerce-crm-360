import { useState, useEffect } from "react"
import { DataTable } from "@/components/organisms/DataTable"
import { makeContactColumns } from "./columns"
import { fetchContacts } from "@/lib/api/contacts"
import type { Contact } from "@/types/contact"
import type { Tab, ActiveFilters } from "@/components/organisms/DataTable/types"
import { cn } from "@/lib/utils"
import AddIcon from "@mui/icons-material/Add"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined"

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

function ContactExpandedRow({ contact }: { contact: Contact }) {
  const history = [
    ...(contact.lastPurchase
      ? [{
          type: "purchase" as const,
          text: "realizou uma compra",
          time: contact.lastPurchase,
        }]
      : []),
    {
      type: "edit" as const,
      text: "teve o status atualizado",
      time: "01/01 2025 10:00",
    },
    {
      type: "add" as const,
      text: "foi adicionado como contato",
      time: contact.createdAt ?? "—",
    },
  ]

  return (
    <div className="bg-purple-50/40 px-8 py-5 flex gap-8 border-t border-purple-100">
      {/* ── Timeline ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        {history.map((entry, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                entry.type === "add"
                  ? "border-2 border-dashed border-gray-300 bg-transparent"
                  : "bg-white border border-gray-200 shadow-sm"
              )}>
                {entry.type === "add"     && <AddIcon             sx={{ fontSize: 13, color: "#9CA3AF" }} />}
                {entry.type === "edit"    && <EditOutlinedIcon    sx={{ fontSize: 12, color: "#7C3AED" }} />}
                {entry.type === "purchase"&& <ShoppingCartOutlinedIcon sx={{ fontSize: 12, color: "#7C3AED" }} />}
              </div>
              {i < history.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
            </div>

            <div className="pb-6 flex items-center gap-1 flex-wrap text-sm">
              <span className="font-semibold text-gray-800">{contact.name}</span>
              <span className="text-gray-500">{entry.text}</span>
              <span className="text-xs text-gray-400 ml-0.5">- {entry.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ContactsTable() {
  const [activeTab, setActiveTab]         = useState("all")
  const [page, setPage]                   = useState(1)
  const [pageSize, setPageSize]           = useState(DEFAULT_PAGE_SIZE)
  const [contacts, setContacts]           = useState<Contact[]>([])
  const [total, setTotal]                 = useState(0)
  const [loading, setLoading]             = useState(true)
  const [serverFilters, setServerFilters] = useState<ServerFilters>(EMPTY_FILTERS)
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

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

  const onToggleExpand = (id: string) =>
    setExpandedRowId(prev => prev === id ? null : id)

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
      columns={makeContactColumns(expandedRowId, onToggleExpand)}
      getRowId={(c) => c.id}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onFiltersChange={handleFiltersChange}
      rightFilterKey="status"
      headerClassName="bg-[#F0DDFD]"
      dividersClassName="divide-[#9F83B2]"
      rowsPerPageOptions={[10, 25, 50]}
      expandedRowId={expandedRowId}
      renderExpandedRow={(c) => <ContactExpandedRow contact={c} />}
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
