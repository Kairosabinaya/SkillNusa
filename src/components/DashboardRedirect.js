import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './UI/LoadingSpinner';

export default function DashboardRedirect() {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && userProfile) {
      // Check if user has admin role and redirect accordingly
      if (userProfile.roles?.includes('admin')) {
        navigate('/dashboard/admin', { replace: true });
      } else if (userProfile.isFreelancer) {
        navigate('/dashboard/freelancer', { replace: true });
      } else {
        // Default to client dashboard
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