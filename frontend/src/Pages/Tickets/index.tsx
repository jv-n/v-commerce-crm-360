import { useRef, useState } from "react"

import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined"
import UndoIcon from "@mui/icons-material/Undo"
import RefreshIcon from "@mui/icons-material/Refresh"

import { cn } from "@/lib/utils"
import {
  TicketsTable,
  type TicketsTableHandle,
} from "@/components/organisms/TicketsTable/ticketsTable"

export default function Tickets() {
  const tableRef = useRef<TicketsTableHandle>(null)
  const [canUndo, setCanUndo] = useState(false)

  return (
    <div className="relative p-6 pb-20 h-full flex flex-col gap-5 bg-white min-h-full rounded-xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>

        <button className="flex items-center gap-2 bg-[#F7EBFF] border border-[#D1B1E5] rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
          <AddCircleOutlinedIcon sx={{ fontSize: 18 }} />
          Adicionar Ticket
        </button>
      </div>

      <TicketsTable
        ref={tableRef}
        onCanUndoChange={setCanUndo}
      />

      <div className="absolute left-6 right-6 bottom-14 border-t border-gray-200" />

      <div className="absolute bottom-6 right-6 flex items-center gap-4">
        <button
          onClick={() => tableRef.current?.undo()}
          disabled={!canUndo}
          title="Desfazer último filtro"
          className={cn(
            "flex items-center justify-center transition-all",
            canUndo
              ? "text-gray-900 hover:opacity-70"
              : "text-gray-300 cursor-not-allowed"
          )}
        >
          <UndoIcon sx={{ fontSize: 24 }} />
        </button>

        <button
          onClick={() => tableRef.current?.reset()}
          title="Resetar tabela"
          className="flex items-center justify-center text-gray-900 hover:opacity-70 transition-all"
        >
          <RefreshIcon sx={{ fontSize: 24 }} />
        </button>
      </div>
    </div>
  )
}