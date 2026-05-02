import { cn } from "@/lib/utils"

interface ContactAvatarProps {
  initials: string
  bgColor: string
  className?: string
}

export function ContactAvatar({ initials, bgColor, className }: ContactAvatarProps) {
  return (
    <div
      className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0",
        className
      )}
      style={{ backgroundColor: bgColor }}
    >
      {initials}
    </div>
  )
}
