import { cn } from "@/lib/utils"
import type { ContactStatus } from "@/types/contact"

const STATUS_CONFIG: Record<ContactStatus, { dot: string; text: string; bg: string; border?: string }> = {
  "Cliente Ativo":   { dot: "bg-green-500",  text: "text-green-700",  bg: "bg-green-50" },
  "Cliente VIP":     { dot: "bg-purple-500", text: "text-purple-700", bg: "bg-purple-50" },
  "Em risco":        { dot: "bg-amber-400",  text: "text-amber-700",  bg: "bg-amber-50" },
  "Lead":            { dot: "bg-blue-500",   text: "text-blue-700",   bg: "bg-blue-50" },
  "Cliente Inativo": { dot: "bg-red-500",    text: "text-red-600",    bg: "bg-red-50" },
  "Desativado":      { dot: "bg-gray-400",   text: "text-gray-400",   bg: "bg-transparent", border: "border border-dashed border-gray-300" },
}

interface StatusBadgeProps {
  status: ContactStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        cfg.bg,
        cfg.text,
        cfg.border,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />
      {status}
    </span>
  )
}
