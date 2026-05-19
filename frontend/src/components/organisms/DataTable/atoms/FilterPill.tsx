import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import CloseIcon from "@mui/icons-material/Close"
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md"

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
          "flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full transition-colors",
          isActive
            ? "bg-purple-50 text-purple-700 font-medium"
            : "text-gray-900 hover:bg-[#F7EBFF]"
        )}
      >
        <span>{isActive ? `${label}: ${activeValue}` : label}</span>
        {!isActive && (isOpen ? <MdKeyboardArrowUp size={14} /> : <MdKeyboardArrowDown size={14} />)}
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
