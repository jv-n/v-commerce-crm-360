import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"

interface Props {
  text: string
}

export function CardInfoTooltip({ text }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos]   = useState({ top: 0, left: 0 })
  const anchorRef       = useRef<HTMLDivElement>(null)

  const handleEnter = () => {
    if (anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect()
      setPos({ top: r.top + window.scrollY, left: r.left + r.width / 2 + window.scrollX })
    }
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onScroll = () => setOpen(false)
    window.addEventListener("scroll", onScroll, true)
    return () => window.removeEventListener("scroll", onScroll, true)
  }, [open])

  const tooltip = open ? createPortal(
    <div
      className="pointer-events-none fixed z-[9999]"
      style={{ top: pos.top, left: pos.left, transform: "translate(-50%, calc(-100% - 10px))" }}
    >
      <div className="bg-[#222] text-white rounded-2xl px-3.5 py-2.5 text-sm whitespace-nowrap shadow-xl">
        {text}
      </div>
      <div className="flex justify-center -mt-1.5">
        <div className="w-3 h-3 bg-[#222] rotate-45" />
      </div>
    </div>,
    document.body
  ) : null

  return (
    <div
      ref={anchorRef}
      className="inline-flex items-center"
      onMouseEnter={handleEnter}
      onMouseLeave={() => setOpen(false)}
    >
      <InfoOutlinedIcon sx={{ fontSize: 14, color: "#9CA3AF" }} className="cursor-default" />
      {tooltip}
    </div>
  )
}
