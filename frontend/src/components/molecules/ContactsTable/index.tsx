import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { DataTable } from "@/components/organisms/DataTable"
import { makeContactColumns } from "./columns"
import { fetchContacts, exportContactsCSV } from "@/lib/api/contacts"
import { ContactFormSheet } from "./ContactFormSheet"
import {
  ContactAdvancedFiltersDrawer,
  EMPTY_CONTACT_ADVANCED,
  contactAdvancedActiveCount,
} from "./AdvancedFiltersDrawer"
import { ExportPopover, type ExportPill } from "@/components/molecules/ExportPopover"
import type { ContactAdvancedFilters } from "./AdvancedFiltersDrawer"
import type { Contact } from "@/types/contact"
import type { Tab, ActiveFilters } from "@/components/organisms/DataTable/types"
import { cn } from "@/lib/utils"
import AddIcon from "@mui/icons-material/Add"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined"
import TuneIcon from "@mui/icons-material/Tune"

const TABS: Tab[] = [
  { id: "all",     label: "Todos os contatos" },
  { id: "clients", label: "Todos os clientes" },
  { id: "leads",   label: "Leads" },
]

const DEFAULT_PAGE_SIZE = 10

interface ServerFilters {
  purchasesMin:   number | null
  purchasesMax:   number | null
  createdYear:    string
  engagement:     string
  clientStatuses: string[]
}

