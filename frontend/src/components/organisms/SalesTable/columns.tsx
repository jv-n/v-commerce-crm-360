import type { Column } from "@/components/organisms/DataTable/types"
import { CellText } from "@/components/organisms/DataTable/atoms/CellText"
import { CellTag }  from "@/components/organisms/DataTable/atoms/CellTag"
import { StatusBadge } from "./tableComponents/badge"
import { OpenCircleButton } from "@/components/atoms/open-circle-button"
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"

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

export function getSaleColumns(
  expandedRowIds: Set<string>,
  onToggleExpand: (id: string) => void,
): Column<Sale>[] {
  return [
    {
      key: "open",
      header: "",
      minWidth: "30px",
      render: (sale) => {
        const isExpanded = expandedRowIds.has(sale.id)
        return (
          <div
            onClick={(e) => e.stopPropagation()}
            className={isExpanded ? "inline-flex rotate-90 transition-transform duration-200" : "inline-flex transition-transform duration-200"}
          >
            <OpenCircleButton
              title={isExpanded ? "Fechar histórico do pedido" : "Abrir histórico do pedido"}
              onClick={() => onToggleExpand(sale.id)}
            />
          </div>
        )
      },
    },
    {
      key: "client",
      header: "Cliente",
      minWidth: "130px",
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
      minWidth: "100px",
      filter: {
        type: "select",
        label: "Categoria",
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
      filter: {
        type: "date-range" as const,
        label: "Data do pedido",
        filterFn: (c: Sale, from: string | null, to: string | null) => {
          if (!c.date) return true
          const [d, m, y] = c.date.split("/")
          const iso = `${y}-${m}-${d}`
          if (from && iso < from) return false
          if (to   && iso > to)   return false
          return true
        },
      },
      render: (c) =>
        c.date
          ? <CellText value={c.date} variant="primary" />
          : <CellText value="—" variant="muted" />,
    },
    {
      key: "status",
      header: "Status",
      minWidth: "100px",
      filter: {
        type: "select",
        label: "Status do pedido",
        options: ALL_STATUSES,
        filterFn: (c, value) => c.status === (value as SaleStatus),
      },
      render: (c) => <StatusBadge status={c.status} />,
    },
    {
      key: "paymentMethod",
      header: "Tipo de pagamento",
      minWidth: "130px",
      filter: {
        type: "select",
        label: "Tipo de pagamento",
        options: ALL_PAYMENT_METHODS,
        filterFn: (c, value) => c.payment_method === value,
      },
      render: (c) => <CellText value={c.payment_method} variant="primary" />,
    },
    {
      key: "forward",
      header: "",
      render: () => (
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D1B1E5] bg-[#F7EBFF] transition-colors hover:bg-[#F0DDFD]"
        >
          <ArrowForwardIcon sx={{ fontSize: 16, color: "#06121C" }} />
        </button>
      ),
    },
  ]
}
