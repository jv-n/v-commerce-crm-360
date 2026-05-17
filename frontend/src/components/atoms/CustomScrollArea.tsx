import { useRef, useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

interface Props {
  children: React.ReactNode
  className?: string
}

export function CustomScrollArea({ children, className }: Props) {
  const scrollRef   = useRef<HTMLDivElement>(null)
  const thumbRef    = useRef<HTMLDivElement>(null)
  const isDragging  = useRef(false)
  const dragStartY  = useRef(0)
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

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={scrollRef}
        onScroll={syncThumb}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {/* Scrollbar customizado */}
      <div
        className={cn(
          "absolute right-1.5 top-1.5 bottom-1.5 w-1.5 z-20 rounded-full transition-opacity duration-200",
          canScroll && isHovered ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onMouseDown={handleTrackMouseDown}
      >
        <div className="absolute inset-0 rounded-full bg-black/10" />
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
