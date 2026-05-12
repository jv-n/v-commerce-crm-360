import { createContext, useContext, useState, type ReactNode } from "react";
import { authenticateUser, type MockUser } from "@/lib/mockUsers";

interface AuthContextValue {
  user: MockUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(() => {
    const stored = sessionStorage.getItem("crm_user");
    return stored ? (JSON.parse(stored) as MockUser) : null;
  });

  function login(email: string, password: string): boolean {
    const found = authenticateUser(email, password);
    if (found) {
      setUser(found);
      sessionStorage.setItem("crm_user", JSON.stringify(found));
      return true;
    }
    return false;
  }

  function logout() {
    setUser(null);
    sessionStorage.removeItem("crm_user");
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
