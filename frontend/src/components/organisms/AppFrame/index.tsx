import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation, useOutletContext } from "react-router-dom";
import AppNavbar from "@/components/molecules/AppNavbar";
import AIChatSidebar from "@/components/molecules/AIChatSidebar";
import type { MentionItem } from "@/lib/api/mentions";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarSeparator,
} from "@/components/molecules/Sidebar/sidebar";
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import ContactPageOutlinedIcon from '@mui/icons-material/ContactPageOutlined';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { useAuth } from "@/contexts/auth/useAuth";
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';

export default function AppFrame() {
    const { pathname, state: locationState } = useLocation();
    const isOnChat = pathname === "/chat";
    const isOnHome = pathname === "/";
    const [isAIOpen, setIsAIOpen] = useState(false);
    const { user } = useAuth()
    const [pendingMention, setPendingMention] = useState<MentionItem | null>(null);
    const [initialMessage, setInitialMessage] = useState("")

    useEffect(() => {
        if (isOnChat) {
            setIsAIOpen(false);
        } else if ((locationState as { reopenAI?: boolean })?.reopenAI) {
            setIsAIOpen(true);
        }
    }, [isOnChat, locationState]);

    useEffect(() => {
        const handler = (e: Event) => {
            const item = (e as CustomEvent<MentionItem>).detail;
            setIsAIOpen(true);
            setPendingMention(item);
        };
        window.addEventListener("open-ai-chat", handler);
        return () => window.removeEventListener("open-ai-chat", handler);
    }, []);

    const itemActive = (path: string) => pathname === path ? "bg-primary" : "bg-background";

    const sidebarItems1 = [
        { name: "Home", nav: true, path: "/" },
    ];

    const allSidebarItems2 = [
        { name: "Contacts",  nav: true,  path: "/contacts",  roles: ["admin", "sales"] },
        { name: "Sales",     nav: true,  path: "/sales",     roles: ["admin", "sales"] },
        { name: "Products",  nav: true,  path: "/products",  roles: [] },
        { name: "Dashboard", nav: true,  path: "/dashboard", roles: ["admin"] },
        { name: "Tickets",   nav: true,  path: "/tickets",   roles: ["admin", "support"] },
    ];

    const sidebarItems2 = allSidebarItems2.filter(
        (item) => item.roles.length === 0 || (user?.role && item.roles.includes(user.role))
    );

    const allSidebarItems3 = [
        { name: "Chat", nav: false, path: "", roles: ["admin"] },
    ];

    const sidebarItems3 = allSidebarItems3.filter(
        (item) => item.roles.length === 0 || (user?.role && item.roles.includes(user.role))
    );

    const iconColor = (path: string) => {
        return path === pathname ? "#000" : "#74FF60";
    }

    const setIcon = (title: string): React.ReactNode => {
        switch (title) {
            case "Home":
                return <HomeOutlinedIcon sx={{ color: iconColor("/")} }/>;
            case "Contacts":
                return <ContactPageOutlinedIcon sx={{ color: iconColor("/contacts")} }/>;
            case "Sales":
                return <RequestQuoteOutlinedIcon sx={{ color: iconColor("/sales")} }/>;
            case "Products":
                return <Inventory2OutlinedIcon sx={{ color: iconColor("/products")} }/>;
            case "Dashboard":
                return <LeaderboardIcon sx={{ color: iconColor("/dashboard")} }/>;
            case "Book":
                return <MenuBookOutlinedIcon sx={{color: iconColor(title.toLowerCase())}}/>;
            case "Chat":
                return <img src="v_ai.svg" alt="Chat Icon" height={48} width={48} />
            case "Tickets":
                return <ConfirmationNumberOutlinedIcon sx={{ color: iconColor("/tickets")} }/>;
            default:
                return <div className="w-6 h-6 rounded-md bg-gray-500" />;
        }
    }

    return (
        <SidebarProvider defaultOpen={true} className="!h-svh overflow-hidden">
            {!isOnHome && ( 
                <Sidebar variant="inset" >
                    <SidebarHeader className="w-full align-center justify-center">
                        <img src="vcom360_icon.svg" alt="CRM Icon" height={80} width={80}/> 
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu className="gap-2">
                                    {sidebarItems1.map((item) => (
                                        <SidebarMenuItem key={item.name} className="flex align-center justify-center">
                                            <SidebarMenuButton className={`${itemActive(item.path)} w-8 h-8 transition duration-400 hover:bg-${itemActive(item.path)} hover:ring hover:ring-primary rounded-md flex items-center justify-center`} asChild>
                                                <NavLink to={item.path}>
                                                    {setIcon(item.name)}
                                                </NavLink>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                        <SidebarSeparator className="bg-foreground/30" />
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu className="gap-2">
                                    {sidebarItems2.map((item) => (
                                        <SidebarMenuItem key={item.name} className="flex align-center justify-center">
                                            <SidebarMenuButton className={`${itemActive(item.path)} w-8 h-8 transition duration-400 hover:bg-${itemActive(item.path)} hover:ring hover:ring-primary rounded-md flex items-center justify-center`} asChild>
                                                <NavLink to={item.path}>
                                                    {setIcon(item.name)}
                                                </NavLink>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                        <SidebarSeparator className="bg-foreground/30"/>
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu className="gap-2">
                                    {sidebarItems3.map((item) => (
                                        <SidebarMenuItem key={item.name} className="flex align-center justify-center">
                                            {item.nav ? (
                                                <SidebarMenuButton
                                                    className={`${itemActive(item.path)} w-8 h-8 transition duration-400 hover:bg-background hover:ring hover:ring-primary rounded-md flex items-center justify-center`}
                                                    asChild
                                                >
                                                    <NavLink to={item.path}>
                                                        {setIcon(item.name)}
                                                    </NavLink>
                                                </SidebarMenuButton>
                                            ) : (
                                                <SidebarMenuButton
                                                    className={`${isAIOpen ? "ring ring-primary" : ""} bg-background !w-11 !h-11 transition duration-400 hover:bg-background hover:ring hover:ring-primary rounded-md flex items-center justify-center`}
                                                    onClick={() => { if (!isOnChat) setIsAIOpen((prev) => !prev); }}
                                                    title="Abrir assistente V.IA"
                                                >
                                                    {setIcon(item.name)}
                                                </SidebarMenuButton>
                                            )}
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>
                </Sidebar>
            )}
            <SidebarInset className="m-2 ml-0 rounded-xl overflow-hidden flex flex-col transition-all duration-300">
                <div className="flex items-center">
                    {isOnHome && ( 
                        <img src="vcom360_icon.svg" alt="Logo" className="w-8 h-8 ml-3 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                        <AppNavbar onOpenAI={() => { if (!isOnChat) setIsAIOpen((prev) => !prev); }} />
                    </div>
                </div>
                <div className="flex flex-1 min-h-0">
                    <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                        <Outlet context={{ onOpenAI: (message?: string) => { if (!isOnChat) {
                            if (message) setInitialMessage(message)
                                setIsAIOpen((prev) => !prev); } }}} />
                    </div>
                    <AIChatSidebar
                    open={isAIOpen}
                    onClose={() => setIsAIOpen(false)}
                    userName= {user?.name ?? "Deslogado"}
                    pendingMention={pendingMention}
                    onMentionInserted={() => setPendingMention(null)}
                    initialMessage={initialMessage}   
                    onInitialMessageSent={() => setInitialMessage("")}
                    />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}