import type { Ticket } from "@/types/ticket"

function escapeCsvValue(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`
}

export function buildTicketsCsv(rows: Ticket[]) {
  const headers = [
    "ID Ticket",
    "Cliente",
    "ID Cliente",
    "ID Pedido",
    "Data de abertura",
    "Responsável",
    "Problema",
    "Status",
    "Nota",
  ]

  const lines = rows.map(ticket => [
    ticket.id,
    ticket.client,
    ticket.clientId,
    ticket.orderId,
    ticket.openedAt,
    ticket.responsible.name,
    ticket.problem,
    ticket.status,
    ticket.score ?? "Sem avaliação",
  ])

  return [headers, ...lines]
    .map(row => row.map(escapeCsvValue).join(","))
    .join("\n")
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

export function formatDateForPill(value: string) {
  if (!value) return ""

  const [year, month, day] = value.split("-")

  if (!year || !month || !day) {
    return value
  }

  return `${day}/${month}/${year}`
}