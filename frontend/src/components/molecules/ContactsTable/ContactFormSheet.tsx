import { useState, useEffect } from "react"
import type React from "react"
import {
  Sheet,
  SheetContent,
} from "@/components/atoms/sheet"
import { Input } from "@/components/atoms/input"
import { Label } from "@/components/atoms/label"
import { Button } from "@/components/atoms/button"
import type { Contact } from "@/types/contact"
import { createContact, updateContact } from "@/lib/api/contacts"

interface ContactFormSheetProps {
  open: boolean
  onClose: () => void
  contact: Contact | null
  onSuccess: () => void
}

export function ContactFormSheet({ open, onClose, contact, onSuccess }: ContactFormSheetProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (contact) {
      setForm({
        name:  contact.name  ?? "",
        email: contact.email ?? "",
        phone: contact.phone ?? "",
      })
    } else {
      setForm({ name: "", email: "", phone: "" })
    }
    setError("")
  }, [contact, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError("Nome é obrigatório"); return }
    setLoading(true)
    setError("")
    try {
      if (contact) {
        await updateContact(contact.id, form)
      } else {
        await createContact(form)
      }
      onSuccess()
      onClose()
    } catch {
      setError("Erro ao salvar contato. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" showCloseButton className="flex flex-col p-0 w-full sm:max-w-md">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {contact ? "Editar contato" : "Adicionar contato"}
          </h2>
          {contact && (
            <p className="text-sm text-gray-500 mt-0.5">{contact.name}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cf-name">Nome *</Label>
              <Input
                id="cf-name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cf-email">Email</Label>
              <Input
                id="cf-email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cf-phone">Telefone</Label>
              <Input
                id="cf-phone"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="(00) 00000-0000"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : contact ? "Salvar alterações" : "Adicionar contato"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
