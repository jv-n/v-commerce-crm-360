import { useState, useEffect, useRef } from "react"
import type React from "react"
import { Dialog } from "radix-ui"
import { X, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { createProduct, fetchSuppliers } from "@/lib/api/products"

const CATEGORIES = [
  "Automotivo", "Beleza", "Brinquedos", "Casa",
  "Eletronicos", "Esportes", "Moveis", "Vestuario", "Indefinida",
]

const WEIGHT_UNITS = ["Quilogramas(Kg)", "Gramas(g)", "Toneladas(t)"]

interface ProductFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

function toKg(value: number, unit: string): number {
  if (unit === "Gramas(g)")    return value / 1000
  if (unit === "Toneladas(t)") return value * 1000
  return value // Quilogramas(Kg)
}

function todayBR(): string {
  return new Date().toLocaleDateString("pt-BR")
}

export function ProductFormModal({ open, onClose, onSuccess }: ProductFormModalProps) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    supplier: "",
    weightUnit: "Quilogramas(Kg)",
    weight: "",
    stock: "",
    status: "Ativo",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [suppliers, setSuppliers] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const supplierRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setForm({
        name: "", category: "", price: "", supplier: "",
        weightUnit: "Quilogramas(Kg)", weight: "", stock: "", status: "Ativo",
      })
      setError("")
      setShowSuggestions(false)
      fetchSuppliers().then(setSuppliers).catch(() => {})
    }
  }, [open])

  // Fecha sugestões ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (supplierRef.current && !supplierRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const filteredSuppliers = form.supplier.trim()
    ? suppliers.filter(s => s.toLowerCase().includes(form.supplier.toLowerCase()))
    : suppliers

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError("Nome do produto é obrigatório."); return }
    setLoading(true)
    setError("")
    try {
      await createProduct({
        name: form.name.trim(),
        category: form.category || undefined,
        price: form.price ? parseFloat(form.price.replace(",", ".")) : null,
        supplier: form.supplier.trim() || null,
        weight_kg: form.weight ? toKg(parseFloat(form.weight.replace(",", ".")), form.weightUnit) : null,
        stock: form.stock ? parseInt(form.stock, 10) : 0,
        status: form.status,
      })
      onSuccess()
      onClose()
    } catch {
      setError("Erro ao criar produto. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl w-full max-w-[620px] p-8 focus:outline-none"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between mb-1">
            <Dialog.Title className="text-2xl font-bold text-gray-900">
              Criação de produto
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-500 hover:text-gray-800 transition-colors">
                <X size={22} />
              </button>
            </Dialog.Close>
          </div>
          <hr className="border-gray-200 mb-6" />

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Nome + Categoria */}
            <div className="grid grid-cols-2 gap-4">
              <FieldBlock label="Nome do produto" required>
                <input
                  className={inputCls}
                  placeholder="Inserir nome..."
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </FieldBlock>
              <FieldBlock label="Categoria">
                <SelectDropdown
                  value={form.category}
                  placeholder="Selecionar categoria"
                  options={CATEGORIES}
                  onChange={v => setForm(f => ({ ...f, category: v }))}
                />
              </FieldBlock>
            </div>

            {/* Preço + Fornecedor */}
            <div className="grid grid-cols-2 gap-4">
              <FieldBlock label="Preço">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">R$</span>
                  <input
                    className={cn(inputCls, "flex-1")}
                    placeholder="00,00"
                    value={form.price}
                    onChange={e => {
                      const v = e.target.value.replace(/[^0-9,]/g, "")
                      if ((v.match(/,/g) ?? []).length <= 1) setForm(f => ({ ...f, price: v }))
                    }}
                    inputMode="decimal"
                  />
                </div>
              </FieldBlock>

              {/* Combobox de fornecedor */}
              <FieldBlock label="Fornecedor">
                <div ref={supplierRef} className="relative">
                  <input
                    className={inputCls}
                    placeholder="Inserir nome..."
                    value={form.supplier}
                    onChange={e => {
                      setForm(f => ({ ...f, supplier: e.target.value }))
                      setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    autoComplete="off"
                  />
                  {showSuggestions && filteredSuppliers.length > 0 && (
                    <ul className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredSuppliers.map(s => (
                        <li
                          key={s}
                          onMouseDown={e => {
                            e.preventDefault()
                            setForm(f => ({ ...f, supplier: s }))
                            setShowSuggestions(false)
                          }}
                          className={cn(
                            "px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-[#F7EBFF] transition-colors",
                            form.supplier === s && "bg-[#F7EBFF] font-medium"
                          )}
                        >
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </FieldBlock>
            </div>

            {/* Peso + Estoque */}
            <div className="grid grid-cols-[auto_1fr_1fr] gap-3 items-end">
              <FieldBlock label="Peso">
                <SelectDropdown
                  value={form.weightUnit}
                  options={WEIGHT_UNITS}
                  onChange={v => setForm(f => ({ ...f, weightUnit: v }))}
                />
              </FieldBlock>
              <div className="pt-7">
                <input
                  className={inputCls}
                  placeholder="Inserir peso..."
                  value={form.weight}
                  onChange={e => {
                    const v = e.target.value.replace(/[^0-9,]/g, "")
                    if ((v.match(/,/g) ?? []).length <= 1) setForm(f => ({ ...f, weight: v }))
                  }}
                  inputMode="decimal"
                />
              </div>
              <FieldBlock label="Estoque">
                <input
                  className={inputCls}
                  placeholder="Quantidade..."
                  value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value.replace(/\D/g, "") }))}
                  inputMode="numeric"
                />
              </FieldBlock>
            </div>

            {/* Status + Avaliação + Data de cadastro */}
            <div className="grid grid-cols-3 gap-4 items-end">
              <FieldBlock label="Status">
                <SelectDropdown
                  value={form.status}
                  options={["Ativo", "Inativo"]}
                  onChange={v => setForm(f => ({ ...f, status: v }))}
                />
              </FieldBlock>
              <FieldBlock label="Avaliação" muted>
                <input className={cn(inputCls, "text-gray-400 cursor-not-allowed")} value="-" disabled />
              </FieldBlock>
              <FieldBlock label="Data de cadastro" muted>
                <input className={cn(inputCls, "text-gray-400 cursor-not-allowed")} value={todayBR()} disabled />
              </FieldBlock>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex justify-center gap-6 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "px-8 py-2 rounded-xl text-sm font-semibold border transition-colors",
                  "bg-[#F7EBFF] border-[#D1B1E5] text-gray-900 hover:bg-[#edd9ff]",
                  loading && "opacity-60 cursor-not-allowed"
                )}
              >
                {loading ? "Criando..." : "Confirmar"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function FieldBlock({
  label, required, muted, children
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

  const label = value || placeholder || ""

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          inputCls,
          "flex items-center justify-between",
          !value && "text-gray-400"
        )}
      >
        <span>{label}</span>
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
