import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import CloseIcon from "@mui/icons-material/Close"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"

interface FilterPillProps {
  label: string
  activeValue?: string
  isOpen: boolean
  onToggle: () => void
  onClear: (e: React.MouseEvent) => void
  alignRight?: boolean
  children: ReactNode
}

export function FilterPill({
  label,
  activeValue,
  isOpen,
  onToggle,
  onClear,
  alignRight = false,
  children,
}: FilterPillProps) {
  const isActive = !!activeValue

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-1 text-sm border rounded-md px-3 py-1.5 transition-colors",
          isActive
            ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
        )}
      >
        <span>{isActive ? `${label}: ${activeValue}` : label}</span>
        {!isActive && <KeyboardArrowDownIcon sx={{ fontSize: 14 }} />}
        {isActive  && <CloseIcon sx={{ fontSize: 13 }} onClick={onClear} />}
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50",
            alignRight ? "right-0" : "left-0"
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}
