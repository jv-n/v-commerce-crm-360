import { useState, useEffect, useRef } from "react"
import type React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { X } from "lucide-react"
import { Input } from "@/components/atoms/input"
import { Label } from "@/components/atoms/label"
import { Button } from "@/components/atoms/button"
import { createContact } from "@/lib/api/contacts"

const ORIGIN_OPTIONS  = ["App", "Indicação", "Web"]
const REGION_OPTIONS  = ["Centro-Oeste", "Nordeste", "Norte", "Não identificada", "Sudeste", "Sul"]

// ── Combobox de região ────────────────────────────────────────────────────────
function RegionCombobox({
  value,
  onChange,
  inputClass,
}: {
  value: string
  onChange: (v: string) => void
  inputClass: string
}) {
  const [input, setInput]   = useState(value)
  const [open,  setOpen]    = useState(false)
  const containerRef        = useRef<HTMLDivElement>(null)

  // Sincroniza quando o form é resetado
  useEffect(() => { setInput(value) }, [value])

  const filtered = REGION_OPTIONS.filter(r =>
    r.toLowerCase().includes(input.toLowerCase())
  )

  const select = (region: string) => {
    setInput(region)
    onChange(region)
    setOpen(false)
  }

  const handleBlur = (e: React.FocusEvent) => {
    // Ignora blur se o foco foi para um item da lista
    if (containerRef.current?.contains(e.relatedTarget as Node)) return
    // Se o texto não bate com nenhuma opção, limpa
    if (!REGION_OPTIONS.includes(input)) {
      setInput("")
      onChange("")
    }
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={input}
        onChange={e => { setInput(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        placeholder="Digite a região..."
        className={inputClass}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {filtered.map(r => (
            <li
              key={r}
              tabIndex={0}
              onMouseDown={() => select(r)}
              onKeyDown={e => e.key === "Enter" && select(r)}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                r === value ? "bg-primary/10 text-primary font-medium" : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface ContactModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  region: "",
  origin: "",
}

interface SavedInfo {
  id: string
  name: string
  timestamp: string
}

export function ContactModal({ open, onClose, onSuccess }: ContactModalProps) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState<SavedInfo | null>(null)

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM)
      setError("")
      setSaved(null)
    }
  }, [open])

  const set = (field: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))

  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11)
    let masked = ""
    if (digits.length === 0) {
      masked = ""
    } else if (digits.length <= 2) {
      masked = `(${digits}`
    } else if (digits.length <= 6) {
      masked = `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    } else if (digits.length <= 10) {
      masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    } else {
      masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    }
    setForm(f => ({ ...f, phone: masked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError("Nome é obrigatório."); return }
    if (form.region && !REGION_OPTIONS.includes(form.region)) { setError("Selecione uma região válida."); return }
    setLoading(true)
    setError("")
    try {
      const created = await createContact({
        name:         form.name,
        email:        form.email        || undefined,
        phone:        form.phone        || undefined,
        clientStatus: "Inativo",
        region:       form.region       || undefined,
        origin:       form.origin       || undefined,
      })
      const ts = new Date().toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
      setSaved({ id: created.id, name: created.name ?? form.name, timestamp: ts })
      onSuccess()
    } catch {
      setError("Erro ao criar contato. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-primary"
  const selectClass = "h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary"
  const labelClass  = "text-xs font-medium text-gray-500 mb-1"

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <DialogPrimitive.Title className="text-lg font-bold text-gray-900">
              Criação de Contato
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
              <X size={16} />
            </DialogPrimitive.Close>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">

              {/* Nome */}
              <div className="flex flex-col">
                <Label className={labelClass}>Nome do contato *</Label>
                <Input
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Inserir nome..."
                  className={inputClass}
                />
              </div>


              {/* Email */}
              <div className="flex flex-col">
                <Label className={labelClass}>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="Inserir email..."
                  className={inputClass}
                />
              </div>

              {/* Telefone */}
              <div className="flex flex-col">
                <Label className={labelClass}>Número de telefone</Label>
                <Input
                  value={form.phone}
                  onChange={handlePhone}
                  placeholder="(00) 00000-0000"
                  className={inputClass}
                />
              </div>

              {/* Região */}
              <div className="flex flex-col">
                <Label className={labelClass}>Região</Label>
                <RegionCombobox
                  value={form.region}
                  onChange={v => setForm(f => ({ ...f, region: v }))}
                  inputClass={inputClass}
                />
              </div>

              {/* Origem */}
              <div className="flex flex-col">
                <Label className={labelClass}>Origem</Label>
                <select value={form.origin} onChange={set("origin")} className={selectClass}>
                  <option value="">Escolha a origem</option>
                  {ORIGIN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

            </div>

            {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

            {/* Rodapé */}
            {!saved && (
              <div className="flex items-center justify-center gap-8 mt-8 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={loading}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-primary-foreground px-8 rounded-xl hover:opacity-90"
                >
                  {loading ? "Salvando..." : "Confirmar"}
                </Button>
              </div>
            )}
          </form>

          {/* Card de confirmação */}
          {saved && (
            <div className="mt-4 mx-0 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
              <p className="text-xs text-gray-500 leading-relaxed">
                Cliente <span className="font-semibold text-gray-800">"{saved.name}"</span> salvo em{" "}
                <span className="font-medium text-gray-700">{saved.timestamp}</span>, com ID{" "}
                <span className="font-mono text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{saved.id}</span>
              </p>
            </div>
          )}

        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
