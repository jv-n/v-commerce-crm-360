import TuneIcon from "@mui/icons-material/Tune"
import CloseIcon from "@mui/icons-material/Close"
import { cn } from "@/lib/utils"

export type ContactAdvancedFilters = {
  regioes:             string[]
  origens:             string[]
  pagamentos:          string[]
  receitaMin:          string
  receitaMax:          string
  ticketMedioMin:      string
  ticketMedioMax:      string
  primeiraCompraFrom:  string
  primeiraCompraTo:    string
  ultimaCompraFrom:    string
  ultimaCompraTo:      string
  ticketsSuporteMin:   string
  ticketsSuporteMax:   string
  notaAtendMin:        string
  notaAtendMax:        string
  npsMin:              string
  npsMax:              string
  notaProdMin:         string
  notaProdMax:         string
}

export const EMPTY_CONTACT_ADVANCED: ContactAdvancedFilters = {
  regioes: [], origens: [], pagamentos: [],
  receitaMin: "", receitaMax: "",
  ticketMedioMin: "", ticketMedioMax: "",
  primeiraCompraFrom: "", primeiraCompraTo: "",
  ultimaCompraFrom: "", ultimaCompraTo: "",
  ticketsSuporteMin: "", ticketsSuporteMax: "",
  notaAtendMin: "", notaAtendMax: "",
  npsMin: "", npsMax: "",
  notaProdMin: "", notaProdMax: "",
}

export function contactAdvancedActiveCount(f: ContactAdvancedFilters): number {
  return [
    f.regioes.length > 0,
    f.origens.length > 0,
    f.pagamentos.length > 0,
    f.receitaMin !== "" || f.receitaMax !== "",
    f.ticketMedioMin !== "" || f.ticketMedioMax !== "",
    f.primeiraCompraFrom !== "" || f.primeiraCompraTo !== "",
    f.ultimaCompraFrom !== "" || f.ultimaCompraTo !== "",
    f.ticketsSuporteMin !== "" || f.ticketsSuporteMax !== "",
    f.notaAtendMin !== "" || f.notaAtendMax !== "",
    f.npsMin !== "" || f.npsMax !== "",
    f.notaProdMin !== "" || f.notaProdMax !== "",
  ].filter(Boolean).length
}

const ALL_REGIOES  = ["Centro-Oeste", "Nordeste", "Norte", "Não identificada", "Sudeste", "Sul"]
const ALL_ORIGENS  = ["App", "Indicação", "Web"]
const ALL_PAGAMENTOS = ["Boleto", "Cartão", "Pix"]

const INPUT_CLS = "w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-300"
const SECTION_HDR = "text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3"

function RangeRow({
  labelA, valA, onA,
  labelB, valB, onB,
  extra,
}: {
  labelA: string; valA: string; onA: (v: string) => void
  labelB: string; valB: string; onB: (v: string) => void
  extra?: React.InputHTMLAttributes<HTMLInputElement>
}) {
  return (
    <div className="flex gap-2">
      <input type="number" placeholder={labelA} value={valA} onChange={e => onA(e.target.value)} {...extra} className={INPUT_CLS} />
      <input type="number" placeholder={labelB} value={valB} onChange={e => onB(e.target.value)} {...extra} className={INPUT_CLS} />
    </div>
  )
}

function DateRangeRow({
  valFrom, onFrom,
  valTo, onTo,
}: {
  valFrom: string; onFrom: (v: string) => void
  valTo: string; onTo: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-xs text-gray-400 mb-1">De</p>
        <input type="date" value={valFrom} onChange={e => onFrom(e.target.value)} className={INPUT_CLS} />
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-1">Até</p>
        <input type="date" value={valTo} onChange={e => onTo(e.target.value)} className={INPUT_CLS} />
      </div>
    </div>
  )
}

function CheckboxGroup({
  options, selected, onToggle,
}: {
  options: string[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {options.map(opt => (
        <label key={opt} className="flex items-center gap-2.5 cursor-pointer group select-none">
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => onToggle(opt)}
            className="w-4 h-4 rounded border-gray-300 accent-purple-600 cursor-pointer"
          />
          <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{opt}</span>
        </label>
      ))}
    </div>
  )
}

