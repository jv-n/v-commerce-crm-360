import { cn } from "@/lib/utils"

export type MapView = "estados" | "regioes"

interface Props {
  view: MapView
  onChange: (v: MapView) => void
}

export function ViewToggle({ view, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      {(["estados", "regioes"] as MapView[]).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
            view === v
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          {v === "estados" ? "Estados" : "Regiões"}
        </button>
      ))}
    </div>
  )
}
