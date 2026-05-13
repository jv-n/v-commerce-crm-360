import { useEffect, useRef } from "react"
import type { ReactNode } from "react"
import type { Tab } from "../types"
import { TabButton } from "../atoms/TabButton"
import { MdOutlineTableChart } from "react-icons/md"
import AddIcon from "@mui/icons-material/Add"
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined"
import CloseIcon from "@mui/icons-material/Close"

interface DataTableTabsProps {
  tabs: Tab[]
  activeTab?: string
  onTabChange: (id: string) => void
  rightSlot?: ReactNode
  searchOpen: boolean
  searchQuery: string
  onSearchOpen: () => void
  onSearchChange: (q: string) => void
  onSearchClose: () => void
  searchPlaceholder?: string
}

export function DataTableTabs({
  tabs,
  activeTab,
  onTabChange,
  rightSlot,
  searchOpen,
  searchQuery,
  onSearchOpen,
  onSearchChange,
  onSearchClose,
  searchPlaceholder = "Pesquisar...",
}: DataTableTabsProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus()
  }, [searchOpen])

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
        <button className="p-2 ml-1 text-gray-400 hover:text-gray-600 rounded hover:bg-[#F7EBFF]">
          <AddIcon sx={{ fontSize: 16 }} />
        </button>
      </div>

      <div className="flex items-center gap-2 relative z-50">
        {!searchOpen && rightSlot}

        {searchOpen ? (
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-2 py-1">
            <SearchOutlinedIcon sx={{ fontSize: 16, color: "#9CA3AF" }} />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-44"
            />
            <button
              onClick={onSearchClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </button>
          </div>
        ) : (
          <button
            onClick={onSearchOpen}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-[#F7EBFF] rounded"
          >
            <SearchOutlinedIcon sx={{ fontSize: 18 }} />
          </button>
        )}

        <button className="p-1.5 text-gray-700">
          <MdOutlineTableChart />
        </button>
      </div>
    </div>
  )
}
