import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { DataTable } from "@/components/organisms/DataTable"
import { makeContactColumns } from "./columns"
import { ContactFormSheet } from "./ContactFormSheet"
import { ContactExpandedRow } from "./ContactExpandedRow"
import { ContactAdvancedFiltersDrawer, EMPTY_CONTACT_ADVANCED, contactAdvancedActiveCount } from "./AdvancedFiltersDrawer"
import { ExportPopover } from "@/components/molecules/ExportPopover"
import { useContactsFetch } from "./useContactsFetch"
import { useContactExport } from "./useContactExport"
import { TABS, DEFAULT_PAGE_SIZE, EMPTY_FILTERS } from "./types"
import type { ServerFilters } from "./types"
import type { ContactAdvancedFilters } from "./AdvancedFiltersDrawer"
import type { Contact } from "@/types/contact"
import type { ActiveFilters } from "@/components/organisms/DataTable/types"
import { cn } from "@/lib/utils"
import TuneIcon from "@mui/icons-material/Tune"

export interface ContactsTableHandle {
  openAdd: () => void
}

export function ContactsTable({
  onOpenAdd,
  onOpenExport,
  onSwitchToLeads,
}: {
  onOpenAdd?: (fn: () => void) => void
  onOpenExport?: (fn: () => void) => void
  onSwitchToLeads?: (fn: () => void) => void
}) {
  const navigate = useNavigate()

  const [activeTab,      setActiveTab]      = useState("all")
  const [page,           setPage]           = useState(1)
  const [pageSize,       setPageSize]       = useState(DEFAULT_PAGE_SIZE)
  const [serverFilters,  setServerFilters]  = useState<ServerFilters>(EMPTY_FILTERS)
  const [advanced,       setAdvanced]       = useState<ContactAdvancedFilters>(EMPTY_CONTACT_ADVANCED)
  const [sortBy,         setSortBy]         = useState<string | null>(null)
  const [sortDir,        setSortDir]        = useState<"asc" | "desc">("asc")
  const [refetchKey,     setRefetchKey]     = useState(0)
  const [nameSearch,     setNameSearch]     = useState("")
  const [expandedRowId,  setExpandedRowId]  = useState<string | null>(null)
  const [drawerOpen,     setDrawerOpen]     = useState(false)
  const [formOpen,       setFormOpen]       = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  const { contacts, total, loading, fetchError } = useContactsFetch({
    page, pageSize, activeTab, nameSearch, serverFilters, sortBy, sortDir, refetchKey, advanced,
  })

  const {
    exportOpen, setExportOpen, exportLoading,
    selectedIds, handleSelectionChange,
    handleExportCSV, handleExportSelected, exportPills,
  } = useContactExport({ activeTab, serverFilters, sortBy, sortDir, advanced, contacts })

  const openAdd     = () => { setEditingContact(null); setFormOpen(true) }
  const openEdit    = (c: Contact) => { setEditingContact(c); setFormOpen(true) }
  const switchLeads = () => { setActiveTab("leads"); setPage(1) }

  useEffect(() => { onOpenAdd?.(openAdd) },         [])
  useEffect(() => { onOpenExport?.(() => setExportOpen(true)) }, [])
  useEffect(() => { onSwitchToLeads?.(switchLeads) }, [])

  const handleFiltersChange = (active: ActiveFilters) => {
    const pf = active["purchases"]
    const cf = active["createdAt"]
    const ef = active["engagement"]
    const sf = active["clientStatus"]
    setServerFilters({
      purchasesMin:   pf?.type === "number-range"                      ? pf.min    : null,
      purchasesMax:   pf?.type === "number-range"                      ? pf.max    : null,
      createdYear:    cf?.type === "select"         && cf.value !== "" ? cf.value  : "",
      engagement:     ef?.type === "select"         && ef.value !== "" ? ef.value  : "",
      clientStatuses: sf?.type === "multi-select"                      ? sf.values : [],
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
        onChange={f => { setAdvanced(f); setPage(1) }}
        onClose={() => setDrawerOpen(false)}
        onClear={() => { setAdvanced(EMPTY_CONTACT_ADVANCED); setPage(1) }}
      />

      <DataTable
        data={contacts}
        loading={loading}
        columns={makeContactColumns(expandedRowId, (id) => setExpandedRowId(prev => prev === id ? null : id), (id) => navigate(`/contacts/${id}`))}
        getRowId={(c) => c.id}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(tabId) => { setActiveTab(tabId); setPage(1) }}
        onFiltersChange={handleFiltersChange}
        onSearchChange={(v) => { setNameSearch(v); setPage(1) }}
        searchPlaceholder="Pesquisar por nome..."
        onSortChange={(sort) => { setSortBy(sort?.key ?? null); setSortDir(sort?.direction ?? "asc"); setPage(1) }}
        onSelectionChange={handleSelectionChange}
        filterBarExtra={filterBarExtra}
        rowsPerPageOptions={[10, 25, 50]}
        expandedRowIds={expandedRowId ? new Set([expandedRowId]) : undefined}
        renderExpandedRow={(c) => <ContactExpandedRow contact={c} onEdit={() => openEdit(c)} />}
        onRowClick={(c) => setExpandedRowId(prev => prev === c.id ? null : c.id)}
        serverPagination={{
          total, page, pageSize,
          onPageChange: (p) => setPage(p),
          onPageSizeChange: (s) => { setPageSize(s); setPage(1) },
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
