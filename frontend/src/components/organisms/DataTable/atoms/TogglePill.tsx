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
        "flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border transition-colors",
        active ? "bg-purple-100 border-purple-300 text-gray-900 font-medium" : "border-transparent text-gray-900 hover:bg-purple-100 hover:border-purple-300"
      )}
    >
      <span>{label}</span>
      {active && <CloseIcon sx={{ fontSize: 13 }} />}
    </button>
  )
}
