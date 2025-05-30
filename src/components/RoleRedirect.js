import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../routes';

/**
 * Component that redirects users to their role-specific dashboard
 * when they try to access pages not permitted for their role
 */
export default function RoleRedirect({ children }) {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [previousRole, setPreviousRole] = useState(null);
  
  useEffect(() => {
    // Store previous role when it changes
    if (userProfile?.activeRole !== previousRole) {
      setPreviousRole(userProfile?.activeRole);
    }
    
    // Only redirect if user is logged in and has a role
    if (userProfile?.activeRole) {
      // Common excluded paths for all roles (role switching, profile, etc)
      const commonExcludedPaths = [
        // Allow dashboard root for initial redirect
        ROUTES.DASHBOARD.ROOT,
        // Allow profile paths for role switching
        ROUTES.PROFILE.ROOT,
        ROUTES.PROFILE.EDIT
      ];
      
      // Role-specific redirects
      switch(userProfile.activeRole) {
        case 'freelancer':
          handleRoleRedirect(
            ROUTES.DASHBOARD.FREELANCER, 
            [...commonExcludedPaths, ROUTES.DASHBOARD.CLIENT, ROUTES.DASHBOARD.ADMIN]
          );
          break;
          
        case 'client':
          handleRoleRedirect(
            ROUTES.DASHBOARD.CLIENT,
            [...commonExcludedPaths, ROUTES.DASHBOARD.FREELANCER, ROUTES.DASHBOARD.ADMIN]
          );
          break;
          
        case 'admin':
          handleRoleRedirect(
            ROUTES.DASHBOARD.ADMIN,
            [...commonExcludedPaths, ROUTES.DASHBOARD.CLIENT, ROUTES.DASHBOARD.FREELANCER]
          );
          break;
          
        default:
          // No redirect for unknown roles
          break;
      }
    }
    
    // Helper function to handle role-specific redirects
    function handleRoleRedirect(dashboardPath, excludedPaths) {
      // Check if current path is in excluded paths
      const isExcludedPath = excludedPaths.some(path => 
        location.pathname === path || location.pathname.startsWith(path)
      );
      
      // Check if already on the correct dashboard
      const isOnCorrectDashboard = location.pathname.startsWith(dashboardPath);
      
      // Only redirect if not on excluded path and not on correct dashboard
      if (!isExcludedPath && !isOnCorrectDashboard) {
        navigate(dashboardPath, { replace: true });
      }
    }
  }, [userProfile, navigate, location, previousRole]);

  return children;
}
