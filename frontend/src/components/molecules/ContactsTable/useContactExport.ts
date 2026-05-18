import { useState, useRef, useEffect, useCallback } from "react"
import { exportContactsCSV } from "@/lib/api/contacts"
import type { ExportPill } from "@/components/molecules/ExportPopover"
import type { Contact } from "@/types/contact"
import type { ContactAdvancedFilters } from "./AdvancedFiltersDrawer"
import type { ServerFilters } from "./types"

function num(v: string): number | undefined {
  return v !== "" ? Number(v) : undefined
}

function buildCSV(rows: Contact[]): string {
  const headers = ["ID", "Nome", "Email", "Status", "Região", "Origem", "Compras", "Produtos distintos", "Receita total", "Ticket médio", "Primeira compra", "Última compra", "Pagamento favorito", "Tickets suporte", "Taxa resolução", "Nota atendimento", "Engajamento", "NPS", "Nota produto"]
  const lines = rows.map(c => [
    c.id, c.name ?? "", c.email ?? "", c.clientStatus ?? "", c.region ?? "",
    c.origin ?? "", c.purchases, c.distinctProducts, c.totalRevenue, c.avgTicket,
    c.firstPurchase ?? "", c.lastPurchase ?? "", c.favPaymentMethod ?? "",
    c.totalTickets, c.resolutionRate, c.avgSupportRating ?? "",
    c.engagement, c.engagementScore, c.productRating ?? "",
  ])
  return [headers, ...lines]
    .map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n")
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

interface Params {
  activeTab: string
  serverFilters: ServerFilters
  advanced: ContactAdvancedFilters
  contacts: Contact[]
}

export function useContactExport({ activeTab, serverFilters, advanced, contacts }: Params) {
  const [exportOpen,    setExportOpen]    = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [selectedIds,   setSelectedIds]   = useState<Set<string>>(new Set())
  const contactsRef   = useRef<Contact[]>([])
  const selectedCache = useRef<Map<string, Contact>>(new Map())

  useEffect(() => { contactsRef.current = contacts }, [contacts])

  const handleSelectionChange = useCallback((ids: Set<string>) => {
    const cache = selectedCache.current
    for (const id of cache.keys()) { if (!ids.has(id)) cache.delete(id) }
    for (const c of contactsRef.current) { if (ids.has(c.id)) cache.set(c.id, c) }
    setSelectedIds(new Set(ids))
  }, [])

  const { purchasesMin, purchasesMax, createdFrom, createdTo, engagement, clientStatuses } = serverFilters

  const handleExportCSV = async () => {
    setExportLoading(true)
    try {
      await exportContactsCSV({
        tab:            activeTab,
        purchasesMin:   purchasesMin ?? undefined,
        purchasesMax:   purchasesMax ?? undefined,
        createdFrom:    createdFrom  || undefined,
        createdTo:      createdTo    || undefined,
        engagement,
        clientStatuses,
        regioes:                advanced.regioes,
        origens:                advanced.origens,
        pagamentos:             advanced.pagamentos,
        receitaMin:             num(advanced.receitaMin),
        receitaMax:             num(advanced.receitaMax),
        ticketMedioMin:         num(advanced.ticketMedioMin),
        ticketMedioMax:         num(advanced.ticketMedioMax),
        primeiraCompraFrom:     advanced.primeiraCompraFrom || undefined,
        primeiraCompraTo:       advanced.primeiraCompraTo   || undefined,
        ultimaCompraFrom:       advanced.ultimaCompraFrom   || undefined,
        ultimaCompraTo:         advanced.ultimaCompraTo     || undefined,
        ticketsSuporteMin:      num(advanced.ticketsSuporteMin),
        ticketsSuporteMax:      num(advanced.ticketsSuporteMax),
        notaAtendMin:           num(advanced.notaAtendMin),
        notaAtendMax:           num(advanced.notaAtendMax),
        npsMin:                 num(advanced.npsMin),
        npsMax:                 num(advanced.npsMax),
        notaProdMin:            num(advanced.notaProdMin),
        notaProdMax:            num(advanced.notaProdMax),
        generos:                advanced.generos,
        faixasEtarias:          advanced.faixasEtarias,
        estados:                advanced.estados,
        canaisPreferidos:       advanced.canaisPreferidos,
        dispositivos:           advanced.dispositivos,
        origensSessao:          advanced.origensSessao,
        periodosDia:            advanced.periodosDia,
        diasSemana:             advanced.diasSemana,
        categoriasVisualizadas: advanced.categoriasVisualizadas,
        taxaConversaoMin:       num(advanced.taxaConversaoMin),
        taxaConversaoMax:       num(advanced.taxaConversaoMax),
        totalSessoesMin:        num(advanced.totalSessoesMin),
        totalSessoesMax:        num(advanced.totalSessoesMax),
        abandonoCarrinhoMin:    num(advanced.abandonoCarrinhoMin),
        abandonoCarrinhoMax:    num(advanced.abandonoCarrinhoMax),
        npsRecenteMin:          num(advanced.npsRecenteMin),
        npsRecenteMax:          num(advanced.npsRecenteMax),
      })
      setExportOpen(false)
    } finally { setExportLoading(false) }
  }

  const handleExportSelected = async () => {
    setExportLoading(true)
    try {
      downloadCSV(
        buildCSV(Array.from(selectedCache.current.values())),
        `contatos_selecionados_${new Date().toISOString().slice(0, 10)}.csv`
      )
      setExportOpen(false)
    } finally { setExportLoading(false) }
  }

  const exportPills: ExportPill[] = [
    ...(serverFilters.clientStatuses.length ? [{ label: "Status",      value: serverFilters.clientStatuses.join(", ") }] : []),
    ...(serverFilters.purchasesMin != null  ? [{ label: "Compras mín", value: String(serverFilters.purchasesMin)      }] : []),
    ...(serverFilters.purchasesMax != null  ? [{ label: "Compras máx", value: String(serverFilters.purchasesMax)      }] : []),
    ...(serverFilters.engagement            ? [{ label: "Engajamento", value: serverFilters.engagement                }] : []),
    ...(serverFilters.createdFrom || serverFilters.createdTo
      ? [{ label: "Criação", value: `${serverFilters.createdFrom || "—"} – ${serverFilters.createdTo || "—"}` }] : []),
    ...(advanced.regioes.length             ? [{ label: "Regiões",     value: advanced.regioes.join(", ")             }] : []),
    ...(advanced.origens.length             ? [{ label: "Origens",     value: advanced.origens.join(", ")             }] : []),
    ...(advanced.pagamentos.length          ? [{ label: "Pagamentos",  value: advanced.pagamentos.join(", ")          }] : []),
    ...(advanced.receitaMin !== "" || advanced.receitaMax !== ""
      ? [{ label: "Receita", value: `${advanced.receitaMin || "—"} – ${advanced.receitaMax || "—"}` }] : []),
    ...(advanced.primeiraCompraFrom || advanced.primeiraCompraTo
      ? [{ label: "Primeira compra", value: `${advanced.primeiraCompraFrom || "—"} – ${advanced.primeiraCompraTo || "—"}` }] : []),
  ]

  return {
    exportOpen, setExportOpen,
    exportLoading,
    selectedIds, handleSelectionChange,
    handleExportCSV, handleExportSelected,
    exportPills,
  }
}
