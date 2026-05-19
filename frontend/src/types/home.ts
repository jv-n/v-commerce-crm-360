export interface ShortcutItem {
  id: number
  label: string
  icon: string
  route: string
  disabled?: boolean
}

export interface ContactBookmark {
  kind: "contact"
  id: string
  name: string
  email: string | null
}

export interface ProductBookmark {
  kind: "product"
  id: string
  name: string
  price: number | null
  totalSales: number
  category: string
}

export type Bookmark = ContactBookmark | ProductBookmark
