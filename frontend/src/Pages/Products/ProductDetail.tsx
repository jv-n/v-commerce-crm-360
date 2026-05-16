import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ProductEditModal } from "./ProductEditModal"
import { ProductResumoCard } from "./ProductResumoCard"
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined"
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined"
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined"
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined"
import {
  fetchProductById,
  fetchProductOrders,
  fetchProductTickets,
  fetchProductMonthlyRevenue,
  fetchProductActivities,
} from "@/lib/api/products"
import type { Product, ProductCategory } from "@/types/product"
import type { ProductOrder, ProductTicket, MonthlyRevenue, ProductActivity } from "@/lib/api/products"
import { cn } from "@/lib/utils"

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(raw: string | null | undefined): string {
  if (!raw) return "—"
  const part = raw.split(" ")[0]
  if (part.includes("-")) {
    const [y, m, d] = part.split("-")
    return `${d}/${m}/${y}`
  }
  return part
}

function fmtCurrency(v: number | null | undefined): string {
  if (v == null) return "—"
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function fmtTime(raw: string | null | undefined): string {
  if (!raw) return ""
  const part = raw.includes("T") ? raw.split("T")[1] : raw.split(" ")[1]
  return part ? part.slice(0, 5) : ""
}

function initials(name: string | null | undefined): string {
  if (!name) return "?"
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
}

const CATEGORY_COLORS: Record<ProductCategory, string> = {
  Automotivo: "bg-slate-100 text-slate-700",
  Beleza: "bg-pink-100 text-pink-700",
  Brinquedos: "bg-violet-100 text-violet-700",
  Casa: "bg-amber-100 text-amber-700",
  Eletronicos: "bg-blue-100 text-blue-700",
  Esportes: "bg-green-100 text-green-700",
  Indefinida: "bg-gray-100 text-gray-600",
  Moveis: "bg-orange-100 text-orange-700",
  Vestuario: "bg-teal-100 text-teal-700",
}

const STATUS_COLORS: Record<string, string> = {
  Aprovado:    "bg-green-100 text-green-700",
  Sucesso:     "bg-green-100 text-green-700",
  Cancelado:   "bg-red-100 text-red-700",
  Reembolsado: "bg-yellow-100 text-yellow-700",
  Pendente:    "bg-gray-100 text-gray-600",
}

// ── sub-components ────────────────────────────────────────────────────────────

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{label}</span>
      <div className="text-sm text-gray-800">{children}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  const cls = STATUS_COLORS[status ?? ""] ?? "bg-gray-100 text-gray-600"
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium", cls)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status ?? "—"}
    </span>
  )
}

