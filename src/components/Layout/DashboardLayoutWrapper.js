import React from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CollapsibleSidebar from './CollapsibleSidebar';
import {
  HomeIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  BriefcaseIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  BellIcon,
  DocumentTextIcon,
  HeartIcon,
  ShoppingCartIcon,
  CogIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const DashboardLayoutWrapper = ({ children }) => {
  const { userProfile } = useAuth();
  const location = useLocation();

  // Determine user role based on route and user profile
  const getUserRole = () => {
    // Check route first
    if (location.pathname.startsWith('/dashboard/freelancer')) {
      return 'freelancer';
    } else if (location.pathname.startsWith('/dashboard/admin')) {
      return 'admin';
    } else if (location.pathname.startsWith('/dashboard/client')) {
      return 'client';
    } else if (location.pathname === '/dashboard') {
      // For root dashboard, check user profile
      if (userProfile?.roles?.includes('freelancer') || userProfile?.isFreelancer) {
        return 'freelancer';
      } else if (userProfile?.roles?.includes('admin') || userProfile?.isAdmin) {
        return 'admin';
      } else {
        return 'client';
      }
    }
    
    // Default to client
    return 'client';
  };

  const userRole = getUserRole();

  // Define menu items based on user role
  const getMenuItems = () => {
    if (userRole === 'freelancer') {
      return [
        {
          label: 'Dashboard',
          path: '/dashboard/freelancer',
          icon: HomeIcon
        },
        {
          label: 'Panduan Freelancer',
          path: '/dashboard/freelancer/guides',
          icon: UserGroupIcon
        },
        {
          label: 'Gigs',
          path: '/dashboard/freelancer/gigs',
          icon: BriefcaseIcon
        },
        {
          label: 'Pesanan',
          path: '/dashboard/freelancer/orders',
          icon: DocumentTextIcon
        },
        {
          label: 'Analitik',
          path: '/dashboard/freelancer/analytics',
          icon: ChartBarIcon
        },
        {
          label: 'Dompet',
          path: '/dashboard/freelancer/wallet',
          icon: CurrencyDollarIcon
        }
      ];
    } else if (userRole === 'admin') {
      return [
        {
          label: 'Dashboard Admin',
          path: '/dashboard/admin',
          icon: HomeIcon
        },
        {
          label: 'Kelola Pengguna',
          path: '/dashboard/admin/users',
          icon: UserGroupIcon
        },
        {
          label: 'Kelola Gigs',
          path: '/dashboard/admin/gigs',
          icon: BriefcaseIcon
        }
      ];
    } else {
      // Client menu items
      return [
        {
          label: 'Dashboard',
          path: '/dashboard/client',
          icon: HomeIcon
        },

        {
          label: 'Favorites',
          path: '/dashboard/client/favorites',
          icon: HeartIcon
        },
        {
          label: 'Cart',
          path: '/dashboard/client/cart',
          icon: ShoppingCartIcon
        },
        {
          label: 'Transactions',
          path: '/dashboard/client/transactions',
          icon: CurrencyDollarIcon
        }
      ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <CollapsibleSidebar 
      menuItems={menuItems}
      userRole={userRole}
    >
      {children || <Outlet />}
    </CollapsibleSidebar>
  );
};

export default DashboardLayoutWrapper; 