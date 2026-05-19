import type { Column } from "@/components/organisms/DataTable/types"
import { OpenCircleButton } from "@/components/atoms/open-circle-button"
import { CellText }        from "@/components/organisms/DataTable/atoms/CellText"
import { CellTag }         from "@/components/organisms/DataTable/atoms/CellTag"
import type { Product, ProductCategory } from "@/types/product"
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import { cn } from "@/lib/utils"

const ALL_CATEGORIES: ProductCategory[] = [
  "Automotivo", "Beleza", "Brinquedos", "Casa", "Eletronicos",
  "Esportes", "Indefinida", "Moveis", "Vestuario",
]

const CATEGORY_COLORS: Record<ProductCategory, string> = {
  "Automotivo":  "bg-slate-100 text-[#06121C]",
  "Beleza":      "bg-pink-100 text-[#06121C]",
  "Brinquedos":  "bg-violet-100 text-[#06121C]",
  "Casa":        "bg-amber-100 text-[#06121C]",
  "Eletronicos": "bg-blue-100 text-[#06121C]",
  "Esportes":    "bg-green-100 text-[#06121C]",
  "Indefinida":  "bg-gray-100 text-[#06121C]",
  "Moveis":      "bg-orange-100 text-[#06121C]",
  "Vestuario":   "bg-teal-100 text-[#06121C]",
}

function getRatingStyles(rating: number): { dotClass: string; colorClasses: string } {
  if (rating >= 7) return { dotClass: "bg-[#257719]", colorClasses: "bg-[#D2F9BE] text-[#257719]" }
  if (rating >= 5) return { dotClass: "bg-[#D8AE30]", colorClasses: "bg-[#F9ED9B] text-[#CCA327]" }
  return              { dotClass: "bg-[#EF5466]", colorClasses: "bg-[#FFEDEF] text-[#D1293D]" }
}

export function makeProductColumns(
  expandedRowIds: Set<string>,
  onToggle: (id: string) => void,
  allIds: string[],
  onToggleAll: () => void,
  onNavigate: (id: string) => void,
): Column<Product>[] {
  const allExpanded = allIds.length > 0 && allIds.every(id => expandedRowIds.has(id))

  return [
    {
      key: "info",
      header: (
        <div
          onClick={(e) => e.stopPropagation()}
          className={allExpanded ? "inline-flex rotate-90 transition-transform duration-200" : "inline-flex transition-transform duration-200"}
        >
          <OpenCircleButton
            title={allExpanded ? "Fechar todos" : "Abrir todos"}
            onClick={() => onToggleAll()}
          />
        </div>
      ),
      render: (p) => (
        <div className={expandedRowIds.has(p.id) ? "inline-flex rotate-90 transition-transform duration-200" : "inline-flex transition-transform duration-200"}>
          <OpenCircleButton title={expandedRowIds.has(p.id) ? "Fechar detalhes do produto" : "Abrir detalhes do produto"} />
        </div>
      ),
    },

    {
      key: "id",
      header: "ID",
      minWidth: "130px",
      render: (p) => <CellText value={p.id} variant="primary" />,
    },

    {
      key: "name",
      header: "Nome",
      minWidth: "180px",
      sortable: true,
      copyId: (p) => p.id,
      render: (p) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNavigate(p.id) }}
          className="text-left hover:bg-[#CFA7FF] rounded-lg px-2 py-0.5 transition-colors"
        >
          <CellText value={p.name} truncate maxWidth="220px" />
        </button>
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
        <CellTag label={p.category} colorClasses={CATEGORY_COLORS[p.category]} />
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
          ? <CellText value={p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} variant="primary" />
          : <CellText value="R$ —" variant="muted" />,
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
      render: (p) => <CellText value={`${p.stock} produtos`} variant="primary" />,
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
          <CellTag
            label={p.rating.toFixed(1)}
            colorClasses={s.colorClasses}
            dotClass={s.dotClass}
          />
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
      render: (p) => <CellText value={p.totalSales} variant="primary" />,
    },

    {
      key: "actions",
      header: "",
      render: (p) => (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(p.id) }}
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg",
            "border border-[#D1B1E5] bg-[#F7EBFF] hover:bg-[#F0DDFD] transition-colors"
          )}
        >
          <ArrowForwardIcon sx={{ fontSize: 16, color: "#06121C" }} />
        </button>
      ),
    },
  ]
}
