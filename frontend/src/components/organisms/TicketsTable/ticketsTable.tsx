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
import { ExportPopover, type ExportPill } from "@/components/molecules/ExportPopover"
import { getTicketColumns } from "./columns"
import { fetchTicketResponsibles, fetchTickets } from "@/lib/api/tickets"
import type { Ticket } from "@/types/ticket"
import type { ActiveFilters, Tab } from "@/components/organisms/DataTable/types"
import { useAuth } from "@/contexts/auth/useAuth"
import { TicketExpandedRow } from "./TicketExpandedRow"
import { cn } from "@/lib/utils"

const TABS: Tab[] = [
  { id: "all", label: "Todos os Tickets" },
  { id: "my-attending", label: "Meus Tickets em Atendimento" },
  { id: "waiting", label: "Tickets Aguardando..." },
]

const DEFAULT_PAGE_SIZE = 10
const EXPORT_PAGE_SIZE = 500000

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

type TicketSort = {
  key: string
  direction: "asc" | "desc"
} | null

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
  sort: TicketSort
}

export type TicketsTableHandle = {
  undo: () => void
  reset: () => void
  openExport: () => void
  openAdd: () => void
}

type TicketsTableProps = {
  onCanUndoChange?: (can: boolean) => void
}

function escapeCsvValue(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`
}

function buildTicketsCsv(rows: Ticket[]) {
  const headers = [
    "ID Ticket",
    "Cliente",
    "ID Cliente",
    "ID Pedido",
    "Data de abertura",
    "Responsável",
    "Problema",
    "Status",
    "Nota",
  ]

  const lines = rows.map(ticket => [
    ticket.id,
    ticket.client,
    ticket.clientId,
    ticket.orderId,
    ticket.openedAt,
    ticket.responsible.name,
    ticket.problem,
    ticket.status,
    ticket.score ?? "Sem avaliação",
  ])

  return [headers, ...lines]
    .map(row => row.map(escapeCsvValue).join(","))
    .join("\n")
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

function formatDateForPill(value: string) {
  if (!value) return ""

  const [year, month, day] = value.split("-")

  if (!year || !month || !day) {
    return value
  }

  return `${day}/${month}/${year}`
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
    const [filterHistory, setFilterHistory] = useState<FilterSnapshot[]>([])
    const [exportOpen, setExportOpen] = useState(false)

    const [exportLoading, setExportLoading] = useState(false)

    const openedFromIso = dateFilters.openedFrom
    const openedToIso = dateFilters.openedTo

    const dateFilterCount =
      Number(Boolean(dateFilters.openedFrom)) +
      Number(Boolean(dateFilters.openedTo))

    const currentSnapshot = useRef<FilterSnapshot>({
      tab: "all",
      page: 1,
      serverFilters: EMPTY_FILTERS,
      dateFilters: EMPTY_DATE_FILTERS,
      sort: null,
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
        sort,
      }
    }, [activeTab, page, serverFilters, dateFilters, sort])

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

    const getRequestFilters = useCallback(() => {
      const requestResponsible =
        activeTab === "my-attending"
          ? loggedUserName
            ? [loggedUserName]
            : ["__usuario_nao_encontrado__"]
          : serverFilters.responsible

      const requestStatus =
        activeTab === "my-attending"
          ? ["Em atendimento"]
          : activeTab === "waiting"
            ? ["Aguardando"]
            : serverFilters.status

      return {
        responsible: requestResponsible,
        status: requestStatus,
        problem: serverFilters.problem,
        score: serverFilters.score,
      }
    }, [activeTab, loggedUserName, serverFilters])

    const handleExportCsv = useCallback(async () => {
      setExportLoading(true)

      try {
        const requestFilters = getRequestFilters()

        const response = await fetchTickets({
          page: 1,
          pageSize: EXPORT_PAGE_SIZE,
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
    }, [dateFilters.openedFrom, dateFilters.openedTo, getRequestFilters, sort])

    const handleExportSelected = useCallback(async () => {
      setExportLoading(true)

      try {
        const today = new Date().toISOString().slice(0, 10)

        downloadCsv(buildTicketsCsv([]), `tickets_selecionados_${today}.csv`)
        setExportOpen(false)
      } catch (error) {
        console.error(error)
      } finally {
        setExportLoading(false)
      }
    }, [])

    const exportPills: ExportPill[] = useMemo(
      () => [
        ...(activeTab === "my-attending"
          ? [{ label: "Aba", value: "Meus Tickets" }]
          : []),
        ...(activeTab === "waiting"
          ? [{ label: "Aba", value: "Aguardando" }]
          : []),
        ...(serverFilters.responsible.length
          ? [
              {
                label: "Responsável",
                value: serverFilters.responsible.join(", "),
              },
            ]
          : []),
        ...(serverFilters.status.length
          ? [
              {
                label: "Status",
                value: serverFilters.status.join(", "),
              },
            ]
          : []),
        ...(serverFilters.problem.length
          ? [
              {
                label: "Problema",
                value: serverFilters.problem.join(", "),
              },
            ]
          : []),
        ...(serverFilters.score.length
          ? [
              {
                label: "Nota",
                value: serverFilters.score.join(", "),
              },
            ]
          : []),
        ...(dateFilters.openedFrom
          ? [
              {
                label: "Data início",
                value: formatDateForPill(dateFilters.openedFrom),
              },
            ]
          : []),
        ...(dateFilters.openedTo
          ? [
              {
                label: "Data fim",
                value: formatDateForPill(dateFilters.openedTo),
              },
            ]
          : []),
      ],
      [
        activeTab,
        serverFilters.responsible,
        serverFilters.status,
        serverFilters.problem,
        serverFilters.score,
        dateFilters.openedFrom,
        dateFilters.openedTo,
      ]
    )

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
        },
        openExport: () => setExportOpen(true),
        openAdd: () => {
          // Mantém o botão disponível sem interferir na exportação.
          // Caso exista modal/fluxo de criação de ticket no projeto,
          // conecte a abertura dele aqui.
          console.info("Abrir fluxo de criação de ticket")
        },
      }),
      [pushHistory]
    )

    const { responsible, status, problem, score } = serverFilters

    useEffect(() => {
      let cancelled = false

      const requestFilters = getRequestFilters()

      fetchTickets({
        page,
        pageSize,
        responsible: requestFilters.responsible,
        status: requestFilters.status,
        problem,
        score,
        openedFrom: openedFromIso,
        openedTo: openedToIso,
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
      sort,
      getRequestFilters,
    ])

    const handleTabChange = (tabId: string) => {
      pushHistory()
      setExpandedRowIds(new Set())
      setLoading(true)
      setActiveTab(tabId)
      setPage(1)
      setServerFilters(EMPTY_FILTERS)
      setDateFilters(EMPTY_DATE_FILTERS)
      setSort(null)
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

    const handleDateFilterChange = (key: keyof DateFilters, value: string) => {
      setExpandedRowIds(new Set())
      setLoading(true)
      setPage(1)

      setDateFilters(prev => ({
        ...prev,
        [key]: value,
      }))
    }

    const handleClearDateFilters = () => {
      setExpandedRowIds(new Set())
      setLoading(true)
      setPage(1)
      setDateFilters(EMPTY_DATE_FILTERS)
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
          selectedCount={0}
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
          onSortChange={handleSortChange}
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