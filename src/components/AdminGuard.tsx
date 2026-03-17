import { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * AdminGuard protege rotas que só podem ser acessadas por administradores.
 * Se o usuário não for admin, tenta voltar para a página anterior.
 */
export default function AdminGuard() {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user && user.role !== 'admin') {
      // Se está logado mas não é admin, tenta voltar
      navigate(-1);
    }
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Se o usuário ainda não carregou (pode acontecer durante checkSession)
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Se não for admin, não renderiza nada (o useEffect cuidará do redirecionamento)
  if (user.role !== 'admin') {
    return null;
  }

  return <Outlet />;
}
