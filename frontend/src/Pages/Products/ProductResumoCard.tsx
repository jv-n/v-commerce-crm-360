import { useEffect, useState } from "react"
import { fetchProductResumo, type ProductResumo } from "@/lib/api/products"

function fmtCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function fmtMes(anoMes: string): string {
  const [y, m] = anoMes.split("-")
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  return `${meses[parseInt(m, 10) - 1] ?? m}/${y}`
}

interface Topic {
  label: string
  value: string
}

function buildTopics(resumo: ProductResumo): Topic[] {
  return [
    {
      label: "Receita total",
      value: resumo.receita_total != null ? fmtCurrency(resumo.receita_total) : "—",
    },
    {
      label: "Melhor mês de vendas",
      value: resumo.melhor_mes ? fmtMes(resumo.melhor_mes) : "—",
    },
    {
      label: "Método de pagamento favorito",
      value: resumo.metodo_pagamento_favorito ?? "—",
    },
    {
      label: "Problema mais frequente em tickets",
      value: resumo.problema_mais_frequente ?? "—",
    },
  ]
}

interface Props {
  productId: string
  data?: ProductResumo
}

export function ProductResumoCard({ productId, data }: Props) {
  const [resumo,  setResumo]  = useState<ProductResumo | null>(data ?? null)
  const [loading, setLoading] = useState(!data)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    if (data) {
      setResumo(data)
      setLoading(false)
      setError(false)
      return
    }
    setLoading(true)
    setError(false)
    fetchProductResumo(productId)
      .then(setResumo)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [productId, data])

  const topics = resumo ? buildTopics(resumo) : []

  return (
    <div className="flex flex-col gap-3 flex-1">
      {loading && (
        <p className="text-sm text-gray-400 text-center animate-pulse py-2">Carregando resumo...</p>
      )}
      {error && (
        <p className="text-sm text-red-400 text-center py-2">Não foi possível carregar o resumo.</p>
      )}
      {!loading && !error && topics.map((t, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{t.label}</span>
          <span className="text-sm font-semibold text-gray-800">{t.value}</span>
        </div>
      ))}
    </div>
  )
}
