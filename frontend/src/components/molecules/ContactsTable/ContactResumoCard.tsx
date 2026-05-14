import { useEffect, useState } from "react"
import { fetchContactResumo, type ContactResumo } from "@/lib/api/contacts"
import InsightsIcon from "@mui/icons-material/Insights"

function fmt(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
}

interface Topic {
  label: string
  value: string
}

function buildTopics(resumo: ContactResumo): Topic[] {
  return [
    {
      label: "Categoria mais comprada",
      value: resumo.categoria_mais_comprada ?? "—",
    },
    {
      label: "Produto mais caro comprado",
      value: resumo.produto_mais_caro
        ? `${resumo.produto_mais_caro}${resumo.produto_mais_caro_valor != null ? ` · ${fmt(resumo.produto_mais_caro_valor)}` : ""}`
        : "—",
    },
    {
      label: "Método de pagamento favorito",
      value: resumo.metodo_pagamento_favorito ?? "—",
    },
    {
      label: "Produto mais comprado",
      value: resumo.produto_mais_comprado
        ? `${resumo.produto_mais_comprado}${resumo.produto_mais_comprado_qty != null ? ` · ${Math.round(resumo.produto_mais_comprado_qty)}x` : ""}`
        : "—",
    },
  ]
}

export function ContactResumoCard({ contactId }: { contactId: string }) {
  const [resumo, setResumo]   = useState<ContactResumo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetchContactResumo(contactId)
      .then(setResumo)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [contactId])

  const topics = resumo ? buildTopics(resumo) : []

  return (
    <div>
      <h3 className="text-sm font-bold text-gray-900 mb-2 text-center">
        Resumo{" "}
        <InsightsIcon sx={{ fontSize: 14, color: "#10b981", verticalAlign: "middle" }} />
      </h3>

      <div
        className="p-px rounded-lg"
        style={{ background: "linear-gradient(135deg, #4ade80, #2dd4bf, #818cf8)" }}
      >
        <div className="bg-white rounded-lg p-3 text-xs text-gray-700 space-y-2.5">
          {loading && (
            <p className="text-gray-400 text-center py-2 animate-pulse">
              Carregando resumo...
            </p>
          )}

          {error && (
            <p className="text-red-400 text-center py-2">
              Não foi possível carregar o resumo.
            </p>
          )}

          {!loading && !error && topics.map((t, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <span className="text-gray-400 font-medium uppercase tracking-wide" style={{ fontSize: "10px" }}>
                {t.label}
              </span>
              <span className="font-semibold text-gray-900 text-xs">
                {t.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
