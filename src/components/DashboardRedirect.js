import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './UI/LoadingSpinner';

export default function DashboardRedirect() {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && userProfile) {
      const activeRole = userProfile.activeRole || 'client';
      
      switch (activeRole) {
        case 'client':
          navigate('/dashboard/client', { replace: true });
          break;
        case 'freelancer':
          navigate('/dashboard/freelancer', { replace: true });
          break;
        case 'admin':
          navigate('/dashboard/admin', { replace: true });
          break;
        default:
          navigate('/dashboard/client', { replace: true });
      }
    }
  }, [userProfile, loading, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" text="Mengalihkan ke dashboard..." />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <LoadingSpinner size="large" text="Mengalihkan ke dashboard..." />
    </div>
  );
} 