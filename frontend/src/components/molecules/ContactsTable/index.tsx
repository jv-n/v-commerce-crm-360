import { useState, useEffect, useRef } from "react"
import { DataTable } from "@/components/organisms/DataTable"
import { makeContactColumns } from "./columns"
import { fetchContacts } from "@/lib/api/contacts"
import { ContactFormSheet } from "./ContactFormSheet"
import {
  ContactAdvancedFiltersDrawer,
  EMPTY_CONTACT_ADVANCED,
  contactAdvancedActiveCount,
} from "./AdvancedFiltersDrawer"
import type { ContactAdvancedFilters } from "./AdvancedFiltersDrawer"
import type { Contact } from "@/types/contact"
import type { Tab, ActiveFilters } from "@/components/organisms/DataTable/types"
import { cn } from "@/lib/utils"
import AddIcon from "@mui/icons-material/Add"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined"
import TuneIcon from "@mui/icons-material/Tune"

const TABS: Tab[] = [
  { id: "all", label: "Todos os contatos" },
]

const DEFAULT_PAGE_SIZE = 10

interface ServerFilters {
  purchasesMin:   number | null
  purchasesMax:   number | null
  createdYear:    string
  engagement:     string
  clientStatuses: string[]
  hasPhone:       boolean
}

const EMPTY_FILTERS: ServerFilters = {
  purchasesMin: null, purchasesMax: null,
  createdYear: "", engagement: "", clientStatuses: [],
  hasPhone: false,
}

function ContactExpandedRow({ contact, onEdit }: { contact: Contact; onEdit: () => void }) {
  const history = [
    ...(contact.lastPurchase
      ? [{ type: "purchase" as const, text: "realizou uma compra", time: contact.lastPurchase }]
      : []),
    { type: "edit" as const, text: "teve o status atualizado", time: "01/01 2025 10:00" },
    { type: "add" as const, text: "foi adicionado como contato", time: contact.createdAt ?? "—" },
  ]

  return (
    <div className="bg-purple-50/40 px-8 py-5 flex gap-8 border-t border-purple-100">
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
                {entry.type === "add"      && <AddIcon                    sx={{ fontSize: 13, color: "#9CA3AF" }} />}
                {entry.type === "edit"     && <EditOutlinedIcon           sx={{ fontSize: 12, color: "#7C3AED" }} />}
                {entry.type === "purchase" && <ShoppingCartOutlinedIcon   sx={{ fontSize: 12, color: "#7C3AED" }} />}
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
      <div className="flex flex-col gap-2 justify-start pt-0.5">
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 text-xs font-medium text-purple-700 hover:text-purple-900 bg-white border border-purple-200 px-3 py-1.5 rounded-md shadow-sm hover:bg-purple-50 transition-colors"
        >
          <EditOutlinedIcon sx={{ fontSize: 13 }} />
          Editar contato
        </button>
      </div>
    </div>
  )
}

export interface ContactsTableHandle {
  openAdd: () => void
}

