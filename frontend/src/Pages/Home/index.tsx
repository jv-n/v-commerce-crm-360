import { useState, useEffect } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { Dialog as DialogPrimitive } from "radix-ui"
import { X } from "lucide-react"
import { fetchBookmarks, saveBookmark, deleteBookmark } from "@/lib/api/bookmarks"
import { fetchGoals, fetchGoalsProgress, fetchGoalProgress, saveGoal, deleteGoal } from "@/lib/api/goals"
import type { Bookmark, ContactBookmark, ProductBookmark, Goal, GoalKind } from "@/types/home"
import { fetchContactById } from "@/lib/api/contacts"
import { fetchProductById } from "@/lib/api/products"
import {
  Inventory2Outlined as Inventory2OutlinedIcon,
  BookmarkBorderOutlined,
  PersonOutlined,
  AddOutlined,
  TrackChangesOutlined,
  PeopleAltOutlined,
  // category icons
  DirectionsCarOutlined,
  SpaOutlined,
  SportsEsportsOutlined,
  HomeOutlined,
  DevicesOutlined,
  FitnessCenterOutlined,
  WeekendOutlined,
  CheckroomOutlined,
  CategoryOutlined,
} from "@mui/icons-material"
import { useAuth } from "@/contexts/auth/useAuth"

// ── Mapas de ícones ───────────────────────────────────────────────────────────

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  Automotivo:  DirectionsCarOutlined,
  Beleza:      SpaOutlined,
  Brinquedos:  SportsEsportsOutlined,
  Casa:        HomeOutlined,
  Eletronicos: DevicesOutlined,
  Esportes:    FitnessCenterOutlined,
  Moveis:      WeekendOutlined,
  Vestuario:   CheckroomOutlined,
  Indefinida:  CategoryOutlined,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  const weekdays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]
  const months   = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
  return `${weekdays[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`
}

