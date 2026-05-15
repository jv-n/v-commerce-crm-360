import { Fragment, useRef, useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import type { Column } from "../types"
import type { ReactNode } from "react"
import ArrowUpwardIcon   from "@mui/icons-material/ArrowUpward"
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward"
import UnfoldMoreIcon    from "@mui/icons-material/UnfoldMore"
import { Checkbox } from "@/components/atoms/checkbox"
import { CopyIdButton } from "@/components/atoms/CopyIdButton"

interface DataTableRowsProps<T> {
  columns: Column<T>[]
  pageData: T[]
  getRowId: (row: T) => string
  selectedRows: Set<string>
  isAllSelected: boolean
  onToggleAll: () => void
  onToggleRow: (id: string) => void
  loading?: boolean
  emptyMessage?: string
  headerClassName?: string
  rowClassName?: string
  expandedRowClassName?: string
  dividersClassName?: string
  expandedRowIds?: Set<string>
  renderExpandedRow?: (row: T) => ReactNode
  sortKey?: string | null
  sortDir?: "asc" | "desc"
  onSort?: (key: string) => void
  onRowClick?: (row: T) => void
}

export function DataTableRows<T,>({
  columns,
  pageData,
  getRowId,
  selectedRows,
  isAllSelected,
  onToggleAll,
  onToggleRow,
  loading = false,
  emptyMessage = "Nenhum item encontrado.",
  headerClassName = "bg-gray-50",
  rowClassName = "",
  expandedRowClassName,
  dividersClassName = "divide-gray-100",
  expandedRowIds,
  renderExpandedRow,
  sortKey,
  sortDir,
  onSort,
  onRowClick,
}: DataTableRowsProps<T>) {
  const scrollRef  = useRef<HTMLDivElement>(null)
  const thumbRef   = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragStartY = useRef(0)
  const dragStartST = useRef(0)

  const [thumbTop,    setThumbTop]    = useState(0)
  const [thumbHeight, setThumbHeight] = useState(20)
  const [canScroll,   setCanScroll]   = useState(false)
  const [isHovered,   setIsHovered]   = useState(false)

  const syncThumb = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    const overflow = scrollHeight > clientHeight + 1
    setCanScroll(overflow)
    if (!overflow) return
    const ratio  = clientHeight / scrollHeight
    const thPct  = Math.max(ratio * 100, 8)
    const maxTop = 100 - thPct
    setThumbHeight(thPct)
    setThumbTop((scrollTop / (scrollHeight - clientHeight)) * maxTop)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(syncThumb)
    ro.observe(el)
    syncThumb()
    return () => ro.disconnect()
  }, [syncThumb])

  const handleThumbMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isDragging.current  = true
    dragStartY.current  = e.clientY
    dragStartST.current = scrollRef.current?.scrollTop ?? 0

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current || !scrollRef.current) return
      const el = scrollRef.current
      const { scrollHeight, clientHeight } = el
      const thumbPx  = (clientHeight / scrollHeight) * clientHeight
      const draggable = clientHeight - thumbPx
      if (draggable <= 0) return
      const ratio = (scrollHeight - clientHeight) / draggable
      el.scrollTop = Math.max(
        0,
        Math.min(dragStartST.current + (ev.clientY - dragStartY.current) * ratio, scrollHeight - clientHeight),
      )
    }
    const onUp = () => {
      isDragging.current = false
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }, [])

  const handleTrackMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === thumbRef.current || !scrollRef.current) return
    const el    = scrollRef.current
    const track = e.currentTarget.getBoundingClientRect()
    const pos   = (e.clientY - track.top) / track.height
    el.scrollTop = pos * (el.scrollHeight - el.clientHeight)
  }, [])

  const headerCells = (
    <>
      <th className="w-10 px-4 py-3">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={onToggleAll}
          className="border-purple-300 cursor-pointer accent-purple-800"
        />
      </th>
      {columns.map(col => {
        const isActive = sortKey === col.key
        return (
          <th
            key={col.key}
            style={col.minWidth ? { minWidth: col.minWidth } : undefined}
            className="px-3 py-3 text-left text-xs font-medium text-[#06121C]"
          >
            {col.sortable && col.header ? (
              <button
                onClick={() => onSort?.(col.key)}
                className={cn(
                  "group inline-flex items-center gap-1 hover:text-gray-800 transition-colors",
                  isActive && "text-gray-800"
                )}
              >
                {col.header}
                <span className={cn(
                  "transition-colors",
                  isActive ? "text-gray-700" : "text-gray-300 group-hover:text-gray-400"
                )}>
                  {isActive && sortDir === "asc"  && <ArrowUpwardIcon   sx={{ fontSize: 12 }} />}
                  {isActive && sortDir === "desc" && <ArrowDownwardIcon sx={{ fontSize: 12 }} />}
                  {!isActive && <UnfoldMoreIcon sx={{ fontSize: 13 }} />}
                </span>
              </button>
            ) : (
              col.header
            )}
          </th>
        )
      })}
    </>
  )

  return (
    <div
      className="relative flex-1 min-h-0 overflow-hidden rounded-xl mt-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tabela — scrollbar nativo oculto, ocupa 100% da largura */}
      <div
        ref={scrollRef}
        onScroll={syncThumb}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <table className="w-full text-xs font-medium text-[#06121C]">
          <thead className={cn("sticky top-0 z-10 border-b border-gray-200", headerClassName)}>
            <tr>{headerCells}</tr>
          </thead>

          <tbody className={cn("divide-y", dividersClassName)}>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3">
                    <div className="w-4 h-4 rounded bg-gray-200" />
                  </td>
                  {columns.map(col => (
                    <td key={col.key} className="px-3 py-3">
                      <div
                        className="h-4 rounded bg-gray-200"
                        style={{ width: `${60 + (i * 13 + col.key.length * 7) % 35}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <>
                {pageData.map(row => {
                  const id         = getRowId(row)
                  const isSelected = selectedRows.has(id)
                  const isExpanded = expandedRowIds?.has(id) ?? false
                  return (
                    <Fragment key={id}>
                      <tr
                        className={cn(
                          "group/row transition-colors",
                          rowClassName || "hover:bg-gray-50/80",
                          isExpanded && expandedRowClassName,
                          isExpanded && "bg-purple-50/",
                          isSelected && "bg-blue-50/60",
                          onRowClick && "cursor-pointer"
                        )}
                        onClick={() => onRowClick?.(row)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => onToggleRow(id)}
                            className="border-purple-300 cursor-pointer accent-purple-800"
                          />
                        </td>
                        {columns.map(col => (
                          <td key={col.key} className="px-3 py-3">
                            {col.copyId ? (
                              <div className="flex items-center gap-1.5">
                                {col.render(row)}
                                <CopyIdButton id={col.copyId(row)} />
                              </div>
                            ) : (
                              col.render(row)
                            )}
                          </td>
                        ))}
                      </tr>
                      {isExpanded && renderExpandedRow && (
                        <tr>
                          <td colSpan={columns.length + 1} className="p-0">
                            {renderExpandedRow(row)}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}

                {pageData.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="px-4 py-12 text-center text-sm text-gray-400"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Scrollbar customizado — overlay, aparece ao passar o mouse */}
      <div
        className={cn(
          "absolute right-1.5 top-1.5 bottom-1.5 w-1.5 z-20 rounded-full transition-opacity duration-200",
          canScroll && isHovered ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onMouseDown={handleTrackMouseDown}
      >
        {/* Track */}
        <div className="absolute inset-0 rounded-full bg-black/10" />
        {/* Thumb */}
        <div
          ref={thumbRef}
          className="absolute left-0 right-0 rounded-full bg-black/30 hover:bg-black/50 transition-colors cursor-pointer"
          style={{ top: `${thumbTop}%`, height: `${thumbHeight}%` }}
          onMouseDown={handleThumbMouseDown}
        />
      </div>
    </div>
  )
}