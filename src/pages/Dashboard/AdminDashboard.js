import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  UsersIcon, 
  BriefcaseIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { collection, getDocs, query, orderBy, limit, where, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { currentUser, userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGigs: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingOrders: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentGigs, setRecentGigs] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const [usersSnapshot, gigsSnapshot, ordersSnapshot] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'gigs')),
        getDocs(collection(db, 'orders'))
      ]);

      // Calculate stats
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const gigs = gigsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const totalRevenue = orders.reduce((sum, order) => sum + (order.price || 0), 0);
      const activeUsers = users.filter(user => user.isActive).length;
      const pendingOrders = orders.filter(order => order.status === 'pending').length;

      setStats({
        totalUsers: users.length,
        totalGigs: gigs.length,
        totalOrders: orders.length,
        totalRevenue,
        activeUsers,
        pendingOrders
      });

      // Get recent data
      const recentUsersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentUsersSnapshot = await getDocs(recentUsersQuery);
      setRecentUsers(recentUsersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const recentGigsQuery = query(
        collection(db, 'gigs'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentGigsSnapshot = await getDocs(recentGigsQuery);
      setRecentGigs(recentGigsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const recentOrdersQuery = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentOrdersSnapshot = await getDocs(recentOrdersQuery);
      setRecentOrders(recentOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('id-ID');
  };

  const quickActions = [
    { name: 'Manage Users', href: '/dashboard/admin/users', icon: UsersIcon, color: 'bg-blue-500' },
    { name: 'Manage Gigs', href: '/dashboard/admin/gigs', icon: BriefcaseIcon, color: 'bg-green-500' },
    { name: 'View Orders', href: '/dashboard/admin/orders', icon: CurrencyDollarIcon, color: 'bg-yellow-500' },
    { name: 'Analytics', href: '/dashboard/admin/analytics', icon: ChartBarIcon, color: 'bg-purple-500' },
  ];

  const statCards = [
    { name: 'Total Users', value: stats.totalUsers, icon: UsersIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Active Users', value: stats.activeUsers, icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-50' },
    { name: 'Total Gigs', value: stats.totalGigs, icon: BriefcaseIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Total Orders', value: stats.totalOrders, icon: CurrencyDollarIcon, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { name: 'Pending Orders', value: stats.pendingOrders, icon: ExclamationTriangleIcon, color: 'text-red-600', bg: 'bg-red-50' },
    { name: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: ChartBarIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  if (!userProfile?.roles?.includes('admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-2 text-lg font-medium text-gray-900">Access Denied</h1>
          <p className="mt-1 text-sm text-gray-500">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your SkillNusa platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={action.href}
                  className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${action.color}`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">{action.name}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Users */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Users</h3>
              <Link to="/dashboard/admin/users" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        {(user.displayName || user.username || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.displayName || user.username || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Gigs */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Gigs</h3>
              <Link to="/dashboard/admin/gigs" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recentGigs.map((gig) => (
                <div key={gig.id} className="border-l-4 border-green-400 pl-3">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">
                    {gig.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {gig.category} • {formatCurrency(gig.packages?.basic?.price || 0)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
              <Link to="/dashboard/admin/orders" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="border-l-4 border-yellow-400 pl-3">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(order.price)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.status} • {formatDate(order.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 