import type { Column } from "@/components/organisms/DataTable/types"
import { StatusBadge } from "./tableComponents/badge"
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined"
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import type { Sale, SaleStatus } from "@/types/sale"

const ALL_STATUSES: SaleStatus[] = ["Aprovado", "Processando", "Recusado", "Reembolsado"]

const ALL_CATEGORIES = [
  "Eletronicos", "Brinquedos", "Vestuario", "Esportes",
  "Casa", "Moveis", "Beleza", "Automotivo", "Indefinida",
]

const ALL_PAYMENT_METHODS = ["Boleto", "Pix", "Cartão"]

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export const saleColumns: Column<Sale>[] = [
  {
    key: "product",
    header: "Produto",
    minWidth: "180px",
    render: (c) => (
      <span className="font-medium text-gray-900 truncate block max-w-[220px]">{c.product}</span>
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
      <span className="text-gray-600 text-sm">{c.categoria ?? "—"}</span>
    ),
  },

  {
    key: "value",
    header: "Valor",
    minWidth: "110px",
    render: (c) => (
      <span className="font-medium text-gray-800">{formatBRL(c.value)}</span>
    ),
  },

  {
    key: "saleDate",
    header: "Data do pedido",
    minWidth: "130px",
    render: (c) =>
      c.date ? (
        <div className="flex items-center gap-1.5 text-gray-600">
          <AccessTimeOutlinedIcon sx={{ fontSize: 14, color: "#9CA3AF" }} />
          <span className="text-xs">{c.date}</span>
        </div>
      ) : (
        <span className="text-xs text-gray-400">—</span>
      ),
  },

  {
    key: "status",
    header: "Status",
    minWidth: "130px",
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
    minWidth: "160px",
    filter: {
      type: "select",
      label: "Todos os métodos",
      options: ALL_PAYMENT_METHODS,
      filterFn: (c, value) => c.payment_method === value,
    },
    render: (c) => <span className="text-gray-700 text-sm">{c.payment_method}</span>,
  },

  {
    key: "forward",
    header: "",
    render: () => <ArrowForwardIcon sx={{ fontSize: 15, color: "#D1D5DB" }} />,
  },
]
