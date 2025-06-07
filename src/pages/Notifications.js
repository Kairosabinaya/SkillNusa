import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import notificationService from '../services/notificationService';
import navigationCleanup from '../utils/navigationCleanup';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import PageContainer from '../components/common/PageContainer';


export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    // Clean up any existing subscriptions before creating new ones

    navigationCleanup.cleanupOnNavigation(currentUser.uid, 'page-mount');

    let unsubscribe = null;

    // Small delay to ensure cleanup completes before creating new subscription
    const setupTimer = setTimeout(() => {
      // Subscribe to real-time notifications
      unsubscribe = notificationService.subscribeToNotifications(
        currentUser.uid,
        (notificationsData) => {
          setNotifications(notificationsData);
          setLoading(false);
        }
      );
    }, 100);

    return () => {
      clearTimeout(setupTimer);
      if (unsubscribe) {
        unsubscribe();
      }
      navigationCleanup.cleanupOnNavigation(currentUser.uid, 'page-unmount');
    };
  }, [currentUser]);

  // Filter notifications based on selected filter
  const filteredNotifications = notifications
    .filter(notification => notification) // Ensure valid notification objects
    .filter(notification => {
      if (filter === 'all') return true;
      if (filter === 'unread') return !notification.read;
      return notification.type === filter;
    });

  // Group notifications by type for stats
  const notificationStats = notifications.reduce((acc, notification) => {
    const type = notification.type;
    if (!acc[type]) {
      acc[type] = { total: 0, unread: 0 };
    }
    acc[type].total++;
    if (!notification.read) {
      acc[type].unread++;
    }
    return acc;
  }, {});

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
    } catch (error) {
      // Silent error handling
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAsRead(true);
      await notificationService.markAllAsRead(currentUser.uid);
    } catch (error) {
      // Silent error handling
    } finally {
      setMarkingAsRead(false);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    const now = new Date();
    const notificationDate = date instanceof Date ? date : new Date(date);
    const diffInHours = (now - notificationDate) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Baru saja' : `${diffInMinutes} menit yang lalu`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} jam yang lalu`;
    } else if (diffInHours < 48) {
      return 'Kemarin';
    } else {
      return notificationDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type, priority) => {
    const iconClass = `h-10 w-10 ${priority === 'high' ? 'text-red-600' : 'text-[#010042]'}`;
    
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

  // Get filter label
  const getFilterLabel = (filterType) => {
    const labels = {
      all: 'Semua',
      unread: 'Belum Dibaca',
      order_status: 'Status Pesanan',
      message: 'Pesan',
      review: 'Review',
      payment: 'Pembayaran'
    };
    return labels[filterType] || filterType;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="large" text="Memuat notifikasi..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageContainer padding="px-6 py-8">
        {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifikasi</h1>
            <p className="text-gray-600">
              {notifications.length > 0 
                ? `${notifications.filter(n => !n.read).length} notifikasi belum dibaca dari ${notifications.length} total`
                : 'Tidak ada notifikasi'
              }
            </p>
          </div>
          
          {notifications.some(n => !n.read) && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAsRead}
              className="px-4 py-2 bg-[#010042] text-white rounded-lg hover:bg-[#0100a3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {markingAsRead ? 'Memproses...' : 'Tandai Semua Dibaca'}
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {['all', 'unread', 'order_status', 'message', 'review', 'payment']
              .filter((filterType) => {
                if (filterType === 'all' || filterType === 'unread') return true;
                const count = notificationStats[filterType]?.total || 0;
                return count > 0;
              })
              .map((filterType) => {
                const count = filterType === 'all' 
                  ? notifications.length 
                  : filterType === 'unread'
                  ? notifications.filter(n => !n.read).length
                  : notificationStats[filterType]?.total || 0;
                
                return (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={`flex-shrink-0 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 ${
                      filter === filterType
                        ? 'border-[#010042] text-[#010042]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {getFilterLabel(filterType)}
                    {count > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        filter === filterType ? 'bg-[#010042] text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
          </nav>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
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
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            {filter === 'all' ? 'Tidak ada notifikasi' : `Tidak ada notifikasi ${getFilterLabel(filter).toLowerCase()}`}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? 'Anda belum memiliki notifikasi saat ini.'
              : `Tidak ada notifikasi ${getFilterLabel(filter).toLowerCase()} yang tersedia.`
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <li 
                key={notification.id} 
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    {getNotificationIcon(notification.type, notification.priority)}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`text-base font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <p className={`mt-1 text-sm ${!notification.read ? 'text-gray-700' : 'text-gray-600'}`}>
                          {notification.message}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Tandai Dibaca
                          </button>
                        )}
                        {notification.priority === 'high' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Penting
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {notification.actionUrl && (
                      <div className="mt-3">
                        <Link 
                          to={notification.actionUrl}
                          onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                          className="inline-flex items-center text-sm font-medium text-[#010042] hover:text-blue-700"
                        >
                          Lihat Detail
                          <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
              )}
      </PageContainer>
    </div>
    );
  } 