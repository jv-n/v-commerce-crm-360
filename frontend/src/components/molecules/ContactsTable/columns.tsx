import type { Column } from "@/components/organisms/DataTable/types"
import type { Contact, EngagementType } from "@/types/contact"
import { StatusBadge } from "@/components/atoms/badge"
import { ContactAvatar } from "@/components/atoms/avatar"
import { cn } from "@/lib/utils"
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"

const ENGAGEMENT: Record<EngagementType, { bar: string; text: string; width: string }> = {
  Promotor:      { bar: "bg-green-500",  text: "text-green-700",  width: "80%" },
  Neutro:        { bar: "bg-yellow-400", text: "text-yellow-600", width: "50%" },
  Detrator:      { bar: "bg-red-500",    text: "text-red-600",    width: "22%" },
  "Nenhum NPS":  { bar: "bg-gray-200",   text: "text-gray-400",   width: "0%" },
}

export const contactColumns: Column<Contact>[] = [
  {
    key: "info",
    header: "",
    render: () => <InfoOutlinedIcon sx={{ fontSize: 15, color: "#D1D5DB" }} />,
  },
  {
    key: "name",
    header: "Nome",
    minWidth: "160px",
    render: (c) => (
      <span className="font-medium text-gray-900 truncate block max-w-[200px]">{c.name}</span>
    ),
  },
  {
    key: "responsible",
    header: "Responsável",
    minWidth: "160px",
    render: (c) => (
      <div className="flex items-center gap-2">
        <ContactAvatar initials={c.responsible.initials} bgColor={c.responsible.bgColor} />
        <span className="text-gray-600 text-xs whitespace-nowrap">{c.responsible.name}</span>
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    minWidth: "130px",
    render: (c) => <StatusBadge status={c.status} />,
  },
  {
    key: "lastPurchase",
    header: "Última compra",
    minWidth: "130px",
    render: (c) =>
      c.lastPurchase ? (
        <div className="flex items-center gap-1.5 text-gray-600">
          <AccessTimeOutlinedIcon sx={{ fontSize: 14, color: "#9CA3AF" }} />
          <span className="text-xs">{c.lastPurchase}</span>
        </div>
      ) : (
        <span className="text-xs text-gray-400">Nenhuma compra</span>
      ),
  },
  {
    key: "purchases",
    header: "Compras",
    minWidth: "80px",
    render: (c) => <span className="text-gray-800 font-medium">{c.purchases}</span>,
  },
  {
    key: "contacts",
    header: "Contatos",
    minWidth: "160px",
    render: (c) => (
      <div className="text-xs text-gray-500 space-y-0.5">
        <div>{c.email}</div>
        <div>{c.phone}</div>
      </div>
    ),
  },
  {
    key: "engagement",
    header: "Engajamento",
    minWidth: "140px",
    render: (c) => {
      const eng = ENGAGEMENT[c.engagement]
      return (
        <div className="flex flex-col gap-1 min-w-[110px]">
          <span className={cn("text-xs font-medium", eng.text)}>{c.engagement}</span>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className={cn("h-1.5 rounded-full", eng.bar)} style={{ width: eng.width }} />
          </div>
        </div>
      )
    },
  },
  {
    key: "actions",
    header: "",
    render: () => (
      <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded px-2 py-1 transition-colors whitespace-nowrap">
        <EditOutlinedIcon sx={{ fontSize: 13 }} />
        Editar
      </button>
    ),
  },
]