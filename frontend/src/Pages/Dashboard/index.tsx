import { MetricCard } from "@/components/molecules/MetricCard"
import type { MetricCardData } from "@/components/molecules/MetricCard"
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined"
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined"
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined"
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined"
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined"
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined"
import { ModuleBarChart } from "@/components/molecules/ModuleBarChart"

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
    <div className="flex flex-col items-start gap-6 h-full w-full rounded-xl bg-secondary p-6 overflow-auto">
      <h1 className="text-2xl font-bold text-secondary-foreground">Dashboard</h1>

      <div className="grid grid-cols-1 w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {METRIC_CARDS.map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </div>

      <div className="flex justify-start">
        <ModuleBarChart
            title="Receita mensal" 
            type="pedidos"
            serial_data={[3, 4, 7, 9]}
            xAxis_data={["Jan", "Fev", "Mar", "Apr"]}
        />
        <div>
        </div>
      </div>
    </div>
  )
}
