import { useState, useRef, useEffect } from "react"
import type React from "react"
import { Sheet, SheetContent } from "@/components/atoms/sheet"
import { Input } from "@/components/atoms/input"
import { Label } from "@/components/atoms/label"
import { Button } from "@/components/atoms/button"
import { createSale, updateSale } from "@/lib/api/sales"
import type { Sale } from "@/types/sale"
import { fetchProducts } from "@/lib/api/products"
import { fetchContacts } from "@/lib/api/contacts"
import type { Product } from "@/types/product"
import type { Contact } from "@/types/contact"
import { useAuth } from "@/contexts/auth/useAuth"

const CATEGORIAS = ["Eletronicos", "Brinquedos", "Vestuario", "Esportes", "Casa", "Moveis", "Beleza", "Automotivo", "Indefinida"]
const PAGAMENTOS = ["Boleto", "Pix", "Cartão"]
const STATUSES = [
  "Processando", "Aprovado", "Em rota", "Entregue",
  "Entregue com Atraso", "Recusado", "Cancelado", "Reembolsado",
]

const selectCls = "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── SearchCombobox ────────────────────────────────────────────────────────────

interface SearchComboboxProps<T> {
  inputId:     string
  label:       string
  placeholder: string
  value:       string
  onChange:    (raw: string) => void
  onSelect:    (item: T) => void
  fetchFn:     (search: string) => Promise<T[]>
  getLabel:    (item: T) => string
  required?:   boolean
}