function RevenueChart({ productName, data }: { productName: string; data: MonthlyRevenue[] }) {
  const last6 = data.slice(-6)
  const max = Math.max(...last6.map(d => d.receita), 1)
  const TICKS = 5
  const tickValues = Array.from({ length: TICKS + 1 }, (_, i) =>
    Math.round((max * (TICKS - i)) / TICKS)
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-500 font-medium">{productName}</span>
        <span className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-500 font-medium">Últimos 6 meses</span>
      </div>

      {last6.length === 0 ? (
        <p className="text-xs text-gray-400 py-6 text-center">Sem dados de receita.</p>
      ) : (
        <div className="flex gap-1" style={{ height: 220 }}>
          {/* Y-axis */}
          <div className="flex flex-col justify-between pb-5 shrink-0" style={{ width: 76 }}>
            {tickValues.map((v, i) => (
              <span key={i} className="text-[8px] text-gray-400 text-right leading-none">
                {fmtCurrency(v)}
              </span>
            ))}
          </div>

          {/* Bars + x-axis */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 flex items-end gap-2 border-l border-b border-gray-300 pl-2 pb-0 overflow-hidden">
              {last6.map(d => (
                <div key={d.ano_mes} className="flex-1 flex items-end h-full">
                  <div
                    className="w-full bg-[#2563EB] rounded-t-sm"
                    style={{ height: `${(d.receita / max) * 100}%`, minHeight: 4 }}
                    title={fmtCurrency(d.receita)}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-1 pl-2">
              {last6.map(d => {
                const [y, m] = d.ano_mes.split("-")
                return (
                  <div key={d.ano_mes} className="flex-1 text-center">
                    <span className="text-[8px] text-gray-400 whitespace-nowrap">{m}/{y}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [product,  setProduct]  = useState<Product | null>(null)
  const [orders,   setOrders]   = useState<ProductOrder[]>([])
  const [tickets,  setTickets]  = useState<ProductTicket[]>([])
  const [revenue,     setRevenue]     = useState<MonthlyRevenue[]>([])
  const [activities,  setActivities]  = useState<ProductActivity[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,    setError]    = useState(false)
  const [tab,      setTab]      = useState<"informacoes" | "atividades">("informacoes")
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(false)
    Promise.allSettled([
      fetchProductById(id),
      fetchProductOrders(id),
      fetchProductTickets(id),
      fetchProductMonthlyRevenue(id),
      fetchProductActivities(id),
    ])
      .then(([p, o, t, r, a]) => {
        if (p.status === "rejected") { setError(true); return }
        setProduct(p.value)
        setOrders(o.status === "fulfilled" ? o.value : [])
        setTickets(t.status === "fulfilled" ? t.value : [])
        setRevenue(r.status === "fulfilled" ? r.value : [])
        setActivities(a.status === "fulfilled" ? a.value : [])
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Carregando...
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-red-500 text-sm">Produto não encontrado.</p>
        <button onClick={() => navigate("/products")} className="text-sm text-purple-600 hover:underline">
          Voltar para o catálogo
        </button>
      </div>
    )
  }

  const catColor = CATEGORY_COLORS[product.category] ?? "bg-gray-100 text-gray-600"

  // Resumo derivado dos dados já carregados
  const receitaTotal = revenue.reduce((acc, r) => acc + r.receita, 0)
  const melhorMes = revenue.reduce<typeof revenue[0] | null>(
    (best, r) => (!best || r.receita > best.receita ? r : best), null
  )?.ano_mes ?? null
  const metodoCounts = orders.reduce<Record<string, number>>((acc, o) => {
    if (o.metodo_pagamento) acc[o.metodo_pagamento] = (acc[o.metodo_pagamento] ?? 0) + 1
    return acc
  }, {})
  const metodoFavorito = Object.entries(metodoCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const problemaCounts = tickets.reduce<Record<string, number>>((acc, t) => {
    if (t.tipo_problema) acc[t.tipo_problema] = (acc[t.tipo_problema] ?? 0) + 1
    return acc
  }, {})
  const problemaFrequente = Object.entries(problemaCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const resumoData = {
    receita_total: receitaTotal,
    melhor_mes: melhorMes,
    metodo_pagamento_favorito: metodoFavorito,
    problema_mais_frequente: problemaFrequente,
  }

  return (
    <>
    {editOpen && (
      <ProductEditModal
        open={editOpen}
        product={product}
        onClose={() => setEditOpen(false)}
        onSuccess={(updated) => {
          setProduct(updated)
          setEditOpen(false)
          if (id) fetchProductActivities(id).then(setActivities).catch(() => {})
        }}
        onDeleted={() => navigate("/products")}
      />
    )}
    <div className="p-6 h-full flex flex-col gap-4 bg-white min-h-full rounded-xl overflow-y-auto">
      {/* Body — 3 colunas */}
      <div className="grid grid-cols-[280px_1fr_300px] gap-4 flex-1 min-h-0">

        {/* ── Painel esquerdo: informações ── */}
        <div className="flex flex-col gap-4">
          {/* Card cabeçalho */}
          <div className="rounded-xl border border-[#9F83B2] flex flex-col shadow-[0_2px_8px_rgba(0,0,0,0.10)] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3">
              <button
                onClick={() => navigate("/products")}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowBackIosNewIcon sx={{ fontSize: 13 }} />
                Catálogo
              </button>
            </div>
            <hr className="border-[#9F83B2]" />
            <div className="px-4 py-4 flex flex-col gap-1">
              <span className="font-bold text-gray-900 text-lg leading-tight">{product.name}</span>
              <span className="text-xs text-purple-500 truncate cursor-default" title={product.id}>
                {product.id}
              </span>
            </div>
          </div>

          {/* Card informações importantes */}
          <div className="rounded-xl border border-[#9F83B2] flex flex-col shadow-[0_2px_8px_rgba(0,0,0,0.10)] flex-1 overflow-hidden">
            {/* Header do card */}
            <div className="flex items-center justify-between px-5 py-4">
              <span className="flex-1 text-center text-base font-bold text-gray-900">Informações importantes</span>
              <button
                onClick={() => setEditOpen(true)}
                className="text-gray-400 hover:text-gray-700 transition-colors shrink-0"
              >
                <EditOutlinedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
            <hr className="border-[#9F83B2]" />

            <div className="flex flex-col gap-5 px-5 py-5">
              <InfoRow label="ID produto">
                <span className="text-sm text-gray-900 break-all">{product.id}</span>
              </InfoRow>
              <InfoRow label="Nome do produto">
                <span className="text-base text-gray-900">{product.name}</span>
              </InfoRow>
              <InfoRow label="Preço">
                <span className="text-base text-gray-900">{fmtCurrency(product.price)}</span>
              </InfoRow>
              <InfoRow label="Categoria">
                <span className={cn("inline-block px-3 py-1 rounded-full text-sm font-medium", catColor)}>
                  {product.category}
                </span>
              </InfoRow>
              <InfoRow label="Quantidade em estoque">
                <span className="text-base text-gray-900">{product.stock.toLocaleString("pt-BR")}</span>
              </InfoRow>
              <InfoRow label="Fornecedor">
                {product.supplier ? (
                  <div className="flex items-center gap-3 mt-1">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-purple-200 text-purple-800 text-sm font-bold shrink-0">
                      {initials(product.supplier)}
                    </span>
                    <span className="text-base text-gray-900">{product.supplier}</span>
                  </div>
                ) : <span className="text-base text-gray-900">—</span>}
              </InfoRow>
              <InfoRow label="Peso KG">
                <span className="text-base text-gray-900">
                  {product.weightKg != null ? `${product.weightKg}kg` : "—"}
                </span>
              </InfoRow>
              <InfoRow label="Avaliação interna">
                <span className="text-base text-gray-900">
                  {product.rating > 0 ? product.rating.toFixed(1) : "—"}
                </span>
              </InfoRow>
              <InfoRow label="Data de cadastro">
                <span className="text-base text-gray-900">{product.createdAt || "—"}</span>
              </InfoRow>
            </div>
          </div>
        </div>

        {/* ── Painel central: tabs ── */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Tabs */}
          <div className="grid grid-cols-2 rounded-xl overflow-hidden border border-[#9F83B2] shadow-[0_2px_8px_rgba(0,0,0,0.10)]">
            {(["informacoes", "atividades"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "py-3 text-sm font-semibold transition-colors",
                  tab === t
                    ? "bg-[#F0DDFD] text-gray-900"
                    : "bg-white text-gray-400 hover:bg-gray-50"
                )}
              >
                {t === "informacoes" ? "Informações" : "Atividades"}
              </button>
            ))}
          </div>

          {tab === "informacoes" && (
            <div className="flex flex-col gap-4 overflow-y-auto">
              {/* Resumo IA */}
              <div className="rounded-xl border border-[#9F83B2] shadow-[0_2px_8px_rgba(0,0,0,0.10)] flex flex-col overflow-hidden">
                <div className="flex items-center justify-center gap-2 px-5 py-4">
                  <span className="text-base font-bold text-gray-900">Resumo da</span>
                  <span
                    className="text-sm font-bold px-3 py-0.5 rounded-full text-white"
                    style={{ background: "linear-gradient(to right, #a855f7, #22c55e)" }}
                  >
                    V.IA
                  </span>
                </div>
                <hr className="border-[#9F83B2]" />
                <div className="p-4">
                  <div
                    className="rounded-xl p-4 flex flex-col gap-3"
                    style={{
                      background: "linear-gradient(white, white) padding-box, linear-gradient(135deg, #a855f7 0%, #22c55e 100%) border-box",
                      border: "2px solid transparent",
                    }}
                  >
                    <ProductResumoCard productId={product.id} data={resumoData} />
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
                      className="flex items-center justify-end gap-1.5 mt-2 w-full hover:opacity-70 transition-opacity"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <defs>
                          <linearGradient id="sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#22c55e" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M12 2 C12.5 7 17 9.5 22 12 C17 14.5 12.5 17 12 22 C11.5 17 7 14.5 2 12 C7 9.5 11.5 7 12 2 Z"
                          fill="url(#sparkle-grad)"
                        />
                      </svg>
                      <span className="text-sm text-gray-600">Faça uma pergunta</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Métricas */}
              <div className="rounded-xl border border-[#9F83B2] shadow-[0_2px_8px_rgba(0,0,0,0.10)] flex flex-col overflow-hidden">
                <div className="flex items-center justify-center px-5 py-4">
                  <span className="text-base font-bold text-gray-900">Métricas do produto</span>
                </div>
                <hr className="border-[#9F83B2]" />
                <div className="p-4">
                  <div className="rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <BarChartOutlinedIcon sx={{ fontSize: 18, color: "#9F83B2" }} />
                      <span className="text-sm font-semibold text-gray-400">Receita mensal</span>
                    </div>
                    <RevenueChart productName={product.name} data={revenue} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "atividades" && (
            <div className="rounded-xl border border-[#9F83B2] shadow-[0_2px_8px_rgba(0,0,0,0.10)] flex flex-col overflow-hidden">
              <div className="flex items-center justify-center gap-2 px-5 py-4 shrink-0">
                <span className="text-base font-bold text-gray-900">Atividades</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <hr className="border-[#9F83B2] shrink-0" />
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
                {activities.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Sem atividades registradas.</p>
                ) : activities.map(act => {
                  const dtPart = act.changed_at.includes("T") ? act.changed_at.split("T") : act.changed_at.split(" ")
                  const [y, m, d] = dtPart[0].split("-")
                  const actDate = `${d}/${m}/${y}`
                  const actTime = (dtPart[1] ?? "").slice(0, 5)
                  return (
                    <div key={act.id} className="rounded-xl border border-gray-200 p-4 flex flex-col gap-1.5 bg-white">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 text-xs font-bold shrink-0">
                          {initials(act.user_name)}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">{act.user_name}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {"• "}Data da Alteração:{" "}
                        <span className="text-purple-600 font-medium">{actDate}</span>
                        {actTime && <> - {actTime}</>}
                      </span>
                      <span className="text-sm text-gray-600">
                        {"• "}Campo alterado:{" "}
                        <span className="text-purple-600 font-medium">{act.field_name}</span>
                      </span>
                      <span className="text-sm text-gray-600">
                        {"• "}Alteração: {act.old_value ?? "—"} para{" "}
                        <span className="text-purple-600 font-medium">{act.new_value ?? "—"}</span>
                      </span>
                      <span className="text-sm text-gray-600">
                        {"• "}Forma de alteração:{" "}
                        <span className="text-purple-600 font-medium">{act.change_method}</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Painel direito: pedidos + tickets ── */}
        <div className="flex flex-col gap-4 min-h-0 h-full">
          {/* Pedidos */}
          <div className="flex-1 min-h-0 rounded-xl border border-[#9F83B2] shadow-[0_2px_8px_rgba(0,0,0,0.10)] flex flex-col overflow-hidden">
            <div className="flex items-center justify-center px-5 py-4 shrink-0">
              <span className="text-base font-bold text-gray-900">Pedidos do produto</span>
            </div>
            <hr className="border-[#9F83B2] shrink-0" />
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              {orders.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Nenhum pedido encontrado.</p>
              ) : orders.map(o => {
                const time = fmtTime(o.data_pedido)
                return (
                  <div key={o.id_pedido} className="rounded-xl border border-gray-200 p-4 flex flex-col gap-2 bg-white">
                    <div className="flex items-center gap-2">
                      <ReceiptLongOutlinedIcon sx={{ fontSize: 20, color: "#22c55e" }} />
                      <span className="text-sm font-medium text-purple-600 underline truncate">
                        {o.id_pedido}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      Data de abertura: {fmtDate(o.data_pedido)}
                      {time && <> - <span className="text-purple-400">{time}</span></>}
                    </span>
                    {o.quantidade != null && (
                      <span className="text-sm text-gray-600">
                        Produtos: <span className="text-purple-600 font-medium">{o.quantidade}x</span> {product.name}
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Status Pedido:</span>
                      <StatusBadge status={o.status} />
                    </div>
                    {o.valor_pedido != null && (
                      <span className="text-sm text-gray-600">Valor: {fmtCurrency(o.valor_pedido)}</span>
                    )}
                    {o.metodo_pagamento && (
                      <span className="text-sm text-gray-600">Método de pagamento: {o.metodo_pagamento}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tickets */}
          <div className="flex-1 min-h-0 rounded-xl border border-[#9F83B2] shadow-[0_2px_8px_rgba(0,0,0,0.10)] flex flex-col overflow-hidden">
            <div className="flex items-center justify-center px-5 py-4 shrink-0">
              <span className="text-base font-bold text-gray-900">Tickets do produto</span>
            </div>
            <hr className="border-[#9F83B2] shrink-0" />
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              {tickets.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Nenhum ticket encontrado.</p>
              ) : tickets.map(t => (
                <div key={t.ticket_id} className="rounded-xl border border-gray-200 p-4 flex flex-col gap-2 bg-white">
                  <div className="flex items-center gap-2">
                    <ConfirmationNumberOutlinedIcon sx={{ fontSize: 20, color: "#9F83B2" }} />
                    <span className="text-sm font-bold text-purple-600 underline truncate">
                      {t.tipo_problema ?? "Ticket"}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    Data de abertura: {fmtDate(t.data_abertura)}
                    {fmtTime(t.data_abertura) && <> - <span className="text-purple-400">{fmtTime(t.data_abertura)}</span></>}
                  </span>
                  <span className="text-sm text-gray-600">ID Ticket: {t.ticket_id}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Status Ticket:</span>
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                      t.resolvido ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    )}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {t.resolvido ? "Finalizado" : "Em aberto"}
                    </span>
                  </div>
                  {t.tipo_problema && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-gray-600">Problema:</span>
                      <AutorenewOutlinedIcon sx={{ fontSize: 18, color: "#9F83B2" }} />
                      <span className="text-sm text-gray-600">{t.tipo_problema}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

