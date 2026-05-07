import { cn } from "@/lib/utils"
import type { ProductState } from "@/types/product"
import TuneIcon from "@mui/icons-material/Tune"
import CloseIcon from "@mui/icons-material/Close"

export type AdvancedFilters = {
  states:    ProductState[]
  priceMin:  string
  priceMax:  string
  ratingMin: string
  ratingMax: string
  stockMin:  string
  stockMax:  string
  dateFrom:  string
  dateTo:    string
}

export const EMPTY_ADVANCED: AdvancedFilters = {
  states: [],
  priceMin: "", priceMax: "",
  ratingMin: "", ratingMax: "",
  stockMin: "", stockMax: "",
  dateFrom: "", dateTo: "",
}

export function advancedActiveCount(f: AdvancedFilters): number {
  return [
    f.states.length > 0,
    f.priceMin !== "" || f.priceMax !== "",
    f.ratingMin !== "" || f.ratingMax !== "",
    f.stockMin !== "" || f.stockMax !== "",
    f.dateFrom !== "" || f.dateTo !== "",
  ].filter(Boolean).length
}

const ALL_STATES: ProductState[] = ["Ativo", "Novo", "Inativo", "Descontinuado"]

function RangeRow({
  labelA, valA, onA,
  labelB, valB, onB,
  extra,
}: {
  labelA: string; valA: string; onA: (v: string) => void
  labelB: string; valB: string; onB: (v: string) => void
  extra?: React.InputHTMLAttributes<HTMLInputElement>
}) {
  const cls = "w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-300"
  return (
    <div className="flex gap-2">
      <input type="number" placeholder={labelA} value={valA} onChange={e => onA(e.target.value)} {...extra} className={cls} />
      <input type="number" placeholder={labelB} value={valB} onChange={e => onB(e.target.value)} {...extra} className={cls} />
    </div>
  )
}

export function AdvancedFiltersDrawer({
  open,
  filters,
  onChange,
  onClose,
  onClear,
}: {
  open: boolean
  filters: AdvancedFilters
  onChange: (f: AdvancedFilters) => void
  onClose: () => void
  onClear: () => void
}) {
  const toggleState = (s: ProductState) =>
    onChange({
      ...filters,
      states: filters.states.includes(s)
        ? filters.states.filter(x => x !== s)
        : [...filters.states, s],
    })

  const hasAny = advancedActiveCount(filters) > 0

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/20 z-[9990]" onClick={onClose} />}

      <div className={cn(
        "fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-[9991] flex flex-col transition-transform duration-300 ease-in-out",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <TuneIcon sx={{ fontSize: 16, color: "#374151" }} />
            <span className="font-semibold text-gray-900 text-sm">Filtros avançados</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <CloseIcon sx={{ fontSize: 18 }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Status</h3>
            <div className="flex flex-col gap-2.5">
              {ALL_STATES.map(s => (
                <label key={s} className="flex items-center gap-2.5 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={filters.states.includes(s)}
                    onChange={() => toggleState(s)}
                    className="w-4 h-4 rounded border-gray-300 accent-purple-600 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{s}</span>
                </label>
              ))}
            </div>
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Preço (R$)</h3>
            <RangeRow
              labelA="Mín" valA={filters.priceMin} onA={v => onChange({ ...filters, priceMin: v })}
              labelB="Máx" valB={filters.priceMax} onB={v => onChange({ ...filters, priceMax: v })}
            />
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Avaliação (0 – 10)</h3>
            <RangeRow
              labelA="Mín" valA={filters.ratingMin} onA={v => onChange({ ...filters, ratingMin: v })}
              labelB="Máx" valB={filters.ratingMax} onB={v => onChange({ ...filters, ratingMax: v })}
              extra={{ min: 0, max: 10, step: 0.1 }}
            />
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Estoque</h3>
            <RangeRow
              labelA="Mín" valA={filters.stockMin} onA={v => onChange({ ...filters, stockMin: v })}
              labelB="Máx" valB={filters.stockMax} onB={v => onChange({ ...filters, stockMax: v })}
            />
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Data de criação</h3>
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-xs text-gray-400 mb-1">De</p>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={e => onChange({ ...filters, dateFrom: e.target.value })}
                  className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-300"
                />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Até</p>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={e => onChange({ ...filters, dateTo: e.target.value })}
                  className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-300"
                />
              </div>
            </div>
          </section>
        </div>

        <div className={cn(
          "px-5 py-4 border-t border-gray-200 transition-opacity duration-200",
          hasAny ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <button
            onClick={onClear}
            className="w-full flex items-center justify-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors py-1"
          >
            <CloseIcon sx={{ fontSize: 14 }} />
            Limpar filtros avançados
          </button>
        </div>
      </div>
    </>
  )
}
