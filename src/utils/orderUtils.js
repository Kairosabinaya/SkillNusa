/**
 * Order utility functions for deadline calculations, status formatting, and revision management
 */

/**
 * Calculate time remaining until deadline
 * @param {Date|Timestamp} deadline - The deadline date
 * @returns {string} Formatted time remaining string
 */
export const calculateTimeRemaining = (deadline) => {
  if (!deadline) return 'Tidak ada deadline';
  
  const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline);
  const now = new Date();
  const timeRemaining = deadlineDate.getTime() - now.getTime();
  
  if (timeRemaining <= 0) {
    return 'Terlambat';
  }
  
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days} hari ${hours} jam`;
  } else {
    return `${hours} jam`;
  }
};

/**
 * Get deadline urgency color class
 * @param {Date|Timestamp} deadline - The deadline date
 * @returns {string} CSS color class
 */
export const getDeadlineUrgencyColor = (deadline) => {
  if (!deadline) return 'text-gray-500';
  
  const timeRemaining = calculateTimeRemaining(deadline);
  
  if (timeRemaining.includes('Terlambat')) {
    return 'text-red-600';
  } else if (timeRemaining.includes('jam') && !timeRemaining.includes('hari')) {
    return 'text-orange-600';
  } else {
    return 'text-gray-500';
  }
};

/**
 * Check if revision button should be disabled
 * @param {Object} order - The order object
 * @returns {boolean} Whether revision is disabled
 */
export const isRevisionDisabled = (order) => {
  if (!order.gig || !order.packageType) {
    // If no gig data, check order's revision fields directly
    const maxRevisions = order.revisions || order.maxRevisions || 3;
    const currentRevisions = order.revisionCount || 0;
    return currentRevisions >= maxRevisions;
  }
  
  const packageData = order.gig.packages[order.packageType];
  if (!packageData) {
    // Fallback to order's revision fields
    const maxRevisions = order.revisions || order.maxRevisions || 3;
    const currentRevisions = order.revisionCount || 0;
    return currentRevisions >= maxRevisions;
  }
  
  const maxRevisions = typeof packageData.revisions === 'number' 
    ? packageData.revisions 
    : (packageData.revisions === 'Unlimited' ? Infinity : (order.revisions || order.maxRevisions || 3));
  
  const currentRevisions = order.revisionCount || 0;
  
  return currentRevisions >= maxRevisions && maxRevisions !== Infinity;
};

/**
 * Get revision count text display
 * @param {Object} order - The order object
 * @returns {string} Formatted revision count text
 */
export const getRevisionCountText = (order) => {
  if (!order.gig || !order.packageType) {
    // If no gig data, use order's revision fields
    const maxRevisions = order.revisions || order.maxRevisions || 3;
    const currentRevisions = order.revisionCount || 0;
    return `${currentRevisions}/${maxRevisions}`;
  }
  
  const packageData = order.gig.packages[order.packageType];
  if (!packageData) {
    // Fallback to order's revision fields
    const maxRevisions = order.revisions || order.maxRevisions || 3;
    const currentRevisions = order.revisionCount || 0;
    return `${currentRevisions}/${maxRevisions}`;
  }
  
  const maxRevisions = packageData.revisions;
  const currentRevisions = order.revisionCount || 0;
  
  if (maxRevisions === 'Unlimited') {
    return `${currentRevisions}/Unlimited`;
  }
  
  return `${currentRevisions}/${maxRevisions}`;
};

/**
 * Get status text in Indonesian
 * @param {string} status - Order status
 * @returns {string} Localized status text
 */
export const getStatusText = (status) => {
  const statusMap = {
    'pending': 'Menunggu Konfirmasi',
    'awaiting_confirmation': 'Menunggu Konfirmasi',
    'active': 'Aktif',
    'in_progress': 'Dalam Proses',
    'in_revision': 'Dalam Revisi',
    'delivered': 'Terkirim',
    'completed': 'Selesai',
    'cancelled': 'Dibatalkan',
    'rejected': 'Ditolak'
  };
  return statusMap[status] || status;
};

/**
 * Get status color classes
 * @param {string} status - Order status
 * @returns {string} CSS color classes
 */
export const getStatusColor = (status) => {
  const colorMap = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'awaiting_confirmation': 'bg-yellow-100 text-yellow-800',
    'active': 'bg-blue-100 text-blue-800',
    'in_progress': 'bg-blue-100 text-blue-800',
    'in_revision': 'bg-orange-100 text-orange-800',
    'delivered': 'bg-purple-100 text-purple-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800',
    'rejected': 'bg-red-100 text-red-800'
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return 'Rp 0';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format date for display
 * @param {Date|Timestamp} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '-';
  
  try {
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return '-';
    }
    
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

/**
 * Calculate deadline from confirmation date and delivery time
 * @param {Date} confirmationDate - Date when order was confirmed
 * @param {number|string} deliveryTime - Delivery time in days
 * @returns {Date} Calculated deadline
 */
export const calculateDeadline = (confirmationDate, deliveryTime) => {
  const deadline = new Date(confirmationDate);
  const deliveryDays = typeof deliveryTime === 'string' ? parseInt(deliveryTime) : deliveryTime;
  deadline.setDate(deadline.getDate() + deliveryDays);
  return deadline;
};

/**
 * Get order statistics from orders array
 * @param {Array} orders - Array of orders
 * @returns {Object} Statistics object
 */
export const calculateOrderStats = (orders) => {
  const stats = { total: 0, active: 0, completed: 0, pending: 0, cancelled: 0 };
  
  orders.forEach(order => {
    stats.total++;
    
    if (order.status === 'active' || 
        order.status === 'in_progress' || 
        order.status === 'in_revision' ||
        order.status === 'delivered') {
      stats.active++;
    } else if (order.status === 'completed') {
      stats.completed++;
    } else if (order.status === 'pending' || order.status === 'awaiting_confirmation') {
      stats.pending++;
    } else if (order.status === 'cancelled' || order.status === 'rejected') {
      stats.cancelled++;
    } else {
      // Unknown status, treat as pending
      stats.pending++;
    }
  });
  
  return stats;
}; 