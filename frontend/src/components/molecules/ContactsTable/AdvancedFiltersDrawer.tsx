import { useState, useRef, useEffect } from "react"
import TuneIcon from "@mui/icons-material/Tune"
import CloseIcon from "@mui/icons-material/Close"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import { cn } from "@/lib/utils"

export type ContactAdvancedFilters = {
  // Compras / financeiro
  regioes:             string[]
  estados:             string[]
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
  // Suporte & NPS
  ticketsSuporteMin:   string
  ticketsSuporteMax:   string
  notaAtendMin:        string
  notaAtendMax:        string
  npsMin:              string
  npsMax:              string
  npsRecenteMin:       string
  npsRecenteMax:       string
  notaProdMin:         string
  notaProdMax:         string
  // Perfil
  generos:             string[]
  faixasEtarias:       string[]
  // Comportamento digital
  canaisPreferidos:    string[]
  dispositivos:        string[]
  origensSessao:       string[]
  periodosDia:         string[]
  diasSemana:          string[]
  categoriasVisualizadas: string[]
  taxaConversaoMin:    string
  taxaConversaoMax:    string
  totalSessoesMin:     string
  totalSessoesMax:     string
  abandonoCarrinhoMin: string
  abandonoCarrinhoMax: string
}

export const EMPTY_CONTACT_ADVANCED: ContactAdvancedFilters = {
  regioes: [], estados: [], origens: [], pagamentos: [],
  receitaMin: "", receitaMax: "",
  ticketMedioMin: "", ticketMedioMax: "",
  primeiraCompraFrom: "", primeiraCompraTo: "",
  ultimaCompraFrom: "", ultimaCompraTo: "",
  ticketsSuporteMin: "", ticketsSuporteMax: "",
  notaAtendMin: "", notaAtendMax: "",
  npsMin: "", npsMax: "",
  npsRecenteMin: "", npsRecenteMax: "",
  notaProdMin: "", notaProdMax: "",
  generos: [], faixasEtarias: [],
  canaisPreferidos: [], dispositivos: [], origensSessao: [],
  periodosDia: [], diasSemana: [], categoriasVisualizadas: [],
  taxaConversaoMin: "", taxaConversaoMax: "",
  totalSessoesMin: "", totalSessoesMax: "",
  abandonoCarrinhoMin: "", abandonoCarrinhoMax: "",
}

export function contactAdvancedActiveCount(f: ContactAdvancedFilters): number {
  return [
    f.regioes.length > 0,
    f.estados.length > 0,
    f.origens.length > 0,
    f.pagamentos.length > 0,
    f.receitaMin !== "" || f.receitaMax !== "",
    f.ticketMedioMin !== "" || f.ticketMedioMax !== "",
    f.primeiraCompraFrom !== "" || f.primeiraCompraTo !== "",
    f.ultimaCompraFrom !== "" || f.ultimaCompraTo !== "",
    f.ticketsSuporteMin !== "" || f.ticketsSuporteMax !== "",
    f.notaAtendMin !== "" || f.notaAtendMax !== "",
    f.npsMin !== "" || f.npsMax !== "",
    f.npsRecenteMin !== "" || f.npsRecenteMax !== "",
    f.notaProdMin !== "" || f.notaProdMax !== "",
    f.generos.length > 0,
    f.faixasEtarias.length > 0,
    f.canaisPreferidos.length > 0,
    f.dispositivos.length > 0,
    f.origensSessao.length > 0,
    f.periodosDia.length > 0,
    f.diasSemana.length > 0,
    f.categoriasVisualizadas.length > 0,
    f.taxaConversaoMin !== "" || f.taxaConversaoMax !== "",
    f.totalSessoesMin !== "" || f.totalSessoesMax !== "",
    f.abandonoCarrinhoMin !== "" || f.abandonoCarrinhoMax !== "",
  ].filter(Boolean).length
}

