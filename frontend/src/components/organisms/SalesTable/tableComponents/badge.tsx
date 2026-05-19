import { cn } from "@/lib/utils"
import type { SaleStatus } from "@/types/sale"

const STATUS_CONFIG: Record<SaleStatus, { dot: string; text: string; bg: string }> = {
  "Processando":          { dot: "bg-blue-500",    text: "text-blue-700",    bg: "bg-blue-50"    },
  "Aprovado":             { dot: "bg-teal-500",    text: "text-teal-700",    bg: "bg-teal-50"    },
  "Em rota":              { dot: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50"   },
  "Entregue":             { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  "Entregue com Atraso":  { dot: "bg-yellow-500",  text: "text-yellow-700",  bg: "bg-yellow-50"  },
  "Recusado":             { dot: "bg-red-500",     text: "text-red-600",     bg: "bg-red-50"     },
  "Cancelado":            { dot: "bg-slate-500",   text: "text-slate-700",   bg: "bg-slate-100"  },
  "Reembolsado":          { dot: "bg-gray-400",    text: "text-gray-600",    bg: "bg-gray-100"   },
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
        "inline-flex items-center gap-1.5 rounded px-2 py-1 text-[9.38px] font-medium whitespace-nowrap",
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
