/**
 * Component that previously handled role switching based on navigation
 * Under the new architecture, roles are permanent and we don't switch activeRole
 */
export default function NavigationRoleHandler({ children }) {
  return children;
}
