import { Field } from "@/components/atoms/field";
import UserMenu from "../UserMenu";
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import NotificationImportantOutlinedIcon from '@mui/icons-material/NotificationImportantOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { useState } from "react"
import SearchInput from "../SearchInput";
import Dropdown from "../Dropdown";
import { Separator } from "@/components/atoms/separator";



export default function AppNavbar() {

    const [unreadNotifications, setUnreadNotifications] = useState(4);

    const hasUnreadNotifications = () => {
        if(unreadNotifications > 0) {
            return <NotificationImportantOutlinedIcon sx={{ color: "#74FF60" }} />;
        } else {
            return <NotificationsOutlinedIcon sx={{ color: "#74FF60" }} />;
        }
    }

    const markNotificationsAsRead = () => {
        setUnreadNotifications(0);
    }

    return (
        <div className="flex items-center justify-between gap-2 px-4 h-14 bg-background rounded-md text-foreground shrink-0">
           <Field orientation="horizontal">
                <SearchInput />
                <button className="flex items-center justify-center rounded-full h-8 w-8 text-sm text-foreground hover:bg-secondary-foreground"
                    onClick={() => {alert("Search not implemented yet")}}>
                    <AddOutlinedIcon sx={{ color: "#74FF60" }} />
                </button>
           </Field>
           <div className="flex items-center gap-6">
                <Dropdown title="Settings" buttonIcon={<SettingsOutlinedIcon sx={{color: "#74FF60"}}/>} menuItems={["Preferences", "Help"]} />
                <Dropdown title="Notifications" buttonIcon={hasUnreadNotifications()} menuItems={["Notification 1", "Notification 2", "Notification 3"]} onOpenChange={(open) => { if(open) markNotificationsAsRead()}} />
                <Separator orientation="vertical" className="bg-foreground/30" />
                <UserMenu name="Joao Victor" avatarSrc="profile_pic.jpg"/>
            </div>
        </div>
    );
}
