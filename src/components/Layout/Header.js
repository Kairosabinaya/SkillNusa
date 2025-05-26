import { Link } from 'react-router-dom';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { getUserProfile } from '../../services/userProfileService';

export default function Header() {
  const { currentUser, userProfile, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [userRegistrationData, setUserRegistrationData] = useState(null);
  const [combinedUserData, setCombinedUserData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch complete profile data using the service
  useEffect(() => {
    async function fetchProfileData() {
      if (!currentUser) return;
      
      try {
        // Use the centralized service to get complete profile data
        const completeProfile = await getUserProfile(currentUser.uid);
        if (completeProfile) {
          setProfileData(completeProfile);
        }
      } catch (error) {
        }
    }

    fetchProfileData();
  }, [currentUser]);

  // Combine all profile data sources
  useEffect(() => {
    if (currentUser) {
      setCombinedUserData({
        ...userProfile,
        ...profileData
      });
    }
  }, [currentUser, userProfile, profileData]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      }
  };

  // Check if the user has both client and freelancer roles
  const hasFreelancerRole = combinedUserData?.roles?.includes('freelancer') || combinedUserData?.isFreelancer;

  // Function to handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Implement search functionality
  };

  return (
    <header className="bg-white border-b border-gray-100 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center transition-all duration-300">
            <span className="text-lg font-bold cursor-pointer bg-gradient-to-r from-[#010042] to-[#0100a3] bg-clip-text text-transparent" style={{letterSpacing: "0.5px"}}>SkillNusa</span>
          </Link>

          {/* Center content - different based on login state */}
          {currentUser ? (
            /* Logged in header */
            <div className="flex items-center space-x-4 flex-grow justify-end md:justify-between ml-4">
              {/* Search Bar - longer on desktop */}
              <div className="hidden md:block md:flex-grow md:max-w-xl mx-4">
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cari layanan, keahlian, atau proyek..."
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                    />
                    <button 
                      type="submit" 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#010042]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
              
              {/* Action Icons */}
              <div className="flex items-center space-x-4">
                {/* Favorites */}
                <Link to="/favorites" className="text-gray-500 hover:text-[#010042] transition-all duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </Link>
                
                {/* Checkout */}
                <Link to="/checkout" className="text-gray-500 hover:text-[#010042] transition-all duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </Link>
                
                {/* SkillBot */}
                <Link to="/skillbot" className="text-gray-500 hover:text-[#010042] transition-all duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </Link>
                
                {/* User Profile Menu */}
                <Menu as="div" className="relative">
                  <MenuButton className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]">
                    <span className="sr-only">Buka menu pengguna</span>
                    <div className="h-8 w-8 rounded-full bg-[#010042]/10 flex items-center justify-center text-[#010042] overflow-hidden border border-gray-200 hover:border-[#010042] transition-all duration-200">
                      {combinedUserData?.profilePhoto ? (
                        <img 
                          className="h-8 w-8 rounded-full object-cover" 
                          src={combinedUserData.profilePhoto} 
                          alt={combinedUserData.displayName || currentUser.email} 
                        />
                      ) : (
                        <span className="text-sm font-semibold">
                          {(combinedUserData?.displayName || currentUser?.displayName)?.charAt(0).toUpperCase() || 
                          currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                  </MenuButton>
                  
                  <MenuItems 
                    className="absolute right-0 mt-2 w-64 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                  >
                    <div className="border-b border-gray-100 pb-2 pt-2 px-4">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {combinedUserData?.displayName || currentUser?.displayName || 'Pengguna'}
                      </p>
                      <p className="text-xs text-gray-500 truncate mb-2">
                        {combinedUserData?.email || currentUser?.email}
                      </p>
                      
                      {/* Add the "Switch to Freelancer" button if the user has freelancer role */}
                      {hasFreelancerRole && (
                        <Link 
                          to="/dashboard/freelancer" 
                          className="w-full text-center text-xs bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-2 rounded transition-colors duration-200 block"
                        >
                          Pindah ke Freelancer
                        </Link>
                      )}
                    </div>
                    
                    <div className="py-1">
                      <MenuItem>
                        {({ active }) => (
                          <Link to="/profile" className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex items-center px-4 py-2 text-sm`}>
                            <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-[#010042]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            Profil Saya
                          </Link>
                        )}
                      </MenuItem>
                      
                      <MenuItem>
                        {({ active }) => (
                          <Link to="/about" className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex items-center px-4 py-2 text-sm`}>
                            <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-[#010042]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            Tentang
                          </Link>
                        )}
                      </MenuItem>
                      
                      <MenuItem>
                        {({ active }) => (
                          <Link to="/contact" className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex items-center px-4 py-2 text-sm`}>
                            <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-[#010042]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                            Kontak
                          </Link>
                        )}
                      </MenuItem>
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex w-full items-center px-4 py-2 text-sm`}
                          >
                            <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-4-4H3zm9 2.586L15.414 9H12V5.586zM4 6a1 1 0 011-1h4a1 1 0 010 2H5a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H5zm0 3a1 1 0 100 2h3a1 1 0 100-2H5z" clipRule="evenodd" />
                            </svg>
                            Keluar
                          </button>
                        )}
                      </MenuItem>
                    </div>
                  </MenuItems>
                </Menu>
              </div>
            </div>
          ) : (
            /* Non-logged in navigation */
            <div className="flex items-center">
              <nav className="hidden md:flex items-center space-x-8 mr-8">
                <Link to="/" className="inline-flex items-center px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-[#010042] transition-all duration-200">
                  Beranda
                </Link>
                <Link to="/about" className="inline-flex items-center px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-[#010042] transition-all duration-200">
                  Tentang
                </Link>
                <Link to="/contact" className="inline-flex items-center px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-[#010042] transition-all duration-200">
                  Kontak
                </Link>
              </nav>
              
              <div className="flex items-center space-x-4">
                <Link to="/login" className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]">
                  Masuk
                </Link>
                <Link to="/register" className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]">
                  Daftar
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 