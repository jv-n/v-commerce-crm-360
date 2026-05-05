import { useState } from "react"
import { DataTable } from "@/components/organisms/DataTable"
import { contactColumns } from "./columns"
import { mockContacts } from "@/lib/mocks/contacts"
import type { Contact } from "@/types/contact"
import type { Tab } from "@/components/organisms/DataTable/types"

const TABS: Tab[] = [
  { id: "all",     label: "Todos os contatos" },
  { id: "clients", label: "Todos os clientes" },
  { id: "leads",   label: "Todos os Leads" },
]

function filterByTab(contacts: Contact[], tab: string): Contact[] {
  if (tab === "clients")
    return contacts.filter(c =>
      ["Cliente Ativo", "Cliente VIP", "Cliente Inativo"].includes(c.status)
    )
  if (tab === "leads")
    return contacts.filter(c => c.status === "Lead")
  return contacts
}

export function ContactsTable() {
  const [activeTab, setActiveTab] = useState("all")

  return (
    <DataTable
      data={filterByTab(mockContacts, activeTab)}
      columns={contactColumns}
      getRowId={(c) => c.id}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  )
}
