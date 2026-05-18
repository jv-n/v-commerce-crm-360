import CloseIcon from "@mui/icons-material/Close"
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md"
import {
    DropdownMenu,
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
import { cn } from "@/lib/utils"
import { fetchProducts } from "@/lib/api/products";
import type { Product, ProductCategory } from "@/types/product";

export type GranularityOption = "ALL" | "CATEGORY" | "PRODUCT"

export type GranularityState = {
    granularity: GranularityOption
    category: ProductCategory | null
    product: Product | null
}

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
    onSelect,
}: {
    selected: ProductCategory | null
    onSelect: (c: ProductCategory) => void
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
                        <DropdownMenuItem
                            key={cat}
                            className={selected === cat ? "font-semibold bg-[#EDE5F2]" : ""}
                            onSelect={() => onSelect(cat)}
                        >
                            {cat}
                        </DropdownMenuItem>
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
    onSelect,
}: {
    selected: Product | null
    onSelect: (p: Product) => void
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
                    {results.map(p => (
                        <DropdownMenuItem
                            key={p.id}
                            className={selected?.id === p.id ? "font-semibold bg-[#EDE5F2]" : ""}
                            onSelect={() => onSelect(p)}
                        >
                            {p.name}
                        </DropdownMenuItem>
                    ))}
                    {search.trim() && results.length === 0 && (
                        <p className="px-2 py-1 text-xs text-muted-foreground">Nenhum resultado</p>
                    )}
                    {!search.trim() && (
                        <p className="px-2 py-1 text-xs text-muted-foreground">
                            {selected ? `Selecionado: ${selected.name}` : "Digite para buscar"}
                        </p>
                    )}
                </div>
            </DropdownMenuSubContent>
        </DropdownMenuSub>
    )
}

export type FilterSelectTypeProps = {
    onChange: (state: GranularityState) => void
}

export function FilterSelectType({ onChange }: FilterSelectTypeProps) {
    const [granularity, setGranularity] = useState<GranularityOption>("ALL")
    const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [open, setOpen] = useState(false)

    const handleSelectAll = () => {
        setGranularity("ALL")
        setSelectedCategory(null)
        setSelectedProduct(null)
        onChange({ granularity: "ALL", category: null, product: null })
    }

    const handleSelectCategory = (c: ProductCategory) => {
        setSelectedCategory(c)
        setGranularity("CATEGORY")
        setSelectedProduct(null)
        onChange({ granularity: "CATEGORY", category: c, product: null })
    }

    const handleSelectProduct = (p: Product) => {
        setSelectedProduct(p)
        setGranularity("PRODUCT")
        setSelectedCategory(null)
        onChange({ granularity: "PRODUCT", category: null, product: p })
    }

    const label =
        granularity === "CATEGORY" && selectedCategory
            ? selectedCategory
            : granularity === "PRODUCT" && selectedProduct
            ? selectedProduct.name
            : "Total"

    const isActive = granularity !== "ALL"

    function clearToDefault(e: React.MouseEvent) {
        e.stopPropagation()
        handleSelectAll()
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button className={cn(
                    "flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border transition-colors",
                    isActive
                        ? "bg-purple-100 border-purple-300 text-gray-900 font-medium"
                        : "border-transparent text-gray-900 hover:bg-purple-100 hover:border-purple-300"
                )}>
                    {label}
                    {isActive
                        ? <CloseIcon sx={{ fontSize: 13 }} onClick={clearToDefault} />
                        : open ? <MdKeyboardArrowUp size={14} /> : <MdKeyboardArrowDown size={14} />
                    }
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                    <DropdownMenuLabel>Granularidade</DropdownMenuLabel>
                    <DropdownMenuItem
                        className={granularity === "ALL" ? "font-semibold bg-[#EDE5F2]" : ""}
                        onSelect={handleSelectAll}
                    >
                        Total
                    </DropdownMenuItem>
                    <CategorySubMenu
                        selected={selectedCategory}
                        onSelect={handleSelectCategory}
                    />
                    <ProductSubMenu
                        selected={selectedProduct}
                        onSelect={handleSelectProduct}
                    />
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}