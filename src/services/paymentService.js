import { db } from '../firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

class PaymentService {
  constructor() {
    // Configuration from environment variables
    this.createPaymentUrl = process.env.REACT_APP_PHP_CREATE_URL;
    this.tripayMode = process.env.REACT_APP_TRIPAY_MODE || 'sandbox';
    
    // Debug environment variables (tanpa expose sensitive data)
    console.log('🔧 [PaymentService] Environment Variables:');
    console.log('- REACT_APP_PHP_CREATE_URL:', this.createPaymentUrl);
    console.log('- REACT_APP_TRIPAY_MODE:', this.tripayMode);
    
    // Validate configuration
    if (!this.createPaymentUrl) {
      console.error('❌ Missing REACT_APP_PHP_CREATE_URL configuration.');
      
      // Set fallback based on mode
      if (this.tripayMode === 'production') {
        this.createPaymentUrl = '/api/payment/create'; // Internal API endpoint
        console.warn('⚠️ Using production fallback: Internal API endpoint');
      } else {
        this.createPaymentUrl = 'http://localhost:3000/create.php'; // Local development
        console.warn('⚠️ Using development fallback: Local PHP bridge');
      }
    }
    
    // NOTE: Private key dan merchant code seharusnya di backend, bukan frontend
    // Untuk sementara masih menggunakan PHP bridge untuk backward compatibility
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

      // Set payment expiry (1 minute from now - FOR TESTING)
              const expiredTime = Math.floor(Date.now() / 1000) + (1 * 60); // 1 minute for testing

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
      // Use camelCase to match PHP bridge expectations
      const paymentData = {
        amount: totalAmount,
        customerName: customerData.customer_name,
        customerEmail: customerData.customer_email,
        customerPhone: customerData.customer_phone,
        orderItems: orderItems,
        returnUrl: `${window.location.origin}/dashboard/client/transactions?payment=success`,
        expiredTime: expiredTime
      };

      console.log('📤 [PaymentService] Sending payment request:', {
        ...paymentData,
        // Don't log sensitive data in production
        customerEmail: paymentData.customerEmail.replace(/(.{2}).*(@.*)/, '$1***$2'),
        customerPhone: paymentData.customerPhone ? paymentData.customerPhone.replace(/(.{3}).*(.{3})/, '$1***$2') : 'N/A'
      });

      // Send request to PHP backend with timeout and retry
      const maxRetries = 2;
      let lastError = null;
      let result = null; // Declare result outside the loop
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 [PaymentService] Attempt ${attempt}/${maxRetries}`);
          
          // Create AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout
          
          const response = await fetch(this.createPaymentUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          console.log(`📥 [PaymentService] Attempt ${attempt} - Response status:`, response.status);
          
          if (!response.ok) {
            const responseText = await response.text();
            console.error(`❌ [PaymentService] Attempt ${attempt} - Error response:`, responseText);
            
            // Try to parse as JSON, fallback to text
            let errorData;
            try {
              errorData = JSON.parse(responseText);
            } catch (e) {
              errorData = { error: `HTTP ${response.status}: ${responseText}` };
            }
            
            // If it's a server error and we have retries left, continue to next attempt
            if (response.status >= 500 && attempt < maxRetries) {
              lastError = new Error(errorData.error || 'Payment creation failed');
              console.log(`⏳ [PaymentService] Server error, retrying in ${attempt * 2} seconds...`);
              await new Promise(resolve => setTimeout(resolve, attempt * 2000));
              continue;
            }
            
            throw new Error(errorData.error || 'Payment creation failed');
          }

          result = await response.json(); // Assign to the outer scope variable
          console.log('✅ [PaymentService] Payment created successfully:', {
            success: result.success,
            merchantRef: result.merchant_ref,
            hasQrString: !!result.tripay_response?.data?.qr_string,
            hasQrUrl: !!result.tripay_response?.data?.qr_url,
            hasCheckoutUrl: !!result.tripay_response?.data?.checkout_url,
            attempt: attempt
          });
          
          // Success - break out of retry loop
          break;
          
        } catch (error) {
          lastError = error;
          
          if (error.name === 'AbortError') {
            console.error(`⏰ [PaymentService] Attempt ${attempt} - Request timeout after 90 seconds`);
            lastError = new Error('Request timeout. Silakan coba lagi.');
          } else {
            console.error(`❌ [PaymentService] Attempt ${attempt} - Error:`, error.message);
          }
          
          // If this is the last attempt, throw the error
          if (attempt === maxRetries) {
            throw lastError;
          }
          
          // Wait before retrying
          console.log(`⏳ [PaymentService] Waiting ${attempt * 2} seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        }
      }
      
      // If we get here without a result, throw the last error
      if (!result) {
        throw lastError || new Error('Payment creation failed after retries');
      }

      // Update order with payment information
      await this.updateOrderWithPayment(orderData.id, {
        merchantRef: merchantRef,
        status: 'payment', // New status for awaiting payment
        paymentStatus: 'pending',
        paymentExpiredAt: new Date(expiredTime * 1000),
        paymentUrl: result.tripay_response?.data?.checkout_url,
        qrString: result.tripay_response?.data?.qr_string,
        qrUrl: result.tripay_response?.data?.qr_url, // Add qr_url support
        reference: result.tripay_response?.data?.reference,
        totalAmount: totalAmount, // This already includes all fees
        updatedAt: serverTimestamp()
      });

      // Validate response structure
      if (!result.success || !result.tripay_response?.data) {
        throw new Error('Invalid response from payment gateway');
      }

      const tripayData = result.tripay_response.data;
      
      // Validate required fields from Tripay response
      if (!tripayData.reference) {
        throw new Error('Missing payment reference from gateway');
      }

      // Log QR code data for debugging
      console.log('🎨 [PaymentService] QR Code data analysis:', {
        qrString: {
          exists: !!tripayData.qr_string,
          length: tripayData.qr_string?.length || 0,
          isSVG: tripayData.qr_string?.includes('<svg') || false,
          preview: tripayData.qr_string?.substring(0, 100) || 'N/A'
        },
        qrUrl: {
          exists: !!tripayData.qr_url,
          url: tripayData.qr_url || 'N/A'
        },
        checkoutUrl: {
          exists: !!tripayData.checkout_url,
          url: tripayData.checkout_url || 'N/A'
        }
      });

      return {
        success: true,
        merchantRef: result.merchant_ref || merchantRef,
        paymentUrl: tripayData.checkout_url || null,
        qrString: tripayData.qr_string || null, // QR string untuk QRIS (usually SVG)
        qrUrl: tripayData.qr_url || null, // QR URL jika ada (image URL)
        reference: tripayData.reference,
        payCode: tripayData.pay_code || null, // Untuk virtual account
        amount: totalAmount,
        expiredAt: new Date(expiredTime * 1000),
        instructions: tripayData.instructions || [],
        // Add metadata for debugging
        _debug: {
          method: 'QRIS',
          merchantRef: result.merchant_ref,
          hasQrData: !!(tripayData.qr_string || tripayData.qr_url),
          originalResponse: process.env.NODE_ENV === 'development' ? result : null
        }
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
      console.log('🔍 [PaymentService] Checking payment status for:', merchantRef);
      
      // This would typically call Tripay's transaction detail API
      // For now, we'll implement a placeholder
      const statusCheckUrl = `${this.createPaymentUrl.replace('create.php', 'status.php')}`;
      
      const response = await fetch(statusCheckUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ merchantRef: merchantRef })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [PaymentService] Status check failed:', errorText);
        throw new Error(`Failed to check payment status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [PaymentService] Payment status checked:', result);
      return result;
    } catch (error) {
      console.error('❌ [PaymentService] Error checking payment status:', error);
      throw error;
    }
  }

  /**
   * Handle payment timeout (1 minute - TESTING)
   * @param {string} orderId - Order ID
   */
  async handlePaymentTimeout(orderId) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'cancelled',
        paymentStatus: 'expired',
        cancellationReason: 'Payment timeout (1 minute - TESTING)',
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error handling payment timeout:', error);
      throw error;
    }
  }

  /**
   * Handle freelancer confirmation timeout (1 minute - TESTING)
   * @param {string} orderId - Order ID
   */
  async handleConfirmationTimeout(orderId) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'cancelled',
        cancellationReason: 'Freelancer confirmation timeout (1 minute - TESTING)',
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
    const platformFee = Math.round(subtotal * 0.05); // FIX: 5% platform fee (was 10%)
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