import { useState, type ReactNode } from "react";
import { getStoredUser, loginUser, type AuthUser } from "@/lib/api/auth";
import { clearSession } from "@/lib/api/auth";
import { AuthContext } from "./context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);

  async function login(email: string, password: string): Promise<void> {
    const authUser = await loginUser(email, password);
    setUser(authUser);
  }
  function logout() {
    setUser(null);
    clearSession();
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}