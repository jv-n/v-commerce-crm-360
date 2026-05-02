import { useState } from "react"
import { cn } from "@/lib/utils"
import { mockContacts } from "@/lib/mocks/contacts"
import { StatusBadge } from "@/components/atoms/badge"
import { ContactAvatar } from "@/components/atoms/avatar"
import type { EngagementType } from "@/types/contact"
import AddIcon from "@mui/icons-material/Add"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import TuneIcon from "@mui/icons-material/Tune"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft"
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight"
import TableRowsOutlinedIcon from "@mui/icons-material/TableRowsOutlined"
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined"
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined"
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"

const TABS = [
  { id: "all",     label: "Todos os contatos" },
  { id: "clients", label: "Todos os clientes" },
  { id: "leads",   label: "Todos os Leads" },
]

const FILTER_PILLS = ["Responsável", "Data de criação", "Compras"]

const ENGAGEMENT: Record<EngagementType, { bar: string; text: string; width: string }> = {
  Promotor:      { bar: "bg-green-500",  text: "text-green-700",  width: "80%" },
  Neutro:        { bar: "bg-yellow-400", text: "text-yellow-600", width: "50%" },
  Detrator:      { bar: "bg-red-500",    text: "text-red-600",    width: "22%" },
  "Nenhum NPS":  { bar: "bg-gray-200",   text: "text-gray-400",   width: "0%" },
}

