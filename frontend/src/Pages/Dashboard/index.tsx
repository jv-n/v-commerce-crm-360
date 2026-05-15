import { MetricCard } from "@/components/molecules/MetricCard"
import type { MetricCardData } from "@/components/molecules/MetricCard"
import { BrazilMapCard } from "@/components/organisms/BrazilMapCard"
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined"
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined"
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined"
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined"
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined"
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined"

const METRIC_CARDS: MetricCardData[] = [
  {
    title: "NPS",
    icon: <SpeedOutlinedIcon />,
    currentValue: "72",
    trendPercent: 11,
    comparisonLabel: "Abr/2025",
    comparisonValue: "65",
  },
  {
    title: "Receita",
    icon: <AttachMoneyOutlinedIcon />,
    currentValue: "R$ 84.320",
    trendPercent: 8,
    comparisonLabel: "Abr/2025",
    comparisonValue: "R$ 78.100",
  },
  {
    title: "Pedidos",
    icon: <ReceiptLongOutlinedIcon />,
    currentValue: "1.248",
    trendPercent: 5,
    comparisonLabel: "Abr/2025",
    comparisonValue: "1.189",
  },
  {
    title: "Clientes",
    icon: <PeopleAltOutlinedIcon />,
    currentValue: "3.540",
    trendPercent: -3,
    comparisonLabel: "Abr/2025",
    comparisonValue: "3.652",
  },
  {
    title: "Tickets Solucionados",
    icon: <ConfirmationNumberOutlinedIcon />,
    currentValue: "418",
    trendPercent: 0,
    comparisonLabel: "Abr/2025",
    comparisonValue: "418",
  },
  {
    title: "Vendas",
    icon: <ShoppingCartOutlinedIcon />,
    currentValue: "R$ 61.200",
    trendPercent: 14,
    comparisonLabel: "Abr/2025",
    comparisonValue: "R$ 53.700",
  },
]

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6 h-full w-full rounded-xl bg-secondary p-6 overflow-hidden">
      <h1 className="text-2xl font-bold text-secondary-foreground">Dashboard</h1>

      {/* Metric cards: 3 cols × 2 rows */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {METRIC_CARDS.map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </div>

      {/* Chart cards: fill remaining vertical space, 2 columns */}
      <div className="grid grid-cols-1 grid-rows-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <BrazilMapCard />
      </div>
    </div>
  )
}
