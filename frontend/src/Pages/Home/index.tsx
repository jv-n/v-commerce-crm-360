import { useState } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { MOCKED_SHORTCUTS } from "@/lib/mocks/home"
import type { ShortcutItem } from "@/types/home"
import MentionInput, { type MentionInputHandle } from "@/components/molecules/MentionInput"
import { useRef } from "react"
import {
  ContactPage as ContactPageIcon,
  ContactPageOutlined as ContactPageOutlinedIcon,     
  ConfirmationNumber as ConfirmationNumberIcon,
  ConfirmationNumberOutlined as ConfirmationNumberOutlinedIcon,
  BarChart as BarChartIcon,
  BarChartOutlined as BarChartOutlinedIcon,     
  RequestQuote as RequestQuoteIcon,
  RequestQuoteOutlined as RequestQuoteOutlinedIcon,  
  Inventory2Outlined as Inventory2OutlinedIcon,
  MenuBook as MenuBookIcon,
  MenuBookOutlined as MenuBookOutlinedIcon,

  FlagOutlined,
} from "@mui/icons-material"
import { useAuth } from "@/contexts/auth/useAuth"

//ícones 

const ICON_MAP: Record<string, React.ElementType> = {
  ContactPage:        ContactPageOutlinedIcon,
  ConfirmationNumber: ConfirmationNumberOutlinedIcon,
  BarChart:           BarChartOutlinedIcon,
  RequestQuote:       RequestQuoteOutlinedIcon,
  Inventory2Outlined: Inventory2OutlinedIcon,
  MenuBook:           MenuBookOutlinedIcon,
}

function formatDate(date: Date): string {
  const weekdays = [
    "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
    "Quinta-feira", "Sexta-feira", "Sábado",
  ]
  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ]
  return `${weekdays[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`
}


function ShortcutCard({
  shortcut,
  onClick,
}: {
  shortcut: ShortcutItem
  onClick: () => void
}) {
  const IconComponent = ICON_MAP[shortcut.icon]

  return (
    <button
      onClick={onClick}
      className="
        flex flex-col items-center justify-center gap-3
        border-[3px] border-[#3FFF24] rounded-xl
        py-8 px-4
        shadow-md
        hover:bg-[#f0fdf4] active:scale-95
        transition-all duration-150
      "
    >
      {IconComponent && (
        <IconComponent sx={{ fontSize: 60, color: "#3FFF24" }} />
      )}
      <span className="text-[24px] font-semibold text-[#3FFF24]">
        {shortcut.label}
      </span>
    </button>
  )
}

//page

export default function Home() {
  const [aiQuery, setAiQuery] = useState("")
  const navigate = useNavigate()
  const { onOpenAI } = useOutletContext<{ onOpenAI: (message?: string) => void }>()

  const { user } = useAuth()
  const today = new Date()
  const mentionInputRef = useRef<MentionInputHandle>(null)

const userFirstName = () => {
  if(!user) return "Usuário Não Identificado"
  const index = user.name.indexOf(" ")
  return user.name.slice(0, index)
}

  return (
    <div className="relative px-6 py-5 h-full flex flex-col gap-5 bg-white min-h-full rounded-xl overflow-y-auto">

      {/* ── Header ── */}
      <div>
        <p className="text-[12px] text-gray-500">{formatDate(today)}</p>
        <h1 className="text-[40px] font-bold text-gray-900 mt-0.5 leading-tight">
          Bem-vindo ao V-Commerce CRM 360, {userFirstName()}.
        </h1>
      </div>

      <div className="w-full py-4">
        <div className="flex items-center gap-2 mb-1">
          <img src="/v_ai.svg" alt="Assistente de IA" className="w-8 h-8" />
          <span className="text-[24px] font-bold text-gray-900">
            Assistente de IA
          </span>
        </div>
        <p className="text-[12px] text-gray-900 mb-3 leading-relaxed">
          Agente para assistência e informações sobre dados com o sistema.
          Realize a interação através de textos no campo abaixo ou acesse o
          botão no menu lateral para expandir o assistente.
        </p>
        <MentionInput
          ref={mentionInputRef}
          onSend={(text) => {
            if (text.trim()) {
              onOpenAI(text)
              mentionInputRef.current?.clear()
            }
          }}
        />
      </div>
      <div className="flex items-center gap-2 mb-1">
        <FlagOutlined sx={{ width: 30, height: 30, color: "#374151" }} />
        <h2 className="text-[24px] font-bold text-gray-900">Funções do sistema</h2>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {MOCKED_SHORTCUTS.map((shortcut) => (
          <ShortcutCard
            key={shortcut.id}
            shortcut={shortcut}
            onClick={() => navigate(shortcut.route)}
          />
        ))}
      </div>

    </div>
  )
}