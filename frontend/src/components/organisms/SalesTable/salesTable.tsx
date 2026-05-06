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

export type SalesTableHandle = {
  undo:  () => void
  reset: () => void
}

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

   const handleFiltersChange = () => {
      
    }

  return (
    <DataTable
      data={filterByTab(mockSales, activeTab)}
      columns={saleColumns}
      getRowId={(c) => c.id}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onFiltersChange={handleFiltersChange}
      rightFilterKey="status"
      rowsPerPageOptions={[10, 25, 50]}
      headerClassName="bg-[#F0DDFD]"
      dividersClassName="divide-[#9F83B2]"
    />
  )
}