import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './UI/LoadingSpinner';

/**
 * Component that guards access to admin dashboard pages
 * Only allows access if user has admin role
 */
export default function AdminDashboardGuard({ children }) {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && userProfile) {
      const hasAdminRole = userProfile.roles?.includes('admin');
      
      if (!hasAdminRole) {
        // Redirect to client dashboard if user is not an admin
        navigate('/dashboard/client', { replace: true });
      }
    }
  }, [userProfile, loading, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" text="Memeriksa akses..." />
      </div>
    );
  }

  return children;
}