function toggle(list: string[], val: string): string[] {
  return list.includes(val) ? list.filter(x => x !== val) : [...list, val]
}

export function ContactAdvancedFiltersDrawer({
  open, filters, onChange, onClose, onClear,
}: {
  open: boolean
  filters: ContactAdvancedFilters
  onChange: (f: ContactAdvancedFilters) => void
  onClose: () => void
  onClear: () => void
}) {
  const set = <K extends keyof ContactAdvancedFilters>(key: K, val: ContactAdvancedFilters[K]) =>
    onChange({ ...filters, [key]: val })

  const hasAny = contactAdvancedActiveCount(filters) > 0

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
            <h3 className={SECTION_HDR}>Região</h3>
            <CheckboxGroup
              options={ALL_REGIOES}
              selected={filters.regioes}
              onToggle={v => set("regioes", toggle(filters.regioes, v))}
            />
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <h3 className={SECTION_HDR}>Origem</h3>
            <CheckboxGroup
              options={ALL_ORIGENS}
              selected={filters.origens}
              onToggle={v => set("origens", toggle(filters.origens, v))}
            />
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <h3 className={SECTION_HDR}>Método de pagamento</h3>
            <CheckboxGroup
              options={ALL_PAGAMENTOS}
              selected={filters.pagamentos}
              onToggle={v => set("pagamentos", toggle(filters.pagamentos, v))}
            />
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <h3 className={SECTION_HDR}>Receita total (R$)</h3>
            <RangeRow
              labelA="Mín" valA={filters.receitaMin} onA={v => set("receitaMin", v)}
              labelB="Máx" valB={filters.receitaMax} onB={v => set("receitaMax", v)}
              extra={{ min: 0, step: 0.01 }}
            />
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <h3 className={SECTION_HDR}>Ticket médio (R$)</h3>
            <RangeRow
              labelA="Mín" valA={filters.ticketMedioMin} onA={v => set("ticketMedioMin", v)}
              labelB="Máx" valB={filters.ticketMedioMax} onB={v => set("ticketMedioMax", v)}
              extra={{ min: 0, step: 0.01 }}
            />
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <h3 className={SECTION_HDR}>Primeira compra</h3>
            <DateRangeRow
              valFrom={filters.primeiraCompraFrom} onFrom={v => set("primeiraCompraFrom", v)}
              valTo={filters.primeiraCompraTo}     onTo={v => set("primeiraCompraTo", v)}
            />
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <h3 className={SECTION_HDR}>Última compra</h3>
            <DateRangeRow
              valFrom={filters.ultimaCompraFrom} onFrom={v => set("ultimaCompraFrom", v)}
              valTo={filters.ultimaCompraTo}     onTo={v => set("ultimaCompraTo", v)}
            />
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <h3 className={SECTION_HDR}>Tickets de suporte</h3>
            <RangeRow
              labelA="Mín" valA={filters.ticketsSuporteMin} onA={v => set("ticketsSuporteMin", v)}
              labelB="Máx" valB={filters.ticketsSuporteMax} onB={v => set("ticketsSuporteMax", v)}
              extra={{ min: 0, max: 8, step: 1 }}
            />
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <h3 className={SECTION_HDR}>Nota média de atendimento (0 – 10)</h3>
            <RangeRow
              labelA="Mín" valA={filters.notaAtendMin} onA={v => set("notaAtendMin", v)}
              labelB="Máx" valB={filters.notaAtendMax} onB={v => set("notaAtendMax", v)}
              extra={{ min: 0, max: 10, step: 0.1 }}
            />
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <h3 className={SECTION_HDR}>NPS médio (0 – 10)</h3>
            <RangeRow
              labelA="Mín" valA={filters.npsMin} onA={v => set("npsMin", v)}
              labelB="Máx" valB={filters.npsMax} onB={v => set("npsMax", v)}
              extra={{ min: 0, max: 10, step: 0.1 }}
            />
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <h3 className={SECTION_HDR}>Nota do produto (0 – 10)</h3>
            <RangeRow
              labelA="Mín" valA={filters.notaProdMin} onA={v => set("notaProdMin", v)}
              labelB="Máx" valB={filters.notaProdMax} onB={v => set("notaProdMax", v)}
              extra={{ min: 0, max: 10, step: 0.1 }}
            />
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
