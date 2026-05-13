export type UserTag = "vendedor" | "liderança" | "agente_de_suporte";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  password: string;
  tag: UserTag;
}

export const MOCK_USERS: MockUser[] = [
  {
    id: "1",
    name: "Carlos Vendas",
    email: "carlos@vcommerce.com",
    password: "vendedor123",
    tag: "vendedor",
  },
  {
    id: "2",
    name: "Ana Liderança",
    email: "ana@vcommerce.com",
    password: "lideranca123",
    tag: "liderança",
  },
  {
    id: "3",
    name: "Pedro Suporte",
    email: "pedro@vcommerce.com",
    password: "suporte123",
    tag: "agente_de_suporte",
  },
];

export function authenticateUser(email: string, password: string): MockUser | null {
  return MOCK_USERS.find((u) => u.email === email && u.password === password) ?? null;
}
