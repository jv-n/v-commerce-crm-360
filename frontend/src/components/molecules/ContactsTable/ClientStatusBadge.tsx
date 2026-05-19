import { cn } from "@/lib/utils"
import type { ClientStatusType } from "@/types/contact"

const STATUS_CONFIG: Record<ClientStatusType, { dot: string; text: string; bg: string; label: string }> = {
  "Ativo":     { dot: "bg-green-500",   text: "text-green-700",   bg: "bg-green-50",   label: "Cliente Ativo"   },
  "Inativo":   { dot: "bg-red-400",     text: "text-red-600",     bg: "bg-red-50",     label: "Cliente Inativo" },
  "VIP":       { dot: "bg-purple-500",  text: "text-purple-700",  bg: "bg-purple-50",  label: "Cliente VIP"     },
  "Lead":      { dot: "bg-blue-400",    text: "text-blue-600",    bg: "bg-blue-50",    label: "Lead"            },
  "Em risco":  { dot: "bg-yellow-400",  text: "text-yellow-700",  bg: "bg-yellow-50",  label: "Em risco"        },
}

interface ClientStatusBadgeProps {
  status: ClientStatusType | null
  className?: string
}

export function ClientStatusBadge({ status, className }: ClientStatusBadgeProps) {
  if (!status || !STATUS_CONFIG[status]) {
    return <span className="text-xs text-gray-400">—</span>
  }

  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        cfg.bg,
        cfg.text,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  )
}

export const ALL_CLIENT_STATUSES: ClientStatusType[] = ["Ativo", "Inativo", "VIP", "Lead", "Em risco"]
