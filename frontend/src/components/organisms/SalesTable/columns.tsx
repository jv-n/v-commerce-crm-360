import type { Column } from "@/components/organisms/DataTable/types"
import { StatusBadge } from "./tableComponents/badge"
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import type { Sale, SaleStatus } from "@/types/sale"
import { cn } from "@/lib/utils"
import type { ProductCategory } from "@/types/product"

const ALL_STATUSES: SaleStatus[] = ["Aprovado", "Processando", "Recusado", "Reembolsado"]

const ALL_CATEGORIES = [
  "Eletronicos", "Brinquedos", "Vestuario", "Esportes",
  "Casa", "Moveis", "Beleza", "Automotivo", "Indefinida",
]

const ALL_PAYMENT_METHODS = ["Boleto", "Pix", "Cartão"]

const CATEGORY_STYLES: Record<ProductCategory, string> = {
  "Automotivo":  "bg-slate-100 text-slate-700",
  "Beleza":      "bg-pink-100 text-pink-700",
  "Brinquedos":  "bg-violet-100 text-violet-700",
  "Casa":        "bg-amber-100 text-amber-700",
  "Eletronicos": "bg-blue-100 text-blue-700",
  "Esportes":    "bg-green-100 text-green-700",
  "Indefinida":  "bg-gray-100 text-gray-500",
  "Moveis":      "bg-orange-100 text-orange-700",
  "Vestuario":   "bg-teal-100 text-teal-700",
}


function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export const saleColumns: Column<Sale>[] = [
  {
    key: "client",
    header: "Cliente",
    minWidth: "150px",
    render: (c) => (
      <span className="font-medium text-[#06121C] truncate block max-w-[200px]">{c.client}</span>
    ),
  },
  {
    key: "product",
    header: "Produto",
    minWidth: "150px",
    render: (c) => (
      <span className="font-medium text-[#06121C] truncate block max-w-[220px]">{c.product}</span>
    ),
  },
  {
    key: "categoria",
    header: "Categoria",
    minWidth: "130px",
    filter: {
      type: "select",
      label: "Todas as categorias",
      options: ALL_CATEGORIES,
      filterFn: (c, value) => c.categoria === value,
    },
    render: (c) => (
            <span className={cn(
              "inline-block text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap",
              CATEGORY_STYLES[c.categoria as ProductCategory]
            )}>
              {c.categoria}
            </span>
          ),
  },
  {
    key: "amount",
    header: "Quantidade",
    minWidth: "60px",
    render: (c) => (
      <span className="text-[#06121C] text-sm">{c.amount}</span>
    ),
  },

  {
    key: "value",
    header: "Valor",
    minWidth: "100px",
    render: (c) => (
      <span className="font-medium text-[#06121C]">{formatBRL(c.value)}</span>
    ),
  },

  {
    key: "saleDate",
    header: "Data do pedido",
    minWidth: "130px",
    render: (c) =>
      c.date ? (
        <div className="flex items-center gap-1.5 text-[#06121C]">
          <span className="text-xs">{c.date}</span>
        </div>
      ) : (
        <span className="text-xs text-gray-400">—</span>
      ),
  },

  {
    key: "status",
    header: "Status",
    minWidth: "100px",
    filter: {
      type: "select",
      label: "Todos os status",
      options: ALL_STATUSES,
      filterFn: (c, value) => c.status === (value as SaleStatus),
    },
    render: (c) => <StatusBadge status={c.status} />,
  },

  {
    key: "paymentMethod",
    header: "Método de pagamento",
    minWidth: "130px",
    filter: {
      type: "select",
      label: "Todos os métodos",
      options: ALL_PAYMENT_METHODS,
      filterFn: (c, value) => c.payment_method === value,
    },
    render: (c) => <span className="text-[#06121C] text-sm">{c.payment_method}</span>,
  },

  {
    key: "forward",
    header: "",
    render: () => 
      <div className="flex justify-center items-center w-[2.2rem] h-[2.2rem] rounded-md bg-[#F7EBFF] border-[#D1B1E5] border hover:bg-[#F0D4FF] cursor-pointer transition-colors">
        <ArrowForwardIcon sx={{ color: "#06121C" }} />
      </div>
  },
]
