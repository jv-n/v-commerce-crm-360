import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { Product } from "@/types/product"
import { FaPen } from "react-icons/fa6"
import AddIcon from "@mui/icons-material/Add"
import { fetchProductActivities, type ProductActivity } from "@/lib/api/products"
import { ProductResumoCard } from "@/Pages/Products/ProductResumoCard"

function fmtActivityDate(iso: string): string {
  const [datePart, timePart = ""] = iso.includes("T") ? iso.split("T") : iso.split(" ")
  const [y, m, d] = datePart.split("-")
  return `${d}/${m} ${y} ${timePart.slice(0, 5)}`
}

export function ProductExpandedRow({ product }: { product: Product }) {
  const [activities, setActivities] = useState<ProductActivity[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    fetchProductActivities(product.id, 3)
      .then(setActivities)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [product.id])

  return (
    <div className="bg-white px-8 py-5 flex gap-8 border-t border-violet-100">
      {/* Timeline */}
      <div className="flex-1 flex flex-col">
        {loading && (
          <p className="text-xs text-gray-400 animate-pulse py-2">Carregando atividades...</p>
        )}

        {!loading && activities.map((act, i) => (
          <div key={act.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-[#F0DDFD]">
                <FaPen size={10} color="#9F83B2" />
              </div>
              {/* linha conectora até o próximo item (sempre tem o item de criação abaixo) */}
              <div className="w-px flex-1 bg-[#9F83B2] my-1" />
            </div>

            <div className="pb-5 flex items-center gap-1 flex-wrap text-sm">
              <span className="font-semibold text-gray-900">{act.user_name}</span>
              <span className="text-gray-500">atualizou</span>
              <span className="font-medium text-gray-900">{act.field_name}:</span>
              <span className="text-gray-500">{act.old_value ?? "—"}</span>
              <span className="text-gray-500">→</span>
              <span className="font-semibold text-gray-900">{act.new_value ?? "—"}</span>
              <span className="text-xs text-gray-400 ml-0.5">- {fmtActivityDate(act.changed_at)}</span>
            </div>
          </div>
        ))}

        {/* Entrada de criação — sempre no final da linha do tempo */}
        {!loading && (
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2 border-dashed border-violet-200 bg-transparent">
                <AddIcon sx={{ fontSize: 13, color: "#9F83B2" }} />
              </div>
            </div>
            <div className="flex items-center gap-1 flex-wrap text-sm">
              <span className="text-gray-900">Produto cadastrado</span>
              {product.createdAt && (
                <span className="text-xs text-gray-400 ml-0.5">- {product.createdAt}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Resumo V.IA */}
      <div className="w-[480px] shrink-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 pb-2">
          <span className="text-base font-bold text-gray-900">Resumo da</span>
          <span
            className="text-sm font-bold text-white inline-flex items-center justify-center"
            style={{
              width: "46px",
              height: "21px",
              borderRadius: "15px",
              background: "linear-gradient(135deg, #B2C6E3 0%, #EACAFF 50%, #74FF60 100%)",
            }}
          >
            V.IA
          </span>
        </div>
        {/* Conteúdo */}
        <div className="flex-1">
          <div
            className="p-2 flex flex-col gap-2"
            style={{
              borderRadius: "7.75px",
              border: "5px solid transparent",
              background: "linear-gradient(white, white) padding-box, linear-gradient(135deg, #8BA9D5 0%, #D594FF 50%, #3FFF24 100%) border-box",
              boxShadow: "0 0 3.8px rgba(0,0,0,0.25)",
            }}
          >
            <ProductResumoCard productId={product.id} />
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-ai-chat", {
                detail: {
                  id: product.id,
                  type: "product",
                  display: product.id,
                  label: product.name,
                  sublabel: product.category,
                }
              }))}
              className="flex items-center justify-end gap-1.5 mt-1 w-full hover:opacity-70 transition-opacity"
            >
              <img src="/v_ai.svg" alt="Chat Icon" height={32} width={32} />
              <span className="text-sm text-gray-600">Faça uma pergunta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
