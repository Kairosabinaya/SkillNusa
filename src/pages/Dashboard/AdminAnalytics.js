import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  ChartBarIcon,
  UsersIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  where,
  limit 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

function AdminAnalytics() {
  const { userProfile } = useAuth();
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalGigs: 0,
    totalOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeUsers: 0,
    freelancersCount: 0,
    clientsCount: 0,
    completedOrders: 0,
    pendingOrders: 0,
    userGrowthRate: 0,
    orderGrowthRate: 0,
    revenueGrowthRate: 0
  });
  const [categoryStats, setCategoryStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [usersSnapshot, gigsSnapshot, ordersSnapshot] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'gigs')),
        getDocs(collection(db, 'orders'))
      ]);

      // Process users data
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const totalUsers = users.length;
      const activeUsers = users.filter(user => user.isActive !== false).length;
      const freelancersCount = users.filter(user => user.isFreelancer).length;
      const clientsCount = users.filter(user => !user.isFreelancer).length;

      // Process gigs data
      const gigs = gigsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const totalGigs = gigs.length;

      // Process orders data
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const totalOrders = orders.length;
      const completedOrders = orders.filter(order => order.status === 'completed').length;
      const pendingOrders = orders.filter(order => order.status === 'pending').length;

      // Calculate revenue
      const totalRevenue = orders.reduce((sum, order) => sum + (order.price || 0), 0);
      
      // Calculate monthly revenue (current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = orders
        .filter(order => {
          if (!order.createdAt) return false;
          const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
          return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        })
        .reduce((sum, order) => sum + (order.price || 0), 0);

      // Calculate growth rates (simplified - comparing last 30 days vs previous 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const recentUsers = users.filter(user => {
        if (!user.createdAt) return false;
        const createdDate = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        return createdDate >= thirtyDaysAgo;
      }).length;

      const previousUsers = users.filter(user => {
        if (!user.createdAt) return false;
        const createdDate = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        return createdDate >= sixtyDaysAgo && createdDate < thirtyDaysAgo;
      }).length;

      const userGrowthRate = previousUsers > 0 ? ((recentUsers - previousUsers) / previousUsers) * 100 : 0;

      // Category statistics
      const categoryMap = {};
      gigs.forEach(gig => {
        if (gig.category) {
          categoryMap[gig.category] = (categoryMap[gig.category] || 0) + 1;
        }
      });

      const categoryStats = Object.entries(categoryMap)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Recent activity (simplified)
      const recentGigs = gigs
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateB - dateA;
        })
        .slice(0, 5);

      const recentOrders = orders
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateB - dateA;
        })
        .slice(0, 5);

      setAnalytics({
        totalUsers,
        totalGigs,
        totalOrders,
        totalRevenue,
        monthlyRevenue,
        activeUsers,
        freelancersCount,
        clientsCount,
        completedOrders,
        pendingOrders,
        userGrowthRate,
        orderGrowthRate: 0, // Simplified for now
        revenueGrowthRate: 0 // Simplified for now
      });

      setCategoryStats(categoryStats);
      
      setRecentActivity([
        ...recentGigs.map(gig => ({ type: 'gig', data: gig })),
        ...recentOrders.map(order => ({ type: 'order', data: order }))
      ].slice(0, 10));

    } catch (error) {
      console.error('Error fetching analytics data:', error);
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

  if (!userProfile?.roles?.includes('admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-2 text-lg font-medium text-gray-900">Access Denied</h1>
          <p className="mt-1 text-sm text-gray-500">You don't have permission to access this page.</p>
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

  const statCards = [
    {
      name: 'Total Users',
      value: analytics.totalUsers,
      icon: UsersIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      growth: analytics.userGrowthRate
    },
    {
      name: 'Total Gigs',
      value: analytics.totalGigs,
      icon: BriefcaseIcon,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      name: 'Total Orders',
      value: analytics.totalOrders,
      icon: ChartBarIcon,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      name: 'Total Revenue',
      value: formatCurrency(analytics.totalRevenue),
      icon: CurrencyDollarIcon,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50'
    },
    {
      name: 'Monthly Revenue',
      value: formatCurrency(analytics.monthlyRevenue),
      icon: ArrowTrendingUpIcon,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      name: 'Active Users',
      value: analytics.activeUsers,
      icon: UsersIcon,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Platform performance and insights</p>
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
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  {stat.growth !== undefined && (
                    <div className={`flex items-center mt-1 ${stat.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.growth >= 0 ? (
                        <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                      ) : (
                        <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
                      )}
                      <span className="text-sm font-medium">
                        {Math.abs(stat.growth).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Analytics */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Analytics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Users</span>
                <span className="font-medium">{analytics.totalUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Users</span>
                <span className="font-medium">{analytics.activeUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Freelancers</span>
                <span className="font-medium">{analytics.freelancersCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Clients</span>
                <span className="font-medium">{analytics.clientsCount}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Growth Rate (30 days)</span>
                  <span className={`font-medium ${analytics.userGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.userGrowthRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Order Analytics */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Analytics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Orders</span>
                <span className="font-medium">{analytics.totalOrders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed Orders</span>
                <span className="font-medium text-green-600">{analytics.completedOrders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending Orders</span>
                <span className="font-medium text-yellow-600">{analytics.pendingOrders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="font-medium">
                  {analytics.totalOrders > 0 ? ((analytics.completedOrders / analytics.totalOrders) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Category Performance & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Categories</h3>
            <div className="space-y-3">
              {categoryStats.map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 truncate">{category.category}</span>
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2">{category.count}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ 
                          width: `${(category.count / Math.max(...categoryStats.map(c => c.count))) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.slice(0, 8).map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                    activity.type === 'gig' ? 'bg-green-400' : 'bg-blue-400'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {activity.type === 'gig' ? 'New gig:' : 'New order:'} {activity.data.title || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(activity.data.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default AdminAnalytics; 