import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useOrderManagement } from '../../hooks/useOrderManagement';
import { 
  calculateTimeRemaining, 
  getStatusText, 
  getStatusColor, 
  formatCurrency, 
  formatDate,
  getRevisionCountText,
  isRevisionDisabled
} from '../../utils/orderUtils';
import OrderCard from '../../components/orders/OrderCard';
import OrderStats from '../../components/orders/OrderStats';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  PaperClipIcon,
  XMarkIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import ErrorPopup from '../../components/common/ErrorPopup';
import SuccessPopup from '../../components/common/SuccessPopup';
import PageContainer from '../../components/common/PageContainer';
import subscriptionRegistry from '../../utils/subscriptionRegistry';
import orderService from '../../services/orderService';
import debugOrders from '../../utils/debugOrders';

export default function FreelancerOrders() {
  const { orderId } = useParams();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Use custom hook for order management
  const {
    orders,
    selectedOrder,
    loading,
    stats,
    error,
    success,
    updateOrderStatus,
    deliverOrder,
    filterOrders,
    clearMessages,
    setError,
    setSuccess
  } = useOrderManagement(currentUser, orderId);

  // Filter orders based on search and status
  const filteredOrders = filterOrders(searchQuery, filterStatus);

  // Handle delivery with our custom hook
  const handleDeliverOrder = async () => {
    if (!selectedOrder || !deliveryMessage.trim()) {
      setError('Pesan delivery tidak boleh kosong');
      return;
    }

    setIsUploading(true);
    try {
      await deliverOrder(selectedOrder.id, deliveryMessage, attachedFiles);
      setDeliveryMessage('');
      setAttachedFiles([]);
    } catch (error) {
      console.error('Error delivering order:', error);
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

  const handleRejectOrder = async () => {
    if (!rejectReason.trim()) {
      setError('Alasan penolakan harus diisi');
      return;
    }

    setIsRejecting(true);
    try {
      // Update order status with reason
      await updateOrderStatus(selectedOrder.id, 'cancelled', rejectReason);
      
      // Send message to chat if conversation exists
      try {
        const chatService = (await import('../../services/chatService')).default;
        const { addDoc, collection, serverTimestamp, updateDoc, doc } = await import('firebase/firestore');
        const { db } = await import('../../firebase/config');
        
        // Create or get chat with client
        const chat = await chatService.createOrGetChat(currentUser.uid, selectedOrder.clientId);
        
        // Send rejection message to chat
        await addDoc(collection(db, 'messages'), {
          conversationId: chat.id,
          senderId: currentUser.uid,
          content: `Pesanan "${selectedOrder.title}" telah ditolak.\n\nAlasan: ${rejectReason}`,
          type: 'text',
          createdAt: serverTimestamp(),
          read: false,
          isSystemMessage: true
        });

        // Update conversation
        await updateDoc(doc(db, 'conversations', chat.id), {
          lastMessage: `Pesanan ditolak: ${rejectReason}`,
          lastMessageTime: serverTimestamp(),
          lastMessageSender: currentUser.uid
        });

        // Send notification
        await addDoc(collection(db, 'notifications'), {
          userId: selectedOrder.clientId,
          type: 'order_rejected',
          message: `Pesanan "${selectedOrder.title}" ditolak oleh freelancer`,
          orderId: selectedOrder.id,
          createdAt: serverTimestamp(),
          read: false
        });
      } catch (chatError) {
        console.error('Error sending rejection message to chat:', chatError);
        // Don't fail the whole operation if chat fails
      }

      setShowRejectModal(false);
      setRejectReason('');
      setSuccess('Pesanan berhasil ditolak dan pesan telah dikirim ke client');
    } catch (error) {
      console.error('Error rejecting order:', error);
      setError('Gagal menolak pesanan');
    } finally {
      setIsRejecting(false);
    }
  };

  // Debug utility - cleanup subscriptions if needed (can be called from console)
  if (typeof window !== 'undefined' && currentUser) {
    window.debugCleanupFreelancerOrders = () => {
      console.log('🧹 [FreelancerOrders] Manual cleanup triggered');
      
      // Clean up from subscription registry
      const cleanedCount = subscriptionRegistry.cleanupUserSubscriptions(currentUser.uid);
      
      // Clean up from order service
      orderService.forceCleanupSubscription(currentUser.uid, 'freelancer');
      
      console.log('✅ [FreelancerOrders] Manual cleanup completed, cleaned subscriptions:', cleanedCount);
      
      // Refresh the page to restart subscriptions cleanly
      if (window.confirm('Cleanup completed. Refresh page to restart cleanly?')) {
        window.location.reload();
      }
    };
  }

  if (loading) {
    return (
      <PageContainer maxWidth="max-w-7xl" padding="px-4 py-16">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
          
          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
          
          {/* Search skeleton */}
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <div className="flex gap-4">
              <div className="flex-1 h-10 bg-gray-200 rounded"></div>
              <div className="w-32 h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
          
          {/* Orders skeleton */}
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
          
          {/* Loading text */}
          <div className="text-center mt-8">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#010042] mr-3"></div>
              <span className="text-gray-600">Memuat pesanan...</span>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Single order view
  if (orderId && selectedOrder) {
    return (
      <PageContainer maxWidth="max-w-7xl" padding="px-4 py-16">
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
                {/* Only show financial info for non-cancelled orders */}
                {selectedOrder.status !== 'cancelled' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Harga:</span>
                      <span className="font-medium">{formatCurrency(selectedOrder.price || selectedOrder.amount || selectedOrder.totalPrice || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platform Fee (10%):</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(Math.round((selectedOrder.price || selectedOrder.amount || selectedOrder.totalPrice || 0) * 0.1))}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-900 font-semibold">Penghasilan Anda:</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(selectedOrder.freelancerEarning || Math.round((selectedOrder.price || selectedOrder.amount || selectedOrder.totalPrice || 0) * 0.9))}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tanggal Pemesanan:</span>
                  <span>{formatDate(selectedOrder.createdAt)}</span>
                </div>
                {/* Only show deadline/completion date for non-cancelled orders */}
                {selectedOrder.status !== 'cancelled' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {selectedOrder.status === 'completed' ? 'Tanggal Selesai:' : 'Deadline:'}
                    </span>
                    <div className="text-right">
                      <span className="font-medium">
                        {selectedOrder.status === 'completed' 
                          ? formatDate(selectedOrder.completedAt || selectedOrder.timeline?.completed || selectedOrder.deliveredAt || selectedOrder.deadline)
                          : formatDate(selectedOrder.deadline)
                        }
                      </span>
                      {/* Only show countdown if order is not completed */}
                      {selectedOrder.status !== 'completed' && selectedOrder.deadline && (
                        <div className={`text-xs mt-1 ${
                          calculateTimeRemaining(selectedOrder.deadline).includes('Terlambat') 
                            ? 'text-red-600' 
                            : calculateTimeRemaining(selectedOrder.deadline).includes('jam') && !calculateTimeRemaining(selectedOrder.deadline).includes('hari')
                            ? 'text-orange-600' 
                            : 'text-gray-500'
                        }`}>
                          Sisa: {calculateTimeRemaining(selectedOrder.deadline)}
                        </div>
                      )}
                                           {/* Show completion indicator for completed orders */}
                       {selectedOrder.status === 'completed'}
                    </div>
                  </div>
                )}
                {/* Show cancellation date for cancelled orders */}
                {selectedOrder.status === 'cancelled' && selectedOrder.cancelledAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tanggal Dibatalkan:</span>
                    <span>{formatDate(selectedOrder.cancelledAt)}</span>
                  </div>
                )}
                {/* Only show revision info for non-cancelled orders */}
                {selectedOrder.status !== 'cancelled' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revisi:</span>
                    <span className={`font-medium ${
                      isRevisionDisabled(selectedOrder) ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {getRevisionCountText(selectedOrder)}
                    </span>
                  </div>
                )}
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
            {(selectedOrder.status === 'active' || selectedOrder.status === 'in_revision') && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedOrder.status === 'in_revision' ? 'Kirim Perbaikan Revisi' : 'Kirim Hasil Pekerjaan'}
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
                      placeholder={selectedOrder.status === 'in_revision' ? 'Jelaskan perbaikan yang telah dilakukan...' : 'Jelaskan hasil pekerjaan Anda...'}
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
                    onClick={handleDeliverOrder}
                    disabled={!deliveryMessage.trim() || isUploading || !['active', 'in_revision'].includes(selectedOrder.status)}
                    className="w-full bg-[#010042] text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Mengirim...' : 
                     !['active', 'in_revision'].includes(selectedOrder.status) ? 'Pesanan Tidak Aktif' : 
                     selectedOrder.status === 'in_revision' ? 'Kirim Perbaikan' : 'Kirim Hasil Pekerjaan'}
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

            {/* Revision History */}
            {selectedOrder.revisionRequests && selectedOrder.revisionRequests.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Riwayat Permintaan Revisi ({selectedOrder.revisionRequests.length})
                </h2>
                <div className="space-y-4">
                  {selectedOrder.revisionRequests
                    .slice()
                    .reverse()
                    .map((revision, index) => (
                    <div key={index} className="border-l-4 border-orange-400 pl-4 py-3 bg-orange-50 rounded-r-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <p className="text-sm font-medium text-orange-900">
                            Revisi #{selectedOrder.revisionRequests.length - index}
                          </p>
                          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full flex-shrink-0">
                            Diminta
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
                
                {selectedOrder.status === 'in_revision' && (
                  <div className="space-y-3">                   
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium">
                          Gunakan form "Kirim Perbaikan Revisi" di atas untuk mengirim hasil perbaikan.
                        </span>
                      </div>
                    </div>
                  </div>
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
                Client
              </h3>
              <div className="flex items-center mb-4">
                <img 
                  src={selectedOrder.client?.profilePhoto || 'https://picsum.photos/48/48'} 
                  alt={selectedOrder.client?.displayName}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div className="ml-3">
                  <p className="font-medium text-gray-900">
                    {selectedOrder.client?.displayName || 'Freelancer'}
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
                Chat
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
                      onClick={() => setShowRejectModal(true)}
                      className="w-full flex items-center gap-2 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
                    >
                      <XCircleIcon className="h-5 w-5" />
                      Tolak Pesanan
                    </button>
                  </>
                )}
                
                {selectedOrder.status === 'active' && (
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-blue-800 font-medium mb-2">
                      Pesanan Sedang Dikerjakan
                    </div>
                    <p className="text-sm text-blue-600">
                      Silakan kerjakan pesanan dan kirim hasil melalui form delivery di bawah.
                    </p>
                  </div>
                )}


                {selectedOrder.status === 'delivered' && (
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-green-800 font-medium mb-2">
                      Pesanan Telah Dikirim
                    </div>
                    <p className="text-sm text-green-600">
                      Menunggu review dari client. Client dapat menerima pekerjaan atau meminta revisi.
                    </p>
                  </div>
                )}
                
                {selectedOrder.status === 'in_revision' && (
                  <div className="space-y-3">
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-orange-800 font-medium mb-2">
                        Revisi Diminta
                      </div>
                      <p className="text-sm text-orange-600">
                        Client meminta revisi. Silakan perbaiki pekerjaan.
                      </p>
                    </div>
                  </div>
                )}
                
                {selectedOrder.status === 'completed' && (
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-green-800 font-medium mb-2">
                      Pesanan Selesai
                    </div>
                    <p className="text-sm text-green-600">
                      Pekerjaan telah diterima oleh client. Terima kasih!
                    </p>
                  </div>
                )}
                
                {selectedOrder.status === 'cancelled' && (
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-red-800 font-medium mb-2">
                      Pesanan Dibatalkan
                    </div>
                    <p className="text-sm text-red-600">
                      Pesanan ini telah dibatalkan. Tidak ada transaksi keuangan yang terjadi.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Reject Order Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md"
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Tolak Pesanan
                </h3>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Anda akan menolak pesanan: <strong>{selectedOrder.title}</strong>
                  </p>
                  <p className="text-sm text-red-600">
                    Alasan penolakan akan dikirim ke client melalui chat.
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alasan Penolakan *
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Jelaskan alasan mengapa Anda menolak pesanan ini..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleRejectOrder}
                  disabled={!rejectReason.trim() || isRejecting}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300"
                >
                  {isRejecting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Menolak...
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      Tolak Pesanan
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </PageContainer>
    );
  }

  // Orders list view
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ErrorPopup 
        message={error} 
        onClose={clearMessages} 
        duration={3000}
      />
      
      <SuccessPopup 
        message={success} 
        onClose={clearMessages} 
        duration={3000}
      />

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pesanan Saya
            </h1>
            <p className="text-gray-600">
              Kelola semua pesanan dari client Anda
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <OrderStats stats={stats} />

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
              className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042] bg-white appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em'
              }}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order, index) => (
            <OrderCard
              key={order.id}
              order={order}
              index={index}
              onStatusUpdate={updateOrderStatus}
              userType="freelancer"
            />
          ))
        ) : (
          <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
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