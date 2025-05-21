import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';
import { ROUTES } from '../routes';

/**
 * A route wrapper component that redirects to login if the user is not authenticated
 */
export default function ProtectedRoute({ children, redirectTo = ROUTES.LOGIN }) {
  const { currentUser, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    // You can replace this with a loading spinner component
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
} 

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  redirectTo: PropTypes.string
}; 