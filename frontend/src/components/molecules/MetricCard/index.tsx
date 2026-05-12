import { TrendBadge } from "@/components/atoms/TrendBadge"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export interface MetricCardData {
  title: string
  icon: ReactNode
  currentValue: string
  trendPercent: number
  /** Label shown below (e.g. "Abr/2025") */
  comparisonLabel: string
  /** Value for the comparison period */
  comparisonValue: string
}

interface MetricCardProps extends MetricCardData {
  className?: string
}

export function MetricCard({
  title,
  icon,
  currentValue,
  trendPercent,
  comparisonLabel,
  comparisonValue,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl bg-card p-4 shadow-sm",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <span className="[&_svg]:size-4">{icon}</span>
          {title}
        </div>
        <InfoOutlinedIcon
          className="text-muted-foreground cursor-default"
          style={{ fontSize: 16 }}
        />
      </div>

      {/* Main value + trend */}
      <div className="flex items-center gap-2">
        <span className="text-3xl font-bold text-card-foreground leading-none">
          {currentValue}
        </span>
        <TrendBadge value={trendPercent} />
      </div>

      {/* Comparison with same period last year */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="size-2 rounded-full bg-primary shrink-0" />
        <span>
          {comparisonLabel}: {comparisonValue}
        </span>
      </div>
    </div>
  )
}
