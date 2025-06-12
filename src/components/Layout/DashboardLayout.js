import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSubscriptions } from '../../context/SubscriptionContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import PropTypes from 'prop-types';
import { getUserProfile, updateUserProfile } from '../../services/userProfileService';

/**
 * Dashboard layout with sidebar navigation
 */
export default function DashboardLayout({ children }) {
  const { currentUser, userProfile, logout } = useAuth();
  const { counts } = useSubscriptions();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [combinedUserData, setCombinedUserData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // No longer need switchingRole state as we've removed role switching functionality

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

  // Function to handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Handle profile photo click - always redirect to client dashboard
  const handleProfilePhotoClick = () => {
    navigate('/dashboard/client');
  };

  // Render count badge for notifications and other items
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

  // Check if the user is a freelancer - more robust role checking
  const isFreelancer = combinedUserData?.roles?.includes('freelancer') || 
                       combinedUserData?.isFreelancer || 
                       userProfile?.isFreelancer;

  // Client sidebar navigation items
  const clientNavItems = [
    {
      name: 'Dashboard',
      href: '/dashboard/client',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v5H8V5z" />
        </svg>
      )
    },
    {
      name: 'Daftar Transaksi',
      href: '/dashboard/client/transactions',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      name: 'Keranjang',
      href: '/dashboard/client/cart',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z" />
        </svg>
      )
    },
    {
      name: 'Favorit',
      href: '/dashboard/client/favorites',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    },
    {
      name: 'Bantuan & Dukungan',
      href: '/contact',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75A9.75 9.75 0 0012 2.25z" />
        </svg>
      )
    }
  ];

  // Freelancer sidebar navigation items
  const freelancerNavItems = [
    {
      name: 'Dashboard',
      href: '/dashboard/freelancer',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Panduan Freelancer',
      href: '/dashboard/freelancer/guides',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      name: 'Chat',
      href: '/dashboard/freelancer/messages',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      name: 'Gigs',
      href: '/dashboard/freelancer/gigs',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      subItems: [
        {
          name: 'Tambah Gig',
          href: '/dashboard/freelancer/gigs/create',
        },
        {
          name: 'Daftar Gig Saya',
          href: '/dashboard/freelancer/gigs',
        }
      ]
    },
    {
      name: 'Pesanan',
      href: '/dashboard/freelancer/orders',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      name: 'Analytics',
      href: '/dashboard/freelancer/analytics',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      name: 'Wallet',
      href: '/dashboard/freelancer/wallet',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    }
  ];

  // Admin sidebar navigation items
  const adminNavItems = [
    {
      name: 'Dashboard Admin',
      href: '/dashboard/admin',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      name: 'Kelola Pengguna',
      href: '/dashboard/admin/users',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    {
      name: 'Kelola Gigs',
      href: '/dashboard/admin/gigs',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/'); // Always redirect to home after logout
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getNavItems = () => {
    // Determine sidebar based on current route path
    if (location.pathname.startsWith('/dashboard/freelancer')) {
      return freelancerNavItems;
    } else if (location.pathname.startsWith('/dashboard/client')) {
      return clientNavItems;
    } else if (location.pathname.startsWith('/dashboard/admin')) {
      return adminNavItems;
    } else {
      // Default to client sidebar for /dashboard root or any other dashboard path
      return clientNavItems;
    }
  };

  const navItems = getNavItems();

  // Determine current dashboard type for user role display
  const getCurrentDashboardType = () => {
    if (location.pathname.startsWith('/dashboard/freelancer')) {
      return 'Freelancer';
    } else if (location.pathname.startsWith('/dashboard/client')) {
      return 'Client';
    } else if (location.pathname.startsWith('/dashboard/admin')) {
      return 'Admin';
    } else {
      return 'Client'; // Default
    }
  };

  // Animation for sidebar
  const sidebarAnimation = useSpring({
    transform: sidebarOpen ? 'translateX(0%)' : 'translateX(-100%)',
    config: { tension: 300, friction: 30 }
  });

  // Animation for content area
  const contentAnimation = useSpring({
    marginLeft: !sidebarOpen && window.innerWidth >= 1024 ? '0px' : '0px',
    config: { tension: 300, friction: 30 }
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen || window.innerWidth >= 1024 ? 0 : -300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 w-64 bg-white/95 backdrop-blur-sm shadow-xl lg:translate-x-0 lg:static lg:inset-0 lg:bg-white`}
      >
        
        {/* Sidebar header */}
        <motion.div 
          className="flex items-center justify-between h-16 px-6 border-b border-gray-200"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link to="/" className="flex items-center">
            <motion.span 
              className="text-xl font-bold bg-gradient-to-r from-[#010042] to-[#0100a3] bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              SkillNusa
            </motion.span>
          </Link>
          
          {/* Close button for mobile */}
          <motion.button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        </motion.div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.href;
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * (index + 5) }}
                >
                  <Link
                    to={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-[#010042] text-white shadow-md'
                        : 'text-gray-700 hover:bg-[#010042]/5 hover:text-[#010042]'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <motion.span 
                      className={`mr-3 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#010042]'}`}
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      {item.icon}
                    </motion.span>
                    {item.name}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </nav>

        {/* Logout button */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.svg 
              className="mr-3 h-5 w-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              whileHover={{ x: 2 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v6" />
            </motion.svg>
            Keluar
          </motion.button>
        </motion.div>
      </motion.aside>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top bar */}
        <motion.header 
          className="bg-white border-b border-gray-100 shadow-sm"
          initial={{ y: -60 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex justify-between h-16 items-center">
              {/* Mobile menu button & Logo */}
              <div className="flex items-center">
                <motion.button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 mr-2 sm:mr-4"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </motion.button>
              </div>

              {/* Search Bar */}
              <motion.div 
                className="flex-1 max-w-sm sm:max-w-xl mx-2 sm:mx-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={
                        userProfile?.activeRole === 'freelancer' && location.pathname.includes('/guides')
                          ? "Cari video panduan freelancer..."
                          : userProfile?.activeRole === 'freelancer'
                          ? "Cari panduan, orders, atau gigs..."
                          : "Cari layanan, keahlian, atau proyek..."
                      }
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                    />
                    <button 
                      type="submit" 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#010042]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                </form>
              </motion.div>

              {/* Right side actions */}
              <motion.div 
                className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {/* Action Icons */}
                <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
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
                  {/* <Link to="/transactions" className="hidden md:block text-gray-500 hover:text-[#010042] transition-all duration-200" title="Riwayat Transaksi">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </Link> */}
                  
                  {/* Messages with count */}
                  <Link to="/messages" className="text-gray-500 hover:text-[#010042] transition-all duration-200 relative" title="Pesan">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {renderCountBadge(counts.messages)}
                  </Link>
                  
                  {/* Orders icon only for Freelancers - Hidden on small screens */}
                  {isFreelancer && (
                    <Link to="/dashboard/freelancer/orders" className="hidden sm:block text-gray-500 hover:text-[#010042] transition-all duration-200 relative" title="Pesanan Saya">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      {renderCountBadge(counts.orders)}
                    </Link>
                  )}
                  
                  {/* General Notifications for all users - Hidden on small screens */}
                  <Link to="/notifications" className="hidden sm:block text-gray-500 hover:text-[#010042] transition-all duration-200 relative" title="Notifikasi">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {renderCountBadge(counts.notifications)}
                  </Link>
                  
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
                          {isFreelancer && (
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
                          {combinedUserData?.roles?.includes('admin') && (
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
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* Main content area */}
        <motion.main 
          className="flex-1 overflow-auto relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {children || <Outlet />}
        </motion.main>
      </div>
    </div>
  );
}

DashboardLayout.propTypes = {
  children: PropTypes.node
}; 