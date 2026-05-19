import { useRef, useState, useCallback, useEffect } from "react"
import { ChevronRight as ChevronRightIcon, ChevronLeft as ChevronLeftIcon } from "@mui/icons-material"
import { cn } from "@/lib/utils"

interface HorizontalScrollProps {
  children: React.ReactNode
  className?: string
  scrollStep?: number
}

export function HorizontalScroll({
  children,
  className,
  scrollStep = 240,
}: HorizontalScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)

  //atualiza se tem conteúdo à esquerda
  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
  }, [])

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    el?.addEventListener("scroll", checkScroll)
    window.addEventListener("resize", checkScroll)
    return () => {
      el?.removeEventListener("scroll", checkScroll)
      window.removeEventListener("resize", checkScroll)
    }
  }, [checkScroll])

  const handleScrollRight = () =>
    scrollRef.current?.scrollBy({ left: scrollStep, behavior: "smooth" })

  const handleScrollLeft = () =>
    scrollRef.current?.scrollBy({ left: -scrollStep, behavior: "smooth" })

  const btnClass = `
    absolute top-1/2 -translate-y-1/2
    w-7 h-7 flex items-center justify-center
    rounded-lg bg-[#EDE9FE] border border-[#DDD6FE]
    text-[#7C3AED] hover:bg-[#DDD6FE]
    transition-all z-10
  `

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className={cn(
          "flex overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          className
        )}
      >
        {children}
      </div>

      {/* seta esquerda */} // Só aparece se houver conteúdo à esquerda
      {canScrollLeft && (
        <button onClick={handleScrollLeft} aria-label="Ver anterior" className={`${btnClass} left-0`}>
          <ChevronLeftIcon sx={{ fontSize: 16 }} />
        </button>
      )}

      {/* seta direita */} //sempre visível
      <button onClick={handleScrollRight} aria-label="Ver mais" className={`${btnClass} right-0`}>
        <ChevronRightIcon sx={{ fontSize: 16 }} />
      </button>
    </div>
  )
}