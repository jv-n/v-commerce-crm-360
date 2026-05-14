import AddIcon from "@mui/icons-material/Add"
import CheckIcon from "@mui/icons-material/Check"
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined"
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined"
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import { cn } from "@/lib/utils"
import { StatusBadge } from "./tableComponents/badge"
import type { Sale } from "@/types/sale"

type TimelineEntry =
  | { type: "created";  date: string; client: string }
  | { type: "status";   status: Sale["status"] }
  | { type: "payment";  method: string; amount: number; value: number }

function getTimeline(sale: Sale): TimelineEntry[] {
  return [
    { type: "status",  status: sale.status },
    { type: "payment", method: sale.payment_method, amount: sale.amount, value: sale.value },
    { type: "created", date: sale.date, client: sale.client },
  ]
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function StatusIcon({ status }: { status: Sale["status"] }) {
  if (status === "Aprovado")    return <CheckIcon sx={{ fontSize: 14, color: "#9F83B2" }} />
  if (status === "Reembolsado") return <ReplayOutlinedIcon sx={{ fontSize: 13, color: "#9F83B2" }} />
  if (status === "Recusado")    return <BlockOutlinedIcon  sx={{ fontSize: 13, color: "#9F83B2" }} />
  return <CheckIcon sx={{ fontSize: 14, color: "#9F83B2" }} />
}

interface SaleExpandedRowProps {
  sale:   Sale
  onEdit: (sale: Sale) => void
}

export function SaleExpandedRow({ sale, onEdit }: SaleExpandedRowProps) {
  const timeline = getTimeline(sale)

  return (
    <div className="bg-white px-8 py-5 border-t border-violet-100">
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col min-w-0">
          {timeline.map((entry, index) => (
            <div key={`${entry.type}-${index}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                    entry.type === "created"
                      ? "border-2 border-dashed border-violet-200 bg-transparent"
                      : "bg-[#F0DDFD]"
                  )}
                >
                  {entry.type === "created"  && <AddIcon sx={{ fontSize: 13, color: "#9F83B2" }} />}
                  {entry.type === "status"   && <StatusIcon status={entry.status} />}
                  {entry.type === "payment"  && <PaymentsOutlinedIcon sx={{ fontSize: 13, color: "#9F83B2" }} />}
                </div>
                {index < timeline.length - 1 && (
                  <div className="my-1 w-px flex-1 bg-[#9F83B2]" />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1 pb-6 text-sm">
                {entry.type === "created" && (
                  <>
                    <span className="font-semibold text-gray-800">{entry.client}</span>
                    <span className="text-gray-500">realizou o</span>
                    <span className="font-medium text-violet-600">pedido</span>
                    {entry.date && (
                      <span className="ml-0.5 text-xs text-gray-400">- {entry.date}</span>
                    )}
                  </>
                )}

                {entry.type === "status" && (
                  <>
                    <span className="text-gray-500">Status atual:</span>
                    <StatusBadge status={entry.status} />
                  </>
                )}

                {entry.type === "payment" && (
                  <>
                    <span className="text-gray-500">Pagamento via</span>
                    <span className="font-semibold text-gray-800">{entry.method}</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500">{entry.amount} un.</span>
                    <span className="text-gray-400">·</span>
                    <span className="font-medium text-gray-800">{formatBRL(entry.value)}</span>
                  </>
                )}
              </div>
            </div>
          ))}
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
