import type { ReactNode } from "react"

interface CellDoubleProps {
  top: ReactNode
  bottom?: ReactNode
}

export function CellDouble({ top, bottom }: CellDoubleProps) {
  return (
    <div className="space-y-0.5">
      <div className="text-xs font-medium text-[#06121C]">{top}</div>
      {bottom != null && (
        <div className="text-xs text-gray-400">{bottom}</div>
      )}
    </div>
  )
}
