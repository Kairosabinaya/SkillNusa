import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Enhanced NavigationRoleHandler to prevent 404 issues on page reload
 * Handles role-based navigation without causing unnecessary redirects
 */
export default function NavigationRoleHandler({ children }) {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't redirect during loading or if no user
    if (loading || !currentUser) {
      return;
    }

    // Don't redirect on auth-related pages
    const authPaths = ['/login', '/register', '/forgot-password', '/verify-email', '/auth-action'];
    if (authPaths.includes(location.pathname)) {
      return;
    }

    // Don't redirect on public pages
    const publicPaths = ['/', '/about', '/contact', '/browse'];
    const isPublicPath = publicPaths.includes(location.pathname) || 
                        location.pathname.startsWith('/gig/') ||
                        location.pathname.startsWith('/freelancer/');
    
    if (isPublicPath) {
      return;
    }

    // Wait for user profile to be loaded
    if (!userProfile) {
      return;
    }

    // Handle dashboard redirects more carefully
    if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
      // Only redirect if we're at the exact dashboard root
      if (userProfile.roles?.includes('admin')) {
        navigate('/dashboard/admin', { replace: true });
      } else if (userProfile.isFreelancer) {
        navigate('/dashboard/freelancer', { replace: true });
      } else {
        navigate('/dashboard/client', { replace: true });
      }
      return;
    }

    // Prevent invalid role access redirects unless absolutely necessary
    const currentPath = location.pathname;
    
    // Only redirect if user is trying to access a role they don't have
    if (currentPath.startsWith('/dashboard/admin') && !userProfile.roles?.includes('admin')) {
      navigate('/dashboard/client', { replace: true });
    } else if (currentPath.startsWith('/dashboard/freelancer') && !userProfile.isFreelancer) {
      navigate('/dashboard/client', { replace: true });
    }
    // Note: We don't redirect from client dashboard as it's the default for all users

  }, [currentUser, userProfile, loading, location.pathname, navigate]);

  return children;
}
