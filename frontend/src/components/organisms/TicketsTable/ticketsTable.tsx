import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

import CloseIcon from "@mui/icons-material/Close"

import { DataTable } from "@/components/organisms/DataTable"
import { getTicketColumns } from "./columns"
import { fetchTicketResponsibles, fetchTickets } from "@/lib/api/tickets"
import type { Ticket } from "@/types/ticket"
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
  undo: () => void
  reset: () => void
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
        <DataTable
          data={tickets}
          loading={loading}
          columns={columns}
          getRowId={ticket => ticket.id}
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onFiltersChange={handleFiltersChange}
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