import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Header from './Header';

const CollapsibleSidebar = ({ 
  children, 
  menuItems = [], 
  userRole = 'client',
  className = '' 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const isActiveRoute = (path) => {
    // Exact match for dashboard routes
    if (path.endsWith('/dashboard/freelancer') || path.endsWith('/dashboard/client') || path.endsWith('/dashboard/admin')) {
      return location.pathname === path;
    }
    // For other routes, check if current path starts with the menu path
    return location.pathname.startsWith(path + '/') || location.pathname === path;
  };

  return (
    <div className={`flex flex-col min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <Header />
      
      {/* Main Layout with Sidebar */}
      <div className="flex flex-1 pt-16">
        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed top-20 left-4 z-50">
          <button
            onClick={toggleMobile}
            className="p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50"
          >
            {isMobileOpen ? (
              <XMarkIcon className="h-6 w-6 text-gray-600" />
            ) : (
              <Bars3Icon className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Overlay */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={toggleMobile}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.div
          initial={false}
          animate={{
            width: isCollapsed ? '80px' : '280px'
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={`
            hidden lg:flex flex-col bg-white border-r border-gray-200 shadow-sm
            fixed left-0 top-16 bottom-0 z-30
            ${isCollapsed ? 'w-20' : 'w-70'}
          `}
        >
          {/* Navigation starts from top */}
          <div className="pt-4"></div>

          {/* Navigation Menu */}
          <nav className="px-4 space-y-2">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className={`
                  flex items-center px-3 py-2.5 rounded-lg transition-all duration-200
                  ${isActiveRoute(item.path)
                    ? 'bg-[#010042] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                  ${isCollapsed ? 'justify-center' : 'justify-start'}
                `}
                title={isCollapsed ? item.label : ''}
              >
                <item.icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            ))}
          </nav>

          {/* Collapse Button - positioned right after menu */}
          <div className="px-4 pt-4">
            <button
              onClick={toggleCollapse}
              className="w-full p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center border border-gray-200"
            >
              {isCollapsed ? (
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="lg:hidden fixed left-0 top-16 bottom-0 w-80 bg-white border-r border-gray-200 shadow-lg z-50"
            >
              {/* Mobile Close Button */}
              <div className="flex items-center justify-end p-4">
                <button
                  onClick={toggleMobile}
                  className="p-1.5 rounded-lg hover:bg-gray-100"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 px-4 pb-4 space-y-2">
                {menuItems.map((item, index) => (
                  <Link
                    key={index}
                    to={item.path}
                    className={`
                      flex items-center px-3 py-2.5 rounded-lg transition-colors
                      ${isActiveRoute(item.path)
                        ? 'bg-[#010042] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                    onClick={toggleMobile}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div 
          className={`flex-1 transition-all duration-300 ${isMobileOpen ? 'lg:ml-0' : ''}`}
          style={{
            marginLeft: isCollapsed ? '80px' : '280px'
          }}
        >
          <div className="lg:hidden h-16"></div> {/* Spacer for mobile menu button */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSidebar; 