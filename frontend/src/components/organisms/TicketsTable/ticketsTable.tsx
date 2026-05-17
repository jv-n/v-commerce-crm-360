import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"

import { DataTable } from "@/components/organisms/DataTable"
import { ExportPopover } from "@/components/molecules/ExportPopover"
import { getTicketColumns } from "./columns"
import { fetchTicketResponsibles, fetchTickets } from "@/lib/api/tickets"
import type { Ticket } from "@/types/ticket"
import type { ActiveFilters } from "@/components/organisms/DataTable/types"
import { useAuth } from "@/contexts/auth/useAuth"
import { TicketExpandedRow } from "./TicketExpandedRow"
import { cn } from "@/lib/utils"

import {
  DEFAULT_PAGE_SIZE,
  EMPTY_DATE_FILTERS,
  EMPTY_FILTERS,
  EXPORT_PAGE_SIZE,
  TABS,
  type DateFilters,
  type FilterSnapshot,
  type ServerFilters,
  type TicketSort,
} from "./ticketConstants"
import { buildTicketsCsv, downloadCsv } from "./ticketExport"
import {
  buildTicketExportPills,
  getTicketRequestFilters,
} from "./ticketFilters"

export type TicketsTableHandle = {
  undo: () => void
  reset: () => void
  openExport: () => void
  openAdd: () => void
}

