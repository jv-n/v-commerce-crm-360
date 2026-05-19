import { useState, useEffect } from "react"
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
  const isInvalid = valA !== "" && valB !== "" && Number(valA) > Number(valB)
  const base = "w-full border rounded-md px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1"
  const cls = isInvalid
    ? `${base} border-red-400 focus:ring-red-300`
    : `${base} border-gray-200 focus:ring-purple-300`

  const strip = (v: string) => v.replace(/^-/, "")

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input type="number" min={0} placeholder={labelA} value={valA} onChange={e => onA(strip(e.target.value))} {...extra} className={cls} />
        <input type="number" min={0} placeholder={labelB} value={valB} onChange={e => onB(strip(e.target.value))} {...extra} className={cls} />
      </div>
      {isInvalid && (
        <p className="text-xs text-red-500">Mín não pode ser maior que Máx</p>
      )}
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
  const [draft, setDraft] = useState<AdvancedFilters>(filters)

  useEffect(() => {
    if (open) setDraft(filters)
  }, [open])

  const set = (patch: Partial<AdvancedFilters>) => setDraft(d => ({ ...d, ...patch }))

  const toggleState = (s: ProductState) =>
    setDraft(d => ({
      ...d,
      states: d.states.includes(s) ? d.states.filter(x => x !== s) : [...d.states, s],
    }))

  const dateInvalid = draft.dateFrom !== "" && draft.dateTo !== "" && draft.dateFrom > draft.dateTo
  const rangeInvalid =
    (draft.priceMin  !== "" && draft.priceMax  !== "" && Number(draft.priceMin)  > Number(draft.priceMax))  ||
    (draft.ratingMin !== "" && draft.ratingMax !== "" && Number(draft.ratingMin) > Number(draft.ratingMax)) ||
    (draft.stockMin  !== "" && draft.stockMax  !== "" && Number(draft.stockMin)  > Number(draft.stockMax))
  const hasError = dateInvalid || rangeInvalid

  const hasDraftAny = advancedActiveCount(draft) > 0

  const dateCls = `w-full border rounded-md px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 ${dateInvalid ? "border-red-400 focus:ring-red-300" : "border-gray-200 focus:ring-purple-300"}`

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
          <button onClick={onClose} className="text-gray-500 border border-transparent rounded-xl p-1 hover:bg-purple-100 hover:border-purple-300 active:bg-[#EACAFF] active:border-[#B899CC] transition-colors">
            <CloseIcon sx={{ fontSize: 18 }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <section>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Status</h3>
            <div className="flex flex-col gap-2.5">
              {ALL_STATES.map(s => (
                <label key={s} className="flex items-center gap-2.5 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={draft.states.includes(s)}
                    onChange={() => toggleState(s)}
                    className="w-4 h-4 rounded border-gray-300 accent-purple-600 cursor-pointer"
                  />
                  <span className="text-sm text-gray-900 group-hover:text-gray-900 transition-colors">{s}</span>
                </label>
              ))}
            </div>
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Preço (R$)</h3>
            <RangeRow
              labelA="Mín" valA={draft.priceMin}  onA={v => set({ priceMin: v })}
              labelB="Máx" valB={draft.priceMax}  onB={v => set({ priceMax: v })}
            />
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Avaliação (0 – 10)</h3>
            <RangeRow
              labelA="Mín" valA={draft.ratingMin} onA={v => set({ ratingMin: v })}
              labelB="Máx" valB={draft.ratingMax} onB={v => set({ ratingMax: v })}
              extra={{ min: 0, max: 10, step: 0.1 }}
            />
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Estoque</h3>
            <RangeRow
              labelA="Mín" valA={draft.stockMin}  onA={v => set({ stockMin: v })}
              labelB="Máx" valB={draft.stockMax}  onB={v => set({ stockMax: v })}
            />
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Data de criação</h3>
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-xs text-gray-900 mb-1">De</p>
                <input type="date" value={draft.dateFrom} onChange={e => set({ dateFrom: e.target.value })} className={dateCls} />
              </div>
              <div>
                <p className="text-xs text-gray-900 mb-1">Até</p>
                <input type="date" value={draft.dateTo} onChange={e => set({ dateTo: e.target.value })} className={dateCls} />
              </div>
              {dateInvalid && <p className="text-xs text-red-500">"De" não pode ser posterior a "Até"</p>}
            </div>
          </section>
        </div>

        <div className="px-5 py-4 border-t border-gray-200 flex flex-col gap-2">
          <button
            disabled={hasError}
            onClick={() => { onChange(draft); onClose() }}
            className="w-full bg-[#F7EBFF] border border-[#D1B1E5] text-black rounded-md py-2 text-sm font-medium hover:bg-[#F0DDFD] hover:border-[#D1B1E5] active:bg-[#c99aee] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#EACAFF] disabled:hover:border-[#B899CC]"
          >
            Aplicar filtros
          </button>
          {hasDraftAny && (
            <button
              onClick={() => { setDraft(EMPTY_ADVANCED); onClear() }}
              className="w-full flex items-center justify-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors py-1"
            >
              <CloseIcon sx={{ fontSize: 14 }} />
              Limpar filtros avançados
            </button>
          )}
        </div>
      </div>
    </>
  )
}
