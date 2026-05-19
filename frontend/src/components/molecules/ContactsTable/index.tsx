import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from "react"
import { useNavigate } from "react-router-dom"
import { DataTable } from "@/components/organisms/DataTable"
import { makeContactColumns } from "./columns"
import { ContactModal } from "./ContactModal"
import { ContactExpandedRow } from "./ContactExpandedRow"
import { ContactAdvancedFiltersDrawer, EMPTY_CONTACT_ADVANCED, contactAdvancedActiveCount } from "./AdvancedFiltersDrawer"
import { ExportPopover } from "@/components/molecules/ExportPopover"
import { useContactsFetch } from "./useContactsFetch"
import { useContactExport } from "./useContactExport"
import { TABS, DEFAULT_PAGE_SIZE, EMPTY_FILTERS } from "./types"
import type { ServerFilters } from "./types"
import type { ContactAdvancedFilters } from "./AdvancedFiltersDrawer"
import type { ActiveFilters } from "@/components/organisms/DataTable/types"
import { cn } from "@/lib/utils"
import TuneIcon from "@mui/icons-material/Tune"

type FilterSnapshot = {
  activeTab:     string
  page:          number
  serverFilters: ServerFilters
  advanced:      ContactAdvancedFilters
  nameSearch:    string
  sortBy:        string | null
  sortDir:       "asc" | "desc"
}

export type ContactsTableHandle = {
  undo:       () => void
  reset:      () => void
  openAdd:    () => void
  openExport: () => void
}

