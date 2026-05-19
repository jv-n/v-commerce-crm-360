import { useState } from "react"
import { BRAZIL_STATE_PATHS } from "../brazilPaths"
import { getStateColor, COLOR_EMPTY } from "../utils"
import { MapTooltip } from "../atoms/MapTooltip"
import type { TooltipState } from "../atoms/MapTooltip"

interface Props {
  // per-state lookups derived by index.tsx (works for both estados & regioes views)
  stateValues:  Record<string, number> // sigla → valor (for color)
  statePedidos: Record<string, number> // sigla → pedidos (for tooltip)
  stateLabels:  Record<string, string> // sigla → display label (for tooltip)
  min: number
  max: number
  isLoading?: boolean
}

export function BrazilSvgMap({ stateValues, statePedidos, stateLabels, min, max, isLoading }: Props) {
  const [tooltip,       setTooltip]       = useState<TooltipState | null>(null)
  const [hoveredSigla,  setHoveredSigla]  = useState<string | null>(null)

  return (
    <div className="relative flex-1 min-h-0">
      <svg
        viewBox="-25 -28 365 378"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
        onMouseLeave={() => { setTooltip(null); setHoveredSigla(null) }}
      >
        {Object.entries(BRAZIL_STATE_PATHS).map(([sigla, { d }]) => {
          const fill = isLoading ? COLOR_EMPTY : getStateColor(stateValues[sigla], min, max)
          return (
            <path
              key={sigla}
              d={d}
              fill={fill}
              stroke="#ffffff"
              strokeWidth={0.5}
              style={{ cursor: "pointer" }}
              onMouseEnter={(e) => {
                setHoveredSigla(sigla)
                setTooltip({
                  label:    stateLabels[sigla]  ?? sigla,
                  pedidos:  statePedidos[sigla] ?? 0,
                  valor:    stateValues[sigla]  ?? 0,
                  x: e.clientX,
                  y: e.clientY,
                })
              }}
              onMouseMove={(e) =>
                setTooltip((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)
              }
              onMouseLeave={() => { setTooltip(null); setHoveredSigla(null) }}
            />
          )
        })}

        {/* Hover outline rendered on top so it's never clipped by neighbour fills */}
        {hoveredSigla && BRAZIL_STATE_PATHS[hoveredSigla] && (
          <path
            d={BRAZIL_STATE_PATHS[hoveredSigla].d}
            fill="none"
            stroke="#9F83B2"
            strokeWidth={1.5}
            strokeLinejoin="round"
            style={{ pointerEvents: "none" }}
          />
        )}
      </svg>

      {tooltip && <MapTooltip tooltip={tooltip} />}
    </div>
  )
}
