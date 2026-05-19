import { cn } from "@/lib/utils"
import { MdOutlineTableChart } from "react-icons/md"

interface TabButtonProps {
  label: string
  isActive: boolean
  onClick: () => void
  count?: number
}

export function TabButton({ label, isActive, onClick, count }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors",
        isActive
          ? "border-gray-800 text-gray-900"
          : "border-transparent text-gray-900 hover:bg-[#F0DDFD]"
      )}
    >
      <MdOutlineTableChart size={15} />
      {label}
      {count !== undefined && (
        <span className={cn(
          "text-xs px-1.5 py-0.5 rounded-full font-normal",
          isActive ? "bg-gray-100 text-gray-600" : "bg-gray-100 text-gray-900"
        )}>
          {count}
        </span>
      )}
    </button>
  )
}
