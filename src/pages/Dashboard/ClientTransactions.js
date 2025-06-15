import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import orderService from '../../services/orderService';
import reviewService from '../../services/reviewService';
import freelancerRatingService from '../../services/freelancerRatingService';
import notificationService from '../../services/notificationService';
import paymentService from '../../services/paymentService';
import RatingModal from '../../components/RatingModal';
import { 
  isRevisionDisabled, 
  getRevisionCountText, 
  getOrderDeadline,
  calculateWorkDeadline,
  calculateAutoCompletionDeadline,
  calculateRevisionDeadline
} from '../../utils/orderUtils';
import PageContainer from '../../components/common/PageContainer';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

import CountdownTimer from '../../components/common/CountdownTimer';
import cleanPlaceholderQR from '../../scripts/cleanPlaceholderQR';

// Make cleanup function available globally for debugging
if (typeof window !== 'undefined') {
  window.cleanPlaceholderQR = cleanPlaceholderQR;
}


export default function ClientTransactions() {
  const { transactionId } = useParams();
  const { currentUser } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [pendingOrderCompletion, setPendingOrderCompletion] = useState(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [orderRatingStatus, setOrderRatingStatus] = useState({}); // Track which orders have been rated
  
  // Revision modal state
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState('');
  const [pendingRevisionOrder, setPendingRevisionOrder] = useState(null);


  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    if (currentUser && !isLoadingOrders) {
      loadOrders();
    }
  }, [currentUser]);

  useEffect(() => {
    if (transactionId && orders.length > 0) {
      const transaction = orders.find(order => order.id === transactionId);
      setSelectedTransaction(transaction);
    }
  }, [transactionId, orders]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Auto-refresh to check for expired orders every 30 seconds
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      console.log('🔄 [ClientTransactions] Auto-refresh checking for expired orders...');
      
      // Only check if we have orders with payment status
      const hasPaymentOrders = orders.some(order => order.status === 'payment');
      if (hasPaymentOrders) {
        console.log('🔄 [ClientTransactions] Found payment orders, refreshing...');
        loadOrders();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [currentUser, orders]);

  // Handle payment success from URL parameters (after Tripay redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      setSuccess('Pembayaran berhasil! Pesanan Anda sedang diproses.');
      // Clean URL after showing message
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // Refresh orders to get updated status
      setTimeout(() => {
        loadOrders();
      }, 1000);
    }
  }, [location.search]);

  const loadOrders = async () => {
    console.log('🔍 [ClientTransactions] loadOrders called with currentUser:', currentUser?.uid);
    
    if (!currentUser) {
      console.log('❌ [ClientTransactions] No currentUser, returning early');
      setLoading(false);
      return;
    }
    
    if (isLoadingOrders) {
      console.log('⏳ [ClientTransactions] Already loading orders, skipping...');
      return;
    }
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('⏰ [ClientTransactions] Loading timeout after 15 seconds');
      setError('Loading timeout. Silakan refresh halaman.');
      setLoading(false);
      setIsLoadingOrders(false);
    }, 15000);
    
    try {
      setLoading(true);
      setIsLoadingOrders(true);
      setError(''); // Clear previous errors
      console.log('📡 [ClientTransactions] Fetching orders for user:', currentUser.uid);
      
      const ordersWithDetails = await orderService.getOrdersWithDetails(currentUser.uid, 'client');
      
      console.log('📥 [ClientTransactions] Orders received:', {
        userId: currentUser.uid,
        count: ordersWithDetails?.length || 0,
        orders: ordersWithDetails
      });
      
      // Check for expired payment orders and auto-cancel them
      if (ordersWithDetails && ordersWithDetails.length > 0) {
        await checkAndHandleExpiredOrders(ordersWithDetails);
      }
      
      // Ensure we always set an array, even if empty
      setOrders(Array.isArray(ordersWithDetails) ? ordersWithDetails : []);

      // Check rating status for each order (with error handling)
      if (ordersWithDetails && ordersWithDetails.length > 0) {
        const ratingStatusMap = {};
        
        // Process rating status in parallel with timeout
        await Promise.allSettled(
          ordersWithDetails.map(async (order) => {
            try {
              const existingReviews = await reviewService.getGigReviews(order.gigId);
              const userReview = existingReviews.find(review => 
                review.clientId === currentUser.uid && review.orderId === order.id
              );
              ratingStatusMap[order.id] = !!userReview;
            } catch (error) {
              console.error('Error checking rating status for order:', order.id, error);
              ratingStatusMap[order.id] = false;
            }
          })
        );
        
        setOrderRatingStatus(ratingStatusMap);
      }
    } catch (error) {
      console.error('💥 [ClientTransactions] Error loading orders:', error);
      setError(`Gagal memuat transaksi: ${error.message}`);
      setOrders([]); // Set empty array on error
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      setIsLoadingOrders(false);
    }
  };

  // Check and handle expired orders
  const checkAndHandleExpiredOrders = async (ordersData) => {
    try {
      const now = new Date();
      const expiredOrders = ordersData.filter(order => {
        if (order.status !== 'payment' || !order.paymentExpiredAt) return false;
        
        const expiredAt = order.paymentExpiredAt.seconds 
          ? new Date(order.paymentExpiredAt.seconds * 1000) 
          : new Date(order.paymentExpiredAt);
        
        return expiredAt <= now;
      });

      console.log('🔍 [ClientTransactions] Found expired orders:', {
        total: expiredOrders.length,
        orderIds: expiredOrders.map(o => o.id),
        currentTime: now.toISOString(),
        expiredOrdersDetails: expiredOrders.map(o => ({
          id: o.id,
          status: o.status,
          expiredAt: o.paymentExpiredAt.seconds 
            ? new Date(o.paymentExpiredAt.seconds * 1000).toISOString()
            : new Date(o.paymentExpiredAt).toISOString()
        }))
      });

      // Cancel expired orders
      let successfulCancellations = 0;
      for (const order of expiredOrders) {
        try {
          console.log('⏰ [ClientTransactions] Auto-cancelling expired order:', {
            orderId: order.id,
            expiredAt: order.paymentExpiredAt.seconds 
              ? new Date(order.paymentExpiredAt.seconds * 1000).toISOString()
              : new Date(order.paymentExpiredAt).toISOString(),
            currentTime: now.toISOString(),
            timeDifference: now - (order.paymentExpiredAt.seconds 
              ? new Date(order.paymentExpiredAt.seconds * 1000) 
              : new Date(order.paymentExpiredAt))
          });
          
          // Use orderService to update status with proper validation
          await orderService.updateOrderStatus(order.id, 'cancelled', currentUser.uid, {
            statusMessage: 'Payment timeout - order cancelled automatically',
            cancellationReason: 'Payment timeout (TESTING)',
            cancelledAt: now.toISOString(),
            autoCancel: true
          });
          
          // Update the order in the local state immediately for better UX
          order.status = 'cancelled';
          order.cancellationReason = 'Payment timeout (TESTING)';
          order.cancelledAt = now;
          
          successfulCancellations++;
          console.log('✅ [ClientTransactions] Successfully cancelled expired order:', order.id);
          
        } catch (error) {
          console.error('❌ [ClientTransactions] Error cancelling expired order:', order.id, error);
          console.error('❌ [ClientTransactions] Error details:', {
            errorMessage: error.message,
            errorCode: error.code,
            orderId: order.id,
            orderStatus: order.status,
            userId: currentUser.uid
          });
        }
      }

      if (expiredOrders.length > 0) {
        console.log('✅ [ClientTransactions] Auto-cancellation summary:', {
          totalExpired: expiredOrders.length,
          successfulCancellations,
          failedCancellations: expiredOrders.length - successfulCancellations
        });
        
        // Force a UI refresh if any orders were cancelled
        if (successfulCancellations > 0) {
          console.log('🔄 [ClientTransactions] Forcing UI refresh after cancellations');
          setTimeout(() => {
            loadOrders();
          }, 2000); // Give time for database updates to propagate
        }
      }
      
    } catch (error) {
      console.error('❌ [ClientTransactions] Error checking expired orders:', error);
      console.error('❌ [ClientTransactions] Error stack:', error.stack);
    }
  };

  const formatPrice = (price) => {
    // Handle undefined, null, NaN, or non-numeric values
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return 'Rp 0';
    }
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numericPrice);
  };

  const getOrderPrice = (order) => {
    // Try multiple possible price field names and return the first valid one
    let price = order.price || order.totalPrice || order.amount || order.totalAmount;
    
    // If no valid price found in order and we have gig data, try to get price from gig packages
    if (!price && order.gig && order.packageType) {
      const packageData = order.gig.packages?.[order.packageType];
      if (packageData && packageData.price) {
        price = packageData.price;
        console.log(`ClientTransactions - Using gig package price for order ${order.id}:`, price);
      }
    }
    
    return price || 0;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return dateObj.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      payment: { label: 'Menunggu Pembayaran', color: 'bg-orange-100 text-orange-800' },
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
    } else if (activeTab === 'payment') {
      matchesTab = order.status === 'payment';
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
    payment: orders.filter(o => o.status === 'payment').length,
    pending: orders.filter(o => o.status === 'pending').length,
    in_progress: orders.filter(o => ['active', 'in_progress', 'in_revision', 'delivered'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => ['cancelled', 'rejected'].includes(o.status)).length
  };

  const tabs = [
    { id: 'all', label: 'Semua', count: statusCounts.all },
    { id: 'payment', label: 'Menunggu Pembayaran', count: statusCounts.payment },
    { id: 'pending', label: 'Menunggu Konfirmasi', count: statusCounts.pending },
    { id: 'in_progress', label: 'Sedang Dikerjakan', count: statusCounts.in_progress },
    { id: 'completed', label: 'Selesai', count: statusCounts.completed },
    { id: 'cancelled', label: 'Dibatalkan', count: statusCounts.cancelled }
  ];

  const completeOrder = async (orderId) => {
    console.log('🔵 [ClientTransactions] completeOrder called with orderId:', orderId);
    
    // Find the order to get freelancer and gig information
    const order = orders.find(o => o.id === orderId) || selectedTransaction;
    if (!order) {
      console.error('❌ [ClientTransactions] Order not found:', orderId);
      setError('Data pesanan tidak ditemukan');
      return;
    }

    console.log('🔵 [ClientTransactions] Order found with status:', order.status);

    // Check current status and handle accordingly
    if (order.status === 'active' || order.status === 'in_progress') {
      // If order is still active/in_progress, show error message
      setError('Pesanan belum dapat diterima. Tunggu freelancer mengirimkan hasil pekerjaan terlebih dahulu.');
      return;
    }

    if (order.status !== 'delivered') {
      setError(`Pesanan dengan status '${order.status}' tidak dapat diterima. Status harus 'delivered' terlebih dahulu.`);
      return;
    }

    // Check if user has already rated this order
    try {
      const existingReviews = await reviewService.getGigReviews(order.gigId);
      const userReview = existingReviews.find(review => 
        review.clientId === currentUser.uid && review.orderId === orderId
      );
      
      if (userReview) {
        console.log('🔵 [ClientTransactions] User has already rated, completing directly');
        // User has already rated, complete order directly
        await finalizeOrderCompletion(orderId);
        return;
      }
    } catch (error) {
      console.error('Error checking existing reviews:', error);
    }

    console.log('🔵 [ClientTransactions] Showing rating modal');
    // Show rating modal for new ratings
    setPendingOrderCompletion(orderId);
    setShowRatingModal(true);
  };

  const handleRatingSubmit = async (ratingData) => {
    if (!pendingOrderCompletion) return;
    
    const order = orders.find(o => o.id === pendingOrderCompletion) || selectedTransaction;
    if (!order) {
      setError('Data pesanan tidak ditemukan');
      return;
    }

    try {
      setIsSubmittingRating(true);

      // Create review
      const reviewData = {
        gigId: order.gigId,
        freelancerId: order.freelancerId,
        clientId: currentUser.uid,
        orderId: pendingOrderCompletion,
        rating: ratingData.rating,
        comment: ratingData.comment || '',
        createdAt: new Date(),
        status: 'published'
      };

      await reviewService.createReview(reviewData);

      // Update freelancer rating stats
      try {
        await freelancerRatingService.updateFreelancerRatingInProfile(order.freelancerId);
      } catch (ratingError) {
        console.error('Error updating freelancer rating:', ratingError);
        // Don't block completion if rating update fails
      }

      // Create review notification for freelancer
      try {
        await notificationService.createReviewNotification(
          order.freelancerId,
          order.client?.displayName || currentUser.displayName || 'Client',
          ratingData.rating,
          pendingOrderCompletion
        );
        console.log('✅ [ClientTransactions] Review notification created for freelancer');
      } catch (notificationError) {
        console.error('Error creating review notification:', notificationError);
        // Don't block completion if notification fails
      }

      // If this was just a rating (not completion), update the rating status
      setOrderRatingStatus(prev => ({
        ...prev,
        [pendingOrderCompletion]: true
      }));

      // Complete the order only if it was a completion flow, not just rating
      if (order.status === 'delivered') {
        await finalizeOrderCompletion(pendingOrderCompletion);
        setSuccess('Terima kasih atas rating Anda! Pesanan berhasil diselesaikan.');
      } else {
        setSuccess('Terima kasih atas rating Anda!');
      }
      
      setShowRatingModal(false);
      setPendingOrderCompletion(null);
      
    } catch (error) {
      console.error('Error submitting rating:', error);
      setError('Gagal mengirim rating. Silakan coba lagi.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleRatingSkip = async () => {
    if (!pendingOrderCompletion) return;
    
    // Complete order without rating
    await finalizeOrderCompletion(pendingOrderCompletion);
    setShowRatingModal(false);
    setPendingOrderCompletion(null);
  };

  const finalizeOrderCompletion = async (orderId) => {
    try {
      setIsUpdating(true);
      console.log('Completing order:', orderId);
      
      await orderService.updateOrderStatus(orderId, 'completed', currentUser.uid, {
        statusMessage: 'Pekerjaan diterima oleh client',
        completedAt: new Date()
      });
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'completed', completedAt: new Date() }
            : order
        )
      );
      
      // Update selected transaction if it's the current one
      if (selectedTransaction?.id === orderId) {
        setSelectedTransaction(prev => ({ 
          ...prev, 
          status: 'completed',
          completedAt: new Date()
        }));
      }
      
      if (!success) { // Only set success message if not already set by rating
        setSuccess('Pesanan berhasil diselesaikan!');
      }
      
      // Don't auto-reload to prevent infinite loop
      // Orders will be updated via real-time subscriptions
    } catch (error) {
      console.error('Error completing order:', error);
      setError(error.message || 'Gagal menyelesaikan pesanan. Silakan coba lagi.');
    } finally {
      setIsUpdating(false);
    }
  };

  const requestRevision = (orderId) => {
    console.log('🟠 [ClientTransactions] requestRevision called with orderId:', orderId);
    console.log('🟠 [ClientTransactions] isUpdating state:', isUpdating);
    console.log('🟠 [ClientTransactions] Current view context:', transactionId ? 'DETAIL_VIEW' : 'LIST_VIEW');
    console.log('🟠 [ClientTransactions] showRevisionModal current state:', showRevisionModal);
    
    // Get the order to check revision limits
    const order = orders.find(o => o.id === orderId) || selectedTransaction;
    if (!order) {
      console.error('❌ [ClientTransactions] Order not found for revision:', orderId);
      setError('Data pesanan tidak ditemukan');
      return;
    }

    console.log('🟠 [ClientTransactions] Order found for revision:', order);

    // Remove the problematic logic that blocks subsequent revisions
    // The status should be 'delivered' when freelancer submits revision results
    // Client should always be able to request another revision (if quota allows)

    // Check revision count against limits
    const currentRevisions = order.revisionCount || 0;
    const maxRevisions = order.revisions || order.maxRevisions || 3;
    
    console.log('🟠 [ClientTransactions] Revision check:', { currentRevisions, maxRevisions });
    
    if (currentRevisions >= maxRevisions) {
      console.warn('⚠️ [ClientTransactions] Revision limit reached');
      setError(`Maksimal revisi (${maxRevisions}) telah tercapai untuk pesanan ini.`);
      return;
    }

    console.log('🟠 [ClientTransactions] Showing revision modal');
    console.log('🟠 [ClientTransactions] Context info:', {
      isDetailView: !!transactionId,
      isListView: !transactionId,
      orderId: orderId,
      selectedTransactionId: selectedTransaction?.id
    });
    
    // Clear any previous errors/success messages
    setError('');
    setSuccess('');
    
    // Show revision modal
    setPendingRevisionOrder(orderId);
    setRevisionMessage('');
    setShowRevisionModal(true);
    
    console.log('🟠 [ClientTransactions] Modal state set:', {
      showRevisionModal: true,
      pendingRevisionOrder: orderId,
      revisionMessage: '',
      context: transactionId ? 'DETAIL_VIEW' : 'LIST_VIEW'
    });
    
    // Force a small delay to ensure state is set
    setTimeout(() => {
      console.log('🟠 [ClientTransactions] Modal state check after timeout:', {
        showRevisionModal,
        pendingRevisionOrder,
        context: transactionId ? 'DETAIL_VIEW' : 'LIST_VIEW'
      });
    }, 100);
  };

  const handleRevisionSubmit = async () => {
    console.log('🟠 [ClientTransactions] handleRevisionSubmit called:', {
      pendingRevisionOrder,
      revisionMessage: revisionMessage.trim(),
      currentUser: currentUser?.uid
    });

    if (!pendingRevisionOrder || !revisionMessage.trim()) {
      setError('Pesan revisi tidak boleh kosong');
      return;
    }

    try {
      setIsUpdating(true);
      console.log('🟠 [ClientTransactions] Calling orderService.requestRevision:', {
        orderId: pendingRevisionOrder,
        userId: currentUser.uid,
        message: revisionMessage.trim()
      });
      
      const result = await orderService.requestRevision(pendingRevisionOrder, currentUser.uid, revisionMessage.trim());

      console.log('✅ [ClientTransactions] Revision request successful:', result);
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === pendingRevisionOrder 
            ? { ...order, status: 'in_revision', revisionCount: (order.revisionCount || 0) + 1 }
            : order
        )
      );
      
      // Update selected transaction if it's the current one
      if (selectedTransaction?.id === pendingRevisionOrder) {
        setSelectedTransaction(prev => ({ 
          ...prev, 
          status: 'in_revision',
          revisionCount: (prev.revisionCount || 0) + 1
        }));
      }
      
      setSuccess('Permintaan revisi berhasil dikirim!');
      setShowRevisionModal(false);
      setRevisionMessage('');
      setPendingRevisionOrder(null);
      
      // Don't auto-reload to prevent infinite loop
      // Orders will be updated via real-time subscriptions
    } catch (error) {
      console.error('Error requesting revision:', error);
      setError(error.message || 'Gagal meminta revisi. Silakan coba lagi.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRevisionCancel = () => {
    setShowRevisionModal(false);
    setRevisionMessage('');
    setPendingRevisionOrder(null);
  };

  const handleRateOrder = async (orderId) => {
    // This is for rating completed orders (not completing them)
    setPendingOrderCompletion(orderId);
    setShowRatingModal(true);
  };

  // Handle payment button click
  // Handle payment expiry
  const handlePaymentExpiry = async (orderId) => {
    try {
      console.log('⏰ [ClientTransactions] handlePaymentExpiry called for order:', orderId);
      
      // Update order status to cancelled due to payment timeout
      await orderService.updateOrderStatus(orderId, 'cancelled', currentUser.uid, {
        statusMessage: 'Payment timeout - order cancelled automatically',
        cancellationReason: 'Payment timeout (TESTING)',
        cancelledAt: new Date().toISOString()
      });
      
      console.log('✅ [ClientTransactions] Order cancelled due to payment expiry:', orderId);
      
      // Refresh orders to show updated status
      setTimeout(() => {
        loadOrders();
      }, 1000);
      
    } catch (error) {
      console.error('❌ [ClientTransactions] Error handling payment expiry:', error);
    }
  };

  const handlePayment = async (order) => {
    try {
      console.log('💳 [ClientTransactions] handlePayment called with order:', {
        id: order.id,
        status: order.status,
        hasPaymentUrl: !!order.paymentUrl,
        hasQrString: !!order.qrString,
        hasPaymentExpiredAt: !!order.paymentExpiredAt
      });
      
      setError('');
      
      // Check if order already has valid payment URL
      if (order.paymentUrl && order.paymentExpiredAt) {
        const expiredAt = order.paymentExpiredAt.seconds 
          ? new Date(order.paymentExpiredAt.seconds * 1000) 
          : new Date(order.paymentExpiredAt);
        
        console.log('💳 [ClientTransactions] Payment URL analysis:', {
          paymentUrl: order.paymentUrl,
          isExpired: expiredAt <= new Date(),
          expiredAt: expiredAt
        });
        
        // Check if payment is still valid (not expired)
        if (expiredAt > new Date()) {
          console.log('💳 [ClientTransactions] Using existing payment URL - redirecting to Tripay');
          // Redirect directly to Tripay payment page
          window.open(order.paymentUrl, '_blank');
          return;
        } else {
          console.log('💳 [ClientTransactions] Payment expired - creating new payment');
        }
      }
      
      // Create new payment and redirect to Tripay
      console.log('💳 [ClientTransactions] Creating new payment for order:', order.id);
      
      // FIX: Calculate total amount with 5% platform fee
      const baseAmount = order.totalAmount || order.price || 0;
      // Check if totalAmount already includes platform fee by comparing with price
      let totalWithPlatformFee;
      if (order.totalAmount && order.price && Math.abs(order.totalAmount - (order.price * 1.05)) < 1) {
        // totalAmount already includes platform fee
        totalWithPlatformFee = order.totalAmount;
      } else {
        // Add 5% platform fee to price
        totalWithPlatformFee = Math.round((order.price || baseAmount) * 1.05);
      }
      
      const paymentResult = await paymentService.createPayment({
        id: order.id,
        totalAmount: totalWithPlatformFee,
        title: order.title,
        clientName: currentUser.displayName || 'SkillNusa Client',
        clientEmail: currentUser.email || 'client@skillnusa.com',
        clientPhone: currentUser.phoneNumber || '081234567890'
      });

      if (paymentResult.success && paymentResult.paymentUrl) {
        console.log('💳 [ClientTransactions] Payment created successfully - redirecting to Tripay:', {
          merchantRef: paymentResult.merchantRef,
          paymentUrl: paymentResult.paymentUrl,
          amount: paymentResult.amount
        });
        
        // Redirect directly to Tripay payment page
        window.open(paymentResult.paymentUrl, '_blank');
        
        // Show success message
        setSuccess('Pembayaran berhasil dibuat. Halaman pembayaran telah dibuka di tab baru.');
        
        // Refresh orders after a short delay to get updated payment data
        setTimeout(() => {
          loadOrders();
        }, 2000);
        
      } else {
        console.error('❌ [ClientTransactions] Payment creation failed:', paymentResult);
        setError('Gagal membuat pembayaran. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('❌ [ClientTransactions] Error creating payment:', error);
      setError('Gagal membuat pembayaran. Silakan coba lagi.');
    }
  };

  // Debug helper function - can be called from browser console
  const debugPaymentStatus = async (orderId) => {
    try {
      console.log('🔧 [ClientTransactions] Debug payment status for order:', orderId);
      
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        console.error('❌ Order not found:', orderId);
        return;
      }
      
      console.log('📋 [ClientTransactions] Order details:', {
        id: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        merchantRef: order.merchantRef,
        paymentExpiredAt: order.paymentExpiredAt,
        tripayStatus: order.tripayStatus
      });
      
      if (order.merchantRef) {
        console.log('🔍 [ClientTransactions] Checking payment status with Tripay...');
        const statusResult = await paymentService.manualPaymentStatusCheck(order.id, order.merchantRef);
        console.log('📊 [ClientTransactions] Payment status result:', statusResult);
        
        if (statusResult.success) {
          console.log('✅ [ClientTransactions] Payment confirmed - refreshing orders');
          setTimeout(() => {
            loadOrders();
          }, 1000);
        }
      } else {
        console.warn('⚠️ [ClientTransactions] No merchant reference found for order');
      }
      
    } catch (error) {
      console.error('❌ [ClientTransactions] Error in debug payment status:', error);
    }
  };

  // Make debug function available globally for console access
  useEffect(() => {
    window.debugPaymentStatus = debugPaymentStatus;
    window.debugClientTransactions = {
      orders,
      loadOrders,
      checkAndHandleExpiredOrders: () => checkAndHandleExpiredOrders(orders),
      debugPaymentStatus
    };
    
    return () => {
      delete window.debugPaymentStatus;
      delete window.debugClientTransactions;
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100">
            <div className="h-16 bg-gray-300 rounded-t-xl mb-4"></div>
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
    );
  }

  // Transaction Detail View
  if (transactionId) {
    if (!selectedTransaction) {
      return (
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Transaksi tidak ditemukan</h2>
            <p className="mt-2 text-gray-600">Transaksi dengan ID {transactionId} tidak ditemukan.</p>
            <Link 
              to="/dashboard/client/transactions"
              className="mt-4 inline-flex items-center px-4 py-2 bg-[#010042] text-white rounded-lg hover:bg-[#0100a3]"
            >
              Kembali ke Daftar Transaksi
            </Link>
          </div>
        </div>
      );
    }

    return (
      <PageContainer maxWidth="max-w-7xl" padding="px-4 py-16">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/dashboard/client/transactions"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Detail Transaksi #{selectedTransaction.id.slice(-8)}
            </h1>
            <p className="text-gray-600">{selectedTransaction.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Transaksi</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  {getStatusBadge(selectedTransaction.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Paket:</span>
                  <span className="font-medium">
                    {selectedTransaction.packageType === 'basic' ? 'Dasar' : 
                     selectedTransaction.packageType === 'standard' ? 'Standar' : 'Premium'}
                  </span>
                </div>
                {/* Only show price for non-cancelled orders */}
                {selectedTransaction.status !== 'cancelled' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Harga:</span>
                    <span className="font-medium">{formatPrice(getOrderPrice(selectedTransaction))}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tanggal Pemesanan:</span>
                  <span>{formatDate(selectedTransaction.createdAt)}</span>
                </div>
                

                {/* Show deadline based on status using new utility function */}
                {selectedTransaction.status !== 'cancelled' && (() => {
                  const deadlineInfo = getOrderDeadline(selectedTransaction);
                  if (deadlineInfo.date) {
                    return (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{deadlineInfo.label}:</span>
                        <span className="font-medium">
                          {formatDate(deadlineInfo.date)}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
                {/* Show cancellation date for cancelled orders */}
                {selectedTransaction.status === 'cancelled' && selectedTransaction.cancelledAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tanggal Dibatalkan:</span>
                    <span>{formatDate(selectedTransaction.cancelledAt)}</span>
                  </div>
                )}
                {/* Only show revision info for non-cancelled orders */}
                {selectedTransaction.status !== 'cancelled' && (selectedTransaction.revisionCount > 0 || selectedTransaction.revisions || selectedTransaction.maxRevisions) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revisi:</span>
                    <span className={`font-medium ${isRevisionDisabled(selectedTransaction) ? 'text-red-600' : 'text-gray-900'}`}>
                      {getRevisionCountText(selectedTransaction)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Requirements */}
            {selectedTransaction.requirements && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Persyaratan</h2>
                <p className="text-gray-700">{selectedTransaction.requirements}</p>
              </div>
            )}

            {/* Delivery */}
            {selectedTransaction.deliveryMessage && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Hasil Pekerjaan</h2>
                <p className="text-gray-700">{selectedTransaction.deliveryMessage}</p>
                {selectedTransaction.deliveredAt && (
                  <p className="text-sm text-gray-500 mt-2">
                    Dikirim pada: {formatDate(selectedTransaction.deliveredAt)}
                  </p>
                )}
              </div>
            )}

            {/* Revision History */}
            {selectedTransaction.revisionRequests && selectedTransaction.revisionRequests.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Riwayat Revisi ({selectedTransaction.revisionRequests.length})
                </h2>
                <div className="space-y-4">
                  {selectedTransaction.revisionRequests
                    .slice()
                    .reverse()
                    .map((revision, index) => (
                    <div key={index} className="border-l-4 border-orange-400 pl-4 py-3 bg-orange-50 rounded-r-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <p className="text-sm font-medium text-orange-900">
                            Revisi #{selectedTransaction.revisionRequests.length - index}
                          </p>
                          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full flex-shrink-0">
                            Dari Client
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 flex-shrink-0 ml-4 pr-2">
                          {formatDate(revision.requestedAt?.toDate ? revision.requestedAt.toDate() : revision.requestedAt)}
                        </p>
                      </div>
                      <p className="text-gray-700 text-sm">
                        {revision.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Freelancer Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Freelancer</h3>
                            <div className="flex items-center mb-4">
                <img 
                  src={selectedTransaction.freelancer?.profilePhoto || 'https://picsum.photos/48/48'}
                  alt={selectedTransaction.freelancer?.displayName}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div className="ml-3">
                  <p className="font-medium text-gray-900">
                    {selectedTransaction.freelancer?.displayName || 'Freelancer'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedTransaction.freelancer?.email}
                  </p>
                </div>
              </div>
              

            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
              
              {/* Success/Error Messages */}
              {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                  {success}
                </div>
              )}
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                {/* Chat button - always available */}
                <button
                  onClick={async () => {
                    try {
                      // Import chatService dynamically
                      const { default: chatService } = await import('../../services/chatService');
                      
                      // Create or get chat with freelancer
                      const chat = await chatService.createOrGetChat(
                        currentUser.uid, 
                        selectedTransaction.freelancerId
                      );
                      
                      // Navigate to the chat
                      window.location.href = `/messages?chatId=${chat.id}`;
                    } catch (error) {
                      console.error('Error creating chat:', error);
                      // Fallback to basic messages page
                      window.location.href = `/messages`;
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#010042] text-white py-2 px-4 rounded-lg hover:bg-[#0100a3] transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Chat dengan Freelancer
                </button>
                
                {/* Payment action for payment status */}
                {selectedTransaction.status === 'payment' && (
                  <>
                    <button
                      onClick={() => handlePayment(selectedTransaction)}
                      className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Bayar Sekarang
                    </button>
                    

                    {/* Payment info */}
                    <div className="w-full p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2 text-orange-800">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium">
                          Menunggu Pembayaran
                        </span>
                      </div>
                      <p className="text-sm text-orange-600 mt-1">
                        Silakan lakukan pembayaran untuk melanjutkan pesanan. Setelah pembayaran berhasil, pesanan akan diteruskan ke freelancer.
                      </p>
                    </div>
                  </>
                )}
                {selectedTransaction.status === 'completed' && (
                  <>
                    <Link
                      to={`/gig/${selectedTransaction.gigId}`}
                      className="w-full flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Pesan Lagi
                    </Link>
                    
                    {/* Show rating button if not rated yet */}
                    {!orderRatingStatus[selectedTransaction.id] && (
                      <button
                        onClick={() => handleRateOrder(selectedTransaction.id)}
                        disabled={isSubmittingRating}
                        className="w-full flex items-center gap-2 bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Beri Rating
                      </button>
                    )}
                    
                    {/* Show if already rated */}
                    {orderRatingStatus[selectedTransaction.id] && (
                      <div className="w-full flex items-center gap-2 bg-gray-100 text-gray-600 py-2 px-4 rounded-lg">
                        <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Sudah Diberi Rating
                      </div>
                    )}
                  </>
                )}
                
                {/* Action buttons for delivered orders */}
                {selectedTransaction.status === 'delivered' && (
                  <>
                    <button 
                      type="button"
                      onClick={(e) => {
                        console.log('🔵 [ClientTransactions] Accept button clicked');
                        e.preventDefault();
                        e.stopPropagation();
                        completeOrder(selectedTransaction.id);
                      }}
                      disabled={isUpdating}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                    >
                      {isUpdating ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                          </svg>
                          Memproses...
                        </>
                      ) : (
                        <>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Terima Pekerjaan
                        </>
                      )}
                    </button>
                    
                    {/* Only show revision button if revision quota is not exhausted */}
                    {(selectedTransaction.revisionCount || 0) < (selectedTransaction.revisions || selectedTransaction.maxRevisions || 3) && (
                      <button 
                        type="button"
                        onClick={(e) => {
                          console.log('🟠 [ClientTransactions] Revision button clicked');
                          e.preventDefault();
                          e.stopPropagation();
                          requestRevision(selectedTransaction.id);
                        }}
                        disabled={isUpdating}
                        className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                        title="Minta revisi kepada freelancer"
                      >
                        {isUpdating ? (
                          <>
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            Memproses...
                          </>
                        ) : (
                          <>
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Minta Revisi ({(selectedTransaction.revisionCount || 0)}/{selectedTransaction.revisions || selectedTransaction.maxRevisions || 3})
                          </>
                        )}
                      </button>
                    )}
                    
                    {/* Show message when revision quota is exhausted */}
                    {(selectedTransaction.revisionCount || 0) >= (selectedTransaction.revisions || selectedTransaction.maxRevisions || 3) && (
                      <div className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                          </svg>
                          <span className="text-sm font-medium">
                            Jatah revisi telah habis ({selectedTransaction.revisions || selectedTransaction.maxRevisions || 3}/{selectedTransaction.revisions || selectedTransaction.maxRevisions || 3})
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Silakan terima pekerjaan atau hubungi freelancer melalui chat untuk diskusi lebih lanjut.
                        </p>
                      </div>
                    )}
                  </>
                )}


                
                {/* Active/In Progress Orders - Show status info only */}
                {['active', 'in_progress'].includes(selectedTransaction.status) && (
                  <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">
                        {selectedTransaction.status === 'active' ? 'Pesanan Sedang Dikerjakan' : 'Dalam Proses'}
                      </span>
                    </div>
                    <p className="text-sm text-blue-600 mt-1">
                      Freelancer sedang mengerjakan pesanan Anda. Silakan tunggu hingga hasil pekerjaan dikirimkan.
                    </p>
                  </div>
                )}

                {selectedTransaction.status === 'in_revision' && (
                  <div className="w-full p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">
                        Permintaan revisi telah dikirim ({(selectedTransaction.revisionCount || 0)}/{selectedTransaction.revisions || selectedTransaction.maxRevisions || 3})
                      </span>
                    </div>
                    <p className="text-sm text-orange-600 mt-1">
                      Freelancer sedang mengerjakan revisi. Silakan tunggu hasil revisi.
                    </p>
                  </div>
                )}

                {selectedTransaction.status === 'cancelled' && (
                  <div className="w-full p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">
                        Pesanan Dibatalkan
                      </span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">
                      Pesanan ini telah dibatalkan. Tidak ada transaksi keuangan yang terjadi.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rating Modal - Detail View */}
        <RatingModal
          isOpen={showRatingModal}
          onClose={handleRatingSkip}
          onSubmit={handleRatingSubmit}
                          freelancerName={selectedTransaction?.freelancer?.displayName || 'Freelancer'}
          gigTitle={selectedTransaction?.title || ''}
          isSubmitting={isSubmittingRating}
        />

        {/* Revision Modal - Detail View */}
        {showRevisionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Permintaan Revisi
                </h3>
                
                {/* Debug Info */}
                <div className="mb-2 p-2 bg-blue-100 text-xs text-blue-800 rounded">
                  Order ID: {pendingRevisionOrder}<br/>
                  Transaction ID: {transactionId}<br/>
                </div>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                <div className="mb-4">
                  <label htmlFor="revisionMessageDetail" className="block text-sm font-medium text-gray-700 mb-2">
                    Jelaskan apa yang perlu direvisi:
                  </label>
                  <textarea
                    id="revisionMessageDetail"
                    value={revisionMessage}
                    onChange={(e) => setRevisionMessage(e.target.value)}
                    placeholder="Contoh: Mohon ubah warna background menjadi biru dan tambahkan logo di bagian header..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent resize-none"
                    disabled={isUpdating}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Berikan detail yang jelas agar freelancer dapat melakukan revisi dengan tepat.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleRevisionCancel}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleRevisionSubmit}
                    disabled={isUpdating || !revisionMessage.trim()}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isUpdating ? 'Mengirim...' : 'Kirim Revisi'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Daftar Transaksi</h1>
            <p className="text-gray-600">Kelola semua pesanan layanan Anda</p>
          </div>
          <button
            onClick={() => !isLoadingOrders && loadOrders()}
            disabled={isLoadingOrders}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className={`h-4 w-4 mr-2 ${isLoadingOrders ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isLoadingOrders ? 'Memuat...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 font-medium">Error:</p>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={() => setError('')}
              className="text-sm text-red-600 hover:text-red-800 underline"
            >
              Dismiss
            </button>
            <button
              onClick={() => {
                setError('');
                loadOrders();
              }}
              className="text-sm text-red-600 hover:text-red-800 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 mb-6">
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

        {/* Orders List */}
        <div className="divide-y divide-gray-100">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada transaksi</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'all' 
                  ? 'Anda belum memiliki transaksi apapun.'
                  : `Tidak ada transaksi dengan status "${tabs.find(t => t.id === activeTab)?.label}".`
                }
              </p>
              <div className="mt-6">
                <Link
                  to="/browse"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#010042] hover:bg-[#010042]/90"
                >
                  Mulai Berbelanja
                </Link>
              </div>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {order.title}
                      </h3>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500 space-x-4 mb-2">
                      <span>ID: {order.id}</span>
                      <span>•</span>
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                    
                    {/* Payment deadline banner for payment status */}
                    {order.status === 'payment' && order.paymentExpiredAt && (
                      <div className="mb-2 text-sm text-orange-600">
                        <span className="font-medium">Batas waktu pembayaran: </span>
                        {formatDate(order.paymentExpiredAt.seconds 
                          ? new Date(order.paymentExpiredAt.seconds * 1000) 
                          : new Date(order.paymentExpiredAt)
                        )}
                      </div>
                    )}
                    
                    <div className="text-lg font-bold text-[#010042]">
                      {formatPrice(getOrderPrice(order))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 ml-4">
                    {/* Show payment button for payment status orders */}
                    {order.status === 'payment' && (
                      <button
                        onClick={() => handlePayment(order)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Bayar Sekarang
                      </button>
                    )}
                    
                    {/* Show message button for non-payment status orders */}
                    {order.status !== 'payment' && (
                      <Link
                        to={`/messages/${order.conversationId || order.id}`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Pesan
                      </Link>
                    )}
                    
                    {/* Show rating button for completed orders that haven't been rated */}
                    {order.status === 'completed' && !orderRatingStatus[order.id] && (
                      <button
                        onClick={() => handleRateOrder(order.id)}
                        disabled={isSubmittingRating}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Beri Rating
                      </button>
                    )}
                    
                    {/* Show "Sudah Dirating" for completed orders that have been rated */}
                    {order.status === 'completed' && orderRatingStatus[order.id] && (
                      <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md">
                        <svg className="h-4 w-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Sudah Dirating
                      </span>
                    )}
                    
                    {/* Show detail button for all orders */}
                    <Link
                      to={`/dashboard/client/transactions/${order.id}`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#010042] hover:bg-[#010042]/90"
                    >
                      Detail
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Rating Modal - List View */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={handleRatingSkip}
        onSubmit={handleRatingSubmit}
                    freelancerName={orders.find(o => o.id === pendingOrderCompletion)?.freelancer?.displayName || 'Freelancer'}
        gigTitle={orders.find(o => o.id === pendingOrderCompletion)?.title || ''}
        isSubmitting={isSubmittingRating}
      />

      {/* Revision Modal - List View */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Permintaan Revisi
              </h3>
              
              {/* Debug Info */}
              <div className="mb-2 p-2 bg-green-100 text-xs text-green-800 rounded">
                Order ID: {pendingRevisionOrder}<br/>
                No Transaction ID (List View)<br/>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="revisionMessage" className="block text-sm font-medium text-gray-700 mb-2">
                  Jelaskan apa yang perlu direvisi:
                </label>
                <textarea
                  id="revisionMessage"
                  value={revisionMessage}
                  onChange={(e) => setRevisionMessage(e.target.value)}
                  placeholder="Contoh: Mohon ubah warna background menjadi biru dan tambahkan logo di bagian header..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent resize-none"
                  disabled={isUpdating}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Berikan detail yang jelas agar freelancer dapat melakukan revisi dengan tepat.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleRevisionCancel}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleRevisionSubmit}
                  disabled={isUpdating || !revisionMessage.trim()}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdating ? 'Mengirim...' : 'Kirim Revisi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Debug showRevisionModal state */}
      {console.log('🔍 [ClientTransactions] showRevisionModal state:', showRevisionModal)}
      
    </div>
  );
} 