function fmtCurrency(v: number | null) {
  if (v === null) return "—"
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

// ── Componentes de card ───────────────────────────────────────────────────────

const contactCardClass = `
  group relative flex items-center gap-4
  border-2 border-gray-200 bg-white rounded-xl
  py-5 px-5 shadow-sm flex-1 min-w-0
  transition-all duration-150 hover:bg-[#EEF4FF] active:scale-95
  cursor-pointer
`

const productCardClass = `
  group relative flex items-center gap-4
  border-2 border-gray-200 bg-white rounded-xl
  py-5 px-5 shadow-sm flex-1 min-w-0
  transition-all duration-150 hover:bg-[#F0FDF4] active:scale-95
  cursor-pointer
`

function ContactBookmarkCard({ item, onClick, onDelete }: { item: ContactBookmark; onClick: () => void; onDelete: () => void }) {
  return (
    <div className={contactCardClass} onClick={onClick}>
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-[#A8C7FA] flex items-center justify-center">
        <PersonOutlined sx={{ fontSize: 28, color: "#1a3a6b" }} />
      </div>
      <div className="flex flex-col min-w-0 text-left">
        <span className="text-base font-semibold text-[#1a3a6b] truncate">{item.name}</span>
        <span className="text-xs text-[#1a3a6b]/70 truncate">{item.email ?? "—"}</span>
        <span className="text-[11px] font-mono text-[#1a3a6b]/50 mt-0.5 truncate">ID: {item.id}</span>
      </div>
      <button
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-200/70 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        title="Remover bookmark"
      >
        <X size={12} />
      </button>
    </div>
  )
}

function ProductBookmarkCard({ item, onClick, onDelete }: { item: ProductBookmark; onClick: () => void; onDelete: () => void }) {
  const IconComponent = CATEGORY_ICON_MAP[item.category] ?? CategoryOutlined

  return (
    <div className={productCardClass} onClick={onClick}>
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-[#86EFAC] flex items-center justify-center">
        <IconComponent sx={{ fontSize: 28, color: "#14532d" }} />
      </div>
      <div className="flex flex-col min-w-0 text-left">
        <span className="text-base font-semibold text-[#14532d] truncate">{item.name}</span>
        <span className="text-xs text-[#14532d]/70">{fmtCurrency(item.price)} · {item.totalSales} vendas</span>
        <span className="text-[11px] font-mono text-[#14532d]/50 mt-0.5 truncate">ID: {item.id}</span>
      </div>
      <button
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-200/70 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        title="Remover bookmark"
      >
        <X size={12} />
      </button>
    </div>
  )
}

function BookmarkCard({ item, onNavigate, onDelete }: { item: Bookmark; onNavigate: (path: string) => void; onDelete: () => void }) {
  if (item.kind === "contact")
    return <ContactBookmarkCard item={item} onClick={() => onNavigate(`/contacts/${item.id}`)} onDelete={onDelete} />
  return <ProductBookmarkCard item={item} onClick={() => onNavigate(`/products/${item.id}`)} onDelete={onDelete} />
}

function AddBookmarkButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        flex items-center gap-4
        border-2 border-dashed border-gray-300 rounded-xl
        py-6 px-6 flex-1 min-w-0
        transition-all duration-150 hover:bg-gray-50 active:scale-95
      "
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center">
        <AddOutlined sx={{ fontSize: 24, color: "#111827" }} />
      </div>
      <span className="text-sm font-medium text-gray-900">Adicionar bookmark</span>
    </button>
  )
}

// ── Componentes de metas ──────────────────────────────────────────────────────

const GOAL_CONFIG: Record<GoalKind, {
  border: string; bg: string; hover: string; text: string; subtext: string; deleteBg: string;
  Icon: React.ElementType; label: string;
}> = {
  product_sales: {
    border: "#86EFAC", bg: "#F0FDF4", hover: "#DCFCE7",
    text: "#14532d", subtext: "#14532d99", deleteBg: "#86EFAC66",
    Icon: Inventory2OutlinedIcon, label: "Vendas de produto",
  },
  new_clients: {
    border: "#A8C7FA", bg: "#EEF4FF", hover: "#DCEAFF",
    text: "#1a3a6b", subtext: "#1a3a6b99", deleteBg: "#A8C7FA66",
    Icon: PeopleAltOutlined, label: "Novos clientes",
  },
  category_sales: {
    border: "#D1B1E5", bg: "#F7EBFF", hover: "#F0DDFD",
    text: "#2E0E55", subtext: "#2E0E5599", deleteBg: "#D1B1E566",
    Icon: CategoryOutlined, label: "Vendas por categoria",
  },
}

function GoalCard({ goal, progressLoading, onDelete }: { goal: Goal; progressLoading: boolean; onDelete: () => void }) {
  const cfg     = GOAL_CONFIG[goal.kind]
  const pct     = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0
  const reached = pct >= 100

  return (
    <div
      className="group relative flex flex-col gap-3 rounded-xl py-5 px-5 shadow-md flex-1 min-w-0 cursor-default"
      style={{ border: `6px solid ${cfg.border}`, background: cfg.bg }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center"
          style={{ border: `2px solid ${cfg.border}` }}
        >
          <cfg.Icon sx={{ fontSize: 22, color: cfg.text }} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold truncate" style={{ color: cfg.text }}>{goal.label}</span>
          <span className="text-[11px] truncate" style={{ color: cfg.subtext }}>
            {goal.kind === "product_sales"  && (goal.productId ?? "")}
            {goal.kind === "new_clients"    && (goal.referenceMonth ?? "calculando...")}
            {goal.kind === "category_sales" && goal.category}
          </span>
        </div>
      </div>

      {/* Progresso */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center h-4">
          {progressLoading ? (
            <span className="text-xs italic" style={{ color: cfg.subtext }}>Calculando...</span>
          ) : (
            <>
              <span className="text-xs font-medium" style={{ color: cfg.subtext }}>
                {goal.current.toLocaleString("pt-BR")} / {goal.target.toLocaleString("pt-BR")}
              </span>
              <span className="text-xs font-bold" style={{ color: reached ? "#15803D" : cfg.text }}>
                {reached ? "Concluída!" : `${pct}%`}
              </span>
            </>
          )}
        </div>
        <div className="w-full h-2 rounded-full bg-black/10 overflow-hidden">
          {progressLoading ? (
            <div
              className="h-full rounded-full animate-pulse"
              style={{ width: "100%", background: cfg.border, opacity: 0.4 }}
            />
          ) : (
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: reached ? "#15803D" : cfg.border }}
            />
          )}
        </div>
      </div>

      {/* Botão delete */}
      <button
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-100 transition-all opacity-0 group-hover:opacity-100"
        style={{ background: cfg.deleteBg, color: cfg.subtext }}
        onMouseEnter={e => (e.currentTarget.style.color = "#EF4444")}
        onMouseLeave={e => (e.currentTarget.style.color = cfg.subtext)}
        onClick={onDelete}
        title="Remover meta"
      >
        <X size={12} />
      </button>
    </div>
  )
}

function AddGoalButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        flex items-center gap-4
        border-2 border-dashed border-gray-300 rounded-xl
        py-5 px-5 flex-1 min-w-0
        transition-all duration-150 hover:bg-gray-50 active:scale-95
      "
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center">
        <AddOutlined sx={{ fontSize: 20, color: "#111827" }} />
      </div>
      <span className="text-sm font-medium text-gray-900">Adicionar meta</span>
    </button>
  )
}

