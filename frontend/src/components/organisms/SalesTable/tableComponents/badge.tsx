import { cn } from "@/lib/utils"

import type { SaleStatus } from "@/types/sale";

const STATUS_CONFIG: Record<SaleStatus, { dot: string; text: string; bg: string; border?: string }> = {
  "Em andamento": { dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50" },
  "Concluída":    { dot: "bg-green-500", text: "text-green-700", bg: "bg-green-50" },
  "Falha":          { dot: "bg-red-500", text: "text-red-600", bg: "bg-red-50" },
  "Reembolsada":  { dot: "bg-gray-500", text: "text-gray-700", bg: "bg-gray-50" },
  "Cancelada":    { dot: "bg-purple-500", text: "text-purple-600", bg: "bg-purple-50" },
}

interface StatusBadgeProps {
  status: SaleStatus
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
