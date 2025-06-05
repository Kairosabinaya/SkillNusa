import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { useAuth } from '../../context/AuthContext';
import { useSubscriptions } from '../../context/SubscriptionContext';
import { useState, useEffect } from 'react';
import { getUserProfile } from '../../services/userProfileService';

export default function Header() {
  const { currentUser, userProfile, logout } = useAuth();
  const { counts } = useSubscriptions(); // Use centralized subscription context
  const navigate = useNavigate();
  const location = useLocation();
  const [profileData, setProfileData] = useState(null);

  const [combinedUserData, setCombinedUserData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Check if current page is browse
  const isBrowsePage = location.pathname === '/browse';

  // Get initial search query from URL params if on browse page
  useEffect(() => {
    if (isBrowsePage) {
      const urlParams = new URLSearchParams(location.search);
      const initialSearch = urlParams.get('search') || '';
      setSearchQuery(initialSearch);
    }
  }, [location, isBrowsePage]);

  // Real-time counts are now handled by SubscriptionContext
  // Remove the duplicate subscription logic

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
        console.error('Error fetching profile data:', error);
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
      console.error('Logout error:', error);
    }
  };

  // Check user roles
  const hasFreelancerRole = combinedUserData?.roles?.includes('freelancer') || combinedUserData?.isFreelancer;
  const hasAdminRole = combinedUserData?.roles?.includes('admin');

  // Function to handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Always search in browse
      navigate(`/browse?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Handle profile photo click - redirect to client dashboard
  const handleProfilePhotoClick = () => {
    navigate('/dashboard/client');
  };

  // Render count badge
  const renderCountBadge = (count) => {
    if (count > 0) {
      return (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {count > 99 ? '99+' : count}
        </span>
      );
    }
    return null;
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
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
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
                {/* Always show standard menu items */}
                {
                  /* Regular menu items for other user roles */
                  <>
                    {/* Favorites with count */}
                    <Link to="/favorites" className="text-gray-500 hover:text-[#010042] transition-all duration-200 relative" title="Favorit">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {renderCountBadge(counts.favorites)}
                    </Link>
                    
                    {/* Cart with count */}
                    <Link to="/cart" className="text-gray-500 hover:text-[#010042] transition-all duration-200 relative" title="Keranjang">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z" />
                      </svg>
                      {renderCountBadge(counts.cart)}
                    </Link>
                    
                    {/* Transactions */}
                    <Link to="/transactions" className="text-gray-500 hover:text-[#010042] transition-all duration-200" title="Riwayat Transaksi">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </Link>
                    
                    {/* Messages with count */}
                    <Link to="/messages" className="text-gray-500 hover:text-[#010042] transition-all duration-200 relative" title="Pesan">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {renderCountBadge(counts.messages)}
                    </Link>
                    
                    {/* SkillBot */}
                    <Link to="/messages?chatId=skillbot" className="text-gray-500 hover:text-[#010042] transition-all duration-200" title="SkillBot">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </Link>
                  </>
                }
                
                {/* No separate role access buttons outside dropdown */}
                
                {/* User Profile Menu */}
                <div 
                  className="relative"
                  onMouseEnter={() => setIsMenuOpen(true)}
                  onMouseLeave={() => setIsMenuOpen(false)}
                >
                  <div
                    onClick={handleProfilePhotoClick}
                    className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042] cursor-pointer"
                    title="Klik untuk dashboard client"
                  >
                    <span className="sr-only">Buka dashboard client</span>
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
                  </div>
                  
                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                      {/* Arrow pointer */}
                      <div className="absolute -top-2 right-3 w-4 h-4 bg-white transform rotate-45 border-l border-t border-black border-opacity-5"></div>
                      
                      <div className="border-b border-gray-100 pb-2 pt-2 px-4">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {combinedUserData?.displayName || currentUser?.displayName || 'Pengguna'}
                        </p>
                        <p className="text-xs text-gray-500 truncate mb-2">
                          {combinedUserData?.email || currentUser?.email}
                        </p>
                      </div>
                      
                      <div className="py-1">
                        {/* Client Dashboard */}
                        <Link 
                          to="/dashboard/client"
                          className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 group flex items-center px-4 py-2 text-sm"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-[#010042]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v5H8V5z" />
                          </svg>
                          Dashboard Client
                        </Link>
                        
                        {/* Freelancer Dashboard (conditional) */}
                        {hasFreelancerRole && (
                          <Link 
                            to="/dashboard/freelancer"
                            className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 group flex items-center px-4 py-2 text-sm"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-[#010042]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Dashboard Freelancer
                          </Link>
                        )}
                        
                        {/* Admin Dashboard (conditional) */}
                        {hasAdminRole && (
                          <Link 
                            to="/dashboard/admin"
                            className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 group flex items-center px-4 py-2 text-sm"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-[#010042]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Dashboard Admin
                          </Link>
                        )}
                        
                        <div className="border-t border-gray-100 my-1"></div>
                        
                        {/* Settings */}
                        <Link 
                          to="/settings" 
                          className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 group flex items-center px-4 py-2 text-sm"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-[#010042]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Pengaturan
                        </Link>
                        
                        <Link 
                          to="/about" 
                          className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 group flex items-center px-4 py-2 text-sm"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-[#010042]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          Tentang
                        </Link>
                        
                        <Link 
                          to="/contact" 
                          className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 group flex items-center px-4 py-2 text-sm"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-[#010042]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          Kontak
                        </Link>
                        
                        <div className="border-t border-gray-100 my-1"></div>
                        
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsMenuOpen(false);
                          }}
                          className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 group flex w-full items-center px-4 py-2 text-sm"
                        >
                          <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-4-4H3zm9 2.586L15.414 9H12V5.586zM4 6a1 1 0 011-1h4a1 1 0 010 2H5a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H5zm0 3a1 1 0 100 2h3a1 1 0 100-2H5z" clipRule="evenodd" />
                          </svg>
                          Keluar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Non-logged in navigation */
            <div className={`flex items-center ${isBrowsePage ? 'flex-grow justify-between' : ''}`}>
              {/* Search Bar - only show on browse page for non-logged users */}
              {isBrowsePage && (
                <div className="flex-grow max-w-xl mx-4">
                  <form onSubmit={handleSearchSubmit}>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Cari layanan, keahlian, atau proyek..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
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
              )}
              
              {/* Navigation and Auth buttons - always positioned on the right */}
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
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 