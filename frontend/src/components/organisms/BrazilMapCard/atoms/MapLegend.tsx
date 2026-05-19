import { COLOR_LOW, COLOR_HIGH, formatCurrency } from "../utils"

interface Props {
  min: number
  max: number
}

export function MapLegend({ min, max }: Props) {
  return (
    <div className="flex flex-col items-center gap-1 text-[10px] text-muted-foreground self-stretch py-1">
      <span className="shrink-0 text-center leading-tight">{max > 0 ? formatCurrency(max) : "—"}</span>
      <div
        className="w-2 flex-1 rounded-full"
        style={{ background: `linear-gradient(to bottom, rgb(${COLOR_HIGH.join(",")}), rgb(${COLOR_LOW.join(",")}))` }}
      />
      <span className="shrink-0 text-center leading-tight">{min > 0 ? formatCurrency(min) : "—"}</span>
    </div>
  )
}
