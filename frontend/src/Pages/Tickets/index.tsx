import { useRef, useState } from "react"

import UndoIcon from "@mui/icons-material/Undo"
import RefreshIcon from "@mui/icons-material/Refresh"

import { AddCircleButtonIcon } from "@/components/atoms/add-circle-button-icon"
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

        <button className="flex items-center gap-2 rounded-lg border border-[#D1B1E5] bg-[#F7EBFF] px-3.5 py-1.5 text-[15px] font-medium text-[#06121C] shadow-sm transition-colors hover:bg-[#F0DDFD]">
          <AddCircleButtonIcon />
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