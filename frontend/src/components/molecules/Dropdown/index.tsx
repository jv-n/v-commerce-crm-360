import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/atoms/dropdown-menu";

interface DropdownProps extends React.ComponentProps<typeof DropdownMenu> {
    title: string;
    buttonIcon: React.ReactNode;
    menuItems: string[];
}

export default function Dropdown({ title, buttonIcon, menuItems }: DropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center rounded-full text-sm text-foreground hover:bg-secondary-foreground">
                    {buttonIcon}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuGroup>
                    <DropdownMenuLabel>{title}</DropdownMenuLabel>
                    {menuItems.map((item, index) => (
                        <DropdownMenuItem key={index}>{item}</DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}