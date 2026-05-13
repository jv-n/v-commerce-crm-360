import type { Column } from "@/components/organisms/DataTable/types"
import type { Product, ProductCategory } from "@/types/product"
import { cn } from "@/lib/utils"
import { CiCircleChevRight, CiCircleChevDown } from "react-icons/ci"
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"

const ALL_CATEGORIES: ProductCategory[] = [
  "Automotivo", "Beleza", "Brinquedos", "Casa", "Eletronicos",
  "Esportes", "Indefinida", "Moveis", "Vestuario",
]

const CATEGORY_STYLES: Record<ProductCategory, string> = {
  "Automotivo":  "bg-slate-100 text-[#06121C]",
  "Beleza":      "bg-pink-100 text-[#06121C]",
  "Brinquedos":  "bg-[#E2CBFF] text-[#06121C]",
  "Casa":        "bg-[#FFE9CB] text-[#06121C]",
  "Eletronicos": "bg-[#FFA58E] text-[#06121C]",
  "Esportes":    "bg-[#FFCBFE] text-[#06121C]",
  "Indefinida":  "bg-gray-100 text-[#06121C]",
  "Moveis":      "bg-[#FFE9CB] text-[#06121C]",
  "Vestuario":   "bg-teal-100 text-[#06121C]",
}

function getRatingStyles(rating: number): { dot: string; badge: string; text: string } {
  if (rating >= 7) return { dot: "bg-[#257719]",  badge: "bg-[#D2F9BE]",  text: "text-[#257719]" }
  if (rating >= 5) return { dot: "bg-[#D8AE30]", badge: "bg-[#F9ED9B]", text: "text-[#CCA327]" }
  return              { dot: "bg-[#EF5466]",    badge: "bg-[#FFEDEF]",    text: "text-[#D1293D]" }
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
        <span className="text-xs font-medium text-[#06121C]">{p.id}</span>
      ),
    },

    {
      key: "name",
      header: "Nome",
      minWidth: "180px",
      sortable: true,
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
          "inline-block text-xs font-medium px-3 py-1 rounded-[3.83px] whitespace-nowrap",
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
      sortable: true,
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
      sortable: true,
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
      sortable: true,
      filterOptional: true,
      filter: {
        type: "number-range",
        label: "Avaliação (0–10)",
        minBound: 0,
        maxBound: 10,
        filterFn: (p, min, max) => {
          if (min != null && p.rating < min) return false
          if (max != null && p.rating > max) return false
          return true
        },
      },
      render: (p) => {
        const s = getRatingStyles(p.rating)
        return (
          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[3.83px] text-xs font-semibold", s.badge, s.text)}>
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
      sortable: true,
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
        <button className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#D1B1E5] bg-[#F7EBFF] text-black hover:bg-purple-100 transition-colors">
          <ArrowForwardIcon sx={{ fontSize: 16 }} />
        </button>
      ),
    },
  ]
}
