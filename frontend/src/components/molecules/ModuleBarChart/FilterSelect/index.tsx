import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import { useEffect, useRef, useState } from 'react';
import { fetchProducts } from "@/lib/api/products";
import type { Product, ProductCategory } from "@/types/product";

type PeriodOption = "ALL" | "3" | "6" | "12"
export type GranularityOption = "ALL" | "CATEGORY" | "PRODUCT"

const ALL_CATEGORIES: ProductCategory[] = [
    "Automotivo", "Beleza", "Brinquedos", "Casa",
    "Eletronicos", "Esportes", "Indefinida", "Moveis", "Vestuario",
]

function SubSearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div className="px-1.5 pb-1">
            <input
                autoFocus
                value={value}
                onChange={e => onChange(e.target.value)}
                onKeyDown={e => e.stopPropagation()}
                placeholder="Buscar..."
                className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
            />
        </div>
    )
}

function CategorySubMenu({
    selected,
    onToggle,
}: {
    selected: ProductCategory[]
    onToggle: (c: ProductCategory) => void
}) {
    const [search, setSearch] = useState("")
    const filtered = ALL_CATEGORIES.filter(c =>
        c.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>Por categoria</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
                <DropdownMenuLabel>Categorias</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <SubSearchInput value={search} onChange={setSearch} />
                <div className="max-h-48 overflow-y-auto">
                    {filtered.map(cat => (
                        <DropdownMenuCheckboxItem
                            key={cat}
                            checked={selected.includes(cat)}
                            onCheckedChange={() => onToggle(cat)}
                            onSelect={e => e.preventDefault()}
                        >
                            {cat}
                        </DropdownMenuCheckboxItem>
                    ))}
                    {filtered.length === 0 && (
                        <p className="px-2 py-1 text-xs text-muted-foreground">Nenhum resultado</p>
                    )}
                </div>
            </DropdownMenuSubContent>
        </DropdownMenuSub>
    )
}

function ProductSubMenu({
    selected,
    onToggle,
}: {
    selected: Product[]
    onToggle: (p: Product) => void
}) {
    const [search, setSearch] = useState("")
    const [results, setResults] = useState<Product[]>([])
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(async () => {
            if (!search.trim()) { setResults([]); return }
            try {
                const page = await fetchProducts({ search, pageSize: 15 })
                setResults(page.data)
            } catch {
                setResults([])
            }
        }, 300)
        return () => { if (timer.current) clearTimeout(timer.current) }
    }, [search])

    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>Por produto</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56">
                <DropdownMenuLabel>Produtos</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <SubSearchInput value={search} onChange={setSearch} />
                <div className="max-h-48 overflow-y-auto">
                    {selected.map(p => (
                        <DropdownMenuCheckboxItem
                            key={`sel-${p.id}`}
                            checked
                            onCheckedChange={() => onToggle(p)}
                            onSelect={e => e.preventDefault()}
                        >
                            {p.name}
                        </DropdownMenuCheckboxItem>
                    ))}
                    {results
                        .filter(r => !selected.some(s => s.id === r.id))
                        .map(p => (
                            <DropdownMenuCheckboxItem
                                key={p.id}
                                checked={false}
                                onCheckedChange={() => onToggle(p)}
                                onSelect={e => e.preventDefault()}
                            >
                                {p.name}
                            </DropdownMenuCheckboxItem>
                        ))
                    }
                    {search.trim() && results.length === 0 && (
                        <p className="px-2 py-1 text-xs text-muted-foreground">Nenhum resultado</p>
                    )}
                    {!search.trim() && selected.length === 0 && (
                        <p className="px-2 py-1 text-xs text-muted-foreground">Digite para buscar</p>
                    )}
                </div>
            </DropdownMenuSubContent>
        </DropdownMenuSub>
    )
}

export type FilterSelectProps = {
   Options: {
    value: PeriodOption
    label: string
   }[]
}

export type FilterSelectTypeProps = {
    Options: {
        value: GranularityOption
        label: string
    }[]
}

export function FilterSelectType(props: FilterSelectTypeProps) {
    const [granularity, setGranularity] = useState<GranularityOption>("ALL")
    const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>([])
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
    const [open, setOpen] = useState(false)

    const toggleCategory = (c: ProductCategory) =>
        setSelectedCategories(prev =>
            prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
        )

    const toggleProduct = (p: Product) =>
        setSelectedProducts(prev =>
            prev.some(x => x.id === p.id) ? prev.filter(x => x.id !== p.id) : [...prev, p]
        )

    const label = () => {
        if (granularity === "CATEGORY" && selectedCategories.length > 0)
            return `Categorias (${selectedCategories.length})`
        if (granularity === "PRODUCT" && selectedProducts.length > 0)
            return `Produtos (${selectedProducts.length})`
        return props.Options.find(o => o.value === granularity)?.label ?? "Todos"
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button className="bg-[#E7DEED] rounded-md transition hover:bg-[#D0C5D6] p-1 text-black text-xs flex items-center gap-1">
                    {label()}
                    <KeyboardArrowDownOutlinedIcon
                        fontSize="small"
                        className={`transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
                    />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                    <DropdownMenuLabel>Granularidade</DropdownMenuLabel>
                    <DropdownMenuItem
                        className={granularity === "ALL" ? "font-semibold bg-[#EDE5F2]" : ""}
                        onSelect={() => { setGranularity("ALL"); setSelectedCategories([]); setSelectedProducts([]) }}
                    >
                        Todos
                    </DropdownMenuItem>
                    <CategorySubMenu
                        selected={selectedCategories}
                        onToggle={cat => { setGranularity("CATEGORY"); toggleCategory(cat) }}
                    />
                    <ProductSubMenu
                        selected={selectedProducts}
                        onToggle={prod => { setGranularity("PRODUCT"); toggleProduct(prod) }}
                    />
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export function FilterSelectPeriod(props: FilterSelectProps){
    const [graph_period, setGraphPeriod] = useState<PeriodOption>("ALL")
    const [open, setOpen] = useState(false)

    const graph_period_show = () => {
        return props.Options.find(o => o.value === graph_period)?.label ?? "Todo o período"
    }
    return(
        <DropdownMenu open={open} onOpenChange={setOpen}>
                    <DropdownMenuTrigger asChild>
                        <button className="bg-[#E7DEED] rounded-md transition hover:bg-[#D0C5D6] p-1 text-black text-xs flex items-center gap-1">
                            {graph_period_show()}
                            <KeyboardArrowDownOutlinedIcon
                                fontSize="small"
                                className={`transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
                            />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>Período</DropdownMenuLabel>
                            {props.Options.map(option => (
                                <DropdownMenuItem
                                    key={option.value}
                                    className={graph_period === option.value ? "font-semibold bg-[#EDE5F2]" : ""}
                                    onSelect={() => setGraphPeriod(option.value)}
                                >
                                    {option.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
    )
}