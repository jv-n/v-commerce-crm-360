import { cn } from "@/lib/utils"

const VARIANTS = {
  /** Todos os valores reais — texto preto, tamanho base */
  primary: "text-sm text-[#06121C]",
  /** Valores nulos, placeholders, metadados — cinza pequeno */
  muted:   "text-xs text-gray-400",
} as const

interface CellTextProps {
  value: React.ReactNode
  variant?: keyof typeof VARIANTS
  truncate?: boolean
  maxWidth?: string
  className?: string
}

export function CellText({
  value,
  variant = "primary",
  truncate,
  maxWidth,
  className,
}: CellTextProps) {
  return (
    <span
      className={cn(VARIANTS[variant], truncate && "truncate block", className)}
      style={truncate && maxWidth ? { maxWidth } : undefined}
    >
      {value}
    </span>
  )
}
