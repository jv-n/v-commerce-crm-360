import React from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import AppNavbar from "@/components/molecules/AppNavbar";
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
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';
import ContactPageOutlinedIcon from '@mui/icons-material/ContactPageOutlined';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';

export default function AppFrame() {
    const { pathname } = useLocation();

    const itemActive = (path: string) => pathname === path ? "bg-primary" : "bg-background";

    const sidebarItems1 = [
        { name: "Home", nav: true, path: "/" },
        { name: "Bookmarks", nav: true, path: "/bookmarks" },
    ];

    const sidebarItems2 = [
        { name: "Contacts", nav: true, path: "/contacts" },
        { name: "Sales", nav: true, path: "/sales" },
        { name: "Products", nav: true, path: "/products" },
        { name: "Dashboard", nav: true, path: "/dashboard" },
    ];

    const sidebarItems3 = [
        { name: "Book", nav: true, path: "/book" },
        { name: "Chat", nav: false, path: "/chat" },
    ];

    const iconColor = (path: string) => {
        return path === pathname ? "#000" : "#74FF60";
    }

    const setIcon = (title: string): React.ReactNode => {
        switch (title) {
            case "Home":
                return <HomeOutlinedIcon sx={{ color: iconColor("/")} }/>;
            case "Bookmarks":
                return <BookmarkBorderOutlinedIcon sx={{ color: iconColor("/bookmarks")} }/>;
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
                return <img src="v_ai.svg" alt="Chat Icon" height={40} width={40} />
            default:
                return <div className="w-6 h-6 rounded-md bg-gray-500" />;
        }
    }

    return (
        <SidebarProvider defaultOpen={true}>
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
                </SidebarContent>
            </Sidebar>
            <SidebarInset className="m-2 ml-0 rounded-xl flex flex-col">
                <AppNavbar />
                <div className="flex-1">
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
