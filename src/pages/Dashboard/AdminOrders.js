import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  CurrencyDollarIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const orderStatuses = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: ClockIcon },
  in_review: { label: 'In Review', color: 'bg-purple-100 text-purple-800', icon: EyeIcon },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircleIcon },
  dispute: { label: 'Dispute', color: 'bg-orange-100 text-orange-800', icon: ExclamationTriangleIcon }
};

const paymentStatuses = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800' },
  refunded: { label: 'Refunded', color: 'bg-red-100 text-red-800' }
};

export default function AdminOrders() {
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, paymentStatusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch orders
      const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch gigs
      const gigsSnapshot = await getDocs(collection(db, 'gigs'));
      const gigsData = gigsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setOrders(ordersData);
      setUsers(usersData);
      setGigs(gigsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => {
        const client = getUser(order.clientId);
        const freelancer = getUser(order.freelancerId);
        const gig = getGig(order.gigId);
        
        return (
          order.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          freelancer?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          freelancer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          gig?.title?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Payment status filter
    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter(order => order.paymentStatus === paymentStatusFilter);
    }

    setFilteredOrders(filtered);
  };

  const getUser = (userId) => {
    return users.find(user => user.id === userId);
  };

  const getGig = (gigId) => {
    return gigs.find(gig => gig.id === gigId);
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setActionLoading(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };

      // If marking as completed, add completion timestamp
      if (newStatus === 'completed') {
        updateData.completedAt = serverTimestamp();
      }

      await updateDoc(orderRef, updateData);
      await fetchData();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async (orderId, newPaymentStatus) => {
    setActionLoading(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        paymentStatus: newPaymentStatus,
        updatedAt: serverTimestamp()
      });
      await fetchData();
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Error updating payment status');
    } finally {
      setActionLoading(false);
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

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleString('id-ID');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600">Manage all orders on the platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {Object.entries(orderStatuses).map(([status, config]) => {
            const count = orders.filter(order => order.status === status).length;
            const IconComponent = config.icon;
            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${config.color.split(' ')[0]}-50`}>
                    <IconComponent className={`w-6 h-6 ${config.color.split(' ')[1]}-600`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{config.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              {Object.entries(orderStatuses).map(([status, config]) => (
                <option key={status} value={status}>{config.label}</option>
              ))}
            </select>

            {/* Payment Status Filter */}
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Payment Status</option>
              {Object.entries(paymentStatuses).map(([status, config]) => (
                <option key={status} value={status}>{config.label}</option>
              ))}
            </select>

            {/* Results count */}
            <div className="flex items-center text-sm text-gray-600">
              {filteredOrders.length} of {orders.length} orders
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Freelancer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const client = getUser(order.clientId);
                  const freelancer = getUser(order.freelancerId);
                  const gig = getGig(order.gigId);
                  const statusConfig = orderStatuses[order.status];
                  const paymentConfig = paymentStatuses[order.paymentStatus];

                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 line-clamp-1">
                            {order.title || gig?.title || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.packageType} • {order.deliveryTime}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {client?.displayName || client?.username || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{client?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {freelancer?.displayName || freelancer?.username || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{freelancer?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(order.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          disabled={actionLoading}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border-none ${statusConfig?.color} focus:ring-2 focus:ring-blue-500`}
                        >
                          {Object.entries(orderStatuses).map(([status, config]) => (
                            <option key={status} value={status}>{config.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.paymentStatus}
                          onChange={(e) => handleUpdatePaymentStatus(order.id, e.target.value)}
                          disabled={actionLoading}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border-none ${paymentConfig?.color} focus:ring-2 focus:ring-blue-500`}
                        >
                          {Object.entries(paymentStatuses).map(([status, config]) => (
                            <option key={status} value={status}>{config.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details Modal */}
        <AnimatePresence>
          {showEditModal && selectedOrder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-screen overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Order Details</h3>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedOrder(null);
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Order Info */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Order Information</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Order ID:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedOrder.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Title:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedOrder.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Package:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedOrder.packageType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Price:</span>
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(selectedOrder.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Delivery Time:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedOrder.deliveryTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Revisions:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedOrder.revisions}</span>
                      </div>
                    </div>
                  </div>

                  {/* Client & Freelancer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Client</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getUser(selectedOrder.clientId)?.displayName || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getUser(selectedOrder.clientId)?.email}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Freelancer</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getUser(selectedOrder.freelancerId)?.displayName || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getUser(selectedOrder.freelancerId)?.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  {selectedOrder.requirements && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Requirements</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedOrder.requirements}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {selectedOrder.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Description</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedOrder.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Timeline</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Created:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDateTime(selectedOrder.createdAt)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Updated:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDateTime(selectedOrder.updatedAt)}
                        </span>
                      </div>
                      {selectedOrder.completedAt && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Completed:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatDateTime(selectedOrder.completedAt)}
                          </span>
                        </div>
                      )}
                      {selectedOrder.deliveryDate && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Expected Delivery:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatDateTime(selectedOrder.deliveryDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedOrder(null);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 