export function ContactsTable() {
  const [activeTab, setActiveTab]       = useState("all")
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage]   = useState(1)
  const [rowsPerPage, setRowsPerPage]   = useState(10)

  const filteredContacts = (() => {
    if (activeTab === "clients")
      return mockContacts.filter(c =>
        ["Cliente Ativo", "Cliente VIP", "Cliente Inativo"].includes(c.status)
      )
    if (activeTab === "leads")
      return mockContacts.filter(c => c.status === "Lead")
    return mockContacts
  })()

  const totalContacts  = filteredContacts.length
  const totalPages     = Math.max(1, Math.ceil(totalContacts / rowsPerPage))
  const safePage       = Math.min(currentPage, totalPages)
  const pageContacts   = filteredContacts.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage)

  const isAllSelected  = pageContacts.length > 0 && pageContacts.every(c => selectedRows.has(c.id))

  const toggleAll = () => {
    const next = new Set(selectedRows)
    if (isAllSelected) pageContacts.forEach(c => next.delete(c.id))
    else               pageContacts.forEach(c => next.add(c.id))
    setSelectedRows(next)
  }

  const toggleRow = (id: string) => {
    const next = new Set(selectedRows)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelectedRows(next)
  }

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setCurrentPage(1)
    setSelectedRows(new Set())
  }

  const handleRowsPerPageChange = (val: number) => {
    setRowsPerPage(val)
    setCurrentPage(1)
  }

  const startItem = totalContacts === 0 ? 0 : (safePage - 1) * rowsPerPage + 1
  const endItem   = Math.min(safePage * rowsPerPage, totalContacts)

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">

      {/* ── Tabs + Right Controls ─────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4">
        <div className="flex items-center">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === tab.id
                  ? "border-gray-800 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              )}
            >
              <TableRowsOutlinedIcon sx={{ fontSize: 15 }} />
              {tab.label}
            </button>
          ))}
          <button className="p-2 ml-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
            <AddIcon sx={{ fontSize: 16 }} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 text-sm text-gray-600 border border-gray-200 rounded-md px-3 py-1.5 hover:bg-gray-50">
            Todos os estados
            <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
          </button>
          <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
            <SearchOutlinedIcon sx={{ fontSize: 18 }} />
          </button>
          <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
            <button className="p-1.5 bg-gray-100 text-gray-700 border-r border-gray-200">
              <TableRowsOutlinedIcon sx={{ fontSize: 16 }} />
            </button>
            <button className="p-1.5 text-gray-400 hover:bg-gray-50">
              <GridViewOutlinedIcon sx={{ fontSize: 16 }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-gray-200 bg-gray-50/60 flex-wrap">
        <span className="text-sm text-gray-400 font-medium">Filtrar por:</span>
        {FILTER_PILLS.map(opt => (
          <button
            key={opt}
            className="flex items-center gap-1 text-sm text-gray-700 bg-white border border-gray-200 rounded-md px-3 py-1.5 hover:bg-gray-50 shadow-sm"
          >
            {opt}
            <KeyboardArrowDownIcon sx={{ fontSize: 14 }} />
          </button>
        ))}
        <button className="p-1.5 text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50">
          <AddIcon sx={{ fontSize: 14 }} />
        </button>
        <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 ml-1">
          <TuneIcon sx={{ fontSize: 15 }} />
          Filtros avançados
        </button>
      </div>

      {/* ── Table ─────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-gray-800"
                />
              </th>
              <th className="w-8 px-2 py-3 text-center">
                <InfoOutlinedIcon sx={{ fontSize: 15, color: "#9CA3AF" }} />
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[160px]">Nome</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[160px]">Responsável</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[130px]">Status</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[130px]">Última compra</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[80px]">Compras</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[160px]">Contatos</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[140px]">Engajamento</th>
              <th className="w-20 px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageContacts.map(contact => {
              const eng = ENGAGEMENT[contact.engagement]
              const isSelected = selectedRows.has(contact.id)
              return (
                <tr
                  key={contact.id}
                  className={cn(
                    "hover:bg-gray-50/80 transition-colors",
                    isSelected && "bg-blue-50/60"
                  )}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRow(contact.id)}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-gray-800"
                    />
                  </td>

                  {/* Info icon */}
                  <td className="px-2 py-3 text-center">
                    <InfoOutlinedIcon sx={{ fontSize: 15, color: "#D1D5DB" }} />
                  </td>

                  {/* Nome */}
                  <td className="px-3 py-3">
                    <span className="font-medium text-gray-900 truncate block max-w-[200px]">
                      {contact.name}
                    </span>
                  </td>

                  {/* Responsável */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <ContactAvatar initials={contact.responsible.initials} bgColor={contact.responsible.bgColor} />
                      <span className="text-gray-600 text-xs whitespace-nowrap">{contact.responsible.name}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3">
                    <StatusBadge status={contact.status} />
                  </td>

                  {/* Última compra */}
                  <td className="px-3 py-3">
                    {contact.lastPurchase ? (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <AccessTimeOutlinedIcon sx={{ fontSize: 14, color: "#9CA3AF" }} />
                        <span className="text-xs">{contact.lastPurchase}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Nenhuma compra</span>
                    )}
                  </td>

                  {/* Compras */}
                  <td className="px-3 py-3 text-gray-800 font-medium">
                    {contact.purchases}
                  </td>

                  {/* Contatos */}
                  <td className="px-3 py-3">
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <div>{contact.email}</div>
                      <div>{contact.phone}</div>
                    </div>
                  </td>

                  {/* Engajamento */}
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1 min-w-[110px]">
                      <span className={cn("text-xs font-medium", eng.text)}>
                        {contact.engagement}
                      </span>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={cn("h-1.5 rounded-full transition-all", eng.bar)}
                          style={{ width: eng.width }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Editar */}
                  <td className="px-3 py-3">
                    <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded px-2 py-1 transition-colors">
                      <EditOutlinedIcon sx={{ fontSize: 13 }} />
                      Editar
                    </button>
                  </td>
                </tr>
              )
            })}

            {pageContacts.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-sm text-gray-400">
                  Nenhum contato encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Rows per page</span>
          <select
            value={rowsPerPage}
            onChange={e => handleRowsPerPageChange(Number(e.target.value))}
            className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <KeyboardArrowLeftIcon sx={{ fontSize: 18 }} />
          </button>

          {pageNumbers.map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={cn(
                "w-8 h-8 text-sm rounded transition-colors",
                safePage === page
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <KeyboardArrowRightIcon sx={{ fontSize: 18 }} />
          </button>
        </div>

        <span className="text-sm text-gray-500">
          {startItem}–{endItem} of {totalContacts}
        </span>
      </div>
    </div>
  )
}
