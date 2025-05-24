import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../UI/LoadingSpinner';

/**
 * Component to restrict access based on user role
 * 
 * @param {Object} props
 * @param {Array} props.roles - Array of allowed roles
 * @param {React.ReactNode} props.children - Children components to render if authorized
 * @param {Function} props.element - Function that receives userRole and returns a component
 * @returns {React.ReactNode}
 */
export default function RoleRoute({ roles, children, element }) {
  const { currentUser, userProfile, loading } = useAuth();

  // Handle loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="large" text="Verifying access..." />
      </div>
    );
  }

  // No user authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, but no profile loaded yet
  if (!userProfile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="large" text="Loading user profile..." />
      </div>
    );
  }

  // Check if user role is allowed
  const hasRequiredRole = roles.includes(userProfile.role);

  // If access denied, redirect to home page
  if (!hasRequiredRole) {
    return <Navigate to="/" replace />;
  }

  // If element function is provided, call it with userRole
  if (element) {
    return element({ userRole: userProfile.role });
  }

  // Otherwise, render children
  return children;
} 