import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfileContext } from '@/contexts/ProfileContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireProfile?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false, requireProfile = true }: ProtectedRouteProps) {
  const { user, isLoading, isAdmin } = useAuth();
  const { selectedProfile } = useProfileContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Redirect to login with return path
        navigate('/auth', { state: { from: location.pathname } });
      } else if (requireAdmin && !isAdmin) {
        // User is logged in but not admin
        navigate('/');
      } else if (requireProfile && !selectedProfile && location.pathname !== '/profiles') {
        // User is logged in but hasn't selected a profile
        navigate('/profiles');
      }
    }
  }, [user, isLoading, isAdmin, requireAdmin, requireProfile, selectedProfile, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return null;
  }

  if (requireProfile && !selectedProfile && location.pathname !== '/profiles') {
    return null;
  }

  return <>{children}</>;
}
