import AddIcon from "@mui/icons-material/Add"
import LinkIcon from "@mui/icons-material/Link"
import CheckIcon from "@mui/icons-material/Check"

import { cn } from "@/lib/utils"
import type { Ticket } from "@/types/ticket"

function parseDateTime(value?: string) {
  if (!value) return null

  const normalizedValue = value.replace(" ", "T")
  const date = new Date(normalizedValue)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function formatTicketDateTime(value?: string) {
  const date = parseDateTime(value)

  if (!date) return value || "-"

  const datePart = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)

  const timePart = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)

  return `${datePart} ${timePart}`
}

type TimelineEntry = {
  type: "created" | "linked" | "finished"
  time: string
}

function getTimeline(ticket: Ticket): TimelineEntry[] {
  const timeline: TimelineEntry[] = []

  if (ticket.status === "Finalizado") {
    timeline.push({
      type: "finished",
      time: ticket.openedAt,
    })
  }

  timeline.push({
    type: "linked",
    time: ticket.openedAt,
  })

  timeline.push({
    type: "created",
    time: ticket.openedAt,
  })

  return timeline
}

export function TicketExpandedRow({ ticket }: { ticket: Ticket }) {
  const timeline = getTimeline(ticket)

  return (
    <div className="bg-white px-8 py-5 border-t border-violet-100">
      <div className="flex flex-col">
        {timeline.map((entry, index) => {
          const isCreated = entry.type === "created"
          const isLinked = entry.type === "linked"
          const isFinished = entry.type === "finished"

          return (
            <div key={`${entry.type}-${index}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                    isCreated
                      ? "border-2 border-dashed border-violet-200 bg-transparent"
                      : "bg-[#F0DDFD]"
                  )}
                >
                  {isCreated && (
                    <AddIcon sx={{ fontSize: 13, color: "#9F83B2" }} />
                  )}

                  {isLinked && (
                    <LinkIcon sx={{ fontSize: 13, color: "#9F83B2" }} />
                  )}

                  {isFinished && (
                    <CheckIcon sx={{ fontSize: 14, color: "#9F83B2" }} />
                  )}
                </div>

                {index < timeline.length - 1 && (
                  <div className="my-1 w-px flex-1 bg-[#9F83B2]" />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1 pb-6 text-sm">
                {isCreated && (
                  <>
                    <span className="font-semibold text-gray-800">
                      {ticket.client}
                    </span>
                    <span className="text-gray-500">abriu o</span>
                    <span className="font-medium text-violet-600">
                      ticket
                    </span>
                  </>
                )}

                {isLinked && (
                  <>
                    <span className="font-semibold text-gray-800">
                      {ticket.responsible.name}
                    </span>
                    <span className="text-gray-500">
                      foi linkado como responsável pelo
                    </span>
                    <span className="font-medium text-violet-600">
                      ticket
                    </span>
                  </>
                )}

                {isFinished && (
                  <>
                    <span className="font-semibold text-gray-800">
                      {ticket.responsible.name}
                    </span>
                    <span className="text-gray-500">marcou o</span>
                    <span className="font-medium text-violet-600">
                      ticket
                    </span>
                    <span className="text-gray-500">como</span>
                    <span className="rounded bg-green-50 px-1.5 py-0.5 text-xs font-semibold text-green-600">
                      Finalizado
                    </span>
                  </>
                )}

                <span className="ml-0.5 text-xs text-gray-400">
                  - {formatTicketDateTime(entry.time)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}