const EMPTY_FILTERS: ServerFilters = {
  purchasesMin: null, purchasesMax: null,
  createdYear: "", engagement: "", clientStatuses: [],
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
  const [nameSearch, setNameSearch]         = useState("")

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { purchasesMin, purchasesMax, createdYear, engagement, clientStatuses } = serverFilters

  useEffect(() => {
    const hasText =
      nameSearch !== "" ||
      advanced.receitaMin !== "" || advanced.receitaMax !== "" ||
      advanced.ticketMedioMin !== "" || advanced.ticketMedioMax !== "" ||
      advanced.ticketsSuporteMin !== "" || advanced.ticketsSuporteMax !== "" ||
      advanced.notaAtendMin !== "" || advanced.notaAtendMax !== "" ||
      advanced.npsMin !== "" || advanced.npsMax !== "" ||
      advanced.notaProdMin !== "" || advanced.notaProdMax !== "" ||
      advanced.taxaConversaoMin !== "" || advanced.taxaConversaoMax !== "" ||
      advanced.totalSessoesMin !== "" || advanced.totalSessoesMax !== "" ||
      advanced.abandonoCarrinhoMin !== "" || advanced.abandonoCarrinhoMax !== "" ||
      advanced.npsRecenteMin !== "" || advanced.npsRecenteMax !== ""

    const delay = hasText ? 300 : 0
    if (debounceRef.current) clearTimeout(debounceRef.current)

    let cancelled = false
    debounceRef.current = setTimeout(() => {
      setLoading(true)
      setFetchError(false)
      fetchContacts({
        page, pageSize, tab: activeTab,
        search: nameSearch,
        purchasesMin, purchasesMax, createdYear, engagement, clientStatuses,
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
        generos:            advanced.generos,
        faixasEtarias:      advanced.faixasEtarias,
        estados:            advanced.estados,
        canaisPreferidos:   advanced.canaisPreferidos,
        dispositivos:       advanced.dispositivos,
        origensSessao:      advanced.origensSessao,
        periodosDia:        advanced.periodosDia,
        diasSemana:         advanced.diasSemana,
        categoriasVisualizadas: advanced.categoriasVisualizadas,
        taxaConversaoMin:   advanced.taxaConversaoMin !== "" ? Number(advanced.taxaConversaoMin) : undefined,
        taxaConversaoMax:   advanced.taxaConversaoMax !== "" ? Number(advanced.taxaConversaoMax) : undefined,
        totalSessoesMin:    advanced.totalSessoesMin !== "" ? Number(advanced.totalSessoesMin) : undefined,
        totalSessoesMax:    advanced.totalSessoesMax !== "" ? Number(advanced.totalSessoesMax) : undefined,
        abandonoCarrinhoMin: advanced.abandonoCarrinhoMin !== "" ? Number(advanced.abandonoCarrinhoMin) : undefined,
        abandonoCarrinhoMax: advanced.abandonoCarrinhoMax !== "" ? Number(advanced.abandonoCarrinhoMax) : undefined,
        npsRecenteMin:      advanced.npsRecenteMin !== "" ? Number(advanced.npsRecenteMin) : undefined,
        npsRecenteMax:      advanced.npsRecenteMax !== "" ? Number(advanced.npsRecenteMax) : undefined,
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
    nameSearch,
    purchasesMin, purchasesMax, createdYear, engagement, clientStatuses,
    sortBy, sortDir, refetchKey, nameSearch,
    advanced,
  ])

  const [exportOpen,    setExportOpen]    = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  // ── Seleção acumulativa por cache ────────────────────────────────────────────
  const contactsRef    = useRef<Contact[]>([])
  const selectedCache  = useRef<Map<string, Contact>>(new Map())
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set())
  useEffect(() => { contactsRef.current = contacts }, [contacts])

  const handleSelectionChange = useCallback((ids: Set<string>) => {
    const cache = selectedCache.current
    for (const id of cache.keys()) { if (!ids.has(id)) cache.delete(id) }
    for (const c of contactsRef.current) { if (ids.has(c.id)) cache.set(c.id, c) }
    setSelectedIds(new Set(ids))
  }, [])

  const handleExportCSV = async () => {
    setExportLoading(true)
    try {
      await exportContactsCSV({
        tab: activeTab, search: nameSearch,
        purchasesMin, purchasesMax, createdYear, engagement, clientStatuses,
        regioes:                advanced.regioes,
        origens:                advanced.origens,
        pagamentos:             advanced.pagamentos,
        receitaMin:             advanced.receitaMin             !== "" ? Number(advanced.receitaMin)             : undefined,
        receitaMax:             advanced.receitaMax             !== "" ? Number(advanced.receitaMax)             : undefined,
        ticketMedioMin:         advanced.ticketMedioMin         !== "" ? Number(advanced.ticketMedioMin)         : undefined,
        ticketMedioMax:         advanced.ticketMedioMax         !== "" ? Number(advanced.ticketMedioMax)         : undefined,
        primeiraCompraFrom:     advanced.primeiraCompraFrom     || undefined,
        primeiraCompraTo:       advanced.primeiraCompraTo       || undefined,
        ultimaCompraFrom:       advanced.ultimaCompraFrom       || undefined,
        ultimaCompraTo:         advanced.ultimaCompraTo         || undefined,
        ticketsSuporteMin:      advanced.ticketsSuporteMin      !== "" ? Number(advanced.ticketsSuporteMin)      : undefined,
        ticketsSuporteMax:      advanced.ticketsSuporteMax      !== "" ? Number(advanced.ticketsSuporteMax)      : undefined,
        notaAtendMin:           advanced.notaAtendMin           !== "" ? Number(advanced.notaAtendMin)           : undefined,
        notaAtendMax:           advanced.notaAtendMax           !== "" ? Number(advanced.notaAtendMax)           : undefined,
        npsMin:                 advanced.npsMin                 !== "" ? Number(advanced.npsMin)                 : undefined,
        npsMax:                 advanced.npsMax                 !== "" ? Number(advanced.npsMax)                 : undefined,
        notaProdMin:            advanced.notaProdMin            !== "" ? Number(advanced.notaProdMin)            : undefined,
        notaProdMax:            advanced.notaProdMax            !== "" ? Number(advanced.notaProdMax)            : undefined,
        generos:                advanced.generos,
        faixasEtarias:          advanced.faixasEtarias,
        estados:                advanced.estados,
        canaisPreferidos:       advanced.canaisPreferidos,
        dispositivos:           advanced.dispositivos,
        origensSessao:          advanced.origensSessao,
        periodosDia:            advanced.periodosDia,
        diasSemana:             advanced.diasSemana,
        categoriasVisualizadas: advanced.categoriasVisualizadas,
        taxaConversaoMin:       advanced.taxaConversaoMin       !== "" ? Number(advanced.taxaConversaoMin)       : undefined,
        taxaConversaoMax:       advanced.taxaConversaoMax       !== "" ? Number(advanced.taxaConversaoMax)       : undefined,
        totalSessoesMin:        advanced.totalSessoesMin        !== "" ? Number(advanced.totalSessoesMin)        : undefined,
        totalSessoesMax:        advanced.totalSessoesMax        !== "" ? Number(advanced.totalSessoesMax)        : undefined,
        abandonoCarrinhoMin:    advanced.abandonoCarrinhoMin    !== "" ? Number(advanced.abandonoCarrinhoMin)    : undefined,
        abandonoCarrinhoMax:    advanced.abandonoCarrinhoMax    !== "" ? Number(advanced.abandonoCarrinhoMax)    : undefined,
        npsRecenteMin:          advanced.npsRecenteMin          !== "" ? Number(advanced.npsRecenteMin)          : undefined,
        npsRecenteMax:          advanced.npsRecenteMax          !== "" ? Number(advanced.npsRecenteMax)          : undefined,
      })
      setExportOpen(false)
    } finally { setExportLoading(false) }
  }

  const handleExportSelected = async () => {
    setExportLoading(true)
    try {
      const rows = Array.from(selectedCache.current.values())
      const headers = ["ID", "Nome", "Email", "Status", "Compras", "Última compra", "Engajamento"]
      const lines   = rows.map(c => [c.id, c.name ?? "", c.email ?? "", c.clientStatus ?? "", c.purchases, c.lastPurchase ?? "", c.engagement])
      const csv     = [headers, ...lines].map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")
      const blob    = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
      const url     = URL.createObjectURL(blob)
      const a       = document.createElement("a")
      a.href = url; a.download = `contatos_selecionados_${new Date().toISOString().slice(0, 10)}.csv`; a.click()
      URL.revokeObjectURL(url)
      setExportOpen(false)
    } finally { setExportLoading(false) }
  }

  const exportPills: ExportPill[] = [
    ...(serverFilters.clientStatuses.length  ? [{ label: "Status",      value: serverFilters.clientStatuses.join(", ") }] : []),
    ...(serverFilters.purchasesMin != null   ? [{ label: "Compras mín", value: String(serverFilters.purchasesMin)      }] : []),
    ...(serverFilters.purchasesMax != null   ? [{ label: "Compras máx", value: String(serverFilters.purchasesMax)      }] : []),
    ...(serverFilters.engagement             ? [{ label: "Engajamento", value: serverFilters.engagement                }] : []),
    ...(serverFilters.createdYear            ? [{ label: "Ano criação", value: serverFilters.createdYear               }] : []),
    ...(advanced.regioes.length              ? [{ label: "Regiões",     value: advanced.regioes.join(", ")             }] : []),
    ...(advanced.origens.length              ? [{ label: "Origens",     value: advanced.origens.join(", ")             }] : []),
    ...(advanced.pagamentos.length           ? [{ label: "Pagamentos",  value: advanced.pagamentos.join(", ")          }] : []),
    ...(advanced.receitaMin !== "" || advanced.receitaMax !== ""
      ? [{ label: "Receita", value: `${advanced.receitaMin || "—"} – ${advanced.receitaMax || "—"}` }] : []),
    ...(advanced.primeiraCompraFrom || advanced.primeiraCompraTo
      ? [{ label: "Primeira compra", value: `${advanced.primeiraCompraFrom || "—"} – ${advanced.primeiraCompraTo || "—"}` }] : []),
  ]

  const openAdd     = () => { setEditingContact(null); setFormOpen(true) }
  const openEdit    = (c: Contact) => { setEditingContact(c); setFormOpen(true) }
  const switchLeads = () => { setActiveTab("leads"); setPage(1) }

  useEffect(() => { onOpenAdd?.(openAdd) }, [])
  useEffect(() => { onOpenExport?.(() => setExportOpen(true)) }, [])
  useEffect(() => { onSwitchToLeads?.(switchLeads) }, [])

  const onToggleExpand = (id: string) =>
    setExpandedRowId(prev => prev === id ? null : id)

  const handleSortChange = (sort: { key: string; direction: "asc" | "desc" } | null) => {
    setSortBy(sort?.key ?? null)
    setSortDir(sort?.direction ?? "asc")
    setPage(1)
  }

  const handleSearchChange = useCallback((value: string) => {
    setNameSearch(value)
    setPage(1)
  }, [])

  const handlePageChange     = (newPage: number) => setPage(newPage)
  const handlePageSizeChange = (newSize: number) => { setPageSize(newSize); setPage(1) }

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
        columns={makeContactColumns(expandedRowId, onToggleExpand, (id) => navigate(`/contacts/${id}`))}

        getRowId={(c) => c.id}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(tabId) => { setActiveTab(tabId); setPage(1) }}
        onFiltersChange={handleFiltersChange}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Pesquisar por nome..."
        onSortChange={handleSortChange}
        onSelectionChange={handleSelectionChange}
        filterBarExtra={filterBarExtra}
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