function SearchCombobox<T>({
  inputId, label, placeholder, value, onChange, onSelect, fetchFn, getLabel, required,
}: SearchComboboxProps<T>) {
  const [results, setResults] = useState<T[]>([])
  const [open,    setOpen]    = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (!value.trim()) { setResults([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      try {
        const items = await fetchFn(value)
        setResults(items)
        setOpen(items.length > 0)
      } catch {
        setResults([])
      }
    }, 300)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [value, fetchFn])

  return (
    <div className="flex flex-col gap-1.5 relative">
      <Label htmlFor={inputId}>{label}{required && " *"}</Label>
      <Input
        id={inputId}
        value={value}
        onChange={e => { onChange(e.target.value) }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => { if (results.length > 0) setOpen(true) }}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && (
        <ul className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-input bg-white shadow-md text-sm">
          {results.map((item, i) => (
            <li
              key={i}
              onMouseDown={() => { onSelect(item); setOpen(false) }}
              className="px-3 py-2 cursor-pointer hover:bg-[#F7EBFF] truncate"
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

async function searchProducts(search: string): Promise<Product[]> {
  const res = await fetchProducts({ search, pageSize: 15 })
  return res.data
}

async function searchContacts(search: string): Promise<Contact[]> {
  const res = await fetchContacts({ search, pageSize: 15, page: 1, tab: "all" })
  return res.data
}

// ── SaleFormSheet ─────────────────────────────────────────────────────────────

const EMPTY = {
  id_cliente:       "",
  id_produto:       "",
  nome_cliente:     "",
  nome_produto:     "",
  categoria:        CATEGORIAS[0],
  quantidade:       "",
  valor_pedido:     "",
  metodo_pagamento: PAGAMENTOS[0],
  status:           "Processando",
  data_pedido:      today(),
}

function saleToForm(sale: Sale): typeof EMPTY {
  const [d, m, y] = (sale.date || "").split("/")
  const datePedido = d && m && y ? `${y}-${m}-${d}` : today()
  return {
    id_cliente:       "",
    id_produto:       "",
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

interface SaleFormContentProps {
  sale?:     Sale
  onClose:   () => void
  onSuccess: () => void
}

function SaleFormContent({ sale, onClose, onSuccess }: SaleFormContentProps) {
  const isEdit = Boolean(sale)
  const { user } = useAuth()
  const [form,    setForm]    = useState<typeof EMPTY>(() =>
    sale ? saleToForm(sale) : { ...EMPTY, data_pedido: today() }
  )
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nome_cliente.trim()) { setError("Nome do cliente é obrigatório"); return }
    if (!form.nome_produto.trim())  { setError("Nome do produto é obrigatório");  return }
    setLoading(true)
    setError("")
    try {
      if (isEdit && sale) {
        await updateSale(sale.id, {
          nome_cliente:     form.nome_cliente,
          nome_produto:     form.nome_produto,
          categoria:        form.categoria,
          quantidade:       Number(form.quantidade)   || 0,
          valor_pedido:     Number(form.valor_pedido) || 0,
          metodo_pagamento: form.metodo_pagamento,
          status:           form.status,
          data_pedido:      form.data_pedido,
        }, user?.name ?? "Sistema")
      } else {
        await createSale({
          id_cliente:       form.id_cliente       || undefined,
          id_produto:       form.id_produto       || undefined,
          nome_cliente:     form.nome_cliente,
          nome_produto:     form.nome_produto,
          categoria:        form.categoria,
          quantidade:       Number(form.quantidade)   || 0,
          valor_pedido:     Number(form.valor_pedido) || 0,
          metodo_pagamento: form.metodo_pagamento,
          status:           form.status,
          data_pedido:      form.data_pedido,
        })
      }
      onSuccess()
      onClose()
    } catch {
      setError(isEdit ? "Erro ao atualizar pedido. Tente novamente." : "Erro ao criar pedido. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

        <SearchCombobox<Contact>
          inputId="sf-cliente"
          label="Cliente"
          placeholder="Buscar cliente..."
          value={form.nome_cliente}
          onChange={v => setForm(f => ({ ...f, nome_cliente: v, id_cliente: "" }))}
          onSelect={c => setForm(f => ({ ...f, id_cliente: c.id, nome_cliente: c.name ?? "" }))}
          fetchFn={searchContacts}
          getLabel={c => c.name ?? ""}
          required
        />

        <SearchCombobox<Product>
          inputId="sf-produto"
          label="Produto"
          placeholder="Buscar produto..."
          value={form.nome_produto}
          onChange={v => setForm(f => ({ ...f, nome_produto: v, id_produto: "" }))}
          onSelect={p => setForm(f => ({ ...f, id_produto: p.id, nome_produto: p.name, categoria: p.category }))}
          fetchFn={searchProducts}
          getLabel={p => p.name}
          required
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sf-categoria">Categoria</Label>
          <select id="sf-categoria" value={form.categoria} onChange={set("categoria")} className={selectCls}>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sf-qtd">Quantidade</Label>
            <Input id="sf-qtd" type="number" min="0" step="1" value={form.quantidade} onChange={set("quantidade")} placeholder="0" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sf-valor">Valor (R$)</Label>
            <Input id="sf-valor" type="number" min="0" step="0.01" value={form.valor_pedido} onChange={set("valor_pedido")} placeholder="0,00" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sf-pagamento">Método de pagamento</Label>
          <select id="sf-pagamento" value={form.metodo_pagamento} onChange={set("metodo_pagamento")} className={selectCls}>
            {PAGAMENTOS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sf-status">Status</Label>
          <select id="sf-status" value={form.status} onChange={set("status")} className={selectCls}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sf-data">Data do pedido</Label>
          <Input id="sf-data" type="date" value={form.data_pedido} onChange={set("data_pedido")} />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : isEdit ? "Salvar alterações" : "Adicionar pedido"}
        </Button>
      </div>
    </form>
  )
}

interface SaleFormSheetProps {
  open:      boolean
  onClose:   () => void
  onSuccess: () => void
  sale?:     Sale
}

export function SaleFormSheet({ open, onClose, onSuccess, sale }: SaleFormSheetProps) {
  const isEdit = Boolean(sale)

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" showCloseButton className="flex flex-col p-0 w-full sm:max-w-md">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{isEdit ? "Editar pedido" : "Adicionar pedido"}</h2>
        </div>
        {open && (
          <SaleFormContent
            key={sale?.id ?? "new"}
            sale={sale}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
