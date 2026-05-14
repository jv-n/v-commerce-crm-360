import { useState } from "react"
import { cn } from "@/lib/utils"
import type { Product } from "@/types/product"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"

const BR_REGIONS: Record<string, string[]> = {
  "Norte":        ["Acre", "Amapá", "Amazonas", "Pará", "Rondônia", "Roraima", "Tocantins"],
  "Nordeste":     ["Alagoas", "Bahia", "Ceará", "Maranhão", "Paraíba", "Pernambuco", "Piauí", "Rio Grande do Norte", "Sergipe"],
  "Centro-Oeste": ["Distrito Federal", "Goiás", "Mato Grosso", "Mato Grosso do Sul"],
  "Sudeste":      ["Espírito Santo", "Minas Gerais", "Rio de Janeiro", "São Paulo"],
  "Sul":          ["Paraná", "Rio Grande do Sul", "Santa Catarina"],
}

export function GroupedUFDropdown({
  products,
  selected,
  onSelect,
}: {
  products: Product[]
  selected: string | null
  onSelect: (uf: string) => void
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const ufsWithProducts = new Set(products.map(p => p.uf).filter(Boolean))
  const availableRegions: Record<string, string[]> = Object.fromEntries(
    Object.entries(BR_REGIONS)
      .map(([region, states]): [string, string[]] => [region, states.filter(s => ufsWithProducts.has(s))])
      .filter(([, states]) => states.length > 0)
  )

  const toggle = (region: string) =>
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(region) ? next.delete(region) : next.add(region)
      return next
    })

  return (
    <div className="w-full py-1 max-h-72 overflow-y-auto">
      {Object.entries(availableRegions).map(([region, ufs]) => {
        const isOpen = !collapsed.has(region)
        return (
          <div key={region}>
            <button
              onClick={() => toggle(region)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
            >
              {region}
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: 14,
                  transform: isOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.15s",
                }}
              />
            </button>

            {isOpen && ufs.map(uf => (
              <button
                key={uf}
                onClick={() => onSelect(uf)}
                className={cn(
                  "w-full text-left pl-6 pr-3 py-1.5 text-sm text-gray-900 hover:bg-gray-50 transition-colors",
                  selected === uf && "bg-purple-50 text-purple-700 font-medium"
                )}
              >
                {uf}
              </button>
            ))}
          </div>
        )
      })}
    </div>
  )
}
