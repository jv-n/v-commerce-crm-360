import { ContactsTable } from "@/components/molecules/ContactsTable"


export default function Contacts() {
  return (
    <div className="p-6 h-full flex flex-col gap-5 bg-gray-50 min-h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Contatos</h1>
      </div>
      <ContactsTable />
    </div>
  )
}