type TicketsTableProps = {
  onCanUndoChange?: (can: boolean) => void
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
    const [sort, setSort] = useState<TicketSort>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterHistory, setFilterHistory] = useState<FilterSnapshot[]>([])
    const [exportOpen, setExportOpen] = useState(false)
    const [exportLoading, setExportLoading] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    const ticketsRef = useRef<Ticket[]>([])
    const selectedCache = useRef<Map<string, Ticket>>(new Map())

    const dateFilterCount =
      Number(Boolean(dateFilters.openedFrom)) +
      Number(Boolean(dateFilters.openedTo))

    const currentSnapshot = useRef<FilterSnapshot>({
      tab: "all",
      page: 1,
      serverFilters: EMPTY_FILTERS,
      dateFilters: EMPTY_DATE_FILTERS,
      sort: null,
      searchQuery: "",
    })

    useEffect(() => {
      ticketsRef.current = tickets
    }, [tickets])

    const clearSelection = useCallback(() => {
      selectedCache.current.clear()
      setSelectedIds(new Set())
    }, [])

    const handleSelectionChange = useCallback((ids: Set<string>) => {
      const cache = selectedCache.current

      for (const id of Array.from(cache.keys())) {
        if (!ids.has(id)) {
          cache.delete(id)
        }
      }

      for (const ticket of ticketsRef.current) {
        if (ids.has(ticket.id)) {
          cache.set(ticket.id, ticket)
        }
      }

      setSelectedIds(new Set(ids))
    }, [])

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
        sort,
        searchQuery,
      }
    }, [activeTab, page, serverFilters, dateFilters, sort, searchQuery])

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
          sort: currentSnapshot.current.sort
            ? { ...currentSnapshot.current.sort }
            : null,
        },
      ])
    }, [])

    useEffect(() => {
      onCanUndoChange?.(filterHistory.length > 0)
    }, [filterHistory.length, onCanUndoChange])

    const requestFilters = useMemo(
      () =>
        getTicketRequestFilters(activeTab, loggedUserName, serverFilters),
      [activeTab, loggedUserName, serverFilters]
    )

    const exportPills = useMemo(
      () =>
        buildTicketExportPills(
          activeTab,
          searchQuery,
          serverFilters,
          dateFilters
        ),
      [activeTab, searchQuery, serverFilters, dateFilters]
    )

    const handleExportCsv = useCallback(async () => {
      setExportLoading(true)

      try {
        const response = await fetchTickets({
          page: 1,
          pageSize: EXPORT_PAGE_SIZE,
          search: searchQuery,
          responsible: requestFilters.responsible,
          status: requestFilters.status,
          problem: requestFilters.problem,
          score: requestFilters.score,
          openedFrom: dateFilters.openedFrom,
          openedTo: dateFilters.openedTo,
          sortKey: sort?.key,
          sortDir: sort?.direction,
        })

        const csv = buildTicketsCsv(response.data)
        const today = new Date().toISOString().slice(0, 10)

        downloadCsv(csv, `tickets_${today}.csv`)
        setExportOpen(false)
      } catch (error) {
        console.error(error)
      } finally {
        setExportLoading(false)
      }
    }, [dateFilters, requestFilters, searchQuery, sort])

    const handleExportSelected = useCallback(async () => {
      setExportLoading(true)

      try {
        const selectedTickets = Array.from(selectedCache.current.values())
        const today = new Date().toISOString().slice(0, 10)

        downloadCsv(
          buildTicketsCsv(selectedTickets),
          `tickets_selecionados_${today}.csv`
        )

        setExportOpen(false)
      } catch (error) {
        console.error(error)
      } finally {
        setExportLoading(false)
      }
    }, [])

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
            setSort(prev.sort)
            setSearchQuery(prev.searchQuery)
            clearSelection()

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
          setSort(null)
          setSearchQuery("")
          clearSelection()
        },
        openExport: () => setExportOpen(true),
        openAdd: () => {
          console.info("Abrir fluxo de criação de ticket")
        },
      }),
      [clearSelection, pushHistory]
    )

    useEffect(() => {
      let cancelled = false

      fetchTickets({
        page,
        pageSize,
        search: searchQuery,
        responsible: requestFilters.responsible,
        status: requestFilters.status,
        problem: requestFilters.problem,
        score: requestFilters.score,
        openedFrom: dateFilters.openedFrom,
        openedTo: dateFilters.openedTo,
        sortKey: sort?.key,
        sortDir: sort?.direction,
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
    }, [page, pageSize, searchQuery, requestFilters, dateFilters, sort])

    const handleTabChange = (tabId: string) => {
      pushHistory()
      setExpandedRowIds(new Set())
      setLoading(true)
      setActiveTab(tabId)
      setPage(1)
      setServerFilters(EMPTY_FILTERS)
      setDateFilters(EMPTY_DATE_FILTERS)
      setSort(null)
      setSearchQuery("")
      clearSelection()
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
      clearSelection()

      setServerFilters({
        responsible: getMultiSelectValues(responsibleFilter),
        status: getMultiSelectValues(statusFilter),
        problem: getMultiSelectValues(problemFilter),
        score: getMultiSelectValues(scoreFilter),
      })

      setPage(1)
    }

    const handleDateFilterChange = (key: keyof DateFilters, value: string) => {
      pushHistory()
      setExpandedRowIds(new Set())
      setLoading(true)
      setPage(1)
      clearSelection()

      setDateFilters(prev => ({
        ...prev,
        [key]: value,
      }))
    }

    const handleClearDateFilters = () => {
      pushHistory()
      setExpandedRowIds(new Set())
      setLoading(true)
      setPage(1)
      clearSelection()
      setDateFilters(EMPTY_DATE_FILTERS)
    }

    const handleSearchChange = (query: string) => {
      setExpandedRowIds(new Set())
      setLoading(true)
      setPage(1)
      clearSelection()
      setSearchQuery(query)
    }

    const handleSortChange = (
      nextSort: { key: string; direction: "asc" | "desc" } | null
    ) => {
      pushHistory()
      setExpandedRowIds(new Set())
      setLoading(true)
      setPage(1)
      setSort(nextSort)
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
          onExport={handleExportCsv}
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
          onSortChange={handleSortChange}
          onSearchChange={handleSearchChange}
          headerClassName="
            bg-[#F0DDFD]
            [&_th:not(:first-child)_button_svg]:!text-[#9F83B2]
            [&_th:not(:first-child)_button:hover_svg]:!text-[#6F2B90]
          "
          rowClassName="hover:bg-[#F7EBFF]"
          expandedRowClassName="bg-[#F7EBFF]"
          dividersClassName="divide-[#9F83B2]"
          rowsPerPageOptions={[10, 25, 50]}
          expandedRowIds={expandedRowIds}
          renderExpandedRow={ticket => <TicketExpandedRow ticket={ticket} />}
          extraActiveFilterCount={dateFilterCount}
          onClearExtraFilters={handleClearDateFilters}
          filterBarExtra={
            <div
              className={cn(
                "flex items-center gap-2 text-sm font-medium text-[#06121C] transition-opacity",
                exportOpen && "pointer-events-none opacity-60"
              )}
            >
              <span className="whitespace-nowrap">Data abertura:</span>

              <input
                type="date"
                value={dateFilters.openedFrom}
                disabled={exportOpen}
                onChange={event =>
                  handleDateFilterChange("openedFrom", event.target.value)
                }
                className={cn(
                  "h-9 w-[150px] rounded-xl border border-[#D1B1E5] bg-white px-2.5 text-sm font-medium text-[#06121C] outline-none transition-colors focus:border-[#9F83B2] disabled:cursor-not-allowed disabled:opacity-100 [color-scheme:light] [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer",
                  exportOpen && "brightness-90"
                )}
              />

              <span className="text-sm font-medium text-gray-400">até</span>

              <input
                type="date"
                value={dateFilters.openedTo}
                disabled={exportOpen}
                onChange={event =>
                  handleDateFilterChange("openedTo", event.target.value)
                }
                className={cn(
                  "h-9 w-[150px] rounded-xl border border-[#D1B1E5] bg-white px-2.5 text-sm font-medium text-[#06121C] outline-none transition-colors focus:border-[#9F83B2] disabled:cursor-not-allowed disabled:opacity-100 [color-scheme:light] [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer",
                  exportOpen && "brightness-90"
                )}
              />
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