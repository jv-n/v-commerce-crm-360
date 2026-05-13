import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu"

interface UserMenuProps {
    name: string
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

export default function UserMenu({ name, avatarSrc, onLogout }: UserMenuProps) {
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
            <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                    <DropdownMenuItem>
                        <PersonOutlinedIcon sx={{ color: "#0a0a0a" }} />
                        My Profile
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onLogout}>
                    <LogoutOutlinedIcon />
                    Logout
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
