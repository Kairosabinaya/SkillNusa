import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';
import { motion } from 'framer-motion';

export default function NotificationSummary({ limit = 5 }) {
  const [notifications, setNotifications] = useState([]);
  const [counts, setCounts] = useState({
    order_status: 0,
    message: 0,
    review: 0,
    payment: 0
  });
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to recent notifications
    const unsubscribe = notificationService.subscribeToNotifications(
      currentUser.uid,
      (notificationsData) => {
        // Additional safety check to ensure valid data
        const validNotifications = notificationsData
          .filter(notification => notification)
          .slice(0, limit);
        setNotifications(validNotifications);
        setLoading(false);
      },
      limit
    );

    // Get notification counts by type
    const fetchCounts = async () => {
      const typeCounts = await notificationService.getNotificationCountsByType(currentUser.uid);
      setCounts(typeCounts);
    };

    fetchCounts();

    return () => unsubscribe();
  }, [currentUser, limit]);

  // Format date for display
  const formatDate = (date) => {
    const now = new Date();
    const notificationDate = date instanceof Date ? date : new Date(date);
    const diffInHours = (now - notificationDate) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Baru saja' : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}j`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}h`;
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type, priority) => {
    const iconClass = `h-8 w-8 ${priority === 'high' ? 'text-red-600' : 'text-[#010042]'}`;
    
    switch (type) {
      case 'order_status':
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'message':
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'review':
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      case 'payment':
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 mb-3">
              <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalUnread = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-[#010042] to-[#0100a3] text-white flex justify-between items-center">
        <h3 className="text-lg font-semibold">Notifikasi Terbaru</h3>
        <div className="flex items-center space-x-2">
          {totalUnread > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
          <Link 
            to="/notifications"
            className="text-sm text-white hover:text-gray-200 transition-colors"
          >
            Lihat Semua
          </Link>
        </div>
      </div>

      {/* Notification Counts Summary */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-[#010042]">{counts.order_status}</div>
            <div className="text-xs text-gray-600">Pesanan</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[#010042]">{counts.message}</div>
            <div className="text-xs text-gray-600">Pesan</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[#010042]">{counts.review}</div>
            <div className="text-xs text-gray-600">Review</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[#010042]">{counts.payment}</div>
            <div className="text-xs text-gray-600">Pembayaran</div>
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="p-6">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada notifikasi</h3>
            <p className="mt-1 text-sm text-gray-500">
              Anda belum memiliki notifikasi terbaru.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications
              .filter(notification => notification) // Ensure valid notification objects
              .map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                  !notification.read 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type, notification.priority)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        !notification.read ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </p>
                      <p className={`text-xs mt-1 ${
                        !notification.read ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                        {notification.message.length > 60 
                          ? `${notification.message.substring(0, 60)}...`
                          : notification.message
                        }
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <span className="text-xs text-gray-500">
                        {formatDate(notification.createdAt)}
                      </span>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                      {notification.priority === 'high' && (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  
                  {notification.actionUrl && (
                    <div className="mt-2">
                      <Link 
                        to={notification.actionUrl}
                        className="text-xs text-[#010042] hover:text-blue-700 font-medium"
                      >
                        Lihat Detail →
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {notifications.length > 0 && (
          <div className="mt-4 text-center">
            <Link 
              to="/notifications"
              className="inline-flex items-center text-sm font-medium text-[#010042] hover:text-blue-700"
            >
              Lihat Semua Notifikasi
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
} 