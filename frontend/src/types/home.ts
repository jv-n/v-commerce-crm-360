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

export type GoalKind = "product_sales" | "new_clients" | "category_sales"

export interface Goal {
  id:             string
  kind:           GoalKind
  label:          string
  target:         number
  current:        number
  referenceMonth?: string | null   // "YYYY-MM"
  productId?:     string | null
  productName?:   string | null
  category?:      string | null
}
