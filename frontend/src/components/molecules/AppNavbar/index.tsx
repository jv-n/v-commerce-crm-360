import { Field } from "@/components/atoms/field";
import UserMenu from "../UserMenu";
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { useState } from "react"
import SearchInput from "../SearchInput";
import Dropdown from "../Dropdown";
import { Separator } from "@/components/atoms/separator";
import { useAuth } from "@/contexts/auth/useAuth";
import { useNavigate } from "react-router-dom";

interface AppNavbarProps {
    onOpenAI?: () => void;
}

export default function AppNavbar({ onOpenAI }: AppNavbarProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate("/login");
    }

    const [unreadNotifications, setUnreadNotifications] = useState(4);

    const hasUnreadNotifications = () => {
        
        return <NotificationsOutlinedIcon sx={{ color: "#74FF60" }} />;
    }

    const markNotificationsAsRead = () => {
        setUnreadNotifications(0);
    }

    return (
        <div className="flex items-center justify-between gap-2 px-4 h-14 bg-background rounded-md text-foreground shrink-0">
           <Field orientation="horizontal">
                <SearchInput />
                <button className="flex items-center justify-center rounded-md h-8 w-8 text-sm text-foreground hover:ring hover:ring-primary transition duration-300"
                    onClick={() => {alert("Search not implemented yet")}}>
                    <AddOutlinedIcon sx={{ color: "#74FF60" }} />
                </button>
           </Field>
           <div className="flex items-center gap-6">
                <Dropdown title="Settings" buttonIcon={<SettingsOutlinedIcon sx={{color: "#74FF60"}}/>} menuItems={["Preferences", "Help"]} />
                <Dropdown title="Notifications" buttonIcon={hasUnreadNotifications()} menuItems={["Notification 1", "Notification 2", "Notification 3"]} onOpenChange={(open) => { if(open) markNotificationsAsRead()}} />
                <Separator orientation="vertical" className="bg-foreground/30" />
                <UserMenu name={user?.name ?? "Usuário"} role={user?.role} onLogout={handleLogout} />
            </div>
        </div>
    );
}
