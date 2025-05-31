import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  startAfter,
  limit
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  EyeIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  StarIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function FreelancerAnalytics() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days
  const [analytics, setAnalytics] = useState({
    earnings: {
      total: 0,
      thisMonth: 0,
      lastMonth: 0,
      trend: 0
    },
    orders: {
      total: 0,
      completed: 0,
      pending: 0,
      cancelled: 0,
      conversionRate: 0
    },
    performance: {
      rating: 0,
      responseTime: 0,
      deliveryTime: 0,
      revisionRate: 0
    },
    views: {
      total: 0,
      thisMonth: 0,
      impressions: 0,
      clickThroughRate: 0
    }
  });
  
  const [earningsChart, setEarningsChart] = useState([]);
  const [topGigs, setTopGigs] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, [currentUser, timeRange]);

  const fetchAnalytics = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Calculate date ranges
      const now = new Date();
      const rangeStart = new Date(now.getTime() - (parseInt(timeRange) * 24 * 60 * 60 * 1000));
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch orders data
      const ordersQuery = query(
        collection(db, 'orders'),
        where('sellerId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = [];
      let totalEarnings = 0;
      let thisMonthEarnings = 0;
      let lastMonthEarnings = 0;
      let completedOrders = 0;
      let pendingOrders = 0;
      let cancelledOrders = 0;
      let totalDeliveryTime = 0;
      let deliveredCount = 0;
      let revisionCount = 0;

      ordersSnapshot.forEach(doc => {
        const order = { id: doc.id, ...doc.data() };
        const orderDate = order.createdAt?.toDate();
        
        orders.push(order);
        
        if (order.status === 'completed') {
          totalEarnings += order.amount || 0;
          completedOrders++;
          
          if (orderDate >= thisMonthStart) {
            thisMonthEarnings += order.amount || 0;
          }
          
          if (orderDate >= lastMonthStart && orderDate <= lastMonthEnd) {
            lastMonthEarnings += order.amount || 0;
          }
          
          // Calculate delivery time
          if (order.deliveredAt && order.createdAt) {
            const deliveryDays = Math.ceil((order.deliveredAt.toDate() - order.createdAt.toDate()) / (1000 * 60 * 60 * 24));
            totalDeliveryTime += deliveryDays;
            deliveredCount++;
          }
        } else if (order.status === 'pending') {
          pendingOrders++;
        } else if (order.status === 'cancelled') {
          cancelledOrders++;
        }
        
        if (order.status === 'in_revision') {
          revisionCount++;
        }
      });

      // Fetch gigs data
      const gigsQuery = query(
        collection(db, 'gigs'),
        where('userId', '==', currentUser.uid)
      );
      
      const gigsSnapshot = await getDocs(gigsQuery);
      const gigs = [];
      let totalViews = 0;
      let totalImpressions = 0;

      for (const doc of gigsSnapshot.docs) {
        const gig = { id: doc.id, ...doc.data() };
        
        // Get gig orders for performance metrics
        const gigOrders = orders.filter(order => order.gigId === doc.id);
        gig.orderCount = gigOrders.length;
        gig.revenue = gigOrders
          .filter(order => order.status === 'completed')
          .reduce((sum, order) => sum + (order.amount || 0), 0);
        
        gigs.push(gig);
        totalViews += gig.views || 0;
        totalImpressions += gig.impressions || 0;
      }

      // Fetch reviews for rating
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('sellerId', '==', currentUser.uid)
      );
      
      const reviewsSnapshot = await getDocs(reviewsQuery);
      let totalRating = 0;
      let reviewCount = 0;
      
      reviewsSnapshot.forEach(doc => {
        const review = doc.data();
        totalRating += review.rating || 0;
        reviewCount++;
      });

      // Calculate analytics
      const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;
      const averageDeliveryTime = deliveredCount > 0 ? totalDeliveryTime / deliveredCount : 0;
      const revisionRate = completedOrders > 0 ? (revisionCount / completedOrders) * 100 : 0;
      const conversionRate = totalViews > 0 ? (orders.length / totalViews) * 100 : 0;
      const clickThroughRate = totalImpressions > 0 ? (totalViews / totalImpressions) * 100 : 0;
      const earningsTrend = lastMonthEarnings > 0 ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 : 0;

      setAnalytics({
        earnings: {
          total: totalEarnings,
          thisMonth: thisMonthEarnings,
          lastMonth: lastMonthEarnings,
          trend: earningsTrend
        },
        orders: {
          total: orders.length,
          completed: completedOrders,
          pending: pendingOrders,
          cancelled: cancelledOrders,
          conversionRate: conversionRate
        },
        performance: {
          rating: averageRating,
          responseTime: 2, // This would be calculated from message data
          deliveryTime: averageDeliveryTime,
          revisionRate: revisionRate
        },
        views: {
          total: totalViews,
          thisMonth: totalViews, // This would be filtered by date range
          impressions: totalImpressions,
          clickThroughRate: clickThroughRate
        }
      });

      // Sort gigs by performance
      const sortedGigs = gigs
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      setTopGigs(sortedGigs);

      // Get recent orders
      const sortedOrders = orders
        .sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate())
        .slice(0, 10);
      setRecentOrders(sortedOrders);

      // Generate earnings chart data (simplified)
      const chartData = generateEarningsChart(orders, parseInt(timeRange));
      setEarningsChart(chartData);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateEarningsChart = (orders, days) => {
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayEarnings = orders
        .filter(order => {
          const orderDate = order.createdAt?.toDate();
          return order.status === 'completed' && 
                 orderDate >= dayStart && 
                 orderDate < dayEnd;
        })
        .reduce((sum, order) => sum + (order.amount || 0), 0);
      
      data.push({
        date: date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
        earnings: dayEarnings
      });
    }
    
    return data;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#010042]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Analytics
            </h1>
            <p className="text-gray-600">
              Pantau performa dan statistik gig Anda
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
            >
              <option value="7">7 hari terakhir</option>
              <option value="30">30 hari terakhir</option>
              <option value="90">90 hari terakhir</option>
              <option value="365">1 tahun terakhir</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {/* Total Earnings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className={`flex items-center text-sm ${
              analytics.earnings.trend >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {analytics.earnings.trend >= 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
              )}
              <span>{Math.abs(analytics.earnings.trend).toFixed(1)}%</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(analytics.earnings.total)}
          </h3>
          <p className="text-sm text-gray-600">Total Pendapatan</p>
          <p className="text-xs text-gray-500 mt-1">
            Bulan ini: {formatCurrency(analytics.earnings.thisMonth)}
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {analytics.orders.total}
          </h3>
          <p className="text-sm text-gray-600">Total Pesanan</p>
          <p className="text-xs text-gray-500 mt-1">
            Selesai: {analytics.orders.completed} • Pending: {analytics.orders.pending}
          </p>
        </div>

        {/* Profile Views */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <EyeIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {formatNumber(analytics.views.total)}
          </h3>
          <p className="text-sm text-gray-600">Total Views</p>
          <p className="text-xs text-gray-500 mt-1">
            CTR: {analytics.views.clickThroughRate.toFixed(1)}%
          </p>
        </div>

        {/* Average Rating */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <StarIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {analytics.performance.rating.toFixed(1)}
          </h3>
          <p className="text-sm text-gray-600">Rating Rata-rata</p>
          <p className="text-xs text-gray-500 mt-1">
            Delivery: {analytics.performance.deliveryTime.toFixed(1)} hari
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Earnings Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Tren Pendapatan
          </h2>
          <div className="h-64 flex items-end justify-between space-x-2">
            {earningsChart.map((data, index) => {
              const maxEarnings = Math.max(...earningsChart.map(d => d.earnings));
              const height = maxEarnings > 0 ? (data.earnings / maxEarnings) * 100 : 0;
              
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="relative group">
                    <div 
                      className="bg-[#010042] rounded-t-sm w-full transition-all duration-300 hover:bg-blue-700"
                      style={{ height: `${height * 2}px`, minHeight: data.earnings > 0 ? '4px' : '2px' }}
                    ></div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {formatCurrency(data.earnings)}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 mt-2 rotate-45 origin-left">
                    {data.date}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-lg p-6 relative overflow-hidden"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-8 relative">
            Metrik Performa
          </h2>
          <div className="grid grid-cols-2 gap-6 relative">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="p-3 bg-[#010042]/10 rounded-full transform transition-transform group-hover:scale-110">
                  <ClockIcon className="h-6 w-6 text-[#010042]" />
                </div>
                <span className="text-sm text-gray-600">Response Time</span>
                <span className="text-xl font-bold text-gray-900">
                  {analytics.performance.responseTime}h
                </span>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="p-3 bg-[#010042]/10 rounded-full transform transition-transform group-hover:scale-110">
                  <CalendarIcon className="h-6 w-6 text-[#010042]" />
                </div>
                <span className="text-sm text-gray-600">Delivery Time</span>
                <span className="text-xl font-bold text-gray-900">
                  {analytics.performance.deliveryTime.toFixed(1)} hari
                </span>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="p-3 bg-[#010042]/10 rounded-full transform transition-transform group-hover:scale-110">
                  <ChartBarIcon className="h-6 w-6 text-[#010042]" />
                </div>
                <span className="text-sm text-gray-600">Conversion Rate</span>
                <span className="text-xl font-bold text-gray-900">
                  {analytics.orders.conversionRate.toFixed(1)}%
                </span>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="p-3 bg-[#010042]/10 rounded-full transform transition-transform group-hover:scale-110">
                  <UserGroupIcon className="h-6 w-6 text-[#010042]" />
                </div>
                <span className="text-sm text-gray-600">Revision Rate</span>
                <span className="text-xl font-bold text-gray-900">
                  {analytics.performance.revisionRate.toFixed(1)}%
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Top Performing Gigs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Gig Terbaik
          </h2>
          <div className="space-y-4">
            {topGigs.map((gig, index) => (
              <div key={gig.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#010042] text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">{gig.title}</h4>
                    <p className="text-xs text-gray-500">{gig.orderCount} pesanan</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(gig.revenue)}
                  </p>
                  <p className="text-xs text-gray-500">{gig.views} views</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Pesanan Terbaru
          </h2>
          <div className="space-y-3">
            {recentOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    #{order.id.slice(-6)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.createdAt?.toDate().toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <p className="text-xs text-gray-600 mt-1">
                    {formatCurrency(order.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 