import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  ClockIcon, 
  CurrencyDollarIcon, 
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
  calculateTimeRemaining, 
  getDeadlineUrgencyColor, 
  getStatusText, 
  getStatusColor, 
  formatCurrency, 
  formatDate,
  getRevisionCountText,
  isRevisionDisabled
} from '../../utils/orderUtils';
import orderService from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import RefundRequestModal from './RefundRequestModal';

/**
 * Reusable Order Card Component
 * @param {Object} props - Component props
 * @param {Object} props.order - Order data
 * @param {number} props.index - Card index for animation delay
 * @param {Function} props.onStatusUpdate - Status update callback
 * @param {string} props.userType - Type of user ('freelancer' or 'client')
 * @returns {JSX.Element} Order card component
 */
export default function OrderCard({ order, index, onStatusUpdate, userType = 'freelancer' }) {
  const { currentUser } = useAuth();
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);

  const handleAccept = () => {
    onStatusUpdate(order.id, 'active');
  };

  const handleReject = () => {
    onStatusUpdate(order.id, 'cancelled');
  };

  const handleRevisionClick = () => {
    setShowRevisionModal(true);
    setRevisionMessage('');
    setError('');
  };

  const handleRevisionSubmit = async () => {
    if (!revisionMessage.trim()) {
      setError('Pesan revisi tidak boleh kosong');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      // Call orderService.requestRevision with proper parameters
      await orderService.requestRevision(order.id, currentUser.uid, {
        message: revisionMessage.trim()
      });

      // Close modal and notify parent component
      setShowRevisionModal(false);
      setRevisionMessage('');
      
      // Update status through parent callback
      if (onStatusUpdate) {
        onStatusUpdate(order.id, 'in_revision');
      }
      
    } catch (error) {
      setError(error.message || 'Gagal mengirim permintaan revisi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevisionCancel = () => {
    setShowRevisionModal(false);
    setRevisionMessage('');
    setError('');
  };

  const handleRefundClick = () => {
    setShowRefundModal(true);
  };

  // Check if order is eligible for refund
  const canRequestRefund = (order) => {
    // Can request refund if:
    // 1. Order is paid but not completed
    // 2. Freelancer rejected or didn't respond
    // 3. Order is cancelled but payment was made
    return order.paymentStatus === 'paid' && 
           (order.status === 'pending' || 
            order.status === 'awaiting_confirmation' || 
            order.status === 'cancelled' ||
            order.status === 'active');
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <Link 
              to={`/dashboard/${userType}/orders/${order.id}`}
              className="text-lg font-semibold text-gray-900 hover:text-[#010042] transition-colors"
            >
              {order.title}
            </Link>
            <p className="text-sm text-gray-600 mt-1">
              #{order.id.slice(-8)}
            </p>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
            {getStatusText(order.status)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <UserIcon className="h-4 w-4 mr-2" />
            <span>{order.client?.displayName || 'Client'}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <CurrencyDollarIcon className="h-4 w-4 mr-2" />
            <span>{formatCurrency(order.price || order.amount || order.totalPrice || 0)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span>{formatDate(order.createdAt)}</span>
          </div>
          
          {/* Show confirmation deadline for pending orders */}
          {order.status === 'pending' && order.confirmationDeadline && (
            <div className="flex items-center text-sm">
              <ClockIcon className="h-4 w-4 mr-2 text-red-500" />
              <div className="flex flex-col">
                <span className="text-red-600 font-medium">
                  Konfirmasi: {formatDate(order.confirmationDeadline)}
                </span>
                <span className="text-xs text-red-600 font-medium">
                  Sisa: {calculateTimeRemaining(order.confirmationDeadline)}
                </span>
              </div>
            </div>
          )}
          {(order.deadline || order.status === 'completed') && (
            <div className="flex items-center text-sm">
              <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
              <div className="flex flex-col">
                <span className="text-gray-600">
                  {order.status === 'completed' 
                    ? formatDate(order.completedAt || order.timeline?.completed || order.deliveredAt || order.deadline)
                    : formatDate(order.deadline)
                  }
                </span>
                {/* Only show countdown if order is not completed */}
                {order.status !== 'completed' && order.deadline && (
                  <span className={`text-xs ${getDeadlineUrgencyColor(order.deadline)}`}>
                    Sisa: {calculateTimeRemaining(order.deadline)}
                  </span>
                )}
                {/* Show completion indicator for completed orders */}
                {order.status === 'completed'}
              </div>
            </div>
          )}
        </div>

        {/* Revision Info */}
        {order.gig && order.packageType && (
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <span>Revisi: {getRevisionCountText(order)}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {userType === 'freelancer' ? (
            // Freelancer view - can accept/reject pending orders
            order.status === 'pending' || order.status === 'awaiting_confirmation' ? (
              <>
                <button
                  onClick={handleAccept}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Terima
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Tolak
                </button>
              </>
            ) : (
              <Link
                to={`/dashboard/freelancer/orders/${order.id}`}
                className="flex-1 bg-[#010042] text-white px-4 py-2 rounded-lg hover:bg-[#010042]/90 transition-colors text-sm font-medium text-center"
              >
                Lihat Detail
              </Link>
            )
          ) : (
            // Client view - can request revision for delivered orders or refund for eligible orders
            <>
              {order.status === 'delivered' && !isRevisionDisabled(order) ? (
                <button
                  onClick={handleRevisionClick}
                  className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                >
                  Minta Revisi
                </button>
              ) : canRequestRefund(order) ? (
                <button
                  onClick={handleRefundClick}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium mr-3"
                >
                  Request Refund
                </button>
              ) : null}
              
              <Link
                to={`/dashboard/client/orders/${order.id}`}
                className="flex-1 bg-[#010042] text-white px-4 py-2 rounded-lg hover:bg-[#010042]/90 transition-colors text-sm font-medium text-center"
              >
                Lihat Detail
              </Link>
            </>
          )}
        </div>
      </motion.div>

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Permintaan Revisi
              </h3>
              

              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="revisionMessage" className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi Revisi
                </label>
                <textarea
                  id="revisionMessage"
                  value={revisionMessage}
                  onChange={(e) => setRevisionMessage(e.target.value)}
                  placeholder="Jelaskan apa yang perlu diperbaiki..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleRevisionCancel}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleRevisionSubmit}
                  disabled={isSubmitting || !revisionMessage.trim()}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim Revisi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Request Modal */}
      <RefundRequestModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        order={order}
      />
    </>
  );
} 