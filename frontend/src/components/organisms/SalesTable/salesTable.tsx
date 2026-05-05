import { useState } from "react"
import { DataTable } from "@/components/organisms/DataTable"
import { saleColumns } from "./columns"
import type { Tab } from "@/components/organisms/DataTable/types"
import { mockSales } from "@/lib/mocks/sales"
import type { Sale } from "@/types/sale"

const TABS: Tab[] = [
  { id: "all", label: "Todos os pedidos" },
  { id: "concluded", label: "Pedidos concluídos" },
  { id: "returned", label: "Pedidos devolvidos" },
]

function filterByTab(sales: Sale[], tab: string): Sale[] {
  if (tab === "concluded")
    return sales.filter(c =>
      ["Concluída", "Reembolsada"].includes(c.status)
    )
  if (tab === "returned")
    return sales.filter(c => ["Falha", "Cancelada", "Reembolsada"].includes(c.status))
  return sales
}

export function SalesTable() {
  const [activeTab, setActiveTab] = useState("all")

  return (
    <DataTable
      data={filterByTab(mockSales, activeTab)}
      columns={saleColumns}
      getRowId={(c) => c.id}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  )
}