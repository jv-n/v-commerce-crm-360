import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import type { Ticket } from "@/types/ticket"

import CloseIcon from "@mui/icons-material/Close"

import { DataTable } from "@/components/organisms/DataTable"
import { getTicketColumns } from "./columns"
import { fetchTicketResponsibles, fetchTickets } from "@/lib/api/tickets"
import { ExportPopover, type ExportPill } from "@/components/molecules/ExportPopover"
import type { ActiveFilters, Tab } from "@/components/organisms/DataTable/types"
import { useAuth } from "@/contexts/auth/useAuth"
import { TicketExpandedRow } from "./TicketExpandedRow"

const TABS: Tab[] = [
  { id: "all", label: "Todos os Tickets" },
  { id: "my-attending", label: "Meus Tickets em Atendimento" },
  { id: "waiting", label: "Tickets Aguardando..." },
]

const DEFAULT_PAGE_SIZE = 10

interface ServerFilters {
  responsible: string[]
  status: string[]
  problem: string[]
  score: string[]
}

interface DateFilters {
  openedFrom: string
  openedTo: string
}

const EMPTY_FILTERS: ServerFilters = {
  responsible: [],
  status: [],
  problem: [],
  score: [],
}

const EMPTY_DATE_FILTERS: DateFilters = {
  openedFrom: "",
  openedTo: "",
}

type FilterSnapshot = {
  tab: string
  page: number
  serverFilters: ServerFilters
  dateFilters: DateFilters
}

export type TicketsTableHandle = {
  undo:       () => void
  reset:      () => void
  openExport: () => void
}

type TicketsTableProps = {
  onCanUndoChange?: (can: boolean) => void
}

function formatDateInput(value: string) {
  const onlyNumbers = value.replace(/\D/g, "").slice(0, 8)

  if (onlyNumbers.length <= 2) {
    return onlyNumbers
  }

  if (onlyNumbers.length <= 4) {
    return `${onlyNumbers.slice(0, 2)}/${onlyNumbers.slice(2)}`
  }

  return `${onlyNumbers.slice(0, 2)}/${onlyNumbers.slice(2, 4)}/${onlyNumbers.slice(4)}`
}

function convertPtBrDateToIso(value: string) {
  if (value.length !== 10) {
    return ""
  }

  const [day, month, year] = value.split("/")

  if (!day || !month || !year || year.length !== 4) {
    return ""
  }

  return `${year}-${month}-${day}`
}

