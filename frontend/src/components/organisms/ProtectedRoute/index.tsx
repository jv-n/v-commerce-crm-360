import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/auth/useAuth";

export default function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const { user } = useAuth();
  if(!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />
  return  <Outlet />;
}
