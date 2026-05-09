import type { Ticket } from "@/types/ticket"

export const mockTickets: Ticket[] = [
  {
    id: "33d4eede-c2c6-52...",
    client: "Alexandra Burat Bor...",
    orderId: "810622ab-1...",
    responsible: {
      initials: "LF",
      name: "Luana Ferragut",
    },
    problem: "Produto",
    status: "Finalizado",
    evaluation: {
      label: "Solucionado",
      score: 5,
    },
  },
  {
    id: "33d4eede-c2c6-52...",
    client: "Alexandra Burat Bor...",
    orderId: "810622ab-1...",
    responsible: {
      initials: "LF",
      name: "Luana Ferragut",
    },
    problem: "Entrega",
    status: "Finalizado",
    evaluation: {
      label: "Não Solucionado",
      score: 1,
    },
  },
  {
    id: "33d4eede-c2c6-52...",
    client: "Alexandra Burat Bor...",
    orderId: "810622ab-1...",
    responsible: {
      initials: "LF",
      name: "Luana Ferragut",
    },
    problem: "Pagamento",
    status: "Em atendimento",
    evaluation: {
      label: "Sem avaliação",
    },
  },
  {
    id: "33d4eede-c2c6-52...",
    client: "Alexandra Burat Bor...",
    orderId: "810622ab-1...",
    responsible: {
      initials: "LF",
      name: "Luana Ferragut",
    },
    problem: "Produto",
    status: "Aguardando",
    evaluation: {
      label: "Sem avaliação",
    },
  },
  {
    id: "33d4eede-c2c6-52...",
    client: "Alexandra Burat Bor...",
    orderId: "810622ab-1...",
    responsible: {
      initials: "LF",
      name: "Luana Ferragut",
    },
    problem: "Reembolso",
    status: "Em atendimento",
    evaluation: {
      label: "Sem avaliação",
    },
  },
  {
    id: "33d4eede-c2c6-52...",
    client: "Alexandra Burat Bor...",
    orderId: "810622ab-1...",
    responsible: {
      initials: "LF",
      name: "Luana Ferragut",
    },
    problem: "Entrega",
    status: "Finalizado",
    evaluation: {
      label: "Não respondido",
    },
  },
]