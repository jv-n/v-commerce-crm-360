import type { Bookmark } from "@/types/home"

interface BookmarkRecord {
  id:          string
  kind:        "contact" | "product"
  entity_id:   string
  name:        string
  email?:      string | null
  price?:      number | null
  total_sales?: number | null
  category?:   string | null
}

function toBookmark(r: BookmarkRecord): Bookmark {
  if (r.kind === "contact") {
    return { kind: "contact", id: r.entity_id, name: r.name, email: r.email ?? null }
  }
  return {
    kind: "product",
    id: r.entity_id,
    name: r.name,
    price: r.price ?? null,
    totalSales: r.total_sales ?? 0,
    category: r.category ?? "Indefinida",
  }
}

export async function fetchBookmarks(): Promise<Bookmark[]> {
  const res = await fetch("/api/bookmarks/")
  if (!res.ok) throw new Error("Failed to fetch bookmarks")
  const data: BookmarkRecord[] = await res.json()
  return data.map(toBookmark)
}

export async function saveBookmark(bookmark: Bookmark): Promise<void> {
  const body = {
    kind:        bookmark.kind,
    entity_id:   bookmark.id,
    name:        bookmark.name,
    email:       bookmark.kind === "contact" ? bookmark.email        : null,
    price:       bookmark.kind === "product" ? bookmark.price        : null,
    total_sales: bookmark.kind === "product" ? bookmark.totalSales   : null,
    category:    bookmark.kind === "product" ? bookmark.category     : null,
  }
  const res = await fetch("/api/bookmarks/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error("Failed to save bookmark")
}

export async function deleteBookmark(entityId: string): Promise<void> {
  await fetch(`/api/bookmarks/${entityId}`, { method: "DELETE" })
}
