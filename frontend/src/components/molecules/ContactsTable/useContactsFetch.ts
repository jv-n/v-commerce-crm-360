import { useState, useEffect, useRef } from "react"
import { fetchContacts } from "@/lib/api/contacts"
import type { Contact } from "@/types/contact"
import type { ContactAdvancedFilters } from "./AdvancedFiltersDrawer"
import type { ServerFilters } from "./types"

function num(v: string): number | undefined {
  return v !== "" ? Number(v) : undefined
}

interface Params {
  page: number
  pageSize: number
  activeTab: string
  nameSearch: string
  serverFilters: ServerFilters
  sortBy: string | null
  sortDir: "asc" | "desc"
  refetchKey: number
  advanced: ContactAdvancedFilters
}

export function useContactsFetch({ page, pageSize, activeTab, nameSearch, serverFilters, sortBy, sortDir, refetchKey, advanced }: Params) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { purchasesMin, purchasesMax, createdFrom, createdTo, engagements, clientStatuses } = serverFilters

  useEffect(() => {
    const hasText =
      nameSearch !== "" ||
      advanced.receitaMin !== "" || advanced.receitaMax !== "" ||
      advanced.ticketMedioMin !== "" || advanced.ticketMedioMax !== "" ||
      advanced.ticketsSuporteMin !== "" || advanced.ticketsSuporteMax !== "" ||
      advanced.notaAtendMin !== "" || advanced.notaAtendMax !== "" ||
      advanced.npsMin !== "" || advanced.npsMax !== "" ||
      advanced.notaProdMin !== "" || advanced.notaProdMax !== "" ||
      advanced.taxaConversaoMin !== "" || advanced.taxaConversaoMax !== "" ||
      advanced.totalSessoesMin !== "" || advanced.totalSessoesMax !== "" ||
      advanced.abandonoCarrinhoMin !== "" || advanced.abandonoCarrinhoMax !== "" ||
      advanced.npsRecenteMin !== "" || advanced.npsRecenteMax !== ""

    if (debounceRef.current) clearTimeout(debounceRef.current)
    let cancelled = false

    debounceRef.current = setTimeout(() => {
      setLoading(true)
      setFetchError(false)
      fetchContacts({
        page, pageSize, tab: activeTab,
        search: nameSearch || undefined,
        purchasesMin, purchasesMax, createdFrom, createdTo, engagements, clientStatuses,
        sortBy, sortDir,
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
        .then(res => {
          if (cancelled) return
          setContacts(res.data)
          setTotal(res.total)
        })
        .catch(err => { console.error(err); if (!cancelled) setFetchError(true) })
        .finally(() => { if (!cancelled) setLoading(false) })
    }, hasText ? 300 : 0)

    return () => {
      cancelled = true
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [
    page, pageSize, activeTab,
    purchasesMin, purchasesMax, createdFrom, createdTo, engagements, clientStatuses,
    sortBy, sortDir, refetchKey, nameSearch,
    advanced,
  ])

  return { contacts, total, loading, fetchError }
}
