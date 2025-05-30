import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './UI/LoadingSpinner';

/**
 * Component that guards access to freelancer dashboard pages
 * Only allows access if user has freelancer role
 */
export default function FreelancerDashboardGuard({ children }) {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && userProfile) {
      const hasFreelancerRole = userProfile.roles?.includes('freelancer') || userProfile.isFreelancer;
      
      if (!hasFreelancerRole) {
        // Redirect to client dashboard if user is not a freelancer
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
