import type { Column } from "@/components/organisms/DataTable/types"
import { StatusBadge } from "./tableComponents/badge"
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import type { Sale, SaleStatus } from "@/types/sale"


const ALL_STATUSES: SaleStatus[] = [
  "Em andamento", "Concluída", "Falha", "Reembolsada", "Cancelada"
]

export const saleColumns: Column<Sale>[] = [
  // ── Info icon (decorative) ─────────────────────────────────────────────────
  {
    key: "info",
    header: "",
    render: () => <InfoOutlinedIcon sx={{ fontSize: 15, color: "#D1D5DB" }} />,
  },

  // ── Nome ───────────────────────────────────────────────────────────────────
  {
    key: "client",
    header: "Cliente",
    minWidth: "160px",
    render: (c) => (
      <span className="font-medium text-gray-900 truncate block max-w-[200px]">{c.client_name}</span>
    ),
  },

  // ── Responsável — select filter ─────────────────────────────────────────────
  {
    key: "product",
    header: "Produto",
    minWidth: "160px",
    render: (c) => (
       <span className="font-medium text-gray-900 truncate block max-w-[200px]">{c.product}</span>
    ),
  },

  // ── Quantidade ───────────────────────────────────────────────────────────────
  {
    key: "amount",
    header: "Quantidade",
    minWidth: "100px",
    render: (c) => <span className="text-gray-800 font-medium">{c.amount}</span>,
  },

  // ── Data pedido ──────────────────────────────────────────────────────────
  {
    key: "saleDate",
    header: "Data do pedido",
    minWidth: "130px",
    filter: {
      type: "number-range",
      label: "Todas as datas",
      filterFn: (c, min, max) => {
        if(!min && !max) return true
        const [day, month, year] = c.date.split("/").map(Number)
        const saleDate = new Date(year, month - 1, day).getTime()
        if(min) {
          const minDate = new Date(min).getTime()
          if(saleDate < minDate) return false
        }
        if(max) {
          const maxDate = new Date(max).getTime()
          if(saleDate > maxDate) return false
        }
        return true
      }
    },
    render: (c) =>
      c.date ? (
        <div className="flex items-center gap-1.5 text-gray-600">
          <AccessTimeOutlinedIcon sx={{ fontSize: 14, color: "#9CA3AF" }} />
          <span className="text-xs">{c.date}</span>
        </div>
      ) : (
        <span className="text-xs text-gray-400">Nenhuma compra</span>
      ),
  },

  // ── Status — select filter (used as rightFilterKey) ─────────────────────────
  {
    key: "status",
    header: "Status",
    minWidth: "120px",
    filter: {
      type: "select",
      label: "Todos os estados",
      options: ALL_STATUSES,
      filterFn: (c, value) => c.status === (value as SaleStatus),
    },
    render: (c) => <StatusBadge status={c.status} />,
  },

  // ── Método de pagamento — select filter ───────────────────────────────────
  {
    key: "paymentMethod",
    header: "Método de pagamento",
    minWidth: "160px",
    filter: {
      type: "select",
      label: "Todos os métodos",
      options: ["Cartão de Crédito", "Boleto Bancário", "Pix", "Transferência"],
      filterFn: (c, value) => c.payment_method === value,
    },
    render: (c) => <span className="text-gray-800">{c.payment_method}</span>,
  },

  // ── Forward icon (decorative) ─────────────────────────────────────────────────
  {
    key: "forward",
    header: "",
    render: () => (
    <ArrowForwardIcon sx={{ fontSize: 15, color: "#D1D5DB" }} />
  ),
  },
]
