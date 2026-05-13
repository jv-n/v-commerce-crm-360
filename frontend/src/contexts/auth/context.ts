import { createContext } from "react";
import type { AuthUser } from "@/lib/api/auth";

export interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
