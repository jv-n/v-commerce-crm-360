export type MeetingDay = "hoje" | "amanha"

export interface Meeting {
  id: number
  title: string
  description: string
  time: string
  location: string
  day: MeetingDay
}

export type TaskStatus = "nao_iniciada" | "em_andamento" | "atrasada"

export interface Task {
  id: number
  title: string
  description: string
  dueDate: string
  status: TaskStatus
}

export interface LearningContent {
  id: number
  duration: string
  title: string
  description: string
}