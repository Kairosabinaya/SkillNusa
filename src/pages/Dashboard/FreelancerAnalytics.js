import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  startAfter,
  limit,
  doc,
  getDoc
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days
  // Removed chartTimeRange - using fixed 7 days only
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
  const [recentOrders, setRecentOrders] = useState([]); // All orders for chart
  const [recentOrdersDisplay, setRecentOrdersDisplay] = useState([]); // Recent orders for display

  useEffect(() => {
    fetchAnalytics();
  }, [currentUser, timeRange]);

  useEffect(() => {
    // Re-generate chart when orders change (7 days only)

    const chartData = generateEarningsChart(recentOrders, 7);
    setEarningsChart(chartData);
  }, [recentOrders]);

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

      // Fetch orders data with both field names for compatibility
      const ordersQueryPrimary = query(
        collection(db, 'orders'),
        where('freelancerId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      const ordersQueryFallback = query(
        collection(db, 'orders'),
        where('sellerId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      const [ordersSnapshotPrimary, ordersSnapshotFallback] = await Promise.all([
        getDocs(ordersQueryPrimary).catch(() => ({ docs: [] })),
        getDocs(ordersQueryFallback).catch(() => ({ docs: [] }))
      ]);
      
      const orders = [];
      const processedOrderIds = new Set();
      let totalEarnings = 0;
      let thisMonthEarnings = 0;
      let lastMonthEarnings = 0;
      let completedOrders = 0;
      let pendingOrders = 0;
      let cancelledOrders = 0;
      let totalDeliveryTime = 0;
      let deliveredCount = 0;
      let revisionCount = 0;

      // Process both snapshots to avoid duplicates
      [ordersSnapshotPrimary, ordersSnapshotFallback].forEach(snapshot => {
        snapshot.forEach(doc => {
          if (!processedOrderIds.has(doc.id)) {
            processedOrderIds.add(doc.id);
            const order = { id: doc.id, ...doc.data() };
            const orderDate = order.createdAt?.toDate();
            
            orders.push(order);
        
        if (order.status === 'completed') {
          // Use freelancerEarning field instead of amount
          const earnings = order.freelancerEarning || order.amount || 0;
          totalEarnings += earnings;
          completedOrders++;
          
          if (orderDate >= thisMonthStart) {
            thisMonthEarnings += earnings;
          }
          
          if (orderDate >= lastMonthStart && orderDate <= lastMonthEnd) {
            lastMonthEarnings += earnings;
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
        
            if (order.status === 'in_revision' || order.revisionCount > 0) {
              revisionCount++;
            }
          }
        });
      });

      // Fetch gigs data with both field names for compatibility
      const gigsQueryPrimary = query(
        collection(db, 'gigs'),
        where('freelancerId', '==', currentUser.uid)
      );
      
      const gigsQueryFallback = query(
        collection(db, 'gigs'),
        where('userId', '==', currentUser.uid)
      );
      
      const [gigsSnapshotPrimary, gigsSnapshotFallback] = await Promise.all([
        getDocs(gigsQueryPrimary),
        getDocs(gigsQueryFallback)
      ]);
      
      const gigs = [];
      const processedGigIds = new Set();
      let totalViews = 0;
      let totalImpressions = 0;

      // Process both snapshots to avoid duplicates
      [gigsSnapshotPrimary, gigsSnapshotFallback].forEach(snapshot => {
        snapshot.forEach(doc => {
          if (!processedGigIds.has(doc.id)) {
            processedGigIds.add(doc.id);
            const gig = { id: doc.id, ...doc.data() };
            
            // Get gig orders for performance metrics
            const gigOrders = orders.filter(order => order.gigId === doc.id);
            gig.orderCount = gigOrders.length;
            gig.revenue = gigOrders
              .filter(order => order.status === 'completed')
              .reduce((sum, order) => sum + (order.freelancerEarning || order.amount || 0), 0);
            
            gigs.push(gig);
            totalViews += gig.views || 0;
            totalImpressions += gig.impressions || 0;
          }
        });
      });

      // Fetch reviews for rating using correct field
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('freelancerId', '==', currentUser.uid)
      );
      
      const reviewsSnapshot = await getDocs(reviewsQuery);
      let totalRating = 0;
      let reviewCount = 0;
      
      reviewsSnapshot.forEach(doc => {
        const review = doc.data();
        totalRating += review.rating || 0;
        reviewCount++;
      });

      // Fetch gig ratings and add to gigs
      const gigsWithRatings = await Promise.all(
        gigs.map(async (gig) => {
          const gigReviewsQuery = query(
            collection(db, 'reviews'),
            where('gigId', '==', gig.id)
          );
          
          const gigReviewsSnapshot = await getDocs(gigReviewsQuery);
          let gigTotalRating = 0;
          let gigReviewCount = 0;
          
          gigReviewsSnapshot.forEach(reviewDoc => {
            const review = reviewDoc.data();
            gigTotalRating += review.rating || 0;
            gigReviewCount++;
          });
          
          return {
            ...gig,
            rating: gigReviewCount > 0 ? gigTotalRating / gigReviewCount : 0,
            reviewCount: gigReviewCount
          };
        })
      );

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
      const sortedGigs = gigsWithRatings
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      setTopGigs(sortedGigs);

      // Get recent orders with detailed info and store all orders for chart generation
      const ordersWithDetails = await Promise.all(
        orders.slice(0, 10).map(async (order) => {
          let gigTitle = 'Gig Tidak Diketahui';
          let clientName = 'Client Tidak Diketahui';
          
          // Fetch gig title
          if (order.gigId) {
            try {
              const gigDoc = await getDoc(doc(db, 'gigs', order.gigId));
              if (gigDoc.exists()) {
                gigTitle = gigDoc.data().title || gigTitle;
              }
            } catch (error) {
              // Silent error handling
            }
          }
          
          // Fetch client name
          if (order.clientId) {
            try {
              const clientDoc = await getDoc(doc(db, 'users', order.clientId));
              if (clientDoc.exists()) {
                clientName = clientDoc.data().displayName || clientName;
              }
            } catch (error) {
              // Silent error handling
            }
          }
          
          return {
            ...order,
            gigTitle,
            clientName
          };
        })
      );
      
      setRecentOrders(orders); // Store all orders for chart generation
      setRecentOrdersDisplay(ordersWithDetails); // Store recent orders for display

              // Generate earnings chart data (7 days only)
        const chartData = generateEarningsChart(orders, 7);
        setEarningsChart(chartData);

    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const generateEarningsChart = (orders, days = 7) => {
    const data = [];
    const now = new Date();
    

    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayEarnings = orders
        .filter(order => {
          const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
          return order.status === 'completed' && 
                 orderDate >= dayStart && 
                 orderDate < dayEnd;
        })
        .reduce((sum, order) => sum + (order.freelancerEarning || order.amount || 0), 0);
      
      const formattedDate = date.toLocaleDateString('id-ID', { weekday: 'short' });
      
      data.push({
        date: formattedDate,
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
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

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Selesai';
      case 'pending':
        return 'Menunggu';
      case 'active':
        return 'Aktif';
      case 'cancelled':
        return 'Dibatalkan';
      case 'in_progress':
        return 'Dalam Proses';
      case 'in_revision':
        return 'Revisi';
      default:
        return status;
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

      {/* Analytics Overview */}
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
            <div className="flex items-center">
              {analytics.earnings.trend >= 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                analytics.earnings.trend >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {Math.abs(analytics.earnings.trend).toFixed(1)}%
              </span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(analytics.earnings.total)}
          </h3>
          <p className="text-sm text-gray-600">Total Pendapatan</p>
          <p className="text-xs text-gray-500 mt-1">
            Bulan ini: {formatCurrency(analytics.earnings.thisMonth)}
          </p>
          <p className="text-xs text-orange-600 mt-1 font-medium">
            Sudah dipotong platform fee 10%
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

      <div className="grid grid-cols-1 gap-8">
        {/* Earnings Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Tren Pendapatan (7 Hari)
          </h2>
          
          {earningsChart.length > 0 && earningsChart.some(d => d.earnings > 0) ? (
            <div className="h-64 relative w-full">
              <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                {/* Grid lines */}
                <defs>
                  <pattern id="grid" width="80" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 80 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect x="60" y="20" width="720" height="160" fill="url(#grid)" />
                
                {/* Y-axis */}
                <line x1="60" y1="20" x2="60" y2="180" stroke="#d1d5db" strokeWidth="1"/>
                
                {/* X-axis */}
                <line x1="60" y1="180" x2="780" y2="180" stroke="#d1d5db" strokeWidth="1"/>
                
                {/* Chart line and Y-axis labels */}
                {(() => {
                  const maxEarnings = Math.max(...earningsChart.map(d => d.earnings), 1);
                  const chartWidth = 720;
                  const chartHeight = 160;
                  const marginLeft = 60;
                  const marginTop = 20;
                  
                  // Generate Y-axis labels
                  const yLabels = [];
                  const labelCount = 5;
                  for (let i = 0; i <= labelCount; i++) {
                    const value = (maxEarnings / labelCount) * i;
                    const y = 180 - (i / labelCount) * chartHeight;
                    yLabels.push(
                      <g key={`y-label-${i}`}>
                        <text
                          x="55"
                          y={y + 3}
                          textAnchor="end"
                          className="text-xs fill-gray-500"
                          style={{ fontSize: '10px' }}
                        >
                          {value > 1000 ? `${Math.round(value/1000)}K` : Math.round(value)}
                        </text>
                        <line x1="58" y1={y} x2="62" y2={y} stroke="#9ca3af" strokeWidth="1"/>
                      </g>
                    );
                  }
                  
                  if (earningsChart.length === 1) {
                    // Special case for single data point
                    const x = marginLeft + chartWidth / 2;
                    const y = 180 - (earningsChart[0].earnings / maxEarnings) * chartHeight;
                    
                    return (
                      <>
                        {yLabels}
                        <g key={0}>
                          <circle
                            cx={x}
                            cy={y}
                            r="6"
                            fill="#3b82f6"
                            className="cursor-pointer"
                          />
                          <text
                            x={x}
                            y="195"
                            textAnchor="middle"
                            className="text-xs fill-gray-500"
                          >
                            {earningsChart[0].date}
                          </text>
                          <title>{formatCurrency(earningsChart[0].earnings)}</title>
                        </g>
                      </>
                    );
                  }
                  
                  const points = earningsChart.map((data, index) => {
                    const x = marginLeft + (index / (earningsChart.length - 1)) * chartWidth;
                    const y = 180 - (data.earnings / maxEarnings) * chartHeight;
                    return `${x},${y}`;
                  }).join(' ');
                  
                  return (
                    <>
                      {yLabels}
                      {earningsChart.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2"
                          points={points}
                        />
                      )}
                      {earningsChart.map((data, index) => {
                        const x = marginLeft + (index / (earningsChart.length - 1)) * chartWidth;
                        const y = 180 - (data.earnings / maxEarnings) * chartHeight;
                        return (
                          <g key={index}>
                            <circle
                              cx={x}
                              cy={y}
                              r="4"
                              fill="#3b82f6"
                              className="hover:r-6 transition-all cursor-pointer"
                            />
                            <text
                              x={x}
                              y="195"
                              textAnchor="middle"
                              className="text-xs fill-gray-500"
                              style={{ fontSize: '10px' }}
                            >
                              {data.date}
                            </text>
                            <title>{formatCurrency(data.earnings)}</title>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-500">
              <ChartBarIcon className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-400 mb-2">Belum Ada Data Pendapatan</p>
              <p className="text-sm text-gray-400 text-center">
                Mulai menerima pesanan untuk melihat tren pendapatan Anda
              </p>
            </div>
          )}
        </motion.div>

        {/* Bottom Section with Gigs and Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
          {topGigs.length > 0 ? (
            <div className="space-y-4">
              {topGigs.map((gig, index) => (
                <motion.div 
                  key={gig.id}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all p-4"
                >
                  <div className="flex items-start gap-4">
                    {/* Gig Image/Icon */}
                    <div className="flex-shrink-0">
                      {gig.images && gig.images.length > 0 ? (
                        <img 
                          src={gig.images[0]} 
                          alt={gig.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-[#010042] to-blue-700 rounded-lg flex items-center justify-center">
                          <DocumentTextIcon className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>
                    
                                         {/* Gig Details */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 leading-tight">
                          {gig.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {gig.category} • Mulai dari {formatPrice(
                            gig.packages?.basic?.price || 
                            gig.startingPrice || 
                            gig.price || 
                            100000
                          )}
                        </p>
                      </div>
                      
                      {/* Stats */}
                      <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <EyeIcon className="h-4 w-4" />
                          <span>{formatNumber(gig.views || 0)} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ChartBarIcon className="h-4 w-4" />
                          <span>{gig.orderCount || 0} orders</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <StarIcon className={`h-4 w-4 ${gig.rating > 0 ? 'text-yellow-400' : 'text-gray-400'}`} />
                          <span>
                            {gig.rating > 0 ? `${gig.rating.toFixed(1)} (${gig.reviewCount})` : 'Belum ada rating'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-3">
                        <Link 
                          to={`/gig/${gig.id}`}
                          target="_blank"
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          <EyeIcon className="h-4 w-4" />
                          Lihat
                        </Link>
                        <button 
                          onClick={() => navigate(`/dashboard/freelancer/gigs`)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm('Apakah Anda yakin ingin menghapus gig ini?')) {
      
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <StarIcon className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-400 mb-2">Belum Ada Gig Terbaik</p>
              <p className="text-sm text-gray-400 text-center">
                Buat gig dan mulai menerima pesanan untuk melihat performa gig terbaik Anda
              </p>
            </div>
          )}
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
          {recentOrdersDisplay.length > 0 ? (
            <div className="space-y-3">
              {recentOrdersDisplay.slice(0, 5).map((order) => (
                <div key={order.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
                      {order.gigTitle}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {order.orderNumber || `#${order.id.slice(-6)}`}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span>{order.createdAt?.toDate().toLocaleDateString('id-ID')}</span>
                    <span>{order.clientName}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(order.freelancerEarning || order.price || order.totalAmount || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <DocumentTextIcon className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-400 mb-2">Belum Ada Pesanan</p>
              <p className="text-sm text-gray-400 text-center">
                Pesanan terbaru Anda akan muncul di sini setelah ada yang memesan gig Anda
              </p>
            </div>
          )}
        </motion.div>
        </div>
      </div>
    </div>
  );
} 