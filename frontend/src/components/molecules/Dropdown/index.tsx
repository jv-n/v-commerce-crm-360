import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/atoms/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/atoms/tooltip";
import { useState } from "react";

interface DropdownProps extends React.ComponentProps<typeof DropdownMenu> {
    title: string;
    buttonIcon: React.ReactNode;
    menuItems: string[];
}

export default function Dropdown({ title, buttonIcon, menuItems, onOpenChange, ...props }: DropdownProps) {
    const [open, setOpen] = useState(false);

    const handleOpenChange = (value: boolean) => {
        setOpen(value);
        onOpenChange?.(value);
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <DropdownMenu open={open} onOpenChange={handleOpenChange} {...props}>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center justify-center rounded-md w-7 h-7 text-sm text-foreground hover:ring hover:ring-primary transition duration-300">
                                {buttonIcon}
                            </button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>{title}</DropdownMenuLabel>
                            {menuItems.map((item, index) => (
                                <DropdownMenuItem key={index}>{item}</DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
                <TooltipContent
                    side="bottom"
                    className="bg-background text-primary rounded-lg"
                    arrowClassName="bg-background fill-background"
                >
                    <p>{title}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}