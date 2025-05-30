import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/userProfileService';

/**
 * Component that handles role switching based on navigation
 * When user leaves /dashboard/freelancer, changes activeRole to client
 */
export default function NavigationRoleHandler({ children }) {
  const { currentUser, userProfile } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    // Only run this effect if there's a logged in user with a profile
    if (!currentUser || !userProfile) return;
    
    // If user is currently a freelancer and navigates away from the freelancer dashboard
    if (userProfile.activeRole === 'freelancer' && !location.pathname.startsWith('/dashboard/freelancer')) {
      // Update role to client
      const updateRole = async () => {
        try {
          await updateUserProfile(currentUser.uid, {
            activeRole: 'client'
          });
          console.log('User role automatically changed to client');
        } catch (error) {
          console.error('Error updating active role:', error);
        }
      };
      
      updateRole();
    }
  }, [currentUser, userProfile, location.pathname]);

  return children;
}
