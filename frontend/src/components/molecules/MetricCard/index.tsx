import { TrendBadge } from "@/components/atoms/TrendBadge"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export interface MetricCardData {
  title: string
  icon: ReactNode
  currentValue: string
  trendPercent: number
  comparisonLabel: string
  comparisonValue: string
  yoyPercent?: number
  yoyLabel?: string
  yoyValue?: string
  isLoading?: boolean
  isMock?: boolean
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
  yoyPercent,
  yoyLabel,
  yoyValue,
  isLoading,
  isMock,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl bg-card p-3 shadow-sm",
        isMock && "opacity-60",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <span className="[&_svg]:size-3.5">{icon}</span>
          {title}
          {isMock && (
            <span className="ml-1 rounded bg-muted px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
              Em breve
            </span>
          )}
        </div>
        <InfoOutlinedIcon className="text-muted-foreground cursor-default" style={{ fontSize: 14 }} />
      </div>

      {/* Main value + period trend */}
      <div className="flex items-center gap-2">
        {isLoading ? (
          <div className="h-7 w-24 animate-pulse rounded bg-muted" />
        ) : (
          <span className="text-2xl font-bold text-card-foreground leading-none">
            {currentValue}
          </span>
        )}
        {!isLoading && <TrendBadge value={trendPercent} />}
      </div>

      {/* Previous period */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="size-1.5 rounded-full bg-primary shrink-0" />
        {isLoading ? (
          <div className="h-3 w-28 animate-pulse rounded bg-muted" />
        ) : (
          <span>{comparisonLabel}: {comparisonValue}</span>
        )}
      </div>

      {/* YoY comparison */}
      {(yoyLabel || isLoading) && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
          {isLoading ? (
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          ) : (
            <span className="flex items-center gap-1">
              {yoyLabel}: {yoyValue}
              {yoyPercent !== undefined && (
                <TrendBadge value={yoyPercent} className="text-[10px] px-1 py-0" />
              )}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
