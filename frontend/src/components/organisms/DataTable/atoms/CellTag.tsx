import { cn } from "@/lib/utils"

interface CellTagProps {
  label: string
  /** Classes de bg + text, ex: "bg-pink-100 text-[#06121C]" */
  colorClasses: string
  /** Quando fornecido, exibe um dot colorido antes do label */
  dotClass?: string
  className?: string
}

export function CellTag({ label, colorClasses, dotClass, className }: CellTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        colorClasses,
        className,
      )}
    >
      {dotClass && (
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dotClass)} />
      )}
      {label}
    </span>
  )
}
