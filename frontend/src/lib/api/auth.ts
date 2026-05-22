const TOKEN_KEY = "crm_token_v360"
const USER_KEY = "crm_user_v360"

export interface AuthUser{
    id: number
    name: string
    email: string
    role: string
}

interface LoginResponse {
    access_token: string
    token_type: string
    user: AuthUser
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
    const res = await fetch("/api/auth/login",{
        method: "POST",
        headers: {"Content-Type": "application/json" },
        body: JSON.stringify({email, password})
    })

    if(!res.ok){
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail ?? "Email ou senha incorretos.")
    }
    const data: LoginResponse = await res.json()

    sessionStorage.setItem(TOKEN_KEY, data.access_token)
    sessionStorage.setItem(USER_KEY, JSON.stringify(data.user))
    return data.user
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): AuthUser | null {
  const raw = sessionStorage.getItem(USER_KEY)
  return raw ? (JSON.parse(raw) as AuthUser) : null
}

export function clearSession(): void {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}