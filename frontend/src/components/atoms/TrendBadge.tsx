import TrendingUpIcon from "@mui/icons-material/TrendingUp"
import TrendingDownIcon from "@mui/icons-material/TrendingDown"
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat"
import { cn } from "@/lib/utils"

interface TrendBadgeProps {
  value: number
  className?: string
}

export function TrendBadge({ value, className }: TrendBadgeProps) {
  const isPositive = value > 0
  const isNeutral = value === 0

  const colorClasses = isNeutral
    ? "bg-muted text-muted-foreground"
    : isPositive
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700"

  const Icon = isNeutral
    ? TrendingFlatIcon
    : isPositive
      ? TrendingUpIcon
      : TrendingDownIcon

  const label = isNeutral ? "0%" : `${isPositive ? "+" : ""}${value}%`

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold",
        colorClasses,
        className
      )}
    >
      {label}
      <Icon style={{ fontSize: 14 }} />
    </span>
  )
}
