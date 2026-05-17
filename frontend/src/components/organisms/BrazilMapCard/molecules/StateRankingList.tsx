import { formatCurrency } from "../utils"

interface RankItem {
  key: string
  valor: number
  pct: number
}

interface Props {
  items: RankItem[]
  isLoading?: boolean
}

export function StateRankingList({ items, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-1.5 min-w-[110px] self-start">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div className="h-3 w-8  animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[110px] self-start">
      {items.map(({ key, valor, pct }, idx) => (
        <div key={key} className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground w-3">{idx + 1}.</span>
            <span className="text-xs font-semibold text-card-foreground truncate max-w-[80px]">
              {key}
            </span>
          </div>
          <span className="text-xs font-bold text-card-foreground" title={formatCurrency(valor)}>
            {pct}%
          </span>
        </div>
      ))}
    </div>
  )
}
