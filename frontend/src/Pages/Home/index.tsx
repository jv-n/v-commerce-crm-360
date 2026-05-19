import { useState, useRef, useEffect } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { Dialog as DialogPrimitive } from "radix-ui"
import { X } from "lucide-react"
import { MOCKED_SHORTCUTS } from "@/lib/mocks/home"
import { fetchBookmarks, saveBookmark } from "@/lib/api/bookmarks"
import type { ShortcutItem, Bookmark, ContactBookmark, ProductBookmark } from "@/types/home"
import { fetchContactById } from "@/lib/api/contacts"
import { fetchProductById } from "@/lib/api/products"
import {
  ContactPageOutlined as ContactPageOutlinedIcon,
  ConfirmationNumberOutlined as ConfirmationNumberOutlinedIcon,
  BarChartOutlined as BarChartOutlinedIcon,
  RequestQuoteOutlined as RequestQuoteOutlinedIcon,
  Inventory2Outlined as Inventory2OutlinedIcon,
  FlagOutlined,
  BookmarkBorderOutlined,
  PersonOutlined,
  AddOutlined,
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

const SHORTCUT_ICON_MAP: Record<string, React.ElementType> = {
  ContactPage:        ContactPageOutlinedIcon,
  ConfirmationNumber: ConfirmationNumberOutlinedIcon,
  BarChart:           BarChartOutlinedIcon,
  RequestQuote:       RequestQuoteOutlinedIcon,
  Inventory2Outlined: Inventory2OutlinedIcon,
}

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

function ShortcutCard({ shortcut, onClick }: { shortcut: ShortcutItem; onClick: () => void }) {
  const IconComponent = SHORTCUT_ICON_MAP[shortcut.icon]
  const disabled = shortcut.disabled ?? false

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center gap-3
        border-[6px] border-[#D1B1E5] rounded-xl
        py-6 px-3 flex-1 min-w-0 shadow-md
        transition-all duration-150
        ${disabled ? "bg-[#F7EBFF] cursor-not-allowed opacity-60" : "bg-[#F7EBFF] hover:bg-[#F0DDFD] active:scale-95"}
      `}
    >
      {IconComponent && (
        <IconComponent sx={{ fontSize: 48, color: disabled ? "#9CA3AF" : "#2E0E55" }} />
      )}
      <span className={`text-base font-semibold text-center leading-tight ${disabled ? "text-gray-400" : "text-[#2E0E55]"}`}>
        {shortcut.label}
      </span>
    </button>
  )
}

function AICard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        flex flex-col items-center justify-center gap-3
        border-[6px] border-[#D1B1E5] bg-[#F7EBFF] rounded-xl
        py-6 px-3 flex-1 min-w-0 shadow-md
        transition-all duration-150 hover:bg-[#F0DDFD] active:scale-95
      "
    >
      <img src="/v_ai.svg" alt="Assistente V.IA" className="w-12 h-12" />
      <span className="text-base font-semibold text-center leading-tight text-[#2E0E55]">
        Assistente V.IA
      </span>
    </button>
  )
}

const contactCardClass = `
  flex items-center gap-4
  border-[6px] border-[#A8C7FA] bg-[#EEF4FF] rounded-xl
  py-5 px-5 shadow-md flex-1 min-w-0
  transition-all duration-150 hover:bg-[#DCEAFF] active:scale-95
`

const productCardClass = `
  flex items-center gap-4
  border-[6px] border-[#86EFAC] bg-[#F0FDF4] rounded-xl
  py-5 px-5 shadow-md flex-1 min-w-0
  transition-all duration-150 hover:bg-[#DCFCE7] active:scale-95
`

function ContactBookmarkCard({ item, onClick }: { item: ContactBookmark; onClick: () => void }) {
  return (
    <button className={contactCardClass} onClick={onClick}>
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-[#A8C7FA] flex items-center justify-center">
        <PersonOutlined sx={{ fontSize: 28, color: "#1a3a6b" }} />
      </div>
      <div className="flex flex-col min-w-0 text-left">
        <span className="text-base font-semibold text-[#1a3a6b] truncate">{item.name}</span>
        <span className="text-xs text-[#1a3a6b]/70 truncate">{item.email ?? "—"}</span>
        <span className="text-[11px] font-mono text-[#1a3a6b]/50 mt-0.5 truncate">ID: {item.id}</span>
      </div>
    </button>
  )
}

function ProductBookmarkCard({ item, onClick }: { item: ProductBookmark; onClick: () => void }) {
  const IconComponent = CATEGORY_ICON_MAP[item.category] ?? CategoryOutlined

  return (
    <button className={productCardClass} onClick={onClick}>
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-[#86EFAC] flex items-center justify-center">
        <IconComponent sx={{ fontSize: 28, color: "#14532d" }} />
      </div>
      <div className="flex flex-col min-w-0 text-left">
        <span className="text-base font-semibold text-[#14532d] truncate">{item.name}</span>
        <span className="text-xs text-[#14532d]/70">{fmtCurrency(item.price)} · {item.totalSales} vendas</span>
        <span className="text-[11px] font-mono text-[#14532d]/50 mt-0.5 truncate">ID: {item.id}</span>
      </div>
    </button>
  )
}

function BookmarkCard({ item, onNavigate }: { item: Bookmark; onNavigate: (path: string) => void }) {
  if (item.kind === "contact")
    return <ContactBookmarkCard item={item} onClick={() => onNavigate(`/contacts/${item.id}`)} />
  return <ProductBookmarkCard item={item} onClick={() => onNavigate(`/products/${item.id}`)} />
}

function AddBookmarkButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        flex items-center gap-4
        border-[6px] border-dashed border-[#D1B1E5] rounded-xl
        py-5 px-5 flex-1 min-w-0
        transition-all duration-150 hover:bg-[#F7EBFF] active:scale-95
      "
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-[#D1B1E5] flex items-center justify-center">
        <AddOutlined sx={{ fontSize: 24, color: "#2E0E55" }} />
      </div>
      <span className="text-sm text-[#2E0E55]/60">Adicionar bookmark</span>
    </button>
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
            <DialogPrimitive.Close className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
              <X size={16} />
            </DialogPrimitive.Close>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">ID do cliente ou produto</label>
              <input
                autoFocus
                value={id}
                onChange={e => { setId(e.target.value); setStatus("idle") }}
                placeholder="Ex: PROD-0023 ou UUID do contato..."
                disabled={status === "loading"}
                className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {status === "error" && (
                <span className="text-xs text-red-500">ID não encontrado. Verifique e tente novamente.</span>
              )}
            </div>

            <div className="flex items-center justify-center gap-8 pt-2 border-t border-gray-100">
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
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

  useEffect(() => {
    fetchBookmarks().then(setBookmarks).catch(console.error)
  }, [])

  const addBookmark = async (b: Bookmark) => {
    if (bookmarks.some(x => x.id === b.id)) return
    await saveBookmark(b)
    setBookmarks(prev => [...prev, b])
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

      {/* Funções do sistema */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <FlagOutlined sx={{ fontSize: 24, color: "#374151" }} />
          <h2 className="text-xl font-bold text-gray-900">Funções Do Sistema</h2>
        </div>
        <div className="flex flex-row gap-4">
          {MOCKED_SHORTCUTS.map((shortcut) => (
            <ShortcutCard
              key={shortcut.id}
              shortcut={shortcut}
              onClick={() => navigate(shortcut.route)}
            />
          ))}
          <AICard onClick={() => onOpenAI()} />
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
            <BookmarkCard key={`${item.kind}-${item.id}`} item={item} onNavigate={navigate} />
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
