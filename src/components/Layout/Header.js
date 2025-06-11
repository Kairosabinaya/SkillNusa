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
      navigate('/'); // Redirect to home after logout
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Check user roles - more robust role checking
  const hasFreelancerRole = combinedUserData?.roles?.includes('freelancer') || 
                           combinedUserData?.isFreelancer || 
                           userProfile?.isFreelancer;
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center transition-all duration-300 flex-shrink-0">
            <span className="text-lg sm:text-xl font-bold cursor-pointer bg-gradient-to-r from-[#010042] to-[#0100a3] bg-clip-text text-transparent" style={{letterSpacing: "0.5px"}}>SkillNusa</span>
          </Link>

          {/* Center content - different based on login state */}
          {currentUser ? (
            /* Logged in header */
            <div className="flex items-center space-x-2 sm:space-x-4 flex-grow justify-end md:justify-between ml-2 sm:ml-4">
              {/* Search Bar - longer on desktop, hidden on mobile */}
              <div className="hidden lg:block lg:flex-grow lg:max-w-xl mx-4">
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
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                {/* Search icon for mobile */}
                <Link to="/browse" className="lg:hidden text-gray-500 hover:text-[#010042] transition-all duration-200" title="Cari">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </Link>

                {/* Always show standard menu items */}
                {
                  /* Regular menu items for other user roles */
                  <>
                    {/* Favorites with count - Hidden on small screens */}
                    <Link to="/favorites" className="hidden sm:block text-gray-500 hover:text-[#010042] transition-all duration-200 relative" title="Favorit">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {renderCountBadge(counts.favorites)}
                    </Link>
                    
                    {/* Cart with count */}
                    <Link to="/cart" className="text-gray-500 hover:text-[#010042] transition-all duration-200 relative" title="Keranjang">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z" />
                      </svg>
                      {renderCountBadge(counts.cart)}
                    </Link>
                    
                    {/* Transactions - Hidden on small screens */}
                    <Link to="/transactions" className="hidden md:block text-gray-500 hover:text-[#010042] transition-all duration-200" title="Riwayat Transaksi">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </Link>
                    
                    {/* Messages with count */}
                    <Link to="/messages" className="text-gray-500 hover:text-[#010042] transition-all duration-200 relative" title="Pesan">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {renderCountBadge(counts.messages)}
                    </Link>
                    
                    {/* Orders icon only for Freelancers - Hidden on small screens */}
                    {hasFreelancerRole && (
                      <Link to="/dashboard/freelancer/orders" className="hidden sm:block text-gray-500 hover:text-[#010042] transition-all duration-200 relative" title="Pesanan Saya">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        {renderCountBadge(counts.orders)}
                      </Link>
                    )}
                    
                    {/* General Notifications - Hidden on small screens */}
                    <Link to="/notifications" className="hidden sm:block text-gray-500 hover:text-[#010042] transition-all duration-200 relative" title="Notifikasi">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      {renderCountBadge(counts.notifications)}
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
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
              {/* Search Bar - only show on browse page for non-logged users, responsive */}
              {isBrowsePage && (
                <div className="flex-grow max-w-sm sm:max-w-xl mx-2 sm:mx-4">
                  <form onSubmit={handleSearchSubmit}>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Cari layanan, keahlian, atau proyek..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
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
                {/* Search icon for mobile when not on browse page */}
                {!isBrowsePage && (
                  <Link to="/browse" className="mr-2 sm:mr-4 md:hidden text-gray-500 hover:text-[#010042] transition-all duration-200" title="Cari">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </Link>
                )}

                <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 mr-6 lg:mr-8">
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
                
                <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                  <Link to="/login" className="inline-flex items-center px-2 sm:px-3 py-1.5 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042] transition-all duration-200">
                    Masuk
                  </Link>
                  <Link to="/register" className="inline-flex items-center px-2 sm:px-3 py-1.5 border border-gray-300 text-xs sm:text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042] transition-all duration-200">
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