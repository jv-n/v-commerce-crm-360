import { useState } from "react"
import { cn } from "@/lib/utils"
import { HorizontalScroll } from "@/components/atoms/horizontal-scroll.tsx"
import { MOCKED_MEETINGS, MOCKED_TASKS, MOCKED_LEARNING } from "@/lib/mocks/home.ts"
import type { Meeting, Task, LearningContent, TaskStatus } from "@/types/home.ts"
import {
  Add as AddIcon,
  AccessTime as ClockIcon,
  Computer as ComputerIcon,
  Edit as EditIcon,
  CalendarToday as CalendarIcon,
  CheckBoxOutlineBlank as CheckIcon,
  School as SchoolIcon,
} from "@mui/icons-material"
import { FiAlertTriangle } from "react-icons/fi"


const taskStatusConfig: Record<
  TaskStatus,
  { label: string; dotColor: string; textColor: string; bgColor: string }
> = {
  nao_iniciada: {
    label: "Não iniciada",
    dotColor: "bg-blue-400",
    textColor: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  em_andamento: {
    label: "Em andamento",
    dotColor: "bg-orange-400",
    textColor: "text-orange-500",
    bgColor: "bg-orange-50",
  },
  atrasada: {
    label: "Atrasada",
    dotColor: "bg-red-400",
    textColor: "text-red-500",
    bgColor: "bg-red-50",
  },
}


function formatDate(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`
}

//Cards

function MeetingCard({ meeting }: { meeting: Meeting }) {
  return (
    <div className="relative bg-white border border-gray-200 rounded-lg p-3 w-[230px] flex-shrink-0 hover:shadow-sm transition-shadow">
      <button className="absolute top-2.5 right-2.5 text-gray-400 hover:text-gray-600 transition-colors">
        <EditIcon sx={{ fontSize: 15 }} />
      </button>
      <h3 className="text-[13px] font-semibold text-gray-900 pr-5 leading-tight line-clamp-2">
        {meeting.title}
      </h3>
      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
        {meeting.description}
      </p>
      <div className="flex items-center gap-1 mt-3 text-[11px] text-gray-600">
        <ClockIcon sx={{ fontSize: 13 }} />
        <span>{meeting.time}</span>
      </div>
      <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-600">
        <ComputerIcon sx={{ fontSize: 13 }} />
        <span className="font-bold">{meeting.location}</span>
      </div>
      
    </div>
  )
}

function TaskCard({ task }: { task: Task }) {
  const config = taskStatusConfig[task.status]

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg p-3 w-[260px] flex-shrink-0 hover:shadow-sm transition-shadow">
      <button className="absolute top-2.5 right-2.5 text-gray-400 hover:text-gray-600 transition-colors">
        <EditIcon sx={{ fontSize: 15 }} />
      </button>

      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full mb-2",
          config.textColor,
          config.bgColor
        )}
      >
        {task.status === "atrasada" ? (
          <FiAlertTriangle size={10} />
        ) : (
          <span className={cn("w-1.5 h-1.5 rounded-full", config.dotColor)} />
        )}
        {config.label}
      </span>

      <h3 className="text-[13px] font-semibold text-gray-900 pr-5">
        {task.title}
      </h3>
      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
        {task.description}
      </p>
      <div className="flex items-center gap-1 mt-3 text-[11px] text-gray-600">
        <CheckIcon sx={{ fontSize: 13 }} />
        <span className="font-bold">Até dia {task.dueDate}</span>
      </div>
    </div>
  )
}

function LearningCard({ content }: { content: LearningContent }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 w-[260px] flex-shrink-0 flex flex-col hover:shadow-sm transition-shadow">
      <p className="text-[10px] text-gray-400 mb-2">{content.duration}</p>
      <h3 className="text-[14px] font-bold text-gray-900">{content.title}</h3>
      <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed flex-1">
        {content.description}
      </p>
      <button className="mt-4 w-full text-[11px] font-medium text-gray-700 bg-[#F3E8FF] rounded-lg py-1.5 hover:bg-[#EDD9FF] transition-colors">
        Acessar conteúdo
      </button>
    </div>
  )
}


export default function Home() {
  const [aiQuery, setAiQuery] = useState("")

  const today    = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const weekdays = [
    "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
    "Quinta-feira", "Sexta-feira", "Sábado",
  ]
  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ]

  const dateLabel = `${weekdays[today.getDay()]}, ${today.getDate()} de ${months[today.getMonth()]} de ${today.getFullYear()}`

  const todayMeetings    = MOCKED_MEETINGS.filter((m) => m.day === "hoje")
  const tomorrowMeetings = MOCKED_MEETINGS.filter((m) => m.day === "amanha")

  return (
    <div className="relative px-6 py-5 h-full flex flex-col gap-5 bg-white min-h-full rounded-xl overflow-y-auto">

      <div>
        <p className="text-[12px] text-gray-500">{dateLabel}</p>
        <h1 className="text-[24px] font-bold text-gray-900 mt-0.5 leading-tight">
          Bem-vindo ao V-Commerce CRM 360, Sérgio.
        </h1>
      </div>

      <div className="border border-dashed border-[#A855F7] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <img src="/v_ai.svg" alt="Assistente de IA" className="w-4 h-4" />
          <span className="text-[13px] font-semibold text-gray-900">
            Assistente de IA
          </span>
        </div>
        <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
          Agente para assistência e informações sobre dados com o sistema.
          Realize a interação através de textos no campo abaixo ou acesse o
          botão no menu lateral para expandir o assistente.
        </p>
        <input
          type="text"
          value={aiQuery}
          onChange={(e) => setAiQuery(e.target.value)}
          placeholder="Consulte informações sobre o sistema..."
          className="w-full text-[12px] text-gray-700 border border-[#4ADE80] rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#4ADE80] placeholder:text-gray-300 bg-transparent"
        />
      </div>

      <section>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CalendarIcon sx={{ fontSize: 16, color: "#374151" }} />
            <h2 className="text-[14px] font-bold text-gray-900">Reuniões</h2>
          </div>
          <button className="text-gray-400 hover:text-gray-700 transition-colors">
            <AddIcon sx={{ fontSize: 20 }} />
          </button>
        </div>

        <HorizontalScroll>

          <div className="flex flex-col flex-shrink-0">
            <span className="text-[11px] text-gray-500 mb-2">
              Hoje - {formatDate(today)}
            </span>
            <div className="flex gap-3">
              {todayMeetings.map((m) => <MeetingCard key={m.id} meeting={m} />)}
            </div>
          </div>

          <div className="w-px bg-gray-200 self-stretch flex-shrink-0 mx-4" />

          <div className="flex flex-col flex-shrink-0">
            <span className="text-[11px] text-gray-500 mb-2">
              Amanhã - {formatDate(tomorrow)}
            </span>
            <div className="flex gap-3">
              {tomorrowMeetings.map((m) => <MeetingCard key={m.id} meeting={m} />)}
            </div>
          </div>
        </HorizontalScroll>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
              <rect x="4" y="0"  width="12" height="2" rx="1" fill="#374151" />
              <rect x="4" y="6"  width="12" height="2" rx="1" fill="#374151" />
              <rect x="4" y="12" width="12" height="2" rx="1" fill="#374151" />
              <rect x="0" y="0"  width="2"  height="2" rx="1" fill="#374151" />
              <rect x="0" y="6"  width="2"  height="2" rx="1" fill="#374151" />
              <rect x="0" y="12" width="2"  height="2" rx="1" fill="#374151" />
            </svg>
            <h2 className="text-[14px] font-bold text-gray-900">Tarefas</h2>
          </div>
          <button className="text-gray-400 hover:text-gray-700 transition-colors">
            <AddIcon sx={{ fontSize: 20 }} />
          </button>
        </div>

        <HorizontalScroll className="gap-3">
          {MOCKED_TASKS.map((task) => <TaskCard key={task.id} task={task} />)}
        </HorizontalScroll>
      </section>

      <section className="pb-4">
        <div className="flex items-center gap-2 mb-2">
          <SchoolIcon sx={{ fontSize: 16, color: "#374151" }} />
          <h2 className="text-[14px] font-bold text-gray-900">
            Aprenda a utilizar a plataforma
          </h2>
        </div>

        <div className="mb-4">
          <p className="text-[11px] text-gray-500 mb-1">
            Progresso do V-Academy:{" "}
            <span className="font-bold text-gray-900">20%</span>
          </p>
          <div className="w-full max-w-xs bg-gray-200 rounded-full h-[3px]">
            <div className="bg-gray-700 h-[3px] rounded-full" style={{ width: "20%" }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">2/9 Conteúdos concluídos</p>
        </div>

        <HorizontalScroll className="gap-3">
          {MOCKED_LEARNING.map((c) => <LearningCard key={c.id} content={c} />)}
        </HorizontalScroll>
      </section>
    </div>
  )
}