export const ContactsTable = forwardRef<ContactsTableHandle, { onCanUndoChange?: (can: boolean) => void }>(
  ({ onCanUndoChange }, ref) => {
  const navigate = useNavigate()

  const [activeTab,       setActiveTab]       = useState("all")
  const [page,            setPage]            = useState(1)
  const [pageSize,        setPageSize]        = useState(DEFAULT_PAGE_SIZE)
  const [serverFilters,   setServerFilters]   = useState<ServerFilters>(EMPTY_FILTERS)
  const [advanced,        setAdvanced]        = useState<ContactAdvancedFilters>(EMPTY_CONTACT_ADVANCED)
  const [drawerOpen,      setDrawerOpen]      = useState(false)
  const [expandedRowId,   setExpandedRowId]   = useState<string | null>(null)
  const [sortBy,          setSortBy]          = useState<string | null>(null)
  const [sortDir,         setSortDir]         = useState<"asc" | "desc">("asc")
  const [refetchKey,      setRefetchKey]      = useState(0)
  const [formOpen,        setFormOpen]        = useState(false)
  const [nameSearch,      setNameSearch]      = useState("")
  const [filterHistory,   setFilterHistory]   = useState<FilterSnapshot[]>([])

  const currentSnapshot = useRef<FilterSnapshot>({
    activeTab: "all", page: 1, serverFilters: EMPTY_FILTERS,
    advanced: EMPTY_CONTACT_ADVANCED, nameSearch: "", sortBy: null, sortDir: "asc",
  })

  useEffect(() => {
    currentSnapshot.current = { activeTab, page, serverFilters, advanced, nameSearch, sortBy, sortDir }
  }, [activeTab, page, serverFilters, advanced, nameSearch, sortBy, sortDir])

  useEffect(() => {
    onCanUndoChange?.(filterHistory.length > 0)
  }, [filterHistory.length, onCanUndoChange])

  const pushHistory = useCallback(() => {
    const snap = currentSnapshot.current
    setFilterHistory(h => [...h, {
      ...snap,
      serverFilters: { ...snap.serverFilters },
      advanced:      { ...snap.advanced },
    }])
  }, [])

  const { contacts, total, loading, fetchError } = useContactsFetch({
    page, pageSize, activeTab, nameSearch, serverFilters, sortBy, sortDir, refetchKey, advanced,
  })

  const {
    exportOpen, setExportOpen,
    exportLoading,
    selectedIds, handleSelectionChange,
    handleExportCSV, handleExportSelected,
    exportPills,
  } = useContactExport({ activeTab, serverFilters, advanced, contacts })

  useImperativeHandle(ref, () => ({
    undo: () => {
      setFilterHistory(h => {
        if (h.length === 0) return h
        const prev = h[h.length - 1]
        setExpandedRowId(null)
        setActiveTab(prev.activeTab)
        setPage(prev.page)
        setServerFilters(prev.serverFilters)
        setAdvanced(prev.advanced)
        setNameSearch(prev.nameSearch)
        setSortBy(prev.sortBy)
        setSortDir(prev.sortDir)
        return h.slice(0, -1)
      })
    },
    reset: () => {
      pushHistory()
      setExpandedRowId(null)
      setActiveTab("all")
      setPage(1)
      setServerFilters(EMPTY_FILTERS)
      setAdvanced(EMPTY_CONTACT_ADVANCED)
      setNameSearch("")
      setSortBy(null)
      setSortDir("asc")
    },
    openAdd:    () => setFormOpen(true),
    openExport: () => setExportOpen(true),
  }), [pushHistory])

  const handleFiltersChange = (active: ActiveFilters) => {
    pushHistory()
    const pf = active["purchases"]
    const cf = active["createdAt"]
    const ef = active["engagement"]
    const sf = active["clientStatus"]
    setServerFilters({
      purchasesMin:   pf?.type === "number-range"  ? pf.min               : null,
      purchasesMax:   pf?.type === "number-range"  ? pf.max               : null,
      createdFrom:    cf?.type === "date-range"    ? (cf.from ?? "")      : "",
      createdTo:      cf?.type === "date-range"    ? (cf.to   ?? "")      : "",
      engagements:    ef?.type === "multi-select"   ? ef.values            : [],
      clientStatuses: sf?.type === "multi-select"  ? sf.values            : [],
    })
    setPage(1)
  }

  const advCount = contactAdvancedActiveCount(advanced)

  const filterBarExtra = (
    <div className="flex items-center gap-3">
      {fetchError && <span className="text-xs text-red-500">Erro ao carregar contatos</span>}
      <button
        onClick={() => setDrawerOpen(true)}
        className={cn(
          "flex items-center gap-1.5 text-sm transition-colors px-2 py-1 rounded-lg",
          advCount > 0 ? "text-purple-700 font-medium hover:bg-[#CFA7FF]" : "text-gray-900 hover:bg-[#CFA7FF]"
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
      <ExportPopover
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        total={total}
        entityLabel="Contatos"
        pills={exportPills}
        exportLoading={exportLoading}
        onExport={handleExportCSV}
        selectedCount={selectedIds.size}
        onExportSelected={handleExportSelected}
      />

      <ContactAdvancedFiltersDrawer
        open={drawerOpen}
        filters={advanced}
        onChange={f => { pushHistory(); setAdvanced(f); setPage(1) }}
        onClose={() => setDrawerOpen(false)}
        onClear={() => { pushHistory(); setAdvanced(EMPTY_CONTACT_ADVANCED); setPage(1) }}
      />

      <DataTable
        data={contacts}
        loading={loading}
        columns={makeContactColumns(
          expandedRowId,
          (id) => setExpandedRowId(prev => prev === id ? null : id),
          (id) => navigate(`/contacts/${id}`)
        )}
        getRowId={(c) => c.id}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(tabId) => { pushHistory(); setActiveTab(tabId); setPage(1) }}
        onFiltersChange={handleFiltersChange}
        onSearchChange={(v) => { setNameSearch(v); setPage(1) }}
        searchPlaceholder="Pesquisar por nome ou ID..."
        onSortChange={(sort) => { setSortBy(sort?.key ?? null); setSortDir(sort?.direction ?? "asc"); setPage(1) }}
        onSelectionChange={handleSelectionChange}
        headerClassName="bg-[#EACAFF] [&_th:not(:first-child)_button_svg]:!text-[#9F83B2] [&_th:not(:first-child)_button:hover_svg]:!text-[#6F2B90]"
        filterBarExtra={filterBarExtra}
        rowsPerPageOptions={[10, 25, 50]}
        expandedRowIds={expandedRowId ? new Set([expandedRowId]) : undefined}
        renderExpandedRow={(c) => <ContactExpandedRow contact={c} />}
        onRowClick={(c) => setExpandedRowId(prev => prev === c.id ? null : c.id)}
        serverPagination={{
          total, page, pageSize,
          onPageChange:     (p) => setPage(p),
          onPageSizeChange: (s) => { setPageSize(s); setPage(1) },
        }}
      />

      <ContactModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => setRefetchKey(k => k + 1)}
      />
    </>
  )
})
