import type { ShortcutItem } from "@/types/home"
 
export const MOCKED_SHORTCUTS: ShortcutItem[] = [
  { id: 1, label: "Contatos",   icon: "ContactPage",  route: "/contacts"  },
  { id: 2, label: "Tickets",    icon: "ConfirmationNumber", route: "/tickets" },
  { id: 3, label: "Dashboard",  icon: "BarChart",     route: "/dashboard"     },
  { id: 4, label: "Pedidos",    icon: "RequestQuote", route: "/sales"    },
  { id: 5, label: "Catálogo",   icon: "Inventory2Outlined",     route: "/products"  },
  { id: 6, label: "V-academy",   icon: "MenuBook",     route: "/catalog"   },
]
 