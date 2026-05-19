import { useState, useEffect, useRef } from "react"
import type React from "react"
import { Dialog } from "radix-ui"
import { X, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateContact } from "@/lib/api/contacts"
import { useAuth } from "@/contexts/auth/useAuth"
import type { ContactDetails } from "@/types/contactDetails"
import { fetchContactDetails } from "@/lib/api/contactDetails"

const CLIENT_STATUSES = ["Ativo", "Inativo", "VIP", "Lead", "Em risco"]
const GENDERS = ["Masculino", "Feminino", "Outro", "Não informado"]
const ORIGINS = ["Orgânico", "Pago", "Referral", "Direto", "Social", "Email"]
const COUNTRIES = ["Brasil", "Argentina", "Chile", "Colômbia", "México", "Portugal", "Estados Unidos", "Outro"]
const STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]
const REGIONS = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"]
const RESPONSIBLES = ["Carlos Silva", "Ana Souza", "Pedro Santos", "Maria Lima", "João Oliveira"]

interface ContactEditModalProps {
  open: boolean
  details: ContactDetails
  onClose: () => void
  onSuccess: (updated: ContactDetails) => void
}

export function ContactEditModal({ open, details, onClose, onSuccess }: ContactEditModalProps) {
  const [form, setForm] = useState({
    name: "",
    clientStatus: "",
    email: "",
    phone: "",
    birthDate: "",
    age: "",
    gender: "",
    responsible: "",
    createdAt: "",
    origin: "",
    country: "",
    state: "",
    region: "",
    city: "",
  })
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setForm({
        name:         details.name ?? "",
        clientStatus: details.clientStatus ?? "",
        email:        details.email ?? "",
        phone:        details.phone ?? "",
        birthDate:    details.birthDate ?? "",
        age:          details.age != null ? String(details.age) : "",
        gender:       details.gender ?? "",
        responsible:  details.responsible ?? "",
        createdAt:    details.createdAt ?? "",
        origin:       details.origin ?? "",
        country:      details.country ?? "",
        state:        details.state ?? "",
        region:       details.region ?? "",
        city:         details.city ?? "",
      })
      setError("")
    }
  }, [open, details])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError("Nome é obrigatório."); return }
    setLoading(true)
    setError("")
    try {
      await updateContact(
        details.id,
        {
          name:         form.name.trim(),
          clientStatus: form.clientStatus || undefined,
          email:        form.email.trim() || undefined,
          phone:        form.phone.trim() || undefined,
          birthDate:    form.birthDate.trim() || undefined,
          age:          form.age ? parseInt(form.age, 10) : undefined,
          gender:       form.gender || undefined,
          responsible:  form.responsible || undefined,
          createdAt:    form.createdAt.trim() || undefined,
          origin:       form.origin || undefined,
          country:      form.country || undefined,
          state:        form.state || undefined,
          region:       form.region || undefined,
          city:         form.city.trim() || undefined,
        },
        user?.name ?? "Sistema",
      )
      // Reload details from the dedicated details endpoint to get the full object
      const refreshed = await fetchContactDetails(details.id)
      onSuccess(refreshed)
      onClose()
    } catch {
      setError("Erro ao salvar contato. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl w-full max-w-[680px] max-h-[90vh] flex flex-col focus:outline-none"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between px-8 pt-8 pb-1 shrink-0">
            <Dialog.Title className="text-2xl font-bold text-gray-900">
              Edição de contato
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-500 hover:text-gray-800 transition-colors">
                <X size={22} />
              </button>
            </Dialog.Close>
          </div>
          <hr className="border-gray-200 mx-8 mb-4" />

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-y-auto px-8 pb-8">
            <div className="flex flex-col gap-6">
              {/* Nome + Status */}
              <div className="grid grid-cols-2 gap-4">
                <FieldBlock label="Nome do contato" required>
                  <input
                    className={inputCls}
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </FieldBlock>
                <FieldBlock label="Status">
                  <SelectDropdown
                    value={form.clientStatus}
                    placeholder="Selecionar status"
                    options={CLIENT_STATUSES}
                    onChange={v => setForm(f => ({ ...f, clientStatus: v }))}
                  />
                </FieldBlock>
              </div>

              {/* Email + Telefone */}
              <div className="grid grid-cols-2 gap-4">
                <FieldBlock label="Email">
                  <input
                    className={inputCls}
                    type="email"
                    placeholder="email@exemplo.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </FieldBlock>
                <FieldBlock label="Número de telefone">
                  <input
                    className={inputCls}
                    placeholder="(00) 00000-0000"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/[^0-9()\-\s+]/g, "") }))}
                    inputMode="tel"
                  />
                </FieldBlock>
              </div>

              {/* Data de nascimento + Idade */}
              <div className="grid grid-cols-2 gap-4">
                <FieldBlock label="Data de nascimento">
                  <input
                    className={inputCls}
                    placeholder="DD/MM/AAAA"
                    value={form.birthDate}
                    onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))}
                  />
                </FieldBlock>
                <FieldBlock label="Idade">
                  <input
                    className={inputCls}
                    placeholder="Ex: 30"
                    value={form.age}
                    onChange={e => setForm(f => ({ ...f, age: e.target.value.replace(/\D/g, "") }))}
                    inputMode="numeric"
                  />
                </FieldBlock>
              </div>

              {/* Gênero + Responsável */}
              <div className="grid grid-cols-2 gap-4">
                <FieldBlock label="Gênero">
                  <SelectDropdown
                    value={form.gender}
                    placeholder="Selecionar gênero"
                    options={GENDERS}
                    onChange={v => setForm(f => ({ ...f, gender: v }))}
                  />
                </FieldBlock>
                <FieldBlock label="Responsável">
                  <SelectDropdown
                    value={form.responsible}
                    placeholder="Selecionar responsável"
                    options={RESPONSIBLES}
                    onChange={v => setForm(f => ({ ...f, responsible: v }))}
                  />
                </FieldBlock>
              </div>

              {/* Data de cadastro + Origem */}
              <div className="grid grid-cols-2 gap-4">
                <FieldBlock label="Data de cadastro">
                  <input
                    className={inputCls}
                    placeholder="DD/MM/AAAA"
                    value={form.createdAt}
                    onChange={e => setForm(f => ({ ...f, createdAt: e.target.value }))}
                  />
                </FieldBlock>
                <FieldBlock label="Origem">
                  <SelectDropdown
                    value={form.origin}
                    placeholder="Selecionar origem"
                    options={ORIGINS}
                    onChange={v => setForm(f => ({ ...f, origin: v }))}
                  />
                </FieldBlock>
              </div>

              {/* País + Estado */}
              <div className="grid grid-cols-2 gap-4">
                <FieldBlock label="País">
                  <SelectDropdown
                    value={form.country}
                    placeholder="Selecionar país"
                    options={COUNTRIES}
                    onChange={v => setForm(f => ({ ...f, country: v }))}
                  />
                </FieldBlock>
                <FieldBlock label="Estado">
                  <SelectDropdown
                    value={form.state}
                    placeholder="Selecionar estado"
                    options={STATES}
                    onChange={v => setForm(f => ({ ...f, state: v }))}
                  />
                </FieldBlock>
              </div>

              {/* Região + Cidade */}
              <div className="grid grid-cols-2 gap-4">
                <FieldBlock label="Região">
                  <SelectDropdown
                    value={form.region}
                    placeholder="Selecionar região"
                    options={REGIONS}
                    onChange={v => setForm(f => ({ ...f, region: v }))}
                  />
                </FieldBlock>
                <FieldBlock label="Cidade">
                  <input
                    className={inputCls}
                    placeholder="Nome da cidade"
                    value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  />
                </FieldBlock>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <hr className="border-gray-200" />

              <div className="flex items-center justify-center gap-8">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "px-10 py-2.5 rounded-full text-sm font-semibold border transition-colors",
                    "bg-[#F7EBFF] border-[#D1B1E5] text-gray-900 hover:bg-[#edd9ff]",
                    loading && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {loading ? "Salvando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/* ── Reusable sub-components (same pattern as ProductEditModal) ──────────── */

function FieldBlock({
  label, required, muted, children,
}: { label: string; required?: boolean; muted?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={cn("text-sm font-semibold", muted ? "text-gray-400" : "text-gray-900")}>
        {label}{required && " *"}
      </label>
      {children}
    </div>
  )
}

function SelectDropdown({
  value, placeholder, options, onChange,
}: {
  value: string
  placeholder?: string
  options: string[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(inputCls, "flex items-center justify-between", !value && "text-gray-400")}
      >
        <span>{value || placeholder || ""}</span>
        {open ? <ChevronUp size={16} className="text-gray-500 shrink-0" /> : <ChevronDown size={16} className="text-gray-500 shrink-0" />}
      </button>
      {open && (
        <ul className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {placeholder && (
            <li
              onMouseDown={e => { e.preventDefault(); onChange(""); setOpen(false) }}
              className="px-4 py-2 text-sm text-gray-400 cursor-pointer hover:bg-[#F7EBFF] transition-colors"
            >
              {placeholder}
            </li>
          )}
          {options.map(opt => (
            <li
              key={opt}
              onMouseDown={e => { e.preventDefault(); onChange(opt); setOpen(false) }}
              className={cn(
                "px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-[#F7EBFF] transition-colors",
                value === opt && "bg-[#F7EBFF] font-medium"
              )}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const inputCls =
  "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#D1B1E5] transition"
