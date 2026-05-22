import { useState, useRef, useEffect } from "react"
import type React from "react"
import { Dialog } from "radix-ui"
import { X, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { createSale, updateSale } from "@/lib/api/sales"
import type { Sale } from "@/types/sale"
import { fetchProducts } from "@/lib/api/products"
import { fetchContacts } from "@/lib/api/contacts"
import type { Product } from "@/types/product"
import type { Contact } from "@/types/contact"
import { useAuth } from "@/contexts/auth/useAuth"

const CATEGORIAS = ["Eletronicos", "Brinquedos", "Vestuario", "Esportes", "Casa", "Moveis", "Beleza", "Automotivo", "Indefinida"]
const PAGAMENTOS = ["Boleto", "Pix", "Cartão"]
const STATUSES   = ["Processando", "Aprovado", "Em rota", "Entregue", "Entregue com Atraso", "Recusado", "Cancelado", "Reembolsado"]

const inputCls = "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#D1B1E5] transition"

function today() { return new Date().toISOString().slice(0, 10) }

// ── FieldBlock ────────────────────────────────────────────────────────────────

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

// ── SelectDropdown ────────────────────────────────────────────────────────────

function SelectDropdown({
  value, placeholder, options, onChange,
}: { value: string; placeholder?: string; options: string[]; onChange: (v: string) => void }) {
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
        {open
          ? <ChevronUp  size={16} className="text-gray-500 shrink-0" />
          : <ChevronDown size={16} className="text-gray-500 shrink-0" />}
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

// ── SearchSelect ──────────────────────────────────────────────────────────────
// Enforces selection from the dropdown — free-typed text is cleared on blur.
// Stops fetching once a valid item is selected (selectedId non-empty).

interface SearchSelectProps<T> {
  id:              string
  label:           string
  placeholder:     string
  displayValue:    string
  selectedId:      string
  onDisplayChange: (text: string) => void
  onSelect:        (item: T) => void
  fetchFn:         (q: string) => Promise<T[]>
  getLabel:        (item: T) => string
  required?:       boolean
  showError?:      boolean
}

function SearchSelect<T>({
  id, label, placeholder, displayValue, selectedId,
  onDisplayChange, onSelect, fetchFn, getLabel, required, showError,
}: SearchSelectProps<T>) {
  const [results, setResults] = useState<T[]>([])
  const [open,    setOpen]    = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Already has a valid selection — don't fetch
    if (selectedId) { setResults([]); setOpen(false); return }

    if (timer.current) clearTimeout(timer.current)
    if (!displayValue.trim()) { setResults([]); setOpen(false); return }

    timer.current = setTimeout(async () => {
      try {
        const items = await fetchFn(displayValue)
        setResults(items)
        setOpen(items.length > 0)
      } catch { setResults([]) }
    }, 300)

    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [displayValue, fetchFn, selectedId])

  const handleBlur = () => {
    setTimeout(() => {
      setOpen(false)
      // Clear text if user typed but never selected a valid item
      if (!selectedId && displayValue.trim()) onDisplayChange("")
    }, 150)
  }

  const isValid  = Boolean(selectedId)
  const hasError = showError && !isValid

  return (
    <div className="flex flex-col gap-1.5 relative">
      <label htmlFor={id} className={cn("text-sm font-semibold", "text-gray-900")}>
        {label}{required && " *"}
      </label>
      <input
        id={id}
        value={displayValue}
        onChange={e => onDisplayChange(e.target.value)}
        onFocus={() => { if (results.length > 0 && !selectedId) setOpen(true) }}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          inputCls,
          hasError && "border-red-400 focus:ring-red-200",
          isValid  && "border-green-400"
        )}
      />
      {hasError && (
        <p className="text-xs text-red-500">Selecione {label.toLowerCase()} da lista</p>
      )}
      {open && (
        <ul className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {results.map((item, i) => (
            <li
              key={i}
              onMouseDown={() => { onSelect(item); setOpen(false) }}
              className="px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-[#F7EBFF] truncate"
            >
              {getLabel(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function searchContacts(search: string): Promise<Contact[]> {
  const res = await fetchContacts({ search, pageSize: 15, page: 1, tab: "all" })
  return res.data
}

async function searchProducts(search: string): Promise<Product[]> {
  const res = await fetchProducts({ search, pageSize: 15 })
  return res.data
}

// ── Form state ────────────────────────────────────────────────────────────────

const EMPTY = {
  id_cliente: "", id_produto: "",
  nome_cliente: "", nome_produto: "",
  categoria: "",
  quantidade: "", valor_pedido: "",
  metodo_pagamento: PAGAMENTOS[0],
  status: "Processando",
  data_pedido: today(),
}

function saleToForm(sale: Sale): typeof EMPTY {
  const [d, m, y] = (sale.date || "").split("/")
  const datePedido = d && m && y ? `${y}-${m}-${d}` : today()
  return {
    id_cliente:       sale.client_id ?? "existing",
    id_produto:       "existing",
    nome_cliente:     sale.client,
    nome_produto:     sale.product,
    categoria:        sale.categoria ?? CATEGORIAS[0],
    quantidade:       String(sale.amount),
    valor_pedido:     String(sale.value),
    metodo_pagamento: sale.payment_method || PAGAMENTOS[0],
    status:           sale.status,
    data_pedido:      datePedido,
  }
}

// ── SaleFormContent ───────────────────────────────────────────────────────────

interface SaleFormContentProps {
  sale?: Sale; onClose: () => void; onSuccess: () => void
}

function SaleFormContent({ sale, onClose, onSuccess }: SaleFormContentProps) {
  const isEdit = Boolean(sale)
  const { user } = useAuth()
  const [form,       setForm]       = useState<typeof EMPTY>(() => sale ? saleToForm(sale) : { ...EMPTY, data_pedido: today() })
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState("")
  const [showErrors, setShowErrors] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.id_cliente || !form.nome_cliente.trim()) { setShowErrors(true); setError("Selecione um cliente da lista."); return }
    if (!form.id_produto  || !form.nome_produto.trim())  { setShowErrors(true); setError("Selecione um produto da lista.");  return }
    setLoading(true); setError("")
    try {
      if (isEdit && sale) {
        await updateSale(sale.id, {
          nome_cliente: form.nome_cliente, nome_produto: form.nome_produto,
          categoria: form.categoria, quantidade: Number(form.quantidade) || 0,
          valor_pedido: Number(form.valor_pedido) || 0,
          metodo_pagamento: form.metodo_pagamento, status: form.status, data_pedido: form.data_pedido,
        }, user?.name ?? "Sistema")
      } else {
        await createSale({
          id_cliente: form.id_cliente || undefined, id_produto: form.id_produto || undefined,
          nome_cliente: form.nome_cliente, nome_produto: form.nome_produto,
          categoria: form.categoria, quantidade: Number(form.quantidade) || 0,
          valor_pedido: Number(form.valor_pedido) || 0,
          metodo_pagamento: form.metodo_pagamento, status: form.status, data_pedido: form.data_pedido,
        })
      }
      onSuccess(); onClose()
    } catch {
      setError(isEdit ? "Erro ao atualizar pedido. Tente novamente." : "Erro ao criar pedido. Tente novamente.")
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* Cliente + Produto */}
      <div className="grid grid-cols-2 gap-4">
        <SearchSelect<Contact>
          id="sf-cliente" label="Cliente" placeholder="Buscar cliente..."
          displayValue={form.nome_cliente} selectedId={form.id_cliente}
          onDisplayChange={v => setForm(f => ({ ...f, nome_cliente: v, id_cliente: "" }))}
          onSelect={c => setForm(f => ({ ...f, id_cliente: c.id, nome_cliente: c.name ?? "" }))}
          fetchFn={searchContacts} getLabel={c => c.name ?? ""}
          required showError={showErrors}
        />
        <SearchSelect<Product>
          id="sf-produto" label="Produto" placeholder="Buscar produto..."
          displayValue={form.nome_produto} selectedId={form.id_produto}
          onDisplayChange={v => setForm(f => ({ ...f, nome_produto: v, id_produto: "" }))}
          onSelect={p => setForm(f => ({ ...f, id_produto: p.id, nome_produto: p.name, categoria: p.category }))}
          fetchFn={searchProducts} getLabel={p => p.name}
          required showError={showErrors}
        />
      </div>

      {/* Categoria + Pagamento */}
      <div className="grid grid-cols-2 gap-4">
        <FieldBlock label="Categoria" muted={!form.id_produto}>
          <input
            value={form.categoria}
            readOnly
            disabled={!form.id_produto}
            placeholder="Definida pelo produto"
            className={cn(inputCls, "cursor-not-allowed", !form.id_produto ? "text-gray-400" : "text-gray-700")}
          />
        </FieldBlock>
        <FieldBlock label="Método de pagamento">
          <SelectDropdown value={form.metodo_pagamento} options={PAGAMENTOS} onChange={v => setForm(f => ({ ...f, metodo_pagamento: v }))} />
        </FieldBlock>
      </div>

      {/* Quantidade + Valor */}
      <div className="grid grid-cols-2 gap-4">
        <FieldBlock label="Quantidade">
          <input
            type="number" min="0" step="1" placeholder="0"
            value={form.quantidade}
            onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))}
            className={inputCls}
          />
        </FieldBlock>
        <FieldBlock label="Valor (R$)">
          <input
            type="number" min="0" step="0.01" placeholder="0,00"
            value={form.valor_pedido}
            onChange={e => setForm(f => ({ ...f, valor_pedido: e.target.value }))}
            className={inputCls}
          />
        </FieldBlock>
      </div>

      {/* Status + Data */}
      <div className="grid grid-cols-2 gap-4">
        <FieldBlock label="Status">
          <SelectDropdown value={form.status} options={STATUSES} onChange={v => setForm(f => ({ ...f, status: v }))} />
        </FieldBlock>
        <FieldBlock label="Data do pedido">
          <input
            type="date" value={form.data_pedido}
            onChange={e => setForm(f => ({ ...f, data_pedido: e.target.value }))}
            className={inputCls}
          />
        </FieldBlock>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <hr className="border-gray-200" />

      <div className="flex items-center justify-center gap-8">
        <button
          type="button" onClick={onClose} disabled={loading}
          className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit" disabled={loading}
          className={cn(
            "px-10 py-2.5 rounded-full text-sm font-semibold border transition-colors",
            "bg-[#F7EBFF] border-[#D1B1E5] text-gray-900 hover:bg-[#edd9ff]",
            loading && "opacity-60 cursor-not-allowed"
          )}
        >
          {loading ? "Salvando..." : isEdit ? "Salvar alterações" : "Confirmar"}
        </button>
      </div>
    </form>
  )
}

// ── SaleFormSheet (modal) ─────────────────────────────────────────────────────

interface SaleFormModalProps {
  open: boolean; onClose: () => void; onSuccess: () => void; sale?: Sale
}

export function SaleFormSheet({ open, onClose, onSuccess, sale }: SaleFormModalProps) {
  const isEdit = Boolean(sale)

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl w-full max-w-[620px] p-8 focus:outline-none"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between mb-1">
            <Dialog.Title className="text-2xl font-bold text-gray-900">
              {isEdit ? "Editar pedido" : "Criação de pedido"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-500 hover:text-gray-800 transition-colors">
                <X size={22} />
              </button>
            </Dialog.Close>
          </div>
          <hr className="border-gray-200 mb-6" />

          {open && (
            <SaleFormContent
              key={sale?.id ?? "new"}
              sale={sale}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
