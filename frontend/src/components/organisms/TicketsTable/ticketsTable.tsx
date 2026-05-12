import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

import { DataTable } from "@/components/organisms/DataTable"
import { getTicketColumns } from "./columns"
import { fetchTicketResponsibles, fetchTickets } from "@/lib/api/tickets"
import type { Ticket } from "@/types/ticket"
import type { ActiveFilters, Tab } from "@/components/organisms/DataTable/types"

const TABS: Tab[] = [
  { id: "contacts", label: "Todos os contatos" },
  { id: "clients", label: "Todos os clientes" },
  { id: "leads", label: "Todos os Leads" },
]

const DEFAULT_PAGE_SIZE = 10

interface ServerFilters {
  responsible: string
  status: string
  problem: string
  score: string
}

const EMPTY_FILTERS: ServerFilters = {
  responsible: "",
  status: "",
  problem: "",
  score: "",
}

type FilterSnapshot = {
  tab: string
  page: number
  serverFilters: ServerFilters
}

export type TicketsTableHandle = {
  undo: () => void
  reset: () => void
}

type TicketsTableProps = {
  onCanUndoChange?: (can: boolean) => void
}

export const TicketsTable = forwardRef<TicketsTableHandle, TicketsTableProps>(
  ({ onCanUndoChange }, ref) => {
    const [activeTab, setActiveTab] = useState("contacts")
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [responsibleOptions, setResponsibleOptions] = useState<string[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [serverFilters, setServerFilters] =
      useState<ServerFilters>(EMPTY_FILTERS)
    const [filterHistory, setFilterHistory] = useState<FilterSnapshot[]>([])

    const currentSnapshot = useRef<FilterSnapshot>({
      tab: "contacts",
      page: 1,
      serverFilters: EMPTY_FILTERS,
    })

    const columns = getTicketColumns(responsibleOptions)

    useEffect(() => {
      currentSnapshot.current = { tab: activeTab, page, serverFilters }
    }, [activeTab, page, serverFilters])

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
      setFilterHistory(history => [...history, { ...currentSnapshot.current }])
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

            setActiveTab(prev.tab)
            setPage(prev.page)
            setLoading(true)
            setServerFilters(prev.serverFilters)

            return history.slice(0, -1)
          })
        },
        reset: () => {
          pushHistory()
          setLoading(true)
          setActiveTab("contacts")
          setPage(1)
          setServerFilters(EMPTY_FILTERS)
        },
      }),
      [pushHistory]
    )

    const { responsible, status, problem, score } = serverFilters

    useEffect(() => {
      let cancelled = false

      fetchTickets({
        page,
        pageSize,
        tab: activeTab,
        responsible,
        status,
        problem,
        score,
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
    }, [page, pageSize, activeTab, responsible, status, problem, score])

    const handleTabChange = (tabId: string) => {
      pushHistory()
      setLoading(true)
      setActiveTab(tabId)
      setPage(1)
      setServerFilters(EMPTY_FILTERS)
    }

    const handlePageChange = (newPage: number) => {
      setLoading(true)
      setPage(newPage)
    }

    const handlePageSizeChange = (newSize: number) => {
      setLoading(true)
      setPageSize(newSize)
      setPage(1)
    }

    const handleFiltersChange = (active: ActiveFilters) => {
      const responsibleFilter = active["responsible"]
      const statusFilter = active["status"]
      const problemFilter = active["problem"]
      const scoreFilter = active["score"]

      pushHistory()
      setLoading(true)

      setServerFilters({
        responsible:
          responsibleFilter?.type === "select" && responsibleFilter.value
            ? responsibleFilter.value
            : "",
        status:
          statusFilter?.type === "select" && statusFilter.value
            ? statusFilter.value
            : "",
        problem:
          problemFilter?.type === "select" && problemFilter.value
            ? problemFilter.value
            : "",
        score:
          scoreFilter?.type === "select" && scoreFilter.value
            ? scoreFilter.value
            : "",
      })

      setPage(1)
    }

    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
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
          dividersClassName="divide-[#9F83B2]"
          rowsPerPageOptions={[10, 25, 50]}
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
      </div>
    )
  }
)