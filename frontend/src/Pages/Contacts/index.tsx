import { useState, useCallback } from "react"
import { ContactsTable } from "@/components/molecules/ContactsTable"
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined"

export default function Contacts() {
  const [openAdd, setOpenAdd] = useState<(() => void) | null>(null)

  const handleOpenAdd = useCallback((fn: () => void) => {
    setOpenAdd(() => fn)
  }, [])

  return (
    <div className="relative p-6 h-full flex flex-col gap-5 bg-white min-h-full rounded-xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Contatos</h1>
        <button
          onClick={() => openAdd?.()}
          className="flex items-center gap-2 bg-[#F7EBFF] border border-[#D1B1E5] rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
        >
          <AddCircleOutlinedIcon sx={{ fontSize: 18 }} />
          Adicionar contato
        </button>
      </div>

      <ContactsTable onOpenAdd={handleOpenAdd} />
    </div>
  )
}
