import { useEffect, useState } from "react"
import AddIcon from "@mui/icons-material/Add"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined"
import { fetchSaleActivities } from "@/lib/api/sales"
import type { SaleActivity } from "@/lib/api/sales"
import type { Sale } from "@/types/sale"

interface SaleExpandedRowProps {
  sale:   Sale
  onEdit: (sale: Sale) => void
}

function formatChangedAt(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
  } catch {
    return iso
  }
}

export function SaleExpandedRow({ sale, onEdit }: SaleExpandedRowProps) {
  const [activities, setActivities] = useState<SaleActivity[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchSaleActivities(sale.id)
      .then(setActivities)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [sale.id])

  return (
    <div className="bg-white px-8 py-5 border-t border-violet-100">
      <div className="flex items-start justify-between gap-6">

        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Histórico de edições</p>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map(i => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="mt-0.5 h-6 w-6 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex flex-col gap-1.5 py-1">
                    <div className="h-3 w-48 rounded bg-gray-200" />
                    <div className="h-3 w-32 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col">
              {activities.map((act, index) => {
                const isLast = index === activities.length - 1
                return (
                  <div key={act.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F0DDFD]">
                        <PaymentsOutlinedIcon sx={{ fontSize: 13, color: "#9F83B2" }} />
                      </div>
                      {(!isLast || sale.date) && (
                        <div className="my-1 w-px flex-1 bg-[#9F83B2]" />
                      )}
                    </div>
                    <div className="flex flex-col pb-5 text-sm gap-0.5">
                      <span className="font-semibold text-gray-800">
                        {act.field_name}
                        <span className="font-normal text-gray-500"> alterado de </span>
                        <span className="text-red-400 line-through">{act.old_value ?? "—"}</span>
                        <span className="font-normal text-gray-500"> para </span>
                        <span className="text-violet-600 font-medium">{act.new_value ?? "—"}</span>
                      </span>
                      <span className="text-xs text-gray-400">
                        {act.change_method} por <span className="font-medium text-gray-600">{act.user_name}</span>
                        {" · "}{formatChangedAt(act.changed_at)}
                      </span>
                    </div>
                  </div>
                )
              })}

              {activities.length === 0 && (
                <p className="text-sm text-gray-400 mb-4">Nenhuma edição registrada.</p>
              )}

              {/* creation entry always at the bottom */}
              {sale.date && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-violet-200 bg-transparent">
                      <AddIcon sx={{ fontSize: 13, color: "#9F83B2" }} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 pb-5 text-sm">
                    <span className="font-semibold text-gray-800">{sale.client}</span>
                    <span className="text-gray-500">realizou o</span>
                    <span className="font-medium text-violet-600">pedido</span>
                    <span className="ml-0.5 text-xs text-gray-400">- {sale.date}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onEdit(sale)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#D1B1E5] bg-[#F7EBFF] px-3 py-1.5 text-sm font-medium text-[#06121C] transition-colors hover:bg-[#F0D4FF]"
        >
          <EditOutlinedIcon sx={{ fontSize: 15 }} />
          Editar pedido
        </button>

      </div>
    </div>
  )
}
