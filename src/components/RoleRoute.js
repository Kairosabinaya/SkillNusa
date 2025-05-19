import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleRoute({ roles, children }) {
  const { userProfile } = useAuth();

  if (!userProfile || !roles.includes(userProfile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
} 