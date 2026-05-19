import { TrendBadge } from "@/components/atoms/TrendBadge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/atoms/tooltip"
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
        "flex flex-col gap-2 rounded-xl bg-card p-3 shadow-sm overflow-hidden min-w-0",
        isMock && "opacity-60",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 text-[#A195A9] font-bold text-sm">
        <span className="[&_svg]:size-4">{icon}</span>
        {title}
        {isMock && (
          <span className="ml-1 rounded bg-muted px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            Em breve
          </span>
        )}
      </div>

      {/* Main value + period trend */}
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        {isLoading ? (
          <div className="h-7 w-24 animate-pulse rounded bg-muted" />
        ) : (
          <span className="text-2xl font-bold text-secondary-foreground leading-none min-w-0 truncate">
            {currentValue}
          </span>
        )}
        {!isLoading && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-default">
                  <TrendBadge value={trendPercent} />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                {comparisonLabel}: {comparisonValue}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Divider */}
      {(yoyLabel || isLoading) && <div className="h-px bg-border" />}

      {/* YoY comparison */}
      {(yoyLabel || isLoading) && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
          <span className="size-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
          {isLoading ? (
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          ) : (
            <span className="flex items-center gap-1 min-w-0 flex-wrap">
              <span className="truncate">{yoyLabel}: {yoyValue}</span>
              {yoyPercent !== undefined && (
                <TrendBadge value={yoyPercent} className="text-[10px] px-1 py-0 shrink-0" />
              )}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
