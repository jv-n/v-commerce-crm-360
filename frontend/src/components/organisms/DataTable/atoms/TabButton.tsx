import { cn } from "@/lib/utils"
import TableRowsOutlinedIcon from "@mui/icons-material/TableRowsOutlined"

interface TabButtonProps {
  label: string
  isActive: boolean
  onClick: () => void
}

export function TabButton({ label, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors",
        isActive
          ? "border-gray-800 text-gray-900"
          : "border-transparent text-gray-400 hover:text-gray-600"
      )}
    >
      <TableRowsOutlinedIcon sx={{ fontSize: 15 }} />
      {label}
    </button>
  )
}
