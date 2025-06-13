import { db } from '../firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

class PaymentService {
  constructor() {
    // Configuration from environment variables
    this.createPaymentUrl = process.env.REACT_APP_PHP_CREATE_URL;
    this.tripayPrivateKey = process.env.REACT_APP_TRIPAY_PRIVATE_KEY;
    this.tripayMerchantCode = process.env.REACT_APP_TRIPAY_MERCHANT_CODE;
    this.tripayMode = process.env.REACT_APP_TRIPAY_MODE || 'sandbox';
    
    // Debug environment variables
    console.log('🔧 [PaymentService] Environment Variables:');
    console.log('- REACT_APP_PHP_CREATE_URL:', this.createPaymentUrl);
    console.log('- REACT_APP_TRIPAY_PRIVATE_KEY:', this.tripayPrivateKey ? '***SET***' : 'NOT SET');
    console.log('- REACT_APP_TRIPAY_MERCHANT_CODE:', this.tripayMerchantCode ? '***SET***' : 'NOT SET');
    console.log('- REACT_APP_TRIPAY_MODE:', this.tripayMode);
    
    // Validate configuration
    if (!this.createPaymentUrl || !this.tripayPrivateKey || !this.tripayMerchantCode) {
      console.error('❌ Missing Tripay configuration. Please check environment variables.');
      console.error('Required variables:');
      console.error('- REACT_APP_PHP_CREATE_URL');
      console.error('- REACT_APP_TRIPAY_PRIVATE_KEY');
      console.error('- REACT_APP_TRIPAY_MERCHANT_CODE');
    }
    
    // Fallback for development
    if (!this.createPaymentUrl) {
      console.warn('⚠️ Using fallback URL for development');
      this.createPaymentUrl = 'https://skillnusa.com/create.php';
    }
  }

  /**
   * Create Tripay payment transaction
   * @param {Object} orderData - Order data for payment
   * @returns {Promise<Object>} Payment response
   */
  async createPayment(orderData) {
    try {
      // Validate required order data
      if (!orderData || !orderData.id || !orderData.totalAmount) {
        throw new Error('Invalid order data provided');
      }

      console.log('💳 [PaymentService] Creating payment with URL:', this.createPaymentUrl);

      // Generate merchant reference with unix timestamp
      const merchantRef = `SKILLNUSA-${Math.floor(Date.now() / 1000)}`;
      
      // Use the total amount directly (should already include platform fee from checkout)
      const totalAmount = orderData.totalAmount || 0;
      // Don't add platform fee again as it's already included in totalAmount

      // Set payment expiry (60 minutes from now)
      const expiredTime = Math.floor(Date.now() / 1000) + (60 * 60); // 1 hour

      // Prepare customer data
      const customerData = {
        customer_name: orderData.clientName || orderData.customerName || 'SkillNusa Client',
        customer_email: orderData.clientEmail || orderData.customerEmail || 'client@skillnusa.com',
        customer_phone: orderData.clientPhone || orderData.customerPhone || '081234567890'
      };

      // Prepare order items for Tripay
      const orderItems = [{
        sku: orderData.gigId || 'GIG-001',
        name: orderData.title || 'SkillNusa Service',
        price: totalAmount,
        quantity: 1
      }];

      // Prepare payment request data (signature will be generated in PHP)
      const paymentData = {
        amount: totalAmount,
        customer_name: customerData.customer_name,
        customer_email: customerData.customer_email,
        customer_phone: customerData.customer_phone,
        order_items: orderItems,
        return_url: `${window.location.origin}/dashboard/client/transactions?payment=success`,
        expired_time: expiredTime
      };

      console.log('📤 [PaymentService] Sending payment request:', paymentData);

      // Send request to PHP backend
      const response = await fetch(this.createPaymentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      console.log('📥 [PaymentService] Response status:', response.status);
      console.log('📥 [PaymentService] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const responseText = await response.text();
        console.error('❌ [PaymentService] Error response:', responseText);
        
        // Try to parse as JSON, fallback to text
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { error: `HTTP ${response.status}: ${responseText}` };
        }
        
        throw new Error(errorData.error || 'Payment creation failed');
      }

      const result = await response.json();
      console.log('✅ [PaymentService] Payment created successfully:', result);

      // Update order with payment information
      await this.updateOrderWithPayment(orderData.id, {
        merchantRef: merchantRef,
        status: 'payment', // New status for awaiting payment
        paymentStatus: 'pending',
        paymentExpiredAt: new Date(expiredTime * 1000),
        paymentUrl: result.tripay_response?.data?.checkout_url,
        qrString: result.tripay_response?.data?.qr_string,
        reference: result.tripay_response?.data?.reference,
        totalAmount: totalAmount, // This already includes all fees
        updatedAt: serverTimestamp()
      });

      return {
        success: true,
        merchantRef: result.merchant_ref,
        paymentUrl: result.tripay_response?.data?.checkout_url,
        qrString: result.tripay_response?.data?.qr_string,
        reference: result.tripay_response?.data?.reference,
        amount: totalAmount,
        expiredAt: new Date(expiredTime * 1000),
        instructions: result.tripay_response?.data?.instructions
      };

    } catch (error) {
      console.error('❌ [PaymentService] Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Update order with payment information
   * @param {string} orderId - Order ID
   * @param {Object} paymentData - Payment data to update
   */
  async updateOrderWithPayment(orderId, paymentData) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, paymentData);
    } catch (error) {
      console.error('Error updating order with payment:', error);
      throw error;
    }
  }

  /**
   * Check payment status
   * @param {string} merchantRef - Merchant reference
   * @returns {Promise<Object>} Payment status
   */
  async checkPaymentStatus(merchantRef) {
    try {
      // This would typically call Tripay's transaction detail API
      // For now, we'll implement a placeholder
      const statusCheckUrl = `${this.createPaymentUrl.replace('create.php', 'status.php')}`;
      
      const response = await fetch(statusCheckUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ merchant_ref: merchantRef })
      });

      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  }

  /**
   * Handle payment timeout (60 minutes)
   * @param {string} orderId - Order ID
   */
  async handlePaymentTimeout(orderId) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'cancelled',
        paymentStatus: 'expired',
        cancellationReason: 'Payment timeout (60 minutes)',
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error handling payment timeout:', error);
      throw error;
    }
  }

  /**
   * Handle freelancer confirmation timeout (3 hours)
   * @param {string} orderId - Order ID
   */
  async handleConfirmationTimeout(orderId) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'cancelled',
        cancellationReason: 'Freelancer confirmation timeout (3 hours)',
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        refundStatus: 'pending' // Mark for refund
      });

      // TODO: Implement refund logic here
      console.log(`Order ${orderId} cancelled due to freelancer timeout. Refund needed.`);
    } catch (error) {
      console.error('Error handling confirmation timeout:', error);
      throw error;
    }
  }

  /**
   * Format currency for display
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Calculate total with platform fee
   * @param {number} subtotal - Subtotal amount
   * @returns {Object} Calculation breakdown
   */
  calculateTotal(subtotal) {
    const platformFee = Math.round(subtotal * 0.10); // 10% platform fee
    const total = subtotal + platformFee;

    return {
      subtotal,
      platformFee,
      total,
      formattedSubtotal: this.formatCurrency(subtotal),
      formattedPlatformFee: this.formatCurrency(platformFee),
      formattedTotal: this.formatCurrency(total)
    };
  }
}

export default new PaymentService(); 