import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';
import { ROUTES } from '../routes';
import { useEffect, useState } from 'react';

/**
 * A route wrapper component that checks if the user has the required role(s)
 * Simplified to use isFreelancer property
 */
export default function RoleRoute({ roles, children, redirectTo = ROUTES.HOME }) {
  const { userProfile, currentUser, loading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // If auth is no longer loading and we have user data, we can stop checking
    if (!loading && userProfile) {
      setIsChecking(false);
    }
  }, [loading, userProfile]);

  // Show loading state while checking authentication or profile
  if (loading || isChecking) {
    // You can replace this with a loading spinner component
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If user is not authenticated, redirect
  if (!currentUser || !userProfile) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  
  // Check if user has the required role based on isFreelancer property
  const hasRequiredRole = roles.some(role => {
    if (role === 'freelancer') {
      return userProfile.isFreelancer === true;
    } else if (role === 'client') {
      return !userProfile.isFreelancer;
    } else if (role === 'admin') {
      return userProfile.roles && userProfile.roles.includes('admin');
    }
    return false;
  });
    
  if (!hasRequiredRole) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
} 

RoleRoute.propTypes = {
  roles: PropTypes.arrayOf(PropTypes.string).isRequired,
  children: PropTypes.node.isRequired,
  redirectTo: PropTypes.string
}; 