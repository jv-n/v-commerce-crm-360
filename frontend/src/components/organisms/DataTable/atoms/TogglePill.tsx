import { cn } from "@/lib/utils"
import CloseIcon from "@mui/icons-material/Close"

interface TogglePillProps {
  label: string
  active: boolean
  onToggle: () => void
}

export function TogglePill({ label, active, onToggle }: TogglePillProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors",
        active ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-900 hover:bg-[#F7EBFF]"
      )}
    >
      <span>{label}</span>
      {active && <CloseIcon sx={{ fontSize: 13 }} />}
    </button>
  )
}
