import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES, FREELANCER_STATUS } from '../../utils/constants';

/**
 * RoleSwitcher component allows users to switch between available roles
 */
export default function RoleSwitcher() {
  const { userProfile, activeRole, availableRoles, switchRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // If user has no multiple roles, don't render anything
  if (!userProfile || 
      !availableRoles || 
      availableRoles.length <= 1 || 
      !userProfile.isFreelancer || 
      userProfile.freelancerStatus !== FREELANCER_STATUS.APPROVED) {
    return null;
  }
  
  const handleRoleSwitch = async (role) => {
    if (role === activeRole) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await switchRole(role);
    } catch (error) {
      console.error('Error switching role:', error);
      setError('Failed to switch role. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="relative">
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-500">View as:</span>
        
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => handleRoleSwitch(USER_ROLES.CLIENT)}
            disabled={loading || activeRole === USER_ROLES.CLIENT}
            className={`px-3 py-1.5 text-sm font-medium ${
              activeRole === USER_ROLES.CLIENT
                ? 'bg-[#010042] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Client
          </button>
          
          <button
            type="button"
            onClick={() => handleRoleSwitch(USER_ROLES.FREELANCER)}
            disabled={loading || activeRole === USER_ROLES.FREELANCER}
            className={`px-3 py-1.5 text-sm font-medium ${
              activeRole === USER_ROLES.FREELANCER
                ? 'bg-[#010042] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Freelancer
          </button>
        </div>
        
        {loading && (
          <svg className="animate-spin h-4 w-4 text-[#010042]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
      </div>
      
      {error && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
