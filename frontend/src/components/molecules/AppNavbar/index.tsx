import { NavLink, useLocation } from "react-router-dom";

const navItems = [
    { name: "Home", path: "/" },
    { name: "Bookmarks", path: "/bookmarks" },
    { name: "Contacts", path: "/contacts" },
    { name: "Sales", path: "/sales" },
    { name: "Products", path: "/products" },
    { name: "Dashboard", path: "/dashboard" },
    { name: "Book", path: "/book" },
    { name: "Chat", path: "/chat" },
];

export default function AppNavbar() {
    const { pathname } = useLocation();

    return (
        <div className="flex items-center gap-2 px-4 h-14 bg-background rounded-md text-foreground shrink-0">
            {navItems.map((item) => (
                <NavLink
                    key={item.name}
                    to={item.path}
                    className={`px-3 py-1 rounded-md ${pathname === item.path ? "bg-primary text-primary-foreground" : "hover:bg-secondary-foreground"}`}
                >
                    {item.name}
                </NavLink>
            ))}
        </div>
    );
}
