import UserMenu from "../UserMenu";
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

    return (
        <div className="flex items-center justify-end gap-2 px-4 h-14 bg-background rounded-md text-foreground shrink-0">
           <div className="flex items-center gap-6">
                <Separator orientation="vertical" className="bg-foreground/30" />
                <UserMenu name={user?.name ?? "Usuário"} email={user?.email} role={user?.role} onLogout={handleLogout} />
            </div>
        </div>
    );
}
