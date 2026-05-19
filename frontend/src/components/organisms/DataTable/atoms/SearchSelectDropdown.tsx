import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import type { SearchSelectFilterDef } from "../types"

interface SearchSelectDropdownProps<T> {
  def: SearchSelectFilterDef<T>
  activeValue: string
  onSelect: (value: string) => void
  onClear: () => void
}

export function SearchSelectDropdown<T>({
  def,
  activeValue,
  onSelect,
  onClear,
}: SearchSelectDropdownProps<T>) {
  const [query, setQuery]     = useState("")
  const [options, setOptions] = useState<string[]>([])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      if (!query.trim()) { setOptions([]); return }
      try { setOptions(await def.fetchOptions(query)) }
      catch { setOptions([]) }
    }, query.trim() ? 300 : 0)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [query, def])

  return (
    <div className="py-1 min-w-[220px]">
      <div className="px-2 pb-1.5">
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.stopPropagation()}
          placeholder={`Buscar ${def.label.toLowerCase()}...`}
          className="w-full rounded-md border border-input bg-transparent text-black px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="max-h-48 overflow-y-auto">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={cn(
              "w-full text-left px-3 py-2 text-sm transition-colors",
              activeValue === opt
                ? "bg-purple-50 text-purple-700 font-medium"
                : "hover:bg-[#F7EBFF] text-black"
            )}
          >
            {opt}
          </button>
        ))}
        {query.trim() && options.length === 0 && (
          <p className="px-3 py-2 text-xs text-muted-foreground">Nenhum resultado</p>
        )}
        {!query.trim() && (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            {activeValue ? `Selecionado: ${activeValue}` : "Digite para buscar"}
          </p>
        )}
      </div>
      {activeValue && (
        <button
          onClick={onClear}
          className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100 mt-1"
        >
          Limpar filtro
        </button>
      )}
    </div>
  )
}
