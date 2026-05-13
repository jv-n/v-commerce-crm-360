import type { Column } from "@/components/organisms/DataTable/types"
import { CellText } from "@/components/organisms/DataTable/atoms/CellText"
import { CellTag }  from "@/components/organisms/DataTable/atoms/CellTag"
import { StatusBadge } from "./tableComponents/badge"
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined"
import type { Sale, SaleStatus } from "@/types/sale"
import type { ProductCategory } from "@/types/product"

const ALL_STATUSES: SaleStatus[] = ["Aprovado", "Processando", "Recusado", "Reembolsado"]

const ALL_CATEGORIES = [
  "Eletronicos", "Brinquedos", "Vestuario", "Esportes",
  "Casa", "Moveis", "Beleza", "Automotivo", "Indefinida",
]

const ALL_PAYMENT_METHODS = ["Boleto", "Pix", "Cartão"]

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

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export const saleColumns: Column<Sale>[] = [
  {
    key: "client",
    header: "Cliente",
    minWidth: "150px",
    copyId: (c) => c.id,
    render: (c) => <CellText value={c.client} truncate maxWidth="200px" />,
  },
  {
    key: "product",
    header: "Produto",
    minWidth: "150px",
    render: (c) => <CellText value={c.product} truncate maxWidth="220px" />,
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
    render: (c) => c.categoria
      ? <CellTag label={c.categoria} colorClasses={CATEGORY_COLORS[c.categoria as ProductCategory] ?? "bg-gray-100 text-[#06121C]"} />
      : <CellText value="—" variant="muted" />,
  },
  {
    key: "amount",
    header: "Quantidade",
    minWidth: "60px",
    render: (c) => <CellText value={c.amount} variant="primary" />,
  },
  {
    key: "value",
    header: "Valor",
    minWidth: "100px",
    render: (c) => <CellText value={formatBRL(c.value)} />,
  },
  {
    key: "saleDate",
    header: "Data do pedido",
    minWidth: "130px",
    render: (c) =>
      c.date ? (
        <div className="flex items-center gap-1.5 text-gray-600">
          <AccessTimeOutlinedIcon sx={{ fontSize: 13, color: "#9CA3AF" }} />
          <CellText value={c.date} variant="primary" />
        </div>
      ) : (
        <CellText value="—" variant="muted" />
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
    render: (c) => <CellText value={c.payment_method} variant="primary" />,
  },
  {
    key: "forward",
    header: "",
    render: () =>
      <div className="flex justify-center items-center w-[2.2rem] h-[2.2rem] rounded-md bg-[#F7EBFF] border-[#D1B1E5] border hover:bg-[#F0D4FF] cursor-pointer transition-colors">
        <ArrowForwardIcon sx={{ color: "#06121C" }} />
      </div>,
  },
]
