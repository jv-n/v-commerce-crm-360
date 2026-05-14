import type { ShortcutItem } from "@/types/home"
 
export const MOCKED_SHORTCUTS: ShortcutItem[] = [
  { id: 1, label: "Contatos",   icon: "ContactPage",  route: "/contacts"  },
  { id: 2, label: "Tickets",    icon: "ConfirmationNumber", route: "/tickets" },
  { id: 3, label: "Dashboard",  icon: "BarChart",     route: "/sales"     },
  { id: 4, label: "Pedidos",    icon: "RequestQuote", route: "/orders"    },
  { id: 5, label: "Produtos",   icon: "Bookmark",     route: "/products"  },
  { id: 6, label: "Catálogo",   icon: "MenuBook",     route: "/catalog"   },
]
 