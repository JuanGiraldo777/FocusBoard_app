import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si ya está autenticado, redirigir a dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si no está autenticado, renderizar la página pública
  return <>{children}</>;
}