export function ContactsTable({ onOpenAdd }: { onOpenAdd?: (fn: () => void) => void }) {
  const [activeTab, setActiveTab]         = useState("all")
  const [page, setPage]                   = useState(1)
  const [pageSize, setPageSize]           = useState(DEFAULT_PAGE_SIZE)
  const [contacts, setContacts]           = useState<Contact[]>([])
  const [total, setTotal]                 = useState(0)
  const [loading, setLoading]             = useState(true)
  const [serverFilters, setServerFilters] = useState<ServerFilters>(EMPTY_FILTERS)
  const [advanced, setAdvanced]           = useState<ContactAdvancedFilters>(EMPTY_CONTACT_ADVANCED)
  const [drawerOpen, setDrawerOpen]       = useState(false)
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [sortBy,  setSortBy]  = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [refetchKey, setRefetchKey]         = useState(0)
  const [formOpen, setFormOpen]             = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [fetchError, setFetchError]         = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { purchasesMin, purchasesMax, createdYear, engagement, clientStatuses, hasPhone } = serverFilters

  useEffect(() => {
    const hasText =
      advanced.receitaMin !== "" || advanced.receitaMax !== "" ||
      advanced.ticketMedioMin !== "" || advanced.ticketMedioMax !== "" ||
      advanced.ticketsSuporteMin !== "" || advanced.ticketsSuporteMax !== "" ||
      advanced.notaAtendMin !== "" || advanced.notaAtendMax !== "" ||
      advanced.npsMin !== "" || advanced.npsMax !== "" ||
      advanced.notaProdMin !== "" || advanced.notaProdMax !== ""

    const delay = hasText ? 300 : 0
    if (debounceRef.current) clearTimeout(debounceRef.current)

    let cancelled = false
    debounceRef.current = setTimeout(() => {
      setLoading(true)
      setFetchError(false)
      fetchContacts({
        page, pageSize, tab: activeTab,
        purchasesMin, purchasesMax, createdYear, engagement, clientStatuses, hasPhone,
        sortBy, sortDir,
        regioes:            advanced.regioes,
        origens:            advanced.origens,
        pagamentos:         advanced.pagamentos,
        receitaMin:         advanced.receitaMin   !== "" ? Number(advanced.receitaMin)   : undefined,
        receitaMax:         advanced.receitaMax   !== "" ? Number(advanced.receitaMax)   : undefined,
        ticketMedioMin:     advanced.ticketMedioMin !== "" ? Number(advanced.ticketMedioMin) : undefined,
        ticketMedioMax:     advanced.ticketMedioMax !== "" ? Number(advanced.ticketMedioMax) : undefined,
        primeiraCompraFrom: advanced.primeiraCompraFrom || undefined,
        primeiraCompraTo:   advanced.primeiraCompraTo   || undefined,
        ultimaCompraFrom:   advanced.ultimaCompraFrom   || undefined,
        ultimaCompraTo:     advanced.ultimaCompraTo     || undefined,
        ticketsSuporteMin:  advanced.ticketsSuporteMin !== "" ? Number(advanced.ticketsSuporteMin) : undefined,
        ticketsSuporteMax:  advanced.ticketsSuporteMax !== "" ? Number(advanced.ticketsSuporteMax) : undefined,
        notaAtendMin:       advanced.notaAtendMin !== "" ? Number(advanced.notaAtendMin) : undefined,
        notaAtendMax:       advanced.notaAtendMax !== "" ? Number(advanced.notaAtendMax) : undefined,
        npsMin:             advanced.npsMin !== "" ? Number(advanced.npsMin) : undefined,
        npsMax:             advanced.npsMax !== "" ? Number(advanced.npsMax) : undefined,
        notaProdMin:        advanced.notaProdMin !== "" ? Number(advanced.notaProdMin) : undefined,
        notaProdMax:        advanced.notaProdMax !== "" ? Number(advanced.notaProdMax) : undefined,
      })
        .then((res) => {
          if (cancelled) return
          setContacts(res.data)
          setTotal(res.total)
        })
        .catch(err => { console.error(err); if (!cancelled) setFetchError(true) })
        .finally(() => { if (!cancelled) setLoading(false) })
    }, delay)

    return () => {
      cancelled = true
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [
    page, pageSize, activeTab,
    purchasesMin, purchasesMax, createdYear, engagement, clientStatuses, hasPhone,
    sortBy, sortDir, refetchKey,
    advanced,
  ])

  const openAdd  = () => { setEditingContact(null); setFormOpen(true) }
  const openEdit = (c: Contact) => { setEditingContact(c); setFormOpen(true) }

  useEffect(() => { onOpenAdd?.(openAdd) }, [])

  const onToggleExpand = (id: string) =>
    setExpandedRowId(prev => prev === id ? null : id)

  const handleSortChange = (sort: { key: string; direction: "asc" | "desc" } | null) => {
    setSortBy(sort?.key ?? null)
    setSortDir(sort?.direction ?? "asc")
    setPage(1)
  }

  const handlePageChange     = (newPage: number) => setPage(newPage)
  const handlePageSizeChange = (newSize: number) => { setPageSize(newSize); setPage(1) }

  const handleFiltersChange = (active: ActiveFilters) => {
    const pf = active["purchases"]
    const cf = active["createdAt"]
    const ef = active["engagement"]
    const sf = active["clientStatus"]
    const hf = active["phone"]
    setServerFilters({
      purchasesMin:   pf?.type === "number-range"                      ? pf.min    : null,
      purchasesMax:   pf?.type === "number-range"                      ? pf.max    : null,
      createdYear:    cf?.type === "select"         && cf.value !== "" ? cf.value  : "",
      engagement:     ef?.type === "select"         && ef.value !== "" ? ef.value  : "",
      clientStatuses: sf?.type === "multi-select"                      ? sf.values : [],
      hasPhone:       hf?.type === "toggle"                            ? hf.active : false,
    })
    setPage(1)
  }

  const advCount = contactAdvancedActiveCount(advanced)

  const filterBarExtra = (
    <div className="flex items-center gap-3">
      {fetchError && (
        <span className="text-xs text-red-500">Erro ao carregar contatos</span>
      )}
      <button
        onClick={() => setDrawerOpen(true)}
        className={cn(
          "flex items-center gap-1.5 text-sm transition-colors",
          advCount > 0 ? "text-purple-700 font-medium" : "text-gray-400 hover:text-gray-600"
        )}
      >
        <TuneIcon sx={{ fontSize: 15 }} />
        Filtros avançados
        {advCount > 0 && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] font-bold leading-none">
            {advCount}
          </span>
        )}
      </button>
    </div>
  )

  return (
    <>
      <ContactAdvancedFiltersDrawer
        open={drawerOpen}
        filters={advanced}
        onChange={f => { setAdvanced(f); setPage(1) }}
        onClose={() => setDrawerOpen(false)}
        onClear={() => { setAdvanced(EMPTY_CONTACT_ADVANCED); setPage(1) }}
      />

      <DataTable
        data={contacts}
        loading={loading}
        columns={makeContactColumns(expandedRowId, onToggleExpand)}
        getRowId={(c) => c.id}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(tabId) => { setActiveTab(tabId); setPage(1) }}
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
        filterBarExtra={filterBarExtra}
        headerClassName="bg-[#F0DDFD]"
        dividersClassName="divide-[#9F83B2]"
        rowsPerPageOptions={[10, 25, 50]}
        expandedRowIds={expandedRowId ? new Set([expandedRowId]) : undefined}
        renderExpandedRow={(c) => <ContactExpandedRow contact={c} onEdit={() => openEdit(c)} />}
        onRowClick={(c) => onToggleExpand(c.id)}
        serverPagination={{
          total,
          page,
          pageSize,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
        }}
      />

      <ContactFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        contact={editingContact}
        onSuccess={() => setRefetchKey(k => k + 1)}
      />
    </>
  )
}
