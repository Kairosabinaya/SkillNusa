import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import orderService from '../services/orderService';
import { formatPrice } from '../utils/helpers';

export default function Transactions() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadOrders();
  }, [currentUser]);

  const loadOrders = async () => {
    console.log('🔍 [Transactions] loadOrders called with currentUser:', currentUser?.uid);
    
    if (!currentUser) {
      console.log('❌ [Transactions] No currentUser, returning early');
      return;
    }
    
    try {
      setLoading(true);
      console.log('📡 [Transactions] Fetching orders for user:', currentUser.uid);
      
      const ordersWithDetails = await orderService.getOrdersWithDetails(currentUser.uid, 'client');
      
      console.log('📥 [Transactions] Orders received:', {
        userId: currentUser.uid,
        count: ordersWithDetails?.length || 0,
        orders: ordersWithDetails
      });
      
      // Debug each order
      if (ordersWithDetails && ordersWithDetails.length > 0) {
        ordersWithDetails.forEach((order, index) => {
          console.log(`📋 [Transactions] Order ${index + 1}:`, {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            clientId: order.clientId,
            freelancerId: order.freelancerId,
            gigId: order.gigId,
            title: order.title,
            price: order.price,
            createdAt: order.createdAt,
            gig: order.gig,
            freelancer: order.freelancer
          });
        });
      } else {
        console.log('⚠️ [Transactions] No orders data received or empty array');
      }
      
      setOrders(ordersWithDetails || []);
    } catch (error) {
      console.error('💥 [Transactions] Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return dateObj.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Menunggu Konfirmasi', color: 'bg-yellow-100 text-yellow-800' },
      active: { label: 'Sedang Dikerjakan', color: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'Sedang Dikerjakan', color: 'bg-blue-100 text-blue-800' },
      in_revision: { label: 'Dalam Revisi', color: 'bg-orange-100 text-orange-800' },
      delivered: { label: 'Menunggu Review', color: 'bg-purple-100 text-purple-800' },
      completed: { label: 'Selesai', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800' },
      rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const filteredOrders = orders.filter(order => {
    let matchesTab = false;
    
    if (activeTab === 'all') {
      matchesTab = true;
    } else if (activeTab === 'pending') {
      matchesTab = order.status === 'pending';
    } else if (activeTab === 'in_progress') {
      matchesTab = ['active', 'in_progress', 'in_revision', 'delivered'].includes(order.status);
    } else if (activeTab === 'completed') {
      matchesTab = order.status === 'completed';
    } else if (activeTab === 'cancelled') {
      matchesTab = ['cancelled', 'rejected'].includes(order.status);
    } else {
      matchesTab = order.status === activeTab;
    }
    
    const matchesSearch = !searchQuery || 
      order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.freelancer?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesDate = true;
    if (dateFilter) {
      const orderDate = order.createdAt.seconds ? new Date(order.createdAt.seconds * 1000) : new Date(order.createdAt);
      const filterDate = new Date(dateFilter);
      matchesDate = orderDate.toDateString() === filterDate.toDateString();
    }

    return matchesTab && matchesSearch && matchesDate;
  });

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    in_progress: orders.filter(o => ['active', 'in_progress', 'in_revision', 'delivered'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => ['cancelled', 'rejected'].includes(o.status)).length
  };

  const tabs = [
    { id: 'all', label: 'Semua', count: statusCounts.all },
    { id: 'pending', label: 'Menunggu Konfirmasi', count: statusCounts.pending },
    { id: 'in_progress', label: 'Sedang Dikerjakan', count: statusCounts.in_progress },
    { id: 'completed', label: 'Selesai', count: statusCounts.completed },
    { id: 'cancelled', label: 'Dibatalkan', count: statusCounts.cancelled }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 ">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm">
              <div className="h-16 bg-gray-300 rounded-t-lg mb-4"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border-b border-gray-200 p-6">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Daftar Transaksi</h1>
          <p className="text-gray-600">Kelola semua pesanan layanan Anda</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari transaksi, freelancer, atau ID pesanan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Date Filter */}
              <div className="md:w-48">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                />
              </div>

              {/* Reset Filter */}
              {(searchQuery || dateFilter) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setDateFilter('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* Status Tabs */}
          <div className="border-b border-gray-100">
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 ${
                    activeTab === tab.id
                      ? 'border-[#010042] text-[#010042]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id ? 'bg-[#010042] text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Belum Ada Transaksi</h3>
              <p className="text-gray-500 mb-6">Mulai pesan layanan untuk melihat transaksi Anda</p>
              <Link 
                to="/browse" 
                className="inline-flex items-center px-6 py-3 bg-[#010042] text-white rounded-lg hover:bg-[#0100a3] transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Jelajahi Layanan
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Order Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </div>
                        <span className="text-gray-300">•</span>
                        <div className="text-sm font-medium text-gray-900">
                          #{order.id.slice(-8).toUpperCase()}
                        </div>
                        <div>
                          {getStatusBadge(order.status)}
                        </div>
                      </div>

                      {/* Order Content */}
                      <div className="flex items-start gap-4">
                        {/* Gig Image */}
                        <div className="flex-shrink-0">
                          <img 
                            src={order.gig?.images?.[0] || 'https://picsum.photos/80/80'} 
                            alt={order.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        </div>

                        {/* Order Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-[#010042] hover:underline transition-colors mb-2">
                            {order.title}
                          </h3>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <img 
                              src={order.freelancer?.profilePhoto || 'https://picsum.photos/24/24'} 
                              alt={order.freelancer?.displayName}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="text-sm text-gray-600">
                              {order.freelancer?.displayName || 'Freelancer'}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Paket: {order.packageType === 'basic' ? 'Dasar' : 
                                           order.packageType === 'standard' ? 'Standar' : 'Premium'}</span>
                            <span>•</span>
                            <span>Waktu: {order.deliveryTime}</span>
                            {order.status === 'completed' && order.completedAt && (
                              <>
                                <span>•</span>
                                <span>Selesai: {formatDate(order.completedAt)}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Price and Actions */}
                        <div className="flex-shrink-0 text-right">
                          <div className="text-lg font-bold text-gray-900 mb-3">
                            {formatPrice(order.price)}
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            {/* Detail Button - goes to transaction detail */}
                            <Link
                              to={`/dashboard/client/transactions/${order.id}`}
                              className="text-sm bg-[#010042] text-white px-4 py-2 rounded-lg hover:bg-[#0100a3] transition-colors text-center"
                            >
                              Lihat Detail
                            </Link>
                            
                            {/* Chat Button - for ongoing orders */}
                            {['pending', 'active', 'in_progress', 'in_revision', 'delivered'].includes(order.status) && (
                              <Link
                                to={`/messages?freelancerId=${order.freelancerId}&orderId=${order.id}`}
                                className="text-sm border border-[#010042] text-[#010042] px-4 py-2 rounded-lg hover:bg-[#010042] hover:text-white transition-colors text-center"
                              >
                                Chat
                              </Link>
                            )}
                            
                            {/* Buy Again Button - for completed orders */}
                            {order.status === 'completed' && (
                              <Link
                                to={`/gig/${order.gigId}`}
                                className="text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-center"
                              >
                                Beli Lagi
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {orders.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-gray-900">
                {orders.length}
              </div>
              <div className="text-sm text-gray-600">Total Pesanan</div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-green-600">
                {statusCounts.completed}
              </div>
              <div className="text-sm text-gray-600">Selesai</div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-blue-600">
                {statusCounts.in_progress}
              </div>
              <div className="text-sm text-gray-600">Sedang Dikerjakan</div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-[#010042]">
                {formatPrice(orders.reduce((sum, order) => sum + (order.price || 0), 0))}
              </div>
              <div className="text-sm text-gray-600">Total Belanja</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 