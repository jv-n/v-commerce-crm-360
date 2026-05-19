import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu"

interface UserMenuProps {
    name: string
    email?: string
    role?: string
    avatarSrc?: string
    onLogout?: () => void
}

function getInitials(name: string) {
    return name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
}

function getRoleBadge(role?: string) {
    switch (role) {
        case "admin":   return { label: "Admin",     bg: "#A760FF", color: "#431977" }
        case "sales":   return { label: "Comercial", bg: "#388FD6", color: "#0B2337" }
        case "support": return { label: "Suporte",   bg: "#FF84FD", color: "#992697" }
        default:        return null
    }
}

export default function UserMenu({ name, email, role, avatarSrc, onLogout }: UserMenuProps) {
    const badge = getRoleBadge(role)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="group flex items-center gap-3 text-sm text-foreground outline-none w-max">
                    {avatarSrc ? (
                        <img src={avatarSrc} alt={name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                        <span className="flex w-8 h-8 rounded-full bg-foreground text-background items-center justify-center text-xs font-semibold shrink-0">
                            {getInitials(name)}
                        </span>
                    )}
                    <span>{name}</span>
                    <span className="transition-transform duration-200 group-data-[state=open]:rotate-180">
                        <ExpandMoreOutlinedIcon sx={{ color: "#74FF60" }} />
                    </span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10} className="min-w-40 w-fit bg-white text-black">
                {/* Cabeçalho: email e badge de cargo */}
                <div className="px-3 py-3">
                    {email && (
                        <p className="text-xs text-black font-bold">{email}</p>
                    )}
                    {badge && (
                        <span
                            className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ background: badge.bg, color: badge.color }}
                        >
                            <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ background: badge.color }}
                            />
                            {badge.label}
                        </span>
                    )}
                </div>
                <DropdownMenuSeparator className="bg-black/10" />
                <DropdownMenuItem variant="destructive" onSelect={onLogout} className="text-red-500 focus:text-red-500 focus:bg-red-50">
                    <LogoutOutlinedIcon />
                    Sair da conta
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
