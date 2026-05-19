import { cn } from "@/lib/utils"

interface CellTagProps {
  label: string
  /** Classes de bg + text, ex: "bg-pink-100 text-[#06121C]" */
  colorClasses: string
  /** Quando fornecido, exibe um dot colorido antes do label */
  dotClass?: string
  className?: string
  /** "pill" (padrão, rounded-full) | "badge" (rounded, estilo TicketStatusBadge) */
  variant?: "pill" | "badge"
}

export function CellTag({ label, colorClasses, dotClass, className, variant = "pill" }: CellTagProps) {
  const base =
    variant === "badge"
      ? "inline-flex items-center gap-1.5 rounded px-2 py-1 text-[9.38px] font-medium whitespace-nowrap"
      : "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9.8px] leading-[17.6px] font-medium whitespace-nowrap"

  return (
    <span className={cn(base, colorClasses, className)}>
      {dotClass && (
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dotClass)} />
      )}
      {label}
    </span>
  )
}
