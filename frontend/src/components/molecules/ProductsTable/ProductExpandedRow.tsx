import { cn } from "@/lib/utils"
import type { Product } from "@/types/product"
import { FaPen } from "react-icons/fa6"
import AddIcon from "@mui/icons-material/Add"
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"

function RatingBadge({ rating }: { rating: number }) {
  const dot = rating >= 7 ? "bg-green-500" : rating >= 5 ? "bg-yellow-400" : "bg-red-500"
  const bg  = rating >= 7 ? "bg-green-50 text-green-700" : rating >= 5 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-600"
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold", bg)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
      {rating.toFixed(1)}
    </span>
  )
}

export function ProductExpandedRow({ product }: { product: Product }) {
  const prevRating = Math.max(1, +(product.rating - 1.8).toFixed(1))
  const prevPrice  = product.price != null ? product.price - 4 : null
  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`

  const history = [
    {
      type: "edit" as const,
      user: "Luana Ferragut",
      time: "18/04 2026 16:20",
    },
    {
      type: "rating" as const,
      user: "Thiago Botelho",
      from: prevRating,
      to: product.rating,
      time: "05/04 2026 19:15",
    },
    {
      type: "add" as const,
      user: "Ana Gomes",
      time: product.createdAt,
    },
  ]

  return (
    <div className="bg-white px-8 py-5 flex gap-8 border-t border-violet-100">
      <div className="flex-1 flex flex-col">
        {history.map((entry, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                entry.type === "add"
                  ? "border-2 border-dashed border-violet-200 bg-transparent"
                  : "bg-[#F0DDFD]"
              )}>
                {entry.type === "add"
                  ? <AddIcon sx={{ fontSize: 13, color: "#9F83B2" }} />
                  : <FaPen size={10} color="#9F83B2" />
                }
              </div>
              {i < history.length - 1 && <div className="w-px flex-1 bg-[#9F83B2] my-1" />}
            </div>

            <div className="pb-6 flex items-center gap-1 flex-wrap text-sm">
              <span className="font-semibold text-gray-900">{entry.user}</span>

              {entry.type === "edit" && prevPrice != null && (
                <>
                  <span className="text-gray-900">atualizou o valor:</span>
                  <span className="font-semibold text-gray-900">{fmt(prevPrice)} - {fmt(product.price!)}</span>
                </>
              )}
              {entry.type === "edit" && prevPrice == null && (
                <span className="text-gray-500">atualizou as informações do produto</span>
              )}

              {entry.type === "rating" && (
                <>
                  <span className="text-gray-500">atualizou avaliação de</span>
                  <RatingBadge rating={entry.from} />
                  <span className="text-gray-900">para</span>
                  <RatingBadge rating={entry.to} />
                </>
              )}

              {entry.type === "add" && (
                <>
                  <span className="text-gray-900">created</span>
                  <span className="font-medium text-violet-600">produto</span>
                </>
              )}

              <span className="text-xs text-gray-900 ml-0.5">- {entry.time}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="w-72 shrink-0">
        <h3 className="text-sm font-bold text-gray-900 mb-2 text-center">
          Resumo da <span className="text-green-500">V.IA</span>
        </h3>
        <div className="p-px rounded-lg" style={{ background: "linear-gradient(135deg, #4ade80, #2dd4bf, #818cf8)" }}>
          <div className="bg-white rounded-lg p-3 text-xs text-gray-900 space-y-2">
            <p className="text-gray-900">Um breve resumo criado pelo agente, visando facilitar o entendimento dos dados:</p>
            <p>Contato <span className="font-bold text-gray-900">Adicionado</span> no dia: {product.createdAt}</p>
            <p>Ultima <span className="font-bold text-gray-900">Compra</span>: {product.name}</p>
            <div className="pt-1 flex justify-end">
              <button className="flex items-center gap-1.5 text-xs text-gray-900 hover:text-gray-900 transition-colors">
                Faça uma pergunta
                <AutoAwesomeIcon sx={{ color: "#818cf8", fontSize: 14 }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
