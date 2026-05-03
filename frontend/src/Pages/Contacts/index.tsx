import { ContactsTable } from "@/components/molecules/ContactsTable"
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined"

export default function Contacts() {
  return (
    <div className="p-6 h-full flex flex-col gap-5 bg-gray-50 min-h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Contatos</h1>
        <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
          <AddCircleOutlinedIcon sx={{ fontSize: 18 }} />
          Adicionar Contato
        </button>
      </div>
      <ContactsTable />
    </div>
  )
}
