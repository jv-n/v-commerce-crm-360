import { cn } from "@/lib/utils"
import type { SaleStatus } from "@/types/sale"

const STATUS_CONFIG: Record<SaleStatus, { dot: string; text: string; bg: string }> = {
  "Aprovado":    { dot: "bg-green-500",  text: "text-green-700",  bg: "bg-green-50"  },
  "Processando": { dot: "bg-blue-500",   text: "text-blue-700",   bg: "bg-blue-50"   },
  "Recusado":    { dot: "bg-red-500",    text: "text-red-600",    bg: "bg-red-50"    },
  "Reembolsado": { dot: "bg-gray-400",   text: "text-gray-600",   bg: "bg-gray-100"  },
}

interface StatusBadgeProps {
  status: SaleStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["Aprovado"]
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
      {status}
    </span>
  )
}