const CATEGORIES = ["Automotivo", "Beleza", "Brinquedos", "Casa", "Eletronicos", "Esportes", "Moveis", "Vestuario"]

function AddGoalModal({ open, onAdd, onClose }: { open: boolean; onAdd: (g: Omit<Goal, "id" | "current">) => Promise<void>; onClose: () => void }) {
  const [kind, setKind]         = useState<GoalKind | "">("")
  const [productId, setProductId] = useState("")
  const [category, setCategory] = useState("")
  const [target, setTarget]     = useState("")
  const [status, setStatus]     = useState<"idle" | "loading" | "error">("idle")

  const reset = () => { setKind(""); setProductId(""); setCategory(""); setTarget(""); setStatus("idle") }
  const handleOpenChange = (v: boolean) => { if (!v) { reset(); onClose() } }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!kind || !target) return
    const t = parseInt(target, 10)
    if (isNaN(t) || t <= 0) { setStatus("error"); return }

    setStatus("loading")
    try {
      let label = ""
      const payload: Omit<Goal, "id" | "current"> = { kind, label: "", target: t }

      if (kind === "product_sales") {
        if (!productId.trim()) { setStatus("error"); return }
        try {
          const product = await fetchProductById(productId.trim())
          payload.label = `Vendas de ${product.name}`
          payload.productId = product.id
          payload.productName = product.name
        } catch {
          setStatus("error"); return
        }
      } else if (kind === "new_clients") {
        payload.label = "Novos clientes no mês"
      } else if (kind === "category_sales") {
        if (!category) { setStatus("error"); return }
        payload.label = `Vendas em ${category}`
        payload.category = category
      }

      await onAdd(payload)
      reset()
      onClose()
    } catch {
      setStatus("error")
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">

          <div className="flex items-center justify-between mb-6">
            <DialogPrimitive.Title className="text-lg font-bold text-gray-900">
              Adicionar Meta
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-900 hover:text-gray-700 transition">
              <X size={16} />
            </DialogPrimitive.Close>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Tipo de meta */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-900">Tipo de meta</label>
              <div className="grid grid-cols-3 gap-2">
                {(["product_sales", "new_clients", "category_sales"] as GoalKind[]).map(k => {
                  const cfg = GOAL_CONFIG[k]
                  const active = kind === k
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => { setKind(k); setStatus("idle") }}
                      className="flex flex-col items-center gap-1.5 rounded-xl py-3 px-2 border-2 transition-all text-center"
                      style={{
                        borderColor: active ? cfg.border : "#E5E7EB",
                        background:  active ? cfg.bg    : "white",
                      }}
                    >
                      <cfg.Icon sx={{ fontSize: 22, color: active ? cfg.text : "#111827" }} />
                      <span className="text-[10px] font-medium leading-tight" style={{ color: active ? cfg.text : "#111827" }}>
                        {cfg.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Campos específicos por tipo */}
            {kind === "product_sales" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-900">ID do produto</label>
                <input
                  autoFocus
                  value={productId}
                  onChange={e => { setProductId(e.target.value); setStatus("idle") }}
                  placeholder="Ex: PROD-0023"
                  className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {kind === "category_sales" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-900">Categoria</label>
                <select
                  value={category}
                  onChange={e => { setCategory(e.target.value); setStatus("idle") }}
                  className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Selecione uma categoria</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            {kind && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-900">Meta (quantidade)</label>
                <input
                  value={target}
                  onChange={e => { setTarget(e.target.value); setStatus("idle") }}
                  placeholder="Ex: 100"
                  type="number"
                  min={1}
                  className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {status === "error" && (
              <span className="text-xs text-red-500">
                {kind === "product_sales" ? "Produto não encontrado. Verifique o ID." : "Preencha todos os campos corretamente."}
              </span>
            )}

            <div className="flex items-center justify-center gap-8 pt-4 mt-2 border-t border-gray-100">
              <DialogPrimitive.Close asChild>
                <button type="button" className="text-sm text-gray-900 hover:text-gray-700 transition-colors">
                  Cancelar
                </button>
              </DialogPrimitive.Close>
              <button
                type="submit"
                disabled={!kind || !target || status === "loading"}
                className="bg-primary text-primary-foreground text-sm px-8 py-2 rounded-xl hover:opacity-90 disabled:opacity-40 transition-all"
              >
                {status === "loading" ? "Salvando..." : "Adicionar"}
              </button>
            </div>

          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function AddBookmarkModal({ open, onAdd, onClose }: { open: boolean; onAdd: (b: Bookmark) => Promise<void>; onClose: () => void }) {
  const [id, setId]         = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")

  const handleOpenChange = (v: boolean) => {
    if (!v) { setId(""); setStatus("idle"); onClose() }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = id.trim()
    if (!trimmed) return
    setStatus("loading")
    try {
      try {
        const contact = await fetchContactById(trimmed)
        onAdd({ kind: "contact", id: contact.id, name: contact.name ?? trimmed, email: contact.email })
      } catch {
        const product = await fetchProductById(trimmed)
        onAdd({ kind: "product", id: product.id, name: product.name, price: product.price, totalSales: product.totalSales, category: product.category })
      }
      setId("")
      setStatus("idle")
      onClose()
    } catch {
      setStatus("error")
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <DialogPrimitive.Title className="text-lg font-bold text-gray-900">
              Adicionar Bookmark
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-900 hover:text-gray-700 transition">
              <X size={16} />
            </DialogPrimitive.Close>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-900">ID do cliente ou produto</label>

              <input
                autoFocus
                value={id}
                onChange={e => { setId(e.target.value); setStatus("idle") }}
                placeholder="Ex: PROD-0023 ou UUID do contato..."
                disabled={status === "loading"}
                className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {status === "error" && (
                <span className="text-xs text-red-500">ID não encontrado. Verifique e tente novamente.</span>
              )}
            </div>

            <div className="flex items-center justify-center gap-8 pt-4 mt-4 border-t border-gray-100">
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  className="text-sm text-gray-900 hover:text-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </DialogPrimitive.Close>
              <button
                type="submit"
                disabled={!id.trim() || status === "loading"}
                className="bg-primary text-primary-foreground text-sm px-8 py-2 rounded-xl hover:opacity-90 disabled:opacity-40 transition-all"
              >
                {status === "loading" ? "Buscando..." : "Adicionar"}
              </button>
            </div>
          </form>

        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function Home() {
  const navigate  = useNavigate()
  const { onOpenAI } = useOutletContext<{ onOpenAI: (message?: string) => void }>()
  const { user }  = useAuth()
  const today     = new Date()
  const [bookmarks, setBookmarks]           = useState<Bookmark[]>([])
  const [addingBookmark, setAddingBookmark] = useState(false)
  const [goals, setGoals]                       = useState<Goal[]>([])
  const [goalsProgressLoading, setGoalsProgressLoading] = useState(false)
  const [loadingGoalIds, setLoadingGoalIds]     = useState<Set<string>>(new Set())
  const [addingGoal, setAddingGoal]             = useState(false)

  useEffect(() => {
    fetchBookmarks().then(setBookmarks).catch(console.error)

    // Fase 1: carrega metadados das metas instantaneamente
    fetchGoals()
      .then(loadedGoals => {
        setGoals(loadedGoals)
        if (loadedGoals.length === 0) return

        // Fase 2: carrega progresso em paralelo (queries pesadas)
        setGoalsProgressLoading(true)
        fetchGoalsProgress()
          .then(({ progress, referenceMonth }) => {
            setGoals(prev => prev.map(g => ({
              ...g,
              current: progress[g.id] ?? g.current,
              referenceMonth,
            })))
          })
          .catch(console.error)
          .finally(() => setGoalsProgressLoading(false))
      })
      .catch(console.error)
  }, [])

  const addBookmark = async (b: Bookmark) => {
    if (bookmarks.some(x => x.id === b.id)) return
    await saveBookmark(b)
    setBookmarks(prev => [...prev, b])
  }

  const removeBookmark = async (id: string) => {
    await deleteBookmark(id).catch(console.error)
    setBookmarks(prev => prev.filter(x => x.id !== id))
  }

  const addGoal = async (g: Omit<Goal, "id" | "current">) => {
    const created = await saveGoal(g)
    setGoals(prev => [...prev, created])
    // Anima e busca progresso apenas do card recém-criado
    setLoadingGoalIds(prev => new Set(prev).add(created.id))
    fetchGoalProgress(created.id)
      .then(({ current, referenceMonth }) => {
        setGoals(prev => prev.map(x => x.id === created.id ? { ...x, current, referenceMonth } : x))
      })
      .catch(console.error)
      .finally(() => setLoadingGoalIds(prev => { const n = new Set(prev); n.delete(created.id); return n }))
  }

  const removeGoal = async (id: string) => {
    await deleteGoal(id).catch(console.error)
    setGoals(prev => prev.filter(x => x.id !== id))
  }

  const userFirstName = () => {
    if (!user) return "Usuário"
    const index = user.name.indexOf(" ")
    return index > 0 ? user.name.slice(0, index) : user.name
  }

  return (
    <div className="relative px-6 py-5 h-full flex flex-col gap-8 bg-white min-h-full rounded-xl overflow-y-auto">

      {/* Header */}
      <div>
        <p className="text-[12px] text-gray-500">{formatDate(today)}</p>
        <h1 className="text-[40px] font-bold text-gray-900 mt-0.5 leading-tight">
          Bem-vindo ao V-Commerce CRM 360, {userFirstName()}.
        </h1>
      </div>

      {/* Metas */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <TrackChangesOutlined sx={{ fontSize: 24, color: "#374151" }} />
          <h2 className="text-xl font-bold text-gray-900">Metas do Mês</h2>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} progressLoading={goalsProgressLoading || loadingGoalIds.has(goal.id)} onDelete={() => removeGoal(goal.id)} />
          ))}
          <AddGoalButton onClick={() => setAddingGoal(true)} />
          <AddGoalModal
            open={addingGoal}
            onAdd={addGoal}
            onClose={() => setAddingGoal(false)}
          />
        </div>
      </section>

      {/* Bookmarks */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <BookmarkBorderOutlined sx={{ fontSize: 24, color: "#374151" }} />
          <h2 className="text-xl font-bold text-gray-900">Dados Salvos</h2>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {bookmarks.map((item) => (
            <BookmarkCard key={`${item.kind}-${item.id}`} item={item} onNavigate={navigate} onDelete={() => removeBookmark(item.id)} />
          ))}
          <AddBookmarkButton onClick={() => setAddingBookmark(true)} />
          <AddBookmarkModal
            open={addingBookmark}
            onAdd={(b) => { addBookmark(b); setAddingBookmark(false) }}
            onClose={() => setAddingBookmark(false)}
          />
        </div>
      </section>

    </div>
  )
}
