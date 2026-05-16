import { cn } from "@/lib/utils"
import type { Contact } from "@/types/contact"
import AddIcon from "@mui/icons-material/Add"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined"

export function ContactExpandedRow({ contact, onEdit }: { contact: Contact; onEdit: () => void }) {
  const history = [
    ...(contact.lastPurchase
      ? [{ type: "purchase" as const, text: "realizou uma compra", time: contact.lastPurchase }]
      : []),
    { type: "edit" as const, text: "teve o status atualizado", time: "01/01 2025 10:00" },
    { type: "add"  as const, text: "foi adicionado como contato", time: contact.createdAt ?? "—" },
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
                {entry.type === "add"      && <AddIcon                  sx={{ fontSize: 13, color: "#9CA3AF" }} />}
                {entry.type === "edit"     && <EditOutlinedIcon         sx={{ fontSize: 12, color: "#7C3AED" }} />}
                {entry.type === "purchase" && <ShoppingCartOutlinedIcon sx={{ fontSize: 12, color: "#7C3AED" }} />}
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
