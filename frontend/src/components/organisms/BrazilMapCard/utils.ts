export const COLOR_LOW:  [number, number, number] = [220, 252, 231]
export const COLOR_HIGH: [number, number, number] = [20, 83, 45]
export const COLOR_EMPTY = "#e5e7eb"

export function lerpColor(
  from: [number, number, number],
  to:   [number, number, number],
  t: number,
): string {
  const r = Math.round(from[0] + t * (to[0] - from[0]))
  const g = Math.round(from[1] + t * (to[1] - from[1]))
  const b = Math.round(from[2] + t * (to[2] - from[2]))
  return `rgb(${r},${g},${b})`
}

export function getStateColor(value: number | undefined, min: number, max: number): string {
  if (!value || max === min) return COLOR_EMPTY
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
  return lerpColor(COLOR_LOW, COLOR_HIGH, t)
}

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `R$ ${(value / 1_000).toFixed(0)}K`
  return `R$ ${value}`
}
