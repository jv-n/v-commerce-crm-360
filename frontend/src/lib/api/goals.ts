import type { Goal } from "@/types/home"
import { getToken } from "@/lib/api/auth"

function authHeaders(): HeadersInit {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

interface GoalRecord {
  id:           string
  kind:         string
  label:        string
  target:       number
  current:      number
  product_id?:  string | null
  product_name?: string | null
  category?:    string | null
}

function toGoal(r: GoalRecord): Goal {
  return {
    id:          r.id,
    kind:        r.kind as Goal["kind"],
    label:       r.label,
    target:      r.target,
    current:     r.current,
    productId:   r.product_id,
    productName: r.product_name,
    category:    r.category,
  }
}

export async function fetchGoals(): Promise<Goal[]> {
  const res = await fetch("/api/goals/", { headers: authHeaders() })
  if (!res.ok) throw new Error("Failed to fetch goals")
  const data: GoalRecord[] = await res.json()
  return data.map(toGoal)
}

export async function saveGoal(goal: Omit<Goal, "id" | "current">): Promise<Goal> {
  const body = {
    kind:         goal.kind,
    label:        goal.label,
    target:       goal.target,
    product_id:   goal.productId ?? null,
    product_name: goal.productName ?? null,
    category:     goal.category ?? null,
  }
  const res = await fetch("/api/goals/", {
    method:  "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body:    JSON.stringify(body),
  })
  if (!res.ok) throw new Error("Failed to save goal")
  return toGoal(await res.json())
}

export interface GoalsProgressResult {
  progress: Record<string, number>
  referenceMonth: string   // "YYYY-MM"
}

export async function fetchGoalsProgress(): Promise<GoalsProgressResult> {
  const res = await fetch("/api/goals/progress", { headers: authHeaders() })
  if (!res.ok) throw new Error("Failed to fetch goals progress")
  const data: Record<string, number | string> = await res.json()
  const referenceMonth = (data["_reference_month"] as string) ?? ""
  const progress: Record<string, number> = {}
  for (const [k, v] of Object.entries(data)) {
    if (k !== "_reference_month") progress[k] = v as number
  }
  return { progress, referenceMonth }
}

export async function fetchGoalProgress(id: string): Promise<{ current: number; referenceMonth: string }> {
  const res = await fetch(`/api/goals/${id}/progress`, { headers: authHeaders() })
  if (!res.ok) throw new Error("Failed to fetch goal progress")
  const data: { current: number; reference_month: string } = await res.json()
  return { current: data.current, referenceMonth: data.reference_month }
}

export async function deleteGoal(id: string): Promise<void> {
  await fetch(`/api/goals/${id}`, { method: "DELETE", headers: authHeaders() })
}
