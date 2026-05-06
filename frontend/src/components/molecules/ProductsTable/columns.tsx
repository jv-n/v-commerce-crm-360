import type { Column } from "@/components/organisms/DataTable/types"
import type { Product, ProductCategory } from "@/types/product"
import { cn } from "@/lib/utils"
import { CiCircleChevRight, CiCircleChevDown } from "react-icons/ci"
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"

const ALL_CATEGORIES: ProductCategory[] = [
  "Perfumaria", "Artes", "Esportes", "Infantil", "Utilidades",
  "Instrumentos", "Derivados", "Mobiliário", "Eletrodomésticos",
  "Construção", "Alimentos", "Saúde", "Tecnologia",
]


const CATEGORY_STYLES: Record<ProductCategory, string> = {
  "Perfumaria":       "bg-pink-100 text-pink-700",
  "Artes":            "bg-indigo-100 text-indigo-600",
  "Esportes":         "bg-green-100 text-green-700",
  "Infantil":         "bg-violet-100 text-violet-700",
  "Utilidades":       "bg-orange-100 text-orange-600",
  "Instrumentos":     "bg-lime-100 text-lime-700",
  "Derivados":        "bg-fuchsia-100 text-fuchsia-700",
  "Mobiliário":       "bg-amber-100 text-amber-700",
  "Eletrodomésticos": "bg-sky-100 text-sky-600",
  "Construção":       "bg-rose-100 text-rose-600",
  "Alimentos":        "bg-yellow-100 text-yellow-700",
  "Saúde":            "bg-teal-100 text-teal-700",
  "Tecnologia":       "bg-blue-100 text-blue-700",
}

function getRatingStyles(rating: number): { dot: string; badge: string; text: string } {
  if (rating >= 7) return { dot: "bg-green-500",  badge: "bg-green-50",  text: "text-green-700" }
  if (rating >= 5) return { dot: "bg-yellow-400", badge: "bg-yellow-50", text: "text-yellow-700" }
  return              { dot: "bg-red-500",    badge: "bg-red-50",    text: "text-red-600" }
}

export function makeProductColumns(
  expandedRowIds: Set<string>,
  onToggle: (id: string) => void,
  allIds: string[],
  onToggleAll: () => void,
): Column<Product>[] {
  const allExpanded = allIds.length > 0 && allIds.every(id => expandedRowIds.has(id))

  return [
    {
      key: "info",
      header: (
        <button onClick={onToggleAll} className="flex items-center justify-center">
          {allExpanded
            ? <CiCircleChevDown size={18} color="#7C3AED" />
            : <CiCircleChevRight size={18} color="#06121C" />
          }
        </button>
      ),
      render: (p) => (
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(p.id) }}
          className="flex items-center justify-center"
        >
          {expandedRowIds.has(p.id)
            ? <CiCircleChevDown size={18} color="#7C3AED" />
            : <CiCircleChevRight size={18} color="#06121C" />
          }
        </button>
      ),
    },

    {
      key: "id",
      header: "ID",
      minWidth: "130px",
      render: (p) => (
        <span className="text-xs font-mono text-gray-500">{p.id}</span>
      ),
    },

    {
      key: "name",
      header: "Nome",
      minWidth: "180px",
      render: (p) => (
        <span className="font-medium text-gray-900 truncate block max-w-[220px]">{p.name}</span>
      ),
    },

    {
      key: "category",
      header: "Categoria",
      minWidth: "140px",
      filter: {
        type: "select",
        label: "Categoria",
        options: ALL_CATEGORIES,
        filterFn: (p, value) => p.category === (value as ProductCategory),
      },
      render: (p) => (
        <span className={cn(
          "inline-block text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap",
          CATEGORY_STYLES[p.category]
        )}>
          {p.category}
        </span>
      ),
    },

    {
      key: "price",
      header: "Preço",
      minWidth: "100px",
      filterOptional: true,
      filter: {
        type: "number-range",
        label: "Preço (R$)",
        filterFn: (p, min, max) => {
          if (p.price == null) return false
          if (min != null && p.price < min) return false
          if (max != null && p.price > max) return false
          return true
        },
      },
      render: (p) =>
        p.price != null
          ? <span className="text-gray-800 font-medium text-sm">
              {p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          : <span className="text-gray-400 text-sm">R$ xx,xx</span>,
    },

    {
      key: "stock",
      header: "Estoque disponível",
      minWidth: "150px",
      filterOptional: true,
      filter: {
        type: "number-range",
        label: "Estoque",
        filterFn: (p, min, max) => {
          if (min != null && p.stock < min) return false
          if (max != null && p.stock > max) return false
          return true
        },
      },
      render: (p) => (
        <span className="text-gray-600 text-sm">{p.stock} produtos</span>
      ),
    },

    {
      key: "rating",
      header: "Avaliação",
      minWidth: "100px",
      filterOptional: true,
      filter: {
        type: "number-range",
        label: "Avaliação (0–10)",
        minBound: 0,
        maxBound: 10,
        variant: "slider",
        filterFn: (p, min, max) => {
          if (min != null && p.rating < min) return false
          if (max != null && p.rating > max) return false
          return true
        },
      },
      render: (p) => {
        const s = getRatingStyles(p.rating)
        return (
          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold", s.badge, s.text)}>
            <span className={cn("w-2 h-2 rounded-full flex-shrink-0", s.dot)} />
            {p.rating.toFixed(1)}
          </span>
        )
      },
    },

    {
      key: "totalSales",
      header: "Vendas totais",
      minWidth: "110px",
      filter: {
        type: "number-range",
        label: "Vendas totais",
        filterFn: (p, min, max) => {
          if (min != null && p.totalSales < min) return false
          if (max != null && p.totalSales > max) return false
          return true
        },
      },
      render: (p) => (
        <span className="text-gray-800 font-medium">{p.totalSales}</span>
      ),
    },

    {
      key: "actions",
      header: "",
      render: () => (
        <button className="flex items-center justify-center w-8 h-8 rounded-lg border border-purple-200 bg-purple-50 text-purple-500 hover:bg-purple-100 transition-colors">
          <ArrowForwardIcon sx={{ fontSize: 16 }} />
        </button>
      ),
    },
  ]
}