const ALL_REGIOES        = ["Centro-Oeste", "Nordeste", "Norte", "Não identificada", "Sudeste", "Sul"]
const ALL_ESTADOS        = ["ACRE","ALAGOAS","AMAPÁ","AMAZONAS","BAHIA","CEARÁ","DISTRITO FEDERAL","ESPÍRITO SANTO","GOIÁS","MARANHÃO","MATO GROSSO","MATO GROSSO DO SUL","MINAS GERAIS","PARÁ","PARAÍBA","PARANÁ","PERNAMBUCO","PIAUÍ","RIO DE JANEIRO","RIO GRANDE DO NORTE","RIO GRANDE DO SUL","RONDÔNIA","RORAIMA","SANTA CATARINA","SÃO PAULO","SERGIPE","TOCANTINS"]
const ALL_ORIGENS        = ["App", "Indicação", "Web"]
const ALL_PAGAMENTOS     = ["Boleto", "Cartão", "Pix"]
const ALL_GENEROS        = ["Feminino", "Masculino", "Outro"]
const ALL_FAIXAS_ETARIAS = ["Menor de 18", "18-24", "25-34", "35-44", "45-59", "60+"]
const ALL_CANAIS         = ["App", "Mobile Web", "Web"]
const ALL_DISPOSITIVOS   = ["Desktop", "Mobile", "Tablet"]
const ALL_ORIGENS_SESSAO = ["Direto", "Email", "Organico", "Pago", "Redes Sociais"]
const ALL_PERIODOS_DIA   = ["Madrugada", "Manha", "Tarde", "Noite"]
const ALL_DIAS_SEMANA    = ["Segunda-feira", "Terca-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sabado", "Domingo"]
const ALL_CATEGORIAS_VIZ = ["Automotivo", "Beleza", "Brinquedos", "Casa", "Eletronicos", "Esportes", "Indefinida", "Moveis", "Vestuario"]

const INPUT_CLS = "w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-300 bg-white"

