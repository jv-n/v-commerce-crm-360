import type { Meeting, Task, LearningContent } from "@/types/home"

export const MOCKED_MEETINGS: Meeting[] = [
  {
    id: 1,
    title: "Reunião com equipe comercial",
    description: "Alinhar necessidades da plataforma",
    time: "16:00 - 17:00",
    location: "Remoto",
    day: "hoje",
  },
  {
    id: 2,
    title: "Título",
    description: "Objetivo",
    time: "16:00 - 17:00",
    location: "Remoto",
    day: "hoje",
  },
  {
    id: 3,
    title: "Título",
    description: "Objetivo",
    time: "16:00 - 17:00",
    location: "Remoto",
    day: "amanha",
  },
  {
    id: 4,
    title: "Reunião com equipe comercial",
    description: "Alinhar necessidades da plataforma",
    time: "16:00 - 17:00",
    location: "Remoto",
    day: "amanha",
  },
]

export const MOCKED_TASKS: Task[] = [
  {
    id: 1,
    title: "Atualizar produto",
    description: "Atualizar produto de ID 13467",
    dueDate: "29/04/2026",
    status: "nao_iniciada",
  },
  {
    id: 2,
    title: "Atualizar produto",
    description: "Atualizar produto de ID 13467",
    dueDate: "30/04/2026",
    status: "em_andamento",
  },
  {
    id: 3,
    title: "Atualizar produto",
    description: "Atualizar produto de ID 13467",
    dueDate: "30/04/2026",
    status: "atrasada",
  },
  {
    id: 4,
    title: "Atualizar produto",
    description: "Atualizar produto de ID 13467",
    dueDate: "30/04/2026",
    status: "atrasada",
  },
]

export const MOCKED_LEARNING: LearningContent[] = [
  {
    id: 1,
    duration: "Cerca de 5 minutos",
    title: "Criando contato",
    description: "Veja como criar um contato com todas as informações essenciais.",
  },
  {
    id: 2,
    duration: "Cerca de 5 minutos",
    title: "Criando contato",
    description: "Veja como criar um contato com todas as informações essenciais.",
  },
  {
    id: 3,
    duration: "Cerca de 5 minutos",
    title: "Criando contato",
    description: "Veja como criar um contato com todas as informações essenciais.",
  },
]