export const TicketsTable = forwardRef<TicketsTableHandle, TicketsTableProps>(
  ({ onCanUndoChange }, ref) => {
    const { user } = useAuth()
    const loggedUserName = user?.name?.trim() ?? ""

    const [activeTab, setActiveTab] = useState("all")
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [responsibleOptions, setResponsibleOptions] = useState<string[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set())
    const [serverFilters, setServerFilters] =
      useState<ServerFilters>(EMPTY_FILTERS)
    const [dateFilters, setDateFilters] =
      useState<DateFilters>(EMPTY_DATE_FILTERS)
    const [filterHistory, setFilterHistory] = useState<FilterSnapshot[]>([])

    const openedFromIso = convertPtBrDateToIso(dateFilters.openedFrom)
    const openedToIso = convertPtBrDateToIso(dateFilters.openedTo)

    const dateFilterCount =
      Number(Boolean(dateFilters.openedFrom)) +
      Number(Boolean(dateFilters.openedTo))

    const currentSnapshot = useRef<FilterSnapshot>({
      tab: "all",
      page: 1,
      serverFilters: EMPTY_FILTERS,
      dateFilters: EMPTY_DATE_FILTERS,
    })

    const handleToggleExpand = useCallback((id: string) => {
      setExpandedRowIds(prev => {
        const next = new Set(prev)

        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }

        return next
      })
    }, [])

    const columns = getTicketColumns(
      responsibleOptions,
      expandedRowIds,
      handleToggleExpand
    )

    useEffect(() => {
      currentSnapshot.current = {
        tab: activeTab,
        page,
        serverFilters,
        dateFilters,
      }
    }, [activeTab, page, serverFilters, dateFilters])

    useEffect(() => {
      let cancelled = false

      fetchTicketResponsibles()
        .then(data => {
          if (!cancelled) {
            setResponsibleOptions(data)
          }
        })
        .catch(console.error)

      return () => {
        cancelled = true
      }
    }, [])

    const pushHistory = useCallback(() => {
      setFilterHistory(history => [
        ...history,
        {
          ...currentSnapshot.current,
          serverFilters: { ...currentSnapshot.current.serverFilters },
          dateFilters: { ...currentSnapshot.current.dateFilters },
        },
      ])
    }, [])

    useEffect(() => {
      onCanUndoChange?.(filterHistory.length > 0)
    }, [filterHistory.length, onCanUndoChange])

    const [exportOpen,    setExportOpen]    = useState(false)
    const [exportLoading, setExportLoading] = useState(false)

    // ── Seleção acumulativa por cache ──────────────────────────────────────────
    const ticketsRef      = useRef<Ticket[]>([])
    const selectedCache   = useRef<Map<string, Ticket>>(new Map())
    const [selectedIds,   setSelectedIds]   = useState<Set<string>>(new Set())
    useEffect(() => { ticketsRef.current = tickets }, [tickets])

    const handleSelectionChange = useCallback((ids: Set<string>) => {
      const cache = selectedCache.current
      for (const id of cache.keys()) { if (!ids.has(id)) cache.delete(id) }
      for (const t of ticketsRef.current) { if (ids.has(t.id)) cache.set(t.id, t) }
      setSelectedIds(new Set(ids))
    }, [])

    const buildCSV = (rows: Ticket[]) => {
      const headers = ["ID", "Cliente", "ID Cliente", "ID Pedido", "Aberto em", "Responsável", "Problema", "Status", "Nota"]
      const lines = rows.map(t => [t.id, t.client, t.clientId, t.orderId, t.openedAt, t.responsible.name, t.problem, t.status, t.score ?? ""])
      return [headers, ...lines].map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")
    }

    const downloadCSV = (csv: string, filename: string) => {
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
    }

    const handleExportCSV = async () => {
      setExportLoading(true)
      try {
        const reqResponsible = activeTab === "my-attending" ? (loggedUserName ? [loggedUserName] : ["__none__"]) : serverFilters.responsible
        const reqStatus      = activeTab === "my-attending" ? ["Em atendimento"] : activeTab === "waiting" ? ["Aguardando"] : serverFilters.status
        const res = await fetchTickets({ page: 1, pageSize: 99999, responsible: reqResponsible, status: reqStatus, problem: serverFilters.problem, score: serverFilters.score, openedFrom: openedFromIso, openedTo: openedToIso })
        downloadCSV(buildCSV(res.data), `tickets_${new Date().toISOString().slice(0, 10)}.csv`)
        setExportOpen(false)
      } finally { setExportLoading(false) }
    }

    const handleExportSelected = async () => {
      setExportLoading(true)
      try {
        downloadCSV(buildCSV(Array.from(selectedCache.current.values())), `tickets_selecionados_${new Date().toISOString().slice(0, 10)}.csv`)
        setExportOpen(false)
      } finally { setExportLoading(false) }
    }

    const exportPills: ExportPill[] = [
      ...(activeTab === "my-attending" ? [{ label: "Aba", value: "Meus tickets" }] : []),
      ...(activeTab === "waiting"       ? [{ label: "Aba", value: "Aguardando"   }] : []),
      ...(serverFilters.responsible.length ? [{ label: "Responsável", value: serverFilters.responsible.join(", ") }] : []),
      ...(serverFilters.status.length      ? [{ label: "Status",      value: serverFilters.status.join(", ")      }] : []),
      ...(serverFilters.problem.length     ? [{ label: "Problema",    value: serverFilters.problem.join(", ")     }] : []),
      ...(serverFilters.score.length       ? [{ label: "Nota",        value: serverFilters.score.join(", ")       }] : []),
      ...(dateFilters.openedFrom           ? [{ label: "Abertura de", value: dateFilters.openedFrom               }] : []),
      ...(dateFilters.openedTo             ? [{ label: "Abertura até",value: dateFilters.openedTo                 }] : []),
    ]

    useImperativeHandle(
      ref,
      () => ({
        undo: () => {
          setFilterHistory(history => {
            if (history.length === 0) return history

            const prev = history[history.length - 1]

            setExpandedRowIds(new Set())
            setActiveTab(prev.tab)
            setPage(prev.page)
            setLoading(true)
            setServerFilters(prev.serverFilters)
            setDateFilters(prev.dateFilters)

            return history.slice(0, -1)
          })
        },
        reset: () => {
          pushHistory()
          setExpandedRowIds(new Set())
          setLoading(true)
          setActiveTab("all")
          setPage(1)
          setServerFilters(EMPTY_FILTERS)
          setDateFilters(EMPTY_DATE_FILTERS)
        },
        openExport: () => setExportOpen(true),
      }),
      [pushHistory]
    )

    const { responsible, status, problem, score } = serverFilters

    useEffect(() => {
      let cancelled = false

      const requestResponsible =
        activeTab === "my-attending"
          ? loggedUserName
            ? [loggedUserName]
            : ["__usuario_nao_encontrado__"]
          : responsible

      const requestStatus =
        activeTab === "my-attending"
          ? ["Em atendimento"]
          : activeTab === "waiting"
            ? ["Aguardando"]
            : status

      fetchTickets({
        page,
        pageSize,
        responsible: requestResponsible,
        status: requestStatus,
        problem,
        score,
        openedFrom: openedFromIso,
        openedTo: openedToIso,
      })
        .then(response => {
          if (cancelled) return

          setTickets(response.data)
          setTotal(response.total)
        })
        .catch(console.error)
        .finally(() => {
          if (!cancelled) setLoading(false)
        })

      return () => {
        cancelled = true
      }
    }, [
      page,
      pageSize,
      activeTab,
      loggedUserName,
      responsible,
      status,
      problem,
      score,
      openedFromIso,
      openedToIso,
    ])

    const handleTabChange = (tabId: string) => {
      pushHistory()
      setExpandedRowIds(new Set())
      setLoading(true)
      setActiveTab(tabId)
      setPage(1)
      setServerFilters(EMPTY_FILTERS)
      setDateFilters(EMPTY_DATE_FILTERS)
    }

    const handlePageChange = (newPage: number) => {
      setExpandedRowIds(new Set())
      setLoading(true)
      setPage(newPage)
    }

    const handlePageSizeChange = (newSize: number) => {
      setExpandedRowIds(new Set())
      setLoading(true)
      setPageSize(newSize)
      setPage(1)
    }

    const handleFiltersChange = (active: ActiveFilters) => {
      const responsibleFilter = active["responsible"]
      const statusFilter = active["status"]
      const problemFilter = active["problem"]
      const scoreFilter = active["score"]

      const getMultiSelectValues = (filter: ActiveFilters[string]) => {
        return filter?.type === "multi-select" ? filter.values : []
      }

      pushHistory()
      setExpandedRowIds(new Set())
      setLoading(true)

      setServerFilters({
        responsible: getMultiSelectValues(responsibleFilter),
        status: getMultiSelectValues(statusFilter),
        problem: getMultiSelectValues(problemFilter),
        score: getMultiSelectValues(scoreFilter),
      })

      setPage(1)
    }

    const handleDateFilterChange = (
      key: keyof DateFilters,
      value: string
    ) => {
      const formattedValue = formatDateInput(value)

      setExpandedRowIds(new Set())
      setPage(1)

      if (formattedValue.length === 0 || formattedValue.length === 10) {
        setLoading(true)
      }

      setDateFilters(prev => ({
        ...prev,
        [key]: formattedValue,
      }))
    }

    const handleClearSingleDateFilter = (key: keyof DateFilters) => {
      pushHistory()
      setExpandedRowIds(new Set())
      setLoading(true)
      setPage(1)

      setDateFilters(prev => ({
        ...prev,
        [key]: "",
      }))
    }

    const handleClearDateFilters = () => {
      setExpandedRowIds(new Set())
      setLoading(true)
      setPage(1)
      setDateFilters(EMPTY_DATE_FILTERS)
    }

    const shouldShowCustomEmptyState =
      !loading &&
      tickets.length === 0 &&
      (activeTab === "my-attending" || activeTab === "waiting")

    const emptyStateMessage =
      activeTab === "my-attending"
        ? `${loggedUserName || "Usuário"} não possui tickets em andamento`
        : "Não existem tickets em aguardo"

    return (
      <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-visible">
        <ExportPopover
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          total={total}
          entityLabel="Tickets"
          pills={exportPills}
          exportLoading={exportLoading}
          onExport={handleExportCSV}
          selectedCount={selectedIds.size}
          onExportSelected={handleExportSelected}
        />
        <DataTable
          data={tickets}
          loading={loading}
          columns={columns}
          getRowId={ticket => ticket.id}
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onFiltersChange={handleFiltersChange}
          onSelectionChange={handleSelectionChange}
          headerClassName="bg-[#F0DDFD]"
          rowClassName="hover:bg-[#F7EBFF]"
          expandedRowClassName="bg-[#F7EBFF]"
          dividersClassName="divide-[#9F83B2]"
          rowsPerPageOptions={[10, 25, 50]}
          expandedRowIds={expandedRowIds}
          renderExpandedRow={ticket => <TicketExpandedRow ticket={ticket} />}
          extraActiveFilterCount={dateFilterCount}
          onClearExtraFilters={handleClearDateFilters}
          filterBarExtra={
            <div className="flex items-center gap-2 text-sm font-medium text-[#06121C]">
              <span className="whitespace-nowrap">Data abertura:</span>

              <div className="relative">
                <input
                  value={dateFilters.openedFrom}
                  onChange={event =>
                    handleDateFilterChange("openedFrom", event.target.value)
                  }
                  placeholder="dd/mm/yyyy"
                  inputMode="numeric"
                  className="h-9 w-[138px] rounded-xl border border-[#D1B1E5] bg-white px-4 pr-8 text-sm font-medium text-[#06121C] outline-none transition-colors placeholder:text-[#9F83B2] focus:border-[#9F83B2]"
                />

                {dateFilters.openedFrom && (
                  <button
                    type="button"
                    onClick={() => handleClearSingleDateFilter("openedFrom")}
                    className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[#9F83B2] transition-colors hover:bg-[#F7EBFF] hover:text-[#6F2B90]"
                    title="Limpar data inicial"
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </button>
                )}
              </div>

              <span className="text-sm font-medium text-gray-400">até</span>

              <div className="relative">
                <input
                  value={dateFilters.openedTo}
                  onChange={event =>
                    handleDateFilterChange("openedTo", event.target.value)
                  }
                  placeholder="dd/mm/yyyy"
                  inputMode="numeric"
                  className="h-9 w-[138px] rounded-xl border border-[#D1B1E5] bg-white px-4 pr-8 text-sm font-medium text-[#06121C] outline-none transition-colors placeholder:text-[#9F83B2] focus:border-[#9F83B2]"
                />

                {dateFilters.openedTo && (
                  <button
                    type="button"
                    onClick={() => handleClearSingleDateFilter("openedTo")}
                    className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[#9F83B2] transition-colors hover:bg-[#F7EBFF] hover:text-[#6F2B90]"
                    title="Limpar data final"
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </button>
                )}
              </div>
            </div>
          }
          searchPlaceholder="Pesquisar tickets..."
          searchFn={(ticket, query) => {
            const normalizedQuery = query.toLowerCase()

            return [
              ticket.id,
              ticket.client,
              ticket.clientId,
              ticket.orderId,
              ticket.responsible.name,
              ticket.problem,
              ticket.openedAt,
              ticket.status,
              ticket.score ?? "Sem avaliação",
            ]
              .join(" ")
              .toLowerCase()
              .includes(normalizedQuery)
          }}
          serverPagination={{
            total,
            page,
            pageSize,
            onPageChange: handlePageChange,
            onPageSizeChange: handlePageSizeChange,
          }}
        />

        {shouldShowCustomEmptyState && (
          <div className="pointer-events-none absolute left-0 right-0 top-[112px] bottom-[56px] z-20 flex items-center justify-center rounded-xl bg-white">
            <div className="rounded-xl border border-[#D1B1E5] bg-[#F7EBFF] px-6 py-4 text-center text-sm font-medium text-[#06121C] shadow-sm">
              {emptyStateMessage}
            </div>
          </div>
        )}
      </div>
    )
  }
)