function MultiSelectDropdown({
  options, selected, onToggle, placeholder = "Selecionar...",
}: {
  options: string[]
  selected: string[]
  onToggle: (v: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const label = selected.length === 0
    ? placeholder
    : selected.length === 1
    ? selected[0]
    : `${selected.length} selecionados`

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between border border-gray-200 rounded-md px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-300 hover:border-gray-300 transition-colors"
      >
        <span className={cn("truncate", selected.length === 0 ? "text-gray-400" : "text-gray-700 font-medium")}>
          {label}
        </span>
        <ExpandMoreIcon sx={{ fontSize: 14, color: "#9CA3AF", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s", flexShrink: 0 }} />
      </button>

      {open && (
        <div className="absolute z-[9999] top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-purple-50 transition-colors select-none">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => onToggle(opt)}
                className="w-3 h-3 rounded border-gray-300 accent-purple-600 cursor-pointer flex-shrink-0"
              />
              <span className="text-xs text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function GroupHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-purple-100" />
    </div>
  )
}

function FilterCell({ label, children, span2 }: { label: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-1.5", span2 && "col-span-2")}>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      {children}
    </div>
  )
}

function CompactRange({
  label, valMin, onMin, valMax, onMax, span2, extra,
}: {
  label: string
  valMin: string; onMin: (v: string) => void
  valMax: string; onMax: (v: string) => void
  span2?: boolean
  extra?: React.InputHTMLAttributes<HTMLInputElement>
}) {
  return (
    <FilterCell label={label} span2={span2}>
      <div className="flex gap-1.5">
        <input type="number" placeholder="Mín" value={valMin} onChange={e => onMin(e.target.value)} {...extra} className={INPUT_CLS} />
        <input type="number" placeholder="Máx" value={valMax} onChange={e => onMax(e.target.value)} {...extra} className={INPUT_CLS} />
      </div>
    </FilterCell>
  )
}

function CompactDateRange({
  label, valFrom, onFrom, valTo, onTo,
}: {
  label: string
  valFrom: string; onFrom: (v: string) => void
  valTo: string; onTo: (v: string) => void
}) {
  return (
    <FilterCell label={label} span2>
      <div className="flex gap-1.5">
        <input type="date" value={valFrom} onChange={e => onFrom(e.target.value)} className={INPUT_CLS} />
        <input type="date" value={valTo} onChange={e => onTo(e.target.value)} className={INPUT_CLS} />
      </div>
    </FilterCell>
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
        "fixed top-0 right-0 h-full w-[500px] bg-white shadow-xl z-[9991] flex flex-col transition-transform duration-300 ease-in-out",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <TuneIcon sx={{ fontSize: 15, color: "#374151" }} />
            <span className="font-semibold text-gray-900 text-sm">Filtros avançados</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <CloseIcon sx={{ fontSize: 17 }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ── COMPRAS & FINANCEIRO ─────────────────────────────────────────── */}
          <GroupHeader label="Compras & financeiro" />

          <div className="grid grid-cols-2 gap-3">
            <FilterCell label="Região">
              <MultiSelectDropdown
                options={ALL_REGIOES}
                selected={filters.regioes}
                onToggle={v => set("regioes", toggle(filters.regioes, v))}
              />
            </FilterCell>
            <FilterCell label="Estado">
              <MultiSelectDropdown
                options={ALL_ESTADOS}
                selected={filters.estados}
                onToggle={v => set("estados", toggle(filters.estados, v))}
              />
            </FilterCell>
            <FilterCell label="Origem">
              <MultiSelectDropdown
                options={ALL_ORIGENS}
                selected={filters.origens}
                onToggle={v => set("origens", toggle(filters.origens, v))}
              />
            </FilterCell>
            <FilterCell label="Pagamento">
              <MultiSelectDropdown
                options={ALL_PAGAMENTOS}
                selected={filters.pagamentos}
                onToggle={v => set("pagamentos", toggle(filters.pagamentos, v))}
              />
            </FilterCell>
            <CompactRange
              label="Receita total (R$)"
              valMin={filters.receitaMin}     onMin={v => set("receitaMin", v)}
              valMax={filters.receitaMax}     onMax={v => set("receitaMax", v)}
              extra={{ min: 0, step: 0.01 }}
            />
            <CompactRange
              label="Ticket médio (R$)"
              valMin={filters.ticketMedioMin} onMin={v => set("ticketMedioMin", v)}
              valMax={filters.ticketMedioMax} onMax={v => set("ticketMedioMax", v)}
              extra={{ min: 0, step: 0.01 }}
            />
            <CompactDateRange
              label="Primeira compra"
              valFrom={filters.primeiraCompraFrom} onFrom={v => set("primeiraCompraFrom", v)}
              valTo={filters.primeiraCompraTo}     onTo={v => set("primeiraCompraTo", v)}
            />
            <CompactDateRange
              label="Última compra"
              valFrom={filters.ultimaCompraFrom} onFrom={v => set("ultimaCompraFrom", v)}
              valTo={filters.ultimaCompraTo}     onTo={v => set("ultimaCompraTo", v)}
            />
          </div>

          {/* ── SUPORTE & NPS ────────────────────────────────────────────────── */}
          <GroupHeader label="Suporte & NPS" />

          <div className="grid grid-cols-2 gap-3">
            <CompactRange
              label="Tickets suporte"
              valMin={filters.ticketsSuporteMin} onMin={v => set("ticketsSuporteMin", v)}
              valMax={filters.ticketsSuporteMax} onMax={v => set("ticketsSuporteMax", v)}
              extra={{ min: 0, max: 8, step: 1 }}
            />
            <CompactRange
              label="Nota atendimento (0–10)"
              valMin={filters.notaAtendMin} onMin={v => set("notaAtendMin", v)}
              valMax={filters.notaAtendMax} onMax={v => set("notaAtendMax", v)}
              extra={{ min: 0, max: 10, step: 0.1 }}
            />
            <CompactRange
              label="NPS médio (0–10)"
              valMin={filters.npsMin} onMin={v => set("npsMin", v)}
              valMax={filters.npsMax} onMax={v => set("npsMax", v)}
              extra={{ min: 0, max: 10, step: 0.1 }}
            />
            <CompactRange
              label="NPS recente (0–10)"
              valMin={filters.npsRecenteMin} onMin={v => set("npsRecenteMin", v)}
              valMax={filters.npsRecenteMax} onMax={v => set("npsRecenteMax", v)}
              extra={{ min: 0, max: 10, step: 0.1 }}
            />
            <CompactRange
              label="Nota produto (0–10)"
              valMin={filters.notaProdMin} onMin={v => set("notaProdMin", v)}
              valMax={filters.notaProdMax} onMax={v => set("notaProdMax", v)}
              extra={{ min: 0, max: 10, step: 0.1 }}
            />
          </div>

          {/* ── PERFIL ───────────────────────────────────────────────────────── */}
          <GroupHeader label="Perfil" />

          <div className="grid grid-cols-2 gap-3">
            <FilterCell label="Gênero">
              <MultiSelectDropdown
                options={ALL_GENEROS}
                selected={filters.generos}
                onToggle={v => set("generos", toggle(filters.generos, v))}
              />
            </FilterCell>
            <FilterCell label="Faixa etária">
              <MultiSelectDropdown
                options={ALL_FAIXAS_ETARIAS}
                selected={filters.faixasEtarias}
                onToggle={v => set("faixasEtarias", toggle(filters.faixasEtarias, v))}
              />
            </FilterCell>
          </div>

          {/* ── COMPORTAMENTO DIGITAL ────────────────────────────────────────── */}
          <GroupHeader label="Comportamento digital" />

          <div className="grid grid-cols-2 gap-3">
            <FilterCell label="Canal preferido">
              <MultiSelectDropdown
                options={ALL_CANAIS}
                selected={filters.canaisPreferidos}
                onToggle={v => set("canaisPreferidos", toggle(filters.canaisPreferidos, v))}
              />
            </FilterCell>
            <FilterCell label="Dispositivo">
              <MultiSelectDropdown
                options={ALL_DISPOSITIVOS}
                selected={filters.dispositivos}
                onToggle={v => set("dispositivos", toggle(filters.dispositivos, v))}
              />
            </FilterCell>
            <FilterCell label="Origem da sessão">
              <MultiSelectDropdown
                options={ALL_ORIGENS_SESSAO}
                selected={filters.origensSessao}
                onToggle={v => set("origensSessao", toggle(filters.origensSessao, v))}
              />
            </FilterCell>
            <FilterCell label="Período do dia">
              <MultiSelectDropdown
                options={ALL_PERIODOS_DIA}
                selected={filters.periodosDia}
                onToggle={v => set("periodosDia", toggle(filters.periodosDia, v))}
              />
            </FilterCell>
            <FilterCell label="Dia da semana">
              <MultiSelectDropdown
                options={ALL_DIAS_SEMANA}
                selected={filters.diasSemana}
                onToggle={v => set("diasSemana", toggle(filters.diasSemana, v))}
              />
            </FilterCell>
            <FilterCell label="Categoria visualizada">
              <MultiSelectDropdown
                options={ALL_CATEGORIAS_VIZ}
                selected={filters.categoriasVisualizadas}
                onToggle={v => set("categoriasVisualizadas", toggle(filters.categoriasVisualizadas, v))}
              />
            </FilterCell>
            <CompactRange
              label="Taxa de conversão (%)"
              valMin={filters.taxaConversaoMin} onMin={v => set("taxaConversaoMin", v)}
              valMax={filters.taxaConversaoMax} onMax={v => set("taxaConversaoMax", v)}
              extra={{ min: 0, max: 200, step: 1 }}
            />
            <CompactRange
              label="Sessões totais"
              valMin={filters.totalSessoesMin} onMin={v => set("totalSessoesMin", v)}
              valMax={filters.totalSessoesMax} onMax={v => set("totalSessoesMax", v)}
              extra={{ min: 0, max: 31, step: 1 }}
            />
            <CompactRange
              label="Abandono de carrinho"
              valMin={filters.abandonoCarrinhoMin} onMin={v => set("abandonoCarrinhoMin", v)}
              valMax={filters.abandonoCarrinhoMax} onMax={v => set("abandonoCarrinhoMax", v)}
              extra={{ min: 0, max: 3, step: 1 }}
            />
          </div>

        </div>

        <div className={cn(
          "px-5 py-3.5 border-t border-gray-200 transition-opacity duration-200",
          hasAny ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <button
            onClick={onClear}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors py-1"
          >
            <CloseIcon sx={{ fontSize: 13 }} />
            Limpar filtros avançados
          </button>
        </div>
      </div>
    </>
  )
}
