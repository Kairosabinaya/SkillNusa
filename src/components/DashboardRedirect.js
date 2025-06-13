import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './UI/LoadingSpinner';

export default function DashboardRedirect() {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    // Prevent multiple redirects
    if (redirected) return;
    
    if (!loading && userProfile) {
      // Add slight delay to prevent race conditions
      const timeoutId = setTimeout(() => {
        // Check if user has admin role and redirect accordingly
        if (userProfile.roles?.includes('admin')) {
          navigate('/dashboard/admin', { replace: true });
        } else if (userProfile.isFreelancer) {
          navigate('/dashboard/freelancer', { replace: true });
        } else {
          // Default to client dashboard
          navigate('/dashboard/client', { replace: true });
        }
        setRedirected(true);
      }, 100); // Small delay to prevent race conditions

      return () => clearTimeout(timeoutId);
    }
  }, [userProfile, loading, navigate, redirected]);

  // Add timeout fallback to prevent infinite loading
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      if (!redirected && !loading) {
        console.warn('⚠️ [DashboardRedirect] Fallback redirect to client dashboard');
        navigate('/dashboard/client', { replace: true });
        setRedirected(true);
      }
    }, 5000); // 5 second fallback

    return () => clearTimeout(fallbackTimeout);
  }, [redirected, loading, navigate]);

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