import { formatCurrency } from "../utils"

export interface TooltipState {
  label: string
  pedidos: number
  valor: number
  x: number
  y: number
}

export function MapTooltip({ tooltip }: { tooltip: TooltipState }) {
  return (
    <div
      className="pointer-events-none fixed z-50 rounded-md bg-popover px-2 py-1.5 text-xs text-popover-foreground shadow-md border border-border"
      style={{ left: tooltip.x + 12, top: tooltip.y - 44 }}
    >
      <p className="font-semibold">{tooltip.label}</p>
      <p className="text-muted-foreground">
        {tooltip.pedidos} pedidos · {tooltip.valor ? formatCurrency(tooltip.valor) : "Sem dados"}
      </p>
    </div>
  )
}
