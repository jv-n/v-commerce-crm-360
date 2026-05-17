import { useState, useEffect } from "react"
import { MetricCard } from "@/components/molecules/MetricCard"
import type { MetricCardData } from "@/components/molecules/MetricCard"
import { ModuleBarChart } from "@/components/molecules/ModuleBarChart"
import { BrazilMapCard } from "@/components/organisms/BrazilMapCard"
import { TopCategoriesChart } from "@/components/molecules/TopCategoriesChart"
import { OrdersCard } from "@/components/molecules/OrdersCard"
import { PeriodSelector } from "@/components/molecules/PeriodSelector"
import { fetchDashboardMetrics } from "@/lib/api/dashboard"
import type { DashboardMetrics, PeriodFilter } from "@/types/dashboard"

import SpeedOutlinedIcon             from "@mui/icons-material/SpeedOutlined"
import AttachMoneyOutlinedIcon        from "@mui/icons-material/AttachMoneyOutlined"
import PeopleAltOutlinedIcon          from "@mui/icons-material/PeopleAltOutlined"
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined"
import ShoppingCartOutlinedIcon       from "@mui/icons-material/ShoppingCartOutlined"
import PersonAddAltOutlinedIcon       from "@mui/icons-material/PersonAddAltOutlined"

// -----------------------------------------------------------------------
// Formatting helpers
// -----------------------------------------------------------------------

const ptBR = new Intl.NumberFormat("pt-BR")
const brl  = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })

function fmtNPS(v: number)     { return v.toFixed(1) }
function fmtBRL(v: number)     { return brl.format(v) }
function fmtCount(v: number)   { return ptBR.format(Math.round(v)) }

const PT_MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]

function parseLocalDate(s: string) {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function fmtYoyLabel(yoyStart: string, yoyEnd: string): string {
  const s = parseLocalDate(yoyStart)
  const e = parseLocalDate(yoyEnd)
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${PT_MONTHS[s.getMonth()]}/${s.getFullYear()}`
  }
  return `${PT_MONTHS[s.getMonth()]}-${PT_MONTHS[e.getMonth()]}/${e.getFullYear()}`
}

// -----------------------------------------------------------------------
// Dashboard page
// -----------------------------------------------------------------------

export default function Dashboard() {
  const [period, setPeriod] = useState<PeriodFilter>({ type: "month" })
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)

  const isLoading = metrics === null

  const handlePeriodChange = (p: PeriodFilter) => {
    setMetrics(null)
    setPeriod(p)
  }

  useEffect(() => {
    let alive = true
    fetchDashboardMetrics(period)
      .then(data => { if (alive) setMetrics(data) })
      .catch(console.error)
    return () => { alive = false }
  }, [period])

  // ------------------------------------------------------------------
  // Build MetricCardData for each real metric
  // ------------------------------------------------------------------
  const yoyLabel = metrics
    ? fmtYoyLabel(metrics.period.yoy_start, metrics.period.yoy_end)
    : "—"

  const cards: MetricCardData[] = [
    // ---- NPS ----
    {
      title: "NPS",
      icon:  <SpeedOutlinedIcon />,
      currentValue:    isLoading ? "—" : fmtNPS(metrics!.nps.value),
      trendPercent:    metrics?.nps.trend_pct ?? 0,
      comparisonLabel: "Período anterior",
      comparisonValue: isLoading ? "—" : fmtNPS(metrics!.nps.prev_value),
      yoyLabel,
      yoyValue:        isLoading ? "—" : fmtNPS(metrics!.nps.yoy_value),
      yoyPercent:      metrics?.nps.yoy_pct ?? 0,
      isLoading,
    },
    // ---- Leads Convertidos ----
    {
      title: "Leads Convertidos",
      icon:  <PersonAddAltOutlinedIcon />,
      currentValue:    isLoading || !metrics?.leads_convertidos ? "—" : fmtCount(metrics.leads_convertidos.value),
      trendPercent:    metrics?.leads_convertidos?.trend_pct ?? 0,
      comparisonLabel: "Período anterior",
      comparisonValue: isLoading || !metrics?.leads_convertidos ? "—" : fmtCount(metrics.leads_convertidos.prev_value),
      yoyLabel,
      yoyValue:        isLoading || !metrics?.leads_convertidos ? "—" : fmtCount(metrics.leads_convertidos.yoy_value),
      yoyPercent:      metrics?.leads_convertidos?.yoy_pct ?? 0,
      isLoading,
    },
    // ---- A definir ----
    {
      title: "A definir",
      icon:  <AttachMoneyOutlinedIcon />,
      currentValue:    "—",
      trendPercent:    0,
      comparisonLabel: "—",
      comparisonValue: "—",
      isMock: true,
    },
    // ---- Clientes ----
    {
      title: "Clientes",
      icon:  <PeopleAltOutlinedIcon />,
      currentValue:    isLoading ? "—" : fmtCount(metrics!.clientes.value),
      trendPercent:    metrics?.clientes.trend_pct ?? 0,
      comparisonLabel: "Período anterior",
      comparisonValue: isLoading ? "—" : fmtCount(metrics!.clientes.prev_value),
      yoyLabel,
      yoyValue:        isLoading ? "—" : fmtCount(metrics!.clientes.yoy_value),
      yoyPercent:      metrics?.clientes.yoy_pct ?? 0,
      isLoading,
    },
    // ---- Tickets Solucionados ----
    {
      title: "Tickets Solucionados",
      icon:  <ConfirmationNumberOutlinedIcon />,
      currentValue:    isLoading ? "—" : fmtCount(metrics!.tickets.value),
      trendPercent:    metrics?.tickets.trend_pct ?? 0,
      comparisonLabel: "Período anterior",
      comparisonValue: isLoading ? "—" : fmtCount(metrics!.tickets.prev_value),
      yoyLabel,
      yoyValue:        isLoading ? "—" : fmtCount(metrics!.tickets.yoy_value),
      yoyPercent:      metrics?.tickets.yoy_pct ?? 0,
      isLoading,
    },
    // ---- Vendas ----
    {
      title: "Vendas",
      icon:  <ShoppingCartOutlinedIcon />,
      currentValue:    isLoading ? "—" : fmtBRL(metrics!.vendas.value),
      trendPercent:    metrics?.vendas.trend_pct ?? 0,
      comparisonLabel: "Período anterior",
      comparisonValue: isLoading ? "—" : fmtBRL(metrics!.vendas.prev_value),
      yoyLabel,
      yoyValue:        isLoading ? "—" : fmtBRL(metrics!.vendas.yoy_value),
      yoyPercent:      metrics?.vendas.yoy_pct ?? 0,
      isLoading,
    },
  ]

  return (
    <div className="flex flex-col gap-6 h-full w-full rounded-xl bg-secondary p-6 overflow-auto">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-foreground">Dashboard</h1>
        <PeriodSelector value={period} onChange={handlePeriodChange} />
      </div>

      {/* Top section: metric cards + orders card + categories chart */}
      <div className="flex flex-row gap-4 items-stretch">
        <div className="grid grid-cols-3 gap-3 flex-1 min-w-0">
          {cards.map((card, i) => (
            <MetricCard key={`${card.title}-${i}`} {...card} />
          ))}
        </div>
        <OrdersCard period={period} />
        <TopCategoriesChart period={period} />
      </div>

      {/* Chart cards: fill remaining vertical space */}
      <div className="flex flex-row w-full flex-1 min-h-0 gap-6">
        <ModuleBarChart
            title="Receita no período"
            period={period}
        />
        <BrazilMapCard period={period} />
      </div>
    </div>
  )
}
