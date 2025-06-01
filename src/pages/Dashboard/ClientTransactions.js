import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import orderService from '../../services/orderService';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDocs, query, where } from 'firebase/firestore';

export default function ClientTransactions() {
  const { transactionId } = useParams();
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Rating modal states
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingOrderId, setRatingOrderId] = useState(null);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [currentUser]);

  useEffect(() => {
    if (transactionId && orders.length > 0) {
      const transaction = orders.find(order => order.id === transactionId);
      setSelectedTransaction(transaction);
    }
  }, [transactionId, orders]);

  const loadOrders = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const ordersWithDetails = await orderService.getOrdersWithDetails(currentUser.uid, 'client');
      setOrders(ordersWithDetails);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
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

  // Function to update gig and freelancer aggregate stats
  const updateGigAndFreelancerStats = async (gigId, freelancerId) => {
    try {
      console.log('🔄 Updating aggregate stats for gig:', gigId, 'freelancer:', freelancerId);
      
      // Get all reviews for this gig
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('gigId', '==', gigId),
        where('status', '==', 'published')
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      
      let totalRating = 0;
      let reviewCount = 0;
      
      reviewsSnapshot.forEach((doc) => {
        const review = doc.data();
        totalRating += review.rating;
        reviewCount++;
      });
      
      const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;
      
      console.log('📊 Calculated stats:', {
        gigId,
        reviewCount,
        averageRating: averageRating.toFixed(1)
      });
      
      // Update gig document
      const gigRef = doc(db, 'gigs', gigId);
      await updateDoc(gigRef, {
        rating: parseFloat(averageRating.toFixed(1)),
        totalReviews: reviewCount,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Updated gig stats');
      
      // Get all reviews for this freelancer (across all gigs)
      const freelancerReviewsQuery = query(
        collection(db, 'reviews'),
        where('freelancerId', '==', freelancerId),
        where('status', '==', 'published')
      );
      const freelancerReviewsSnapshot = await getDocs(freelancerReviewsQuery);
      
      let freelancerTotalRating = 0;
      let freelancerReviewCount = 0;
      
      freelancerReviewsSnapshot.forEach((doc) => {
        const review = doc.data();
        freelancerTotalRating += review.rating;
        freelancerReviewCount++;
      });
      
      const freelancerAverageRating = freelancerReviewCount > 0 ? freelancerTotalRating / freelancerReviewCount : 0;
      
      console.log('📊 Calculated freelancer stats:', {
        freelancerId,
        reviewCount: freelancerReviewCount,
        averageRating: freelancerAverageRating.toFixed(1)
      });
      
      // Update freelancer profile document
      const freelancerRef = doc(db, 'freelancerProfiles', freelancerId);
      await updateDoc(freelancerRef, {
        rating: parseFloat(freelancerAverageRating.toFixed(1)),
        totalReviews: freelancerReviewCount,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Updated freelancer stats');
      
    } catch (error) {
      console.error('❌ Error updating aggregate stats:', error);
    }
  };

  // Handler untuk terima pekerjaan
  const handleAcceptWork = async () => {
    if (!selectedTransaction) return;
    if (!window.confirm('Apakah Anda yakin ingin menerima hasil pekerjaan ini?')) return;
    
    setActionLoading(true);
    try {
      console.log('Accepting work for transaction:', selectedTransaction.id);
      console.log('Current status:', selectedTransaction.status);
      console.log('Current user:', currentUser.uid);
      console.log('Selected transaction object:', selectedTransaction);
      
      // Update status di Firebase
      await orderService.updateOrderStatus(selectedTransaction.id, 'completed', currentUser.uid, {
        statusMessage: 'Pekerjaan diterima oleh client.',
        completedAt: new Date().toISOString()
      });
      
      console.log('Status update successful');
      
      // Update state lokal
      setSelectedTransaction(prev => ({
        ...prev,
        status: 'completed',
        statusMessage: 'Pekerjaan diterima oleh client.'
      }));
      
      setOrders(prev => prev.map(t => 
        t.id === selectedTransaction.id 
          ? { ...t, status: 'completed', statusMessage: 'Pekerjaan diterima oleh client.' }
          : t
      ));
      
      // Reload data untuk memastikan konsistensi
      await loadOrders();
      
      alert('Pekerjaan berhasil diterima! Status transaksi telah diubah menjadi "Selesai".');
      
    } catch (error) {
      console.error('Error accepting work:', error);
      console.error('Error details:', error.message, error.stack);
      alert('Gagal menerima pekerjaan. Silakan coba lagi. Error: ' + (error.message || error));
    } finally {
      setActionLoading(false);
    }
  };

  // Handler untuk minta revisi
  const handleRequestRevision = async () => {
    if (!selectedTransaction) return;
    
    const revisionMessage = prompt('Tuliskan pesan revisi yang ingin Anda sampaikan:');
    if (!revisionMessage || revisionMessage.trim() === '') {
      alert('Pesan revisi tidak boleh kosong.');
      return;
    }
    
    setActionLoading(true);
    try {
      console.log('Requesting revision for transaction:', selectedTransaction.id);
      console.log('Current status:', selectedTransaction.status);
      console.log('Current user:', currentUser.uid);
      console.log('Revision message:', revisionMessage.trim());
      
      // Update status di Firebase
      await orderService.updateOrderStatus(selectedTransaction.id, 'in_revision', currentUser.uid, {
        statusMessage: `Revisi diminta: ${revisionMessage.trim()}`,
        revisionRequestedAt: new Date().toISOString(),
        revisionMessage: revisionMessage.trim()
      });
      
      console.log('Status update successful');

      // Send manual revision request message to freelancer
      try {
        // Import chatService if not already imported
        const chatService = (await import('../../services/chatService')).default;
        
        // Find or create chat
        let chat = await chatService.findChatBetweenUsers(currentUser.uid, selectedTransaction.freelancerId);
        if (!chat) {
          chat = await chatService.createOrGetChat(
            currentUser.uid, 
            selectedTransaction.freelancerId, 
            selectedTransaction.gigId, 
            selectedTransaction.id
          );
        }

        if (chat) {
          // Send custom revision request message from client to freelancer
          const revisionRequestContent = `🔄 **Permintaan Revisi**\n\nHalo, saya telah mereview hasil pekerjaan dan meminta revisi dengan detail berikut:\n\n💬 **Detail Revisi:**\n${revisionMessage.trim()}\n\n🎯 Mohon untuk dikerjakan kembali sesuai dengan catatan di atas.\n⏰ Terima kasih atas pengertiannya!`;
          
          await chatService.sendMessage(
            chat.id,
            currentUser.uid, // Client sends the message
            revisionRequestContent,
            'revision_request',
            null,
            null,
            {
              orderId: selectedTransaction.id,
              revisionMessage: revisionMessage.trim(),
              type: 'revision_request'
            }
          );

          console.log('✅ Manual revision request message sent to freelancer');
        }
      } catch (chatError) {
        console.error('Error sending revision request message:', chatError);
        // Don't fail the revision request if chat message fails
      }
      
      // Update state lokal
      setSelectedTransaction(prev => ({
        ...prev,
        status: 'in_revision',
        statusMessage: `Revisi diminta: ${revisionMessage.trim()}`
      }));
      
      setOrders(prev => prev.map(t => 
        t.id === selectedTransaction.id 
          ? { ...t, status: 'in_revision', statusMessage: `Revisi diminta: ${revisionMessage.trim()}` }
          : t
      ));
      
      // Reload data untuk memastikan konsistensi
      await loadOrders();
      
      alert('Permintaan revisi berhasil dikirim! Freelancer akan segera melihat pesan Anda.');
      
    } catch (error) {
      console.error('Error requesting revision:', error);
      alert('Gagal mengirim permintaan revisi. Silakan coba lagi. Error: ' + (error.message || error));
    } finally {
      setActionLoading(false);
    }
  };

  // Handler untuk memberi rating
  const handleGiveRating = (orderId) => {
    setRatingOrderId(orderId);
    setShowRatingModal(true);
    setRating(0);
    setRatingComment('');
  };

  // Handler untuk submit rating
  const handleSubmitRating = async () => {
    if (!ratingOrderId || rating === 0) {
      alert('Silakan berikan rating terlebih dahulu!');
      return;
    }

    setIsSubmittingRating(true);
    try {
      const order = orders.find(o => o.id === ratingOrderId);
      if (!order) {
        throw new Error('Order tidak ditemukan');
      }

      console.log('Creating review for order:', ratingOrderId);

      // Create review using Firebase directly
      const reviewData = {
        orderId: ratingOrderId,
        gigId: order.gigId,
        freelancerId: order.freelancerId,
        clientId: currentUser.uid,
        rating: rating,
        comment: ratingComment.trim(),
        helpful: 0,
        status: 'published',
        isVisible: true,
        isReported: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'reviews'), reviewData);
      console.log('Review created successfully');

      // Update order with rating flag (without changing status)
      const orderRef = doc(db, 'orders', ratingOrderId);
      await updateDoc(orderRef, {
        hasRating: true,
        ratedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('Order updated with rating flag');

      // Update local state
      setOrders(prev => prev.map(o => 
        o.id === ratingOrderId 
          ? { ...o, hasRating: true, ratedAt: new Date().toISOString() }
          : o
      ));

      if (selectedTransaction && selectedTransaction.id === ratingOrderId) {
        setSelectedTransaction(prev => ({
          ...prev,
          hasRating: true,
          ratedAt: new Date().toISOString()
        }));
      }

      // Refresh reviews on gig detail page if open
      if (window.refreshGigReviews) {
        console.log('🔄 Refreshing gig reviews on detail page');
        window.refreshGigReviews();
      }

      // Close modal and show success
      setShowRatingModal(false);
      alert('Rating berhasil diberikan! Terima kasih atas feedback Anda.');

    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Gagal memberikan rating. Silakan coba lagi. Error: ' + (error.message || error));
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Close rating modal
  const closeRatingModal = () => {
    setShowRatingModal(false);
    setRatingOrderId(null);
    setRating(0);
    setRatingComment('');
  };

  // Render star rating
  const renderStarRating = (currentRating, onRatingChange, readonly = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onRatingChange(star)}
            className={`h-8 w-8 ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
          >
            <svg
              className={`w-full h-full ${
                star <= currentRating ? 'text-yellow-400' : 'text-gray-300'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

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
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/dashboard/client/transactions"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Detail Transaksi #{selectedTransaction.id.slice(-8).toUpperCase()}
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
                <div className="flex justify-between">
                  <span className="text-gray-600">Harga:</span>
                  <span className="font-medium">{formatPrice(selectedTransaction.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tanggal Pemesanan:</span>
                  <span>{formatDate(selectedTransaction.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Waktu Pengerjaan:</span>
                  <span>{selectedTransaction.deliveryTime || '3 hari'}</span>
                </div>
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
              
              <Link 
                to={`/messages?freelancerId=${selectedTransaction.freelancerId}&orderId=${selectedTransaction.id}`}
                className="w-full flex items-center justify-center gap-2 bg-[#010042] text-white py-2 px-4 rounded-lg hover:bg-[#0100a3]"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Chat dengan Freelancer
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
              <div className="space-y-2">
                {selectedTransaction.status === 'completed' && !selectedTransaction.hasRating && (
                  <button
                    onClick={() => handleGiveRating(selectedTransaction.id)}
                    className="w-full flex items-center gap-2 bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Beri Rating
                  </button>
                )}

                {selectedTransaction.status === 'completed' && selectedTransaction.hasRating && (
                  <div className="w-full flex items-center gap-2 bg-green-100 text-green-800 py-2 px-4 rounded-lg">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Rating Telah Diberikan
                  </div>
                )}
                
                {selectedTransaction.status === 'delivered' && (
                  <button 
                    onClick={handleAcceptWork}
                    disabled={actionLoading}
                    className={`w-full flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 ${actionLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {actionLoading ? 'Memproses...' : 'Terima Pekerjaan'}
                  </button>
                )}
                
                {['active', 'in_progress', 'delivered'].includes(selectedTransaction.status) && (
                  <button 
                    onClick={handleRequestRevision}
                    disabled={actionLoading}
                    className={`w-full flex items-center gap-2 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 ${actionLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {actionLoading ? 'Memproses...' : 'Minta Revisi'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rating Modal */}
        {showRatingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Berikan Rating & Ulasan
                </h3>
                
                <div className="space-y-4">
                  {/* Star Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating
                    </label>
                    {renderStarRating(rating, setRating)}
                    <p className="text-xs text-gray-500 mt-1">
                      {rating === 0 && 'Pilih rating'}
                      {rating === 1 && 'Sangat Buruk'}
                      {rating === 2 && 'Buruk'}
                      {rating === 3 && 'Biasa'}
                      {rating === 4 && 'Baik'}
                      {rating === 5 && 'Sangat Baik'}
                    </p>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ulasan (Opsional)
                    </label>
                    <textarea
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                      placeholder="Bagikan pengalaman Anda dengan freelancer ini..."
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {ratingComment.length}/500 karakter
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={closeRatingModal}
                    disabled={isSubmittingRating}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSubmitRating}
                    disabled={isSubmittingRating || rating === 0}
                    className="flex-1 px-4 py-2 bg-[#010042] text-white rounded-lg hover:bg-[#0100a3] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingRating ? 'Menyimpan...' : 'Kirim Rating'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Daftar Transaksi</h1>
        <p className="text-gray-600">Kelola semua pesanan layanan Anda</p>
      </div>

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
                      <span>Freelancer: {order.freelancer?.displayName || 'Unknown'}</span>
                      <span>•</span>
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                    
                    <div className="text-lg font-bold text-[#010042]">
                      {formatPrice(order.totalPrice)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 ml-4">
                    <Link
                      to={`/messages/${order.conversationId || order.id}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Pesan
                    </Link>
                    
                    {order.status === 'completed' && !order.hasRating && (
                      <button
                        onClick={() => handleGiveRating(order.id)}
                        className="inline-flex items-center px-3 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700"
                      >
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Rating
                      </button>
                    )}

                    {order.status === 'completed' && order.hasRating && (
                      <span className="inline-flex items-center px-3 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-md">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Sudah Rating
                      </span>
                    )}
                    
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
    </div>
  );
} 