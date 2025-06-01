import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  doc,
  updateDoc,
  addDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import orderService from '../../services/orderService';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  PaperClipIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import ErrorPopup from '../../components/common/ErrorPopup';
import SuccessPopup from '../../components/common/SuccessPopup';

export default function FreelancerOrders() {
  const { orderId } = useParams();
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    pending: 0,
    cancelled: 0
  });

  useEffect(() => {
    fetchOrders();
  }, [currentUser]);

  useEffect(() => {
    if (orderId) {
      const order = orders.find(o => o.id === orderId);
      setSelectedOrder(order);
    }
  }, [orderId, orders]);

  const fetchOrders = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      console.log('🔍 [FreelancerOrders] Fetching orders for freelancer:', currentUser.uid);
      
      // Use OrderService with details to get client data properly
      const ordersData = await orderService.getOrdersWithDetails(currentUser.uid, 'freelancer');
      
      console.log('📥 [FreelancerOrders] Orders received:', {
        count: ordersData.length,
        orders: ordersData.map(o => ({ id: o.id, status: o.status, title: o.title }))
      });

      // Debug: Check client data for each order
      ordersData.forEach((order, index) => {
        console.log(`🧪 [FreelancerOrders] Order ${index + 1} detailed data:`, {
          id: order.id,
          title: order.title,
          status: order.status,
          price: order.price,
          amount: order.amount,
          totalPrice: order.totalPrice,
          clientId: order.clientId,
          client: order.client,
          freelancerId: order.freelancerId,
          allFields: Object.keys(order)
        });
      });

      // Calculate stats with better status handling
      let statusCounts = { total: 0, active: 0, completed: 0, pending: 0, cancelled: 0 };
      
      ordersData.forEach(order => {
        statusCounts.total++;
        console.log('📊 [FreelancerOrders] Processing order status:', { 
          id: order.id, 
          status: order.status, 
          title: order.title 
        });
        
        // More comprehensive status categorization
        if (order.status === 'active' || 
            order.status === 'in_progress' || 
            order.status === 'in_revision' ||
            order.status === 'delivered') {
          statusCounts.active++;
        } else if (order.status === 'completed') {
          statusCounts.completed++;
        } else if (order.status === 'pending' || order.status === 'awaiting_confirmation') {
          statusCounts.pending++;
        } else if (order.status === 'cancelled' || order.status === 'rejected') {
          statusCounts.cancelled++;
        } else {
          // Unknown status, treat as pending for now
          console.warn('📊 [FreelancerOrders] Unknown order status:', order.status);
          statusCounts.pending++;
        }
      });

      console.log('📊 [FreelancerOrders] Final status counts:', statusCounts);

      setOrders(ordersData);
      setStats(statusCounts);
      
      console.log('✅ [FreelancerOrders] Orders state updated:', {
        orders: ordersData.length,
        stats: statusCounts
      });
    } catch (error) {
      console.error('💥 [FreelancerOrders] Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus, message = '') => {
    try {
      console.log('🔄 [FreelancerOrders] Updating order status:', { orderId, newStatus, message });
      
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...(message && { statusMessage: message })
      });

      // Find the order to get clientId
      const order = orders.find(o => o.id === orderId);
      if (order) {
        // Send notification to client (not buyer)
        await addDoc(collection(db, 'notifications'), {
          userId: order.clientId,
          type: 'order_update',
          message: `Status pesanan ${orderId.slice(-8)} diubah menjadi ${getStatusText(newStatus)}`,
          orderId: orderId,
          createdAt: serverTimestamp(),
          read: false
        });
      }

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, statusMessage: message }
            : order
        )
      );

      // Update selected order if it's the current one
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ 
          ...prev, 
          status: newStatus, 
          statusMessage: message 
        }));
      }
      
      // Refresh orders to get updated data
      fetchOrders();
      
      setSuccess('Status pesanan berhasil diupdate');
    } catch (error) {
      console.error('💥 [FreelancerOrders] Error updating order status:', error);
      setError('Gagal mengupdate status pesanan. Silakan coba lagi.');
    }
  };

  const deliverOrder = async () => {
    if (!deliveryMessage.trim()) {
      setError('Pesan delivery harus diisi');
      return;
    }

    try {
      setIsUploading(true);
      
      // Prepare delivery data
      const deliveryData = {
        status: 'delivered',
        deliveryMessage: deliveryMessage,
        deliveredAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add file information if files are attached
      if (attachedFiles.length > 0) {
        deliveryData.attachedFiles = attachedFiles.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        }));
        deliveryData.hasAttachments = true;
      }

      await updateDoc(doc(db, 'orders', selectedOrder.id), deliveryData);

      // Send notification to client
      await addDoc(collection(db, 'notifications'), {
        userId: selectedOrder.clientId,
        type: 'order_delivered',
        message: `Pesanan ${selectedOrder.id.slice(-8)} telah dikirim${attachedFiles.length > 0 ? ` dengan ${attachedFiles.length} file lampiran` : ''}`,
        orderId: selectedOrder.id,
        createdAt: serverTimestamp(),
        read: false
      });

      // Reset form
      setDeliveryMessage('');
      setAttachedFiles([]);
      
      // Refresh data
      fetchOrders();
      
      setSuccess('Hasil pekerjaan berhasil dikirim!');
    } catch (error) {
      console.error('Error delivering order:', error);
      setError('Gagal mengirim hasil pekerjaan. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`File ${file.name} terlalu besar. Maksimal 10MB.`);
        return false;
      }
      
      // Check file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip', 'application/rar'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setError(`File ${file.name} tidak didukung.`);
        return false;
      }
      
      return true;
    });
    
    setAttachedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (indexToRemove) => {
    setAttachedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Menunggu Konfirmasi';
      case 'active': return 'Sedang Dikerjakan';
      case 'in_revision': return 'Dalam Revisi';
      case 'delivered': return 'Terkirim';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'in_revision':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    if (!date) return '';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.client?.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#010042]"></div>
      </div>
    );
  }

  // Single order view
  if (orderId && selectedOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/dashboard/freelancer/orders"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Detail Pesanan #{selectedOrder.id.slice(-8)}
            </h1>
            <p className="text-gray-600">
              {selectedOrder.title}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Informasi Pesanan
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusText(selectedOrder.status)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Paket:</span>
                  <span className="font-medium">{selectedOrder.packageType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Harga:</span>
                  <span className="font-medium">{formatCurrency(selectedOrder.price || selectedOrder.amount || selectedOrder.totalPrice || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tanggal Pemesanan:</span>
                  <span>{formatDate(selectedOrder.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Deadline:</span>
                  <span>{formatDate(selectedOrder.deadline)}</span>
                </div>
              </div>
            </motion.div>

            {/* Requirements */}
            {selectedOrder.requirements && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Persyaratan dari Client
                </h2>
                <p className="text-gray-700">{selectedOrder.requirements}</p>
              </motion.div>
            )}

            {/* Delivery Section */}
            {selectedOrder.status === 'active' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Kirim Hasil Pekerjaan
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pesan Delivery
                    </label>
                    <textarea
                      value={deliveryMessage}
                      onChange={(e) => setDeliveryMessage(e.target.value)}
                      rows={4}
                      placeholder="Jelaskan hasil pekerjaan Anda..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.doc,.docx,.zip,.rar"
                    />
                    <label 
                      htmlFor="file-upload"
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <PaperClipIcon className="h-5 w-5 text-gray-600" />
                      Lampirkan File
                    </label>
                    <span className="text-sm text-gray-500">
                      Max 10MB per file
                    </span>
                  </div>
                  
                  {/* Display attached files */}
                  {attachedFiles.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        File Terlampir ({attachedFiles.length})
                      </label>
                      <div className="space-y-2">
                        {attachedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <PaperClipIcon className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <button
                              onClick={() => removeFile(index)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Hapus
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={deliverOrder}
                    disabled={!deliveryMessage.trim() || isUploading}
                    className="w-full bg-[#010042] text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Mengirim...' : 'Kirim Hasil Pekerjaan'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Delivered Message */}
            {selectedOrder.deliveryMessage && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Pesan Delivery
                </h2>
                <p className="text-gray-700">{selectedOrder.deliveryMessage}</p>
                {selectedOrder.deliveredAt && (
                  <p className="text-sm text-gray-500 mt-2">
                    Dikirim pada: {formatDate(selectedOrder.deliveredAt)}
                  </p>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informasi Client
              </h3>
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-[#010042]/10 flex items-center justify-center">
                  {selectedOrder.client?.profilePhoto ? (
                    <img 
                      src={selectedOrder.client.profilePhoto} 
                      alt={selectedOrder.client.displayName}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-6 w-6 text-[#010042]" />
                  )}
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">
                    {selectedOrder.client?.displayName || 'User'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedOrder.client?.email}
                  </p>
                </div>
              </div>
              
              <Link 
                to={`/dashboard/freelancer/messages/${selectedOrder.conversationId || selectedOrder.id}`}
                className="w-full flex items-center justify-center gap-2 bg-[#010042] text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                onClick={async (e) => {
                  // Prevent default navigation
                  e.preventDefault();
                  
                  if (selectedOrder.clientId) {
                    try {
                      // Import chatService dynamically
                      const { default: chatService } = await import('../../services/chatService');
                      
                      // Create or get chat with this client
                      const chat = await chatService.createOrGetChat(
                        currentUser.uid, 
                        selectedOrder.clientId
                      );
                      
                      // Navigate to the chat
                      window.location.href = `/dashboard/freelancer/messages?chatId=${chat.id}`;
                    } catch (error) {
                      console.error('Error creating chat:', error);
                      // Fallback to basic messages page
                      window.location.href = `/dashboard/freelancer/messages`;
                    }
                  } else {
                    // Fallback if no clientId
                    window.location.href = `/dashboard/freelancer/messages`;
                  }
                }}
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                Chat dengan Client
              </Link>
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Aksi Cepat
              </h3>
              <div className="space-y-2">
                {selectedOrder.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'active')}
                      className="w-full flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      Terima Pesanan
                    </button>
                    <button 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled', 'Pesanan dibatalkan oleh seller')}
                      className="w-full flex items-center gap-2 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
                    >
                      <XCircleIcon className="h-5 w-5" />
                      Tolak Pesanan
                    </button>
                  </>
                )}
                
                {selectedOrder.status === 'delivered' && (
                  <button 
                    onClick={() => updateOrderStatus(selectedOrder.id, 'in_revision')}
                    className="w-full flex items-center gap-2 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700"
                  >
                    <ExclamationTriangleIcon className="h-5 w-5" />
                    Minta Revisi
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Orders list view
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ErrorPopup 
        message={error} 
        onClose={() => setError('')} 
        duration={3000}
      />
      
      <SuccessPopup 
        message={success} 
        onClose={() => setSuccess('')} 
        duration={3000}
      />

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pesanan Saya
        </h1>
        <p className="text-gray-600">
          Kelola semua pesanan dari client Anda
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8"
      >
        <div className="bg-gray-50 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Pesanan</p>
            <DocumentTextIcon className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Menunggu</p>
            <ClockIcon className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Aktif</p>
            <CheckCircleIcon className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Selesai</p>
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
        </div>

        <div className="bg-red-50 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Dibatalkan</p>
            <XCircleIcon className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
        </div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6 bg-white p-4 rounded-lg shadow"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari pesanan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="active">Aktif</option>
              <option value="in_revision">Revisi</option>
              <option value="delivered">Terkirim</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <FunnelIcon className="h-5 w-5 text-gray-600" />
              Filter
            </button>
          </div>
        </div>
      </motion.div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {order.title}
                      </h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <UserIcon className="h-4 w-4" />
                        <span>{order.client?.displayName || 'Client'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CurrencyDollarIcon className="h-4 w-4" />
                        <span>{formatCurrency(order.price || order.amount || order.totalPrice || 0)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>Deadline: {formatDate(order.deadline)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link 
                        to={`/dashboard/freelancer/orders/${order.id}`}
                        className="px-4 py-2 bg-[#010042] text-white rounded-lg hover:bg-blue-700"
                      >
                        Lihat Detail
                      </Link>
                      
                      <Link 
                        to={`/dashboard/freelancer/messages/${order.conversationId || order.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        onClick={async (e) => {
                          // Prevent default navigation
                          e.preventDefault();
                          
                          if (order.clientId) {
                            try {
                              // Import chatService dynamically
                              const { default: chatService } = await import('../../services/chatService');
                              
                              // Create or get chat with this client
                              const chat = await chatService.createOrGetChat(
                                currentUser.uid, 
                                order.clientId
                              );
                              
                              // Navigate to the chat
                              window.location.href = `/dashboard/freelancer/messages?chatId=${chat.id}`;
                            } catch (error) {
                              console.error('Error creating chat:', error);
                              // Fallback to basic messages page
                              window.location.href = `/dashboard/freelancer/messages`;
                            }
                          } else {
                            // Fallback if no clientId
                            window.location.href = `/dashboard/freelancer/messages`;
                          }
                        }}
                      >
                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                        Chat
                      </Link>

                      {order.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'active')}
                            className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            Terima
                          </button>
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                          >
                            <XCircleIcon className="h-4 w-4" />
                            Tolak
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Belum ada pesanan
            </h3>
            <p className="text-gray-500">
              Pesanan dari client akan muncul di sini
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 