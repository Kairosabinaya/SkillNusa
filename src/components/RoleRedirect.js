import { useAuth } from '../context/AuthContext';

/**
 * Component that no longer redirects based on activeRole
 * Now simply passes through to children
 */
export default function RoleRedirect({ children }) {
  return children;
}
