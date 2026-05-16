import type { ExportPill } from "@/components/molecules/ExportPopover"
import type { DateFilters, ServerFilters } from "./ticketConstants"
import { formatDateForPill } from "./ticketExport"

export function getTicketRequestFilters(
  activeTab: string,
  loggedUserName: string,
  serverFilters: ServerFilters
): ServerFilters {
  const responsible =
    activeTab === "my-attending"
      ? loggedUserName
        ? [loggedUserName]
        : ["__usuario_nao_encontrado__"]
      : serverFilters.responsible

  const status =
    activeTab === "my-attending"
      ? ["Em atendimento"]
      : activeTab === "waiting"
        ? ["Aguardando"]
        : serverFilters.status

  return {
    responsible,
    status,
    problem: serverFilters.problem,
    score: serverFilters.score,
  }
}

export function buildTicketExportPills(
  activeTab: string,
  searchQuery: string,
  serverFilters: ServerFilters,
  dateFilters: DateFilters
): ExportPill[] {
  const pills: ExportPill[] = []

  if (activeTab === "my-attending") {
    pills.push({ label: "Aba", value: "Meus Tickets" })
  }

  if (activeTab === "waiting") {
    pills.push({ label: "Aba", value: "Aguardando" })
  }

  if (searchQuery) {
    pills.push({ label: "Busca", value: searchQuery })
  }

  if (serverFilters.responsible.length) {
    pills.push({
      label: "Responsável",
      value: serverFilters.responsible.join(", "),
    })
  }

  if (serverFilters.status.length) {
    pills.push({
      label: "Status",
      value: serverFilters.status.join(", "),
    })
  }

  if (serverFilters.problem.length) {
    pills.push({
      label: "Problema",
      value: serverFilters.problem.join(", "),
    })
  }

  if (serverFilters.score.length) {
    pills.push({
      label: "Nota",
      value: serverFilters.score.join(", "),
    })
  }

  if (dateFilters.openedFrom) {
    pills.push({
      label: "Data início",
      value: formatDateForPill(dateFilters.openedFrom),
    })
  }

  if (dateFilters.openedTo) {
    pills.push({
      label: "Data fim",
      value: formatDateForPill(dateFilters.openedTo),
    })
  }

  return pills
}