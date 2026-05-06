import type { ReactNode } from "react"
import type { Tab } from "../types"
import { TabButton } from "../atoms/TabButton"
import AddIcon from "@mui/icons-material/Add"
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined"
import TableRowsOutlinedIcon from "@mui/icons-material/TableRowsOutlined"
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined"

interface DataTableTabsProps {
  tabs: Tab[]
  activeTab?: string
  onTabChange: (id: string) => void
  rightSlot?: ReactNode
}

export function DataTableTabs({ tabs, activeTab, onTabChange, rightSlot }: DataTableTabsProps) {
  return (
    <div className="flex items-center justify-between px-4 border-b border-gray-200">
      <div className="flex items-center">
        {tabs.map(tab => (
          <TabButton
            key={tab.id}
            label={tab.label}
            isActive={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          />
        ))}
        <button className="p-2 ml-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
          <AddIcon sx={{ fontSize: 16 }} />
        </button>
      </div>

      <div className="flex items-center gap-2 relative z-50">
        {rightSlot}
        <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
          <SearchOutlinedIcon sx={{ fontSize: 18 }} />
        </button>
        <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
          <button className="p-1.5 bg-gray-100 text-gray-700 border-r border-gray-200">
            <TableRowsOutlinedIcon sx={{ fontSize: 16 }} />
          </button>
          <button className="p-1.5 text-gray-400 hover:bg-gray-50">
            <GridViewOutlinedIcon sx={{ fontSize: 16 }} />
          </button>
        </div>
      </div>
    </div>
  )
}
