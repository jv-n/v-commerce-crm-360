import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from "react"
import { DataTable } from "@/components/organisms/DataTable"
import { makeProductColumns } from "./columns"
import { mockProducts } from "@/lib/mocks/products"
import { cn } from "@/lib/utils"
import type { Product, ProductCategory, ProductState } from "@/types/product"
import AddIcon from "@mui/icons-material/Add"
import TuneIcon from "@mui/icons-material/Tune"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import CloseIcon from "@mui/icons-material/Close"
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined"
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"

const BR_REGIONS: Record<string, string[]> = {
  "Norte":        ["Acre", "Amapá", "Amazonas", "Pará", "Rondônia", "Roraima", "Tocantins"],
  "Nordeste":     ["Alagoas", "Bahia", "Ceará", "Maranhão", "Paraíba", "Pernambuco", "Piauí", "Rio Grande do Norte", "Sergipe"],
  "Centro-Oeste": ["Distrito Federal", "Goiás", "Mato Grosso", "Mato Grosso do Sul"],
  "Sudeste":      ["Espírito Santo", "Minas Gerais", "Rio de Janeiro", "São Paulo"],
  "Sul":          ["Paraná", "Rio Grande do Sul", "Santa Catarina"],
}

const UFS_WITH_PRODUCTS = new Set(mockProducts.map(p => p.uf))
const AVAILABLE_REGIONS: Record<string, string[]> = Object.fromEntries(
  Object.entries(BR_REGIONS)
    .map(([region, states]): [string, string[]] => [region, states.filter(s => UFS_WITH_PRODUCTS.has(s))])
    .filter(([, states]) => states.length > 0)
)

const ALL_CATEGORIES: ProductCategory[] = [
  "Perfumaria", "Artes", "Esportes", "Infantil", "Utilidades",
  "Instrumentos", "Derivados", "Mobiliário", "Eletrodomésticos",
  "Construção", "Alimentos", "Saúde", "Tecnologia",
]

const ALL_STATES: ProductState[] = ["Ativo", "Novo", "Inativo", "Descontinuado"]

type OpenFilter = "category" | "sales" | "uf" | null

type AdvancedFilters = {
  states:    ProductState[]
  priceMin:  string
  priceMax:  string
  ratingMin: string
  ratingMax: string
  stockMin:  string
  stockMax:  string
  dateFrom:  string
  dateTo:    string
}

const EMPTY_ADVANCED: AdvancedFilters = {
  states: [],
  priceMin: "", priceMax: "",
  ratingMin: "", ratingMax: "",
  stockMin: "", stockMax: "",
  dateFrom: "", dateTo: "",
}

function advancedActiveCount(f: AdvancedFilters) {
  return [
    f.states.length > 0,
    f.priceMin !== "" || f.priceMax !== "",
    f.ratingMin !== "" || f.ratingMax !== "",
    f.stockMin !== "" || f.stockMax !== "",
    f.dateFrom !== "" || f.dateTo !== "",
  ].filter(Boolean).length
}


function parseDMY(s: string): Date {
  const [d, m, y] = s.split("/")
  return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`)
}

function AdvancedFiltersDrawer({
  open,
  filters,
  onChange,
  onClose,
  onClear,
}: {
  open: boolean
  filters: AdvancedFilters
  onChange: (f: AdvancedFilters) => void
  onClose: () => void
  onClear: () => void
}) {
  const toggleState = (s: ProductState) =>
    onChange({
      ...filters,
      states: filters.states.includes(s)
        ? filters.states.filter(x => x !== s)
        : [...filters.states, s],
    })

  const hasAny = advancedActiveCount(filters) > 0

  const rangeRow = (
    labelA: string,
    valA: string,
    onA: (v: string) => void,
    labelB: string,
    valB: string,
    onB: (v: string) => void,
    extra?: React.InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <div className="flex gap-2">
      <input
        type="number"
        placeholder={labelA}
        value={valA}
        onChange={e => onA(e.target.value)}
        {...extra}
        className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-300"
      />
      <input
        type="number"
        placeholder={labelB}
        value={valB}
        onChange={e => onB(e.target.value)}
        {...extra}
        className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-300"
      />
    </div>
  )

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/20 z-[9990]" onClick={onClose} />
      )}

      <div className={cn(
        "fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-[9991] flex flex-col transition-transform duration-300 ease-in-out",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <TuneIcon sx={{ fontSize: 16, color: "#374151" }} />
            <span className="font-semibold text-gray-900 text-sm">Filtros avançados</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <CloseIcon sx={{ fontSize: 18 }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Status */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Status</h3>
            <div className="flex flex-col gap-2.5">
              {ALL_STATES.map(s => (
                <label key={s} className="flex items-center gap-2.5 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={filters.states.includes(s)}
                    onChange={() => toggleState(s)}
                    className="w-4 h-4 rounded border-gray-300 accent-purple-600 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{s}</span>
                </label>
              ))}
            </div>
          </section>

          <div className="border-t border-gray-100" />

          {/* Preço */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Preço (R$)</h3>
            {rangeRow(
              "Mín", filters.priceMin, v => onChange({ ...filters, priceMin: v }),
              "Máx", filters.priceMax, v => onChange({ ...filters, priceMax: v }),
            )}
          </section>

          <div className="border-t border-gray-100" />

          {/* Avaliação */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Avaliação (0 – 10)</h3>
            {rangeRow(
              "Mín", filters.ratingMin, v => onChange({ ...filters, ratingMin: v }),
              "Máx", filters.ratingMax, v => onChange({ ...filters, ratingMax: v }),
              { min: 0, max: 10, step: 0.1 },
            )}
          </section>

          <div className="border-t border-gray-100" />

          {/* Estoque */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Estoque</h3>
            {rangeRow(
              "Mín", filters.stockMin, v => onChange({ ...filters, stockMin: v }),
              "Máx", filters.stockMax, v => onChange({ ...filters, stockMax: v }),
            )}
          </section>

          <div className="border-t border-gray-100" />

          {/* Data de criação */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Data de criação</h3>
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-xs text-gray-400 mb-1">De</p>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={e => onChange({ ...filters, dateFrom: e.target.value })}
                  className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-300"
                />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Até</p>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={e => onChange({ ...filters, dateTo: e.target.value })}
                  className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-300"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className={cn(
          "px-5 py-4 border-t border-gray-200 transition-opacity duration-200",
          hasAny ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <button
            onClick={onClear}
            className="w-full flex items-center justify-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors py-1"
          >
            <CloseIcon sx={{ fontSize: 14 }} />
            Limpar filtros avançados
          </button>
        </div>
      </div>
    </>
  )
}

function GroupedUFDropdown({
  selected,
  onSelect,
}: {
  selected: string | null
  onSelect: (uf: string) => void
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const toggle = (region: string) =>
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(region) ? next.delete(region) : next.add(region)
      return next
    })

  return (
    <div className="w-full py-1 max-h-72 overflow-y-auto">
      {Object.entries(AVAILABLE_REGIONS).map(([region, ufs]) => {
        const isOpen = !collapsed.has(region)
        return (
          <div key={region}>
            <button
              onClick={() => toggle(region)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              {region}
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: 14,
                  transform: isOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.15s",
                }}
              />
            </button>

            {isOpen && ufs.map(uf => (
              <button
                key={uf}
                onClick={() => onSelect(uf)}
                className={cn(
                  "w-full text-left pl-6 pr-3 py-1.5 text-sm hover:bg-gray-50 transition-colors",
                  selected === uf && "bg-purple-50 text-purple-700 font-medium"
                )}
              >
                {uf}
              </button>
            ))}
          </div>
        )
      })}
    </div>
  )
}

function applyFilters(
  products: Product[],
  tab: string,
  category: ProductCategory | null,
  uf: string | null,
  salesMin: string,
  salesMax: string,
  searchQuery: string,
  adv: AdvancedFilters,
): Product[] {
  let data = products

  if (tab === "new") data = data.filter(p => p.state === "Novo")
  if (category)      data = data.filter(p => p.category === category)
  if (uf)            data = data.filter(p => p.uf === uf)
  const salesMinN = salesMin !== "" ? Number(salesMin) : null
  const salesMaxN = salesMax !== "" ? Number(salesMax) : null
  if (salesMinN != null) data = data.filter(p => p.totalSales >= salesMinN)
  if (salesMaxN != null) data = data.filter(p => p.totalSales <= salesMaxN)
  if (searchQuery)   data = data.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))

  if (adv.states.length)  data = data.filter(p => adv.states.includes(p.state))

  const priceMin = adv.priceMin !== "" ? Number(adv.priceMin) : null
  const priceMax = adv.priceMax !== "" ? Number(adv.priceMax) : null
  if (priceMin != null) data = data.filter(p => p.price != null && p.price >= priceMin)
  if (priceMax != null) data = data.filter(p => p.price != null && p.price <= priceMax)

  const ratingMin = adv.ratingMin !== "" ? Number(adv.ratingMin) : null
  const ratingMax = adv.ratingMax !== "" ? Number(adv.ratingMax) : null
  if (ratingMin != null) data = data.filter(p => p.rating >= ratingMin)
  if (ratingMax != null) data = data.filter(p => p.rating <= ratingMax)

  const stockMin = adv.stockMin !== "" ? Number(adv.stockMin) : null
  const stockMax = adv.stockMax !== "" ? Number(adv.stockMax) : null
  if (stockMin != null) data = data.filter(p => p.stock >= stockMin)
  if (stockMax != null) data = data.filter(p => p.stock <= stockMax)

  if (adv.dateFrom) {
    const from = new Date(adv.dateFrom)
    data = data.filter(p => parseDMY(p.createdAt) >= from)
  }
  if (adv.dateTo) {
    const to = new Date(adv.dateTo)
    data = data.filter(p => parseDMY(p.createdAt) <= to)
  }

  return data
}


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

function ProductExpandedRow({ product }: { product: Product }) {
  const prevRating = Math.max(1, +(product.rating - 1.8).toFixed(1))
  const prevPrice  = product.price != null ? product.price - 4 : null

  const history = [
    {
      type: "edit" as const,
      user: "Luana Ferragut",
      text: prevPrice != null
        ? `atualizou o valor: R$ ${prevPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} → R$ ${product.price!.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        : "atualizou as informações do produto",
      time: "18/04 2026 16:20",
    },
    {
      type: "rating" as const,
      user: "Thiago Botelho",
      text: "atualizou avaliação de",
      from: prevRating,
      to: product.rating,
      time: "05/04 2026 19:15",
    },
    {
      type: "add" as const,
      user: "Ana Gomes",
      text: "criou o produto",
      time: product.createdAt,
    },
  ]

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`

  return (
    <div className="bg-violet-50/50 px-8 py-5 flex gap-8 border-t border-violet-100">
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
                {entry.type === "add"
                  ? <AddIcon sx={{ fontSize: 13, color: "#9CA3AF" }} />
                  : <EditOutlinedIcon sx={{ fontSize: 12, color: "#7C3AED" }} />
                }
              </div>
              {i < history.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
            </div>

            <div className="pb-6 flex items-center gap-1 flex-wrap text-sm">
              <span className="font-semibold text-gray-800">{entry.user}</span>

              {entry.type === "edit" && prevPrice != null && (
                <>
                  <span className="text-gray-500">atualizou o valor:</span>
                  <span className="font-semibold text-gray-800">{fmt(prevPrice)} - {fmt(product.price!)}</span>
                </>
              )}
              {entry.type === "edit" && prevPrice == null && (
                <span className="text-gray-500">atualizou as informações do produto</span>
              )}

              {entry.type === "rating" && (
                <>
                  <span className="text-gray-500">atualizou avaliação de</span>
                  <RatingBadge rating={entry.from} />
                  <span className="text-gray-500">para</span>
                  <RatingBadge rating={entry.to} />
                </>
              )}

              {entry.type === "add" && (
                <>
                  <span className="text-gray-500">created</span>
                  <span className="font-medium text-violet-600">produto</span>
                </>
              )}

              <span className="text-xs text-gray-400 ml-0.5">- {entry.time}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="w-72 shrink-0">
        <h3 className="text-sm font-bold text-gray-800 mb-2 text-center">
          Resumo da <span className="text-green-500">V.IA</span>
        </h3>
        <div className="p-px rounded-lg" style={{ background: "linear-gradient(135deg, #4ade80, #2dd4bf, #818cf8)" }}>
          <div className="bg-white rounded-lg p-3 text-xs text-gray-600 space-y-2">
            <p className="text-gray-500">Um breve resumo criado pelo agente, visando facilitar o entendimento dos dados:</p>
            <p>Contato <span className="font-bold text-gray-800">Adicionado</span> no dia: {product.createdAt}</p>
            <p>Ultima <span className="font-bold text-gray-800">Compra</span>: {product.name}</p>
            <div className="pt-1 flex justify-end">
              <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
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


type FilterSnapshot = {
  activeTab:        string
  selectedCategory: ProductCategory | null
  selectedUF:       string | null
  salesMin:         string
  salesMax:         string
  searchQuery:      string
  searchOpen:       boolean
  advanced:         AdvancedFilters
}

export type ProductsTableHandle = {
  undo:  () => void
  reset: () => void
}

export const ProductsTable = forwardRef<ProductsTableHandle, { onCanUndoChange?: (can: boolean) => void }>(
  ({ onCanUndoChange }, ref) => {
  const [activeTab,        setActiveTab]        = useState("all")
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null)
  const [selectedUF,       setSelectedUF]       = useState<string | null>(null)
  const [salesMin,         setSalesMin]         = useState("")
  const [salesMax,         setSalesMax]         = useState("")
  const [openFilter,       setOpenFilter]       = useState<OpenFilter>(null)
  const [expandedRowId,    setExpandedRowId]    = useState<string | null>(null)
  const [searchOpen,       setSearchOpen]       = useState(false)
  const [searchQuery,      setSearchQuery]      = useState("")
  const [advanced,         setAdvanced]         = useState<AdvancedFilters>(EMPTY_ADVANCED)
  const [drawerOpen,       setDrawerOpen]       = useState(false)
  const [filterHistory,    setFilterHistory]    = useState<FilterSnapshot[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)

  const currentFilters = useRef<FilterSnapshot>({
    activeTab: "all", selectedCategory: null, selectedUF: null,
    salesMin: "", salesMax: "", searchQuery: "", searchOpen: false,
    advanced: EMPTY_ADVANCED,
  })
  useEffect(() => {
    currentFilters.current = {
      activeTab, selectedCategory, selectedUF, salesMin, salesMax,
      searchQuery, searchOpen, advanced,
    }
  })

  const pushHistory = useCallback(() => {
    setFilterHistory(h => [...h, { ...currentFilters.current }])
  }, [])

  useEffect(() => {
    onCanUndoChange?.(filterHistory.length > 0)
  }, [filterHistory.length, onCanUndoChange])

  useImperativeHandle(ref, () => ({
    undo: () => {
      setFilterHistory(h => {
        if (h.length === 0) return h
        const prev = h[h.length - 1]
        setActiveTab(prev.activeTab)
        setSelectedCategory(prev.selectedCategory)
        setSelectedUF(prev.selectedUF)
        setSalesMin(prev.salesMin)
        setSalesMax(prev.salesMax)
        setSearchQuery(prev.searchQuery)
        setSearchOpen(prev.searchOpen)
        setAdvanced(prev.advanced)
        setOpenFilter(null)
        setDrawerOpen(false)
        return h.slice(0, -1)
      })
    },
    reset: () => {
      pushHistory()
      setActiveTab("all")
      setSelectedCategory(null)
      setSelectedUF(null)
      setSalesMin("")
      setSalesMax("")
      setOpenFilter(null)
      setSearchQuery("")
      setSearchOpen(false)
      setAdvanced(EMPTY_ADVANCED)
      setDrawerOpen(false)
    },
  }), [pushHistory])

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  const onToggleExpand = (id: string) =>
    setExpandedRowId(prev => prev === id ? null : id)

  const filteredData = applyFilters(
    mockProducts, activeTab, selectedCategory, selectedUF, salesMin, salesMax, searchQuery, advanced
  )

  const resetFilters = () => {
    setSelectedCategory(null)
    setSelectedUF(null)
    setSalesMin("")
    setSalesMax("")
    setOpenFilter(null)
    setSearchQuery("")
    setSearchOpen(false)
    setAdvanced(EMPTY_ADVANCED)
  }

  const clearAll = () => {
    pushHistory()
    resetFilters()
  }

  const handleTabChange = (tab: string) => {
    pushHistory()
    setActiveTab(tab)
    resetFilters()
  }

  const openDrawer = () => {
    pushHistory()
    setDrawerOpen(true)
  }

  const advCount = advancedActiveCount(advanced)

  const hasActiveFilters =
    selectedCategory !== null || selectedUF !== null ||
    salesMin !== "" || salesMax !== "" || advCount > 0

  const ufLabel       = selectedUF       ?? "Todos os estados"
  const categoryLabel = selectedCategory ?? "Tipo de produto"
  const salesLabel    = (salesMin || salesMax)
    ? `${salesMin || "0"} – ${salesMax || "∞"}`
    : "Vendas totais"

  const tabBtn = (id: string, label: string) => (
    <button
      key={id}
      onClick={() => handleTabChange(id)}
      className={cn(
        "flex items-center gap-1.5 py-3 px-2 text-sm border-b-2 transition-colors whitespace-nowrap",
        activeTab === id
          ? "border-gray-900 text-gray-900 font-medium"
          : "border-transparent text-gray-500 hover:text-gray-700"
      )}
    >
      <TableChartOutlinedIcon sx={{ fontSize: 16 }} />
      {label}
    </button>
  )

  const filterPill = (
    key: OpenFilter,
    label: string,
    isActive: boolean,
    onClear: () => void,
    children: React.ReactNode,
    stretch = false,
  ) => (
    <div className="relative">
      <button
        onClick={() => setOpenFilter(openFilter === key ? null : key)}
        className={cn(
          "flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors",
          isActive
            ? "bg-purple-50 text-purple-700 font-medium"
            : "text-gray-600 hover:bg-gray-100"
        )}
      >
        {label}
        {isActive && (
          <span role="button" onClick={e => { e.stopPropagation(); onClear() }} className="hover:opacity-70">
            <CloseIcon sx={{ fontSize: 12 }} />
          </span>
        )}
        <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
      </button>

      {openFilter === key && (
        <div className={cn(
          "absolute top-full bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]",
          stretch ? "left-0 right-0" : "left-0 mt-1"
        )}>
          {children}
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      {openFilter && (
        <div className="fixed inset-0 z-[9998]" onClick={() => setOpenFilter(null)} />
      )}

      <AdvancedFiltersDrawer
        open={drawerOpen}
        filters={advanced}
        onChange={setAdvanced}
        onClose={() => setDrawerOpen(false)}
        onClear={() => setAdvanced(EMPTY_ADVANCED)}
      />

      {/* ── Card de controles: tabs + filtros ─────────────────────────────── */}
      <div>
        {/* Tab bar */}
        <div className="flex items-center justify-between px-4 border-b border-gray-200">
          <div className="flex items-center gap-1">
            {tabBtn("all", "Todos os produtos")}
            {tabBtn("new", "Novos produtos")}
            <button className="p-2 ml-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
              <AddIcon sx={{ fontSize: 16 }} />
            </button>
          </div>

          <div className="flex items-center text-gray-500 gap-2">
            {searchOpen ? (
              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-2 py-1">
                <SearchOutlinedIcon sx={{ fontSize: 16, color: "#9CA3AF" }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar produto..."
                  className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-44"
                />
                <button
                  onClick={() => { setSearchQuery(""); setSearchOpen(false) }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </button>
              </div>
            ) : (
              <>
                {filterPill(
                  "uf",
                  ufLabel,
                  selectedUF !== null,
                  () => { pushHistory(); setSelectedUF(null) },
                  <GroupedUFDropdown
                    selected={selectedUF}
                    onSelect={(uf) => { pushHistory(); setSelectedUF(uf); setOpenFilter(null) }}
                  />,
                  true
                )}
                <button
                  onClick={() => { pushHistory(); setSearchOpen(true) }}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                >
                  <SearchOutlinedIcon sx={{ fontSize: 18 }} />
                </button>
              </>
            )}

            <button className="p-1.5 text-gray-700 hover:bg-gray-100 rounded">
              <TableChartOutlinedIcon sx={{ fontSize: 16 }} />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 flex-wrap">
          <span className="text-sm text-gray-800 font-bold">Filtrar por:</span>

          {filterPill(
            "category",
            categoryLabel,
            selectedCategory !== null,
            () => { pushHistory(); setSelectedCategory(null) },
            <div className="min-w-[180px] py-1 max-h-60 overflow-y-auto">
              {ALL_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => { pushHistory(); setSelectedCategory(cat); setOpenFilter(null) }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors",
                    selectedCategory === cat && "bg-purple-50 text-purple-700 font-medium"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {filterPill(
            "sales",
            salesLabel,
            salesMin !== "" || salesMax !== "",
            () => { pushHistory(); setSalesMin(""); setSalesMax("") },
            <div className="p-3 w-52 flex flex-col gap-2">
              <input
                type="number"
                placeholder="Mínimo"
                value={salesMin}
                onChange={e => setSalesMin(e.target.value)}
                className="border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-700 w-full focus:outline-none focus:ring-1 focus:ring-purple-300"
              />
              <input
                type="number"
                placeholder="Máximo"
                value={salesMax}
                onChange={e => setSalesMax(e.target.value)}
                className="border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-700 w-full focus:outline-none focus:ring-1 focus:ring-purple-300"
              />
              <button
                onClick={() => { pushHistory(); setOpenFilter(null) }}
                className="text-xs text-white bg-purple-600 hover:bg-purple-700 rounded px-3 py-1.5 transition-colors"
              >
                Aplicar
              </button>
            </div>
          )}

          <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
            <AddIcon sx={{ fontSize: 14 }} />
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              <CloseIcon sx={{ fontSize: 13 }} />
              Limpar todos
            </button>
          )}

          <button
            onClick={openDrawer}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-colors",
              advCount > 0
                ? "text-purple-700 font-medium"
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            <TuneIcon sx={{ fontSize: 15 }} />
            Filtros avançados
            {advCount > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] font-bold leading-none">
                {advCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── DataTable ─────────────────────────────────────────────────────── */}
      <DataTable
        data={filteredData}
        columns={makeProductColumns(expandedRowId, onToggleExpand)}
        getRowId={(p) => p.id}
        noBorder
        headerClassName="bg-[#F0DDFD]"
        dividersClassName="divide-[#9F83B2]"
        expandedRowId={expandedRowId}
        renderExpandedRow={(p) => <ProductExpandedRow product={p} />}
      />
    </div>
  )
})
