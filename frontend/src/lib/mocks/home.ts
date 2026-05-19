import type { ShortcutItem, Bookmark } from "@/types/home"

export const MOCKED_SHORTCUTS: ShortcutItem[] = [
  { id: 1, label: "Contatos",  icon: "ContactPage",        route: "/contacts"  },
  { id: 2, label: "Pedidos",   icon: "RequestQuote",       route: "/sales"     },
  { id: 3, label: "Catálogo",  icon: "Inventory2Outlined", route: "/products"  },
  { id: 4, label: "Tickets",   icon: "ConfirmationNumber", route: "/tickets"   },
  { id: 5, label: "Dashboard", icon: "BarChart",           route: "/dashboard" },
]

export const MOCKED_BOOKMARKS: Bookmark[] = [
  { kind: "contact", id: "07594d7a-5a30-5cdf-b446-fbf7ff5d32d6", name: "Xisto Guimarães", email: "xisto.guimaraes@email.com" },
  { kind: "contact", id: "0aa5f375-b3a6-4e22-b6ba-5545c4cb96d4", name: "Valdo Esteves",   email: "vesteves388@yahoo.com"      },
  { kind: "product", id: "PROD-0023", name: "Monitor 27 Polegadas", price: 2146.00, totalSales: 10504, category: "Eletronicos" },
  { kind: "product", id: "PROD-0041", name: "Console de Videogame", price: 4154.00, totalSales: 10248, category: "Eletronicos" },
]
 