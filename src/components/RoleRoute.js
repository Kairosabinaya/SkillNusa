import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './UI/LoadingSpinner';
import PropTypes from 'prop-types';
import { ROUTES } from '../routes';
import { useEffect, useState } from 'react';

/**
 * Route component that checks user role before allowing access
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if access is allowed
 * @param {string|Array<string>} props.allowedRoles - Role(s) allowed to access this route
 * @param {string} props.redirectTo - Path to redirect if access is denied (default: '/')
 * @returns {React.ReactNode} - Rendered children or redirect
 */
export default function RoleRoute({ 
  children, 
  allowedRoles, 
  redirectTo = '/' 
}) {
  const { currentUser, userProfile, loading } = useAuth();

  // Show loading while auth state is being determined
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" text="Memuat..." />
      </div>
    );
  }

  // Redirect if user is not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect if user profile is not loaded yet
  if (!userProfile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" text="Memuat profil..." />
      </div>
    );
  }

  // Check if user has the required role
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  // For client role, always allow access
  if (rolesArray.includes('client')) {
    return children;
  }
  
  // For freelancer role, check if user is a freelancer
  if (rolesArray.includes('freelancer')) {
    const hasFreelancerRole = userProfile.roles?.includes('freelancer') || userProfile.isFreelancer;
    if (hasFreelancerRole) {
      return children;
    }
  }
  
  // For admin role, check if user is an admin
  if (rolesArray.includes('admin')) {
    const hasAdminRole = userProfile.roles?.includes('admin');
    if (hasAdminRole) {
      return children;
    }
  }
  
  // If no matching role, redirect
  return <Navigate to={redirectTo} replace />;
} 

RoleRoute.propTypes = {
  allowedRoles: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]).isRequired,
  children: PropTypes.node.isRequired,
  redirectTo: PropTypes.string
}; 