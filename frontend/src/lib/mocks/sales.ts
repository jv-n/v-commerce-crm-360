import type { Sale } from "@/types/sale"

export const mockSales: Sale[] = [
  {
    id: "1",
    product: "Smartphone XYZ",
    client_name: "Marcelle Bizantino Silveira",
    amount: 2000,
    date: "28/04/2026",
    status: "Concluída",
    payment_method: "Cartão de Crédito",
  },
  {
    id: "2",
    product: "Notebook ABC",
    client_name: "Antônio de Araújo Caico",
    amount: 3500,
    date: "16/04/2026",
    status: "Em andamento",
    payment_method: "Boleto Bancário",
  },
  {
    id: "3",
    product: "Fone de Ouvido DEF",
    client_name: "Fernando Fernandes Costa",
    amount: 2999,
    date: "10/11/2025",
    status: "Falha",
    payment_method: "Pix",
  },
  {
    id: "4",
    product: "Smartwatch GHI",
    client_name: "Millena Roitter Bolonha da Silva",
    amount: 900,
    date: "18/02/2026",
    status: "Reembolsada",
    payment_method: "Cartão de Crédito",
  },
  {
    id: "5",
    product: "Tablet JKL",
    client_name: "Fiona Miselle Carvalho",
    amount: 1444,
    date: "09/03/2026",
    status: "Cancelada",
    payment_method: "Boleto Bancário",
  },
]