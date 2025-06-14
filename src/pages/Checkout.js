import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import orderService from '../services/orderService';
import cartService from '../services/cartService';
import paymentService from '../services/paymentService';

import PageContainer from '../components/common/PageContainer';

export default function Checkout() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get order data from location state (single order) or cart items
  const orderData = location.state?.orderData;
  const cartItems = location.state?.cartItems || [];
  const isCartCheckout = cartItems.length > 0;
  
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(''); // New state for loading steps
  const [requirements, setRequirements] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('qris'); // Only QRIS for Tripay
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


  useEffect(() => {
    // Redirect if no order data and no cart items
    if (!orderData && !isCartCheckout) {
      navigate('/browse');
      return;
    }
  }, [orderData, isCartCheckout, navigate]);

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

  const calculateTotal = () => {
    if (isCartCheckout) {
      return cartItems.reduce((total, item) => {
        const price = item.packageData?.price || 0;
        return total + price;
      }, 0);
    }
    return orderData?.price || 0;
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    console.log('🛒 [Checkout] handleSubmitOrder called');
    console.log('🛒 [Checkout] Current user:', currentUser ? { uid: currentUser.uid, email: currentUser.email } : 'Not logged in');
    console.log('🛒 [Checkout] Is cart checkout:', isCartCheckout);
    console.log('🛒 [Checkout] Order data:', orderData ? {
      gigId: orderData.gigId,
      freelancerId: orderData.freelancerId,
      packageType: orderData.packageType,
      price: orderData.price,
      title: orderData.title
    } : 'No order data');
    console.log('🛒 [Checkout] Cart items:', cartItems.length);
    console.log('🛒 [Checkout] Requirements length:', requirements.trim().length);
    
    if (!currentUser) {
      console.log('❌ [Checkout] User not logged in, redirecting to login');
      navigate('/login', { state: { from: location } });
      return;
    }

    if (!requirements.trim()) {
      console.log('❌ [Checkout] Requirements empty');
      setError('Harap jelaskan kebutuhan proyek Anda');
      return;
    }

    // Additional validation for non-cart checkout
    if (!isCartCheckout && !orderData) {
      console.log('❌ [Checkout] No order data for single checkout');
      setError('Data pesanan tidak valid. Silakan refresh halaman.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setLoadingStep('Membuat pesanan...');
      console.log('🛒 [Checkout] Starting order submission process');

      let createdOrders = [];

      if (isCartCheckout) {
        console.log('🛒 [Checkout] Processing cart checkout with', cartItems.length, 'items');
        
        // Create multiple orders from cart items with payment status
        const orderPromises = cartItems.map((item, index) => {
          console.log(`🛒 [Checkout] Preparing cart item ${index + 1}:`, {
            gigId: item.gigId,
            freelancerId: item.freelancerId,
            packageType: item.packageType,
            price: item.packageData?.price,
            title: item.gigData?.title
          });
          
          return orderService.createOrder({
            clientId: currentUser.uid,
            freelancerId: item.freelancerId,
            gigId: item.gigId,
            packageType: item.packageType,
            title: item.gigData?.title || 'Order',
            description: item.packageData?.description || '',
            price: item.packageData?.price || 0,
            deliveryTime: parseInt(item.packageData?.deliveryTime) || 7,
            revisions: item.packageData?.revisions || 3,
            requirements: requirements.trim(),
            paymentMethod: 'qris',
            paymentStatus: 'pending',
            status: 'payment' // New status for awaiting payment
          });
        });

        console.log('🛒 [Checkout] Creating', orderPromises.length, 'orders...');
        createdOrders = await Promise.all(orderPromises);
        console.log('✅ [Checkout] Cart orders created:', createdOrders.map(o => ({ id: o.id, orderNumber: o.orderNumber })));

        // Clear cart after successful orders
        setLoadingStep('Membersihkan keranjang...');
        await cartService.clearCart(currentUser.uid);

        // For cart orders, create combined payment with total including platform fee
        setLoadingStep('Menghubungi gateway pembayaran...');
        const subtotal = cartItems.reduce((sum, item) => sum + (item.packageData?.price || 0), 0);
        const totalWithPlatformFee = Math.round(subtotal * 1.05); // Add 5% platform fee
        await createPaymentForOrders(createdOrders, totalWithPlatformFee);

      } else {
        console.log('🛒 [Checkout] Processing single order checkout');
        
        // Create single order with payment status
        const deliveryDays = typeof orderData.deliveryTime === 'string' 
          ? parseInt(orderData.deliveryTime.replace(/\D/g, '')) || 7
          : orderData.deliveryTime || 7;

        console.log('🛒 [Checkout] Single order data prepared:', {
          clientId: currentUser.uid,
          freelancerId: orderData.freelancerId,
          gigId: orderData.gigId,
          packageType: orderData.packageType,
          title: orderData.title,
          price: orderData.price,
          deliveryTime: deliveryDays,
          revisions: orderData.revisions
        });

        const newOrder = await orderService.createOrder({
          clientId: currentUser.uid,
          freelancerId: orderData.freelancerId,
          gigId: orderData.gigId,
          packageType: orderData.packageType,
          title: orderData.title,
          description: orderData.description,
          price: orderData.price,
          deliveryTime: deliveryDays,
          revisions: orderData.revisions,
          requirements: requirements.trim(),
          paymentMethod: 'qris',
          paymentStatus: 'pending',
          status: 'payment' // New status for awaiting payment
        });

        console.log('✅ [Checkout] Single order created:', { id: newOrder.id, orderNumber: newOrder.orderNumber });
        createdOrders = [newOrder];
        // FIX: Send total amount including 5% platform fee
        setLoadingStep('Menghubungi gateway pembayaran...');
        const totalWithPlatformFee = Math.round(orderData.price * 1.05); // Add 5% platform fee
        await createPaymentForOrders([newOrder], totalWithPlatformFee);
      }

    } catch (error) {
      console.error('❌ [Checkout] Error creating order:', error);
      setLoadingStep('');
      if (error.message.includes('permission')) {
        setError('Anda tidak memiliki izin untuk membuat pesanan. Silakan login ulang.');
      } else if (error.message.includes('network')) {
        setError('Masalah koneksi internet. Silakan coba lagi.');
      } else if (error.message.includes('timeout')) {
        setError('Koneksi timeout. Silakan periksa koneksi internet dan coba lagi.');
      } else {
        setError('Gagal membuat pesanan: ' + (error.message || 'Silakan coba lagi.'));
      }
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const createPaymentForOrders = async (orders, totalAmount) => {
    try {
      console.log('💳 [Checkout] createPaymentForOrders called with:', {
        orderCount: orders.length,
        totalAmount,
        orderIds: orders.map(o => o.id)
      });
      
      // Use the first order for payment details (for multiple orders, we combine them)
      const primaryOrder = orders[0];
      
      setLoadingStep('Menyiapkan data pembayaran...');
      const paymentOrderData = {
        id: primaryOrder.id,
        totalAmount: totalAmount,
        title: orders.length > 1 ? `${orders.length} Layanan SkillNusa` : primaryOrder.title,
        gigId: primaryOrder.gigId,
        clientName: currentUser.displayName || 'SkillNusa Client',
        clientEmail: currentUser.email,
        clientPhone: '081234567890' // TODO: Get from user profile
      };

      console.log('💳 [Checkout] Payment order data prepared:', paymentOrderData);
      console.log('💳 [Checkout] Creating payment for orders:', {
        orderCount: orders.length,
        totalAmount,
        primaryOrderId: primaryOrder.id
      });

      setLoadingStep('Menghubungi Tripay...');
      const payment = await paymentService.createPayment(paymentOrderData);
      
      if (payment.success && payment.paymentUrl) {
        console.log('💳 [Checkout] Payment created successfully - redirecting to Tripay:', {
          merchantRef: payment.merchantRef,
          paymentUrl: payment.paymentUrl,
          amount: payment.amount
        });
        
        // Show success message
        setLoadingStep('Berhasil! Mengarahkan ke halaman pembayaran...');
        setSuccess('Pembayaran berhasil dibuat. Anda akan diarahkan ke halaman pembayaran...');
        
        // Redirect directly to Tripay payment page
        setTimeout(() => {
          window.open(payment.paymentUrl, '_blank');
          
          // Also redirect to transactions page
          navigate('/dashboard/client/transactions?payment=pending');
        }, 1500);
        
        return;
      } else {
        console.error('❌ [Checkout] Payment creation failed:', payment);
        throw new Error('Failed to create payment');
      }

    } catch (error) {
      console.error('❌ [Checkout] Error creating payment:', error);
      setError('Gagal membuat pembayaran. Silakan coba lagi.');
    }
  };

  if (!orderData && !isCartCheckout) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageContainer className="flex items-center justify-center min-h-[70vh]" padding="px-6 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data pesanan tidak ditemukan</h2>
            <p className="text-gray-600 mb-6">Silakan pilih layanan terlebih dahulu</p>
            <button
              onClick={() => navigate('/browse')}
              className="bg-[#010042] text-white px-6 py-3 rounded-lg hover:bg-[#0100a3]"
            >
              Jelajahi Layanan
            </button>
          </div>
        </PageContainer>
      </div>
    );
  }

  const renderOrderSummary = () => {
    if (isCartCheckout) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ringkasan Pesanan ({cartItems.length} item)
          </h3>
          
          {cartItems.map((item, index) => (
            <div key={item.id} className="border-b border-gray-100 pb-4 last:border-b-0">
              <div className="font-medium text-gray-900 line-clamp-2 mb-1">
                {item.gigData?.title}
              </div>
              <div className="text-sm text-gray-500 mb-2">
                Paket {item.packageType === 'basic' ? 'Dasar' : 
                       item.packageType === 'standard' ? 'Standar' : 'Premium'}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <img 
                  src={item.freelancerData?.profilePhoto || `https://picsum.photos/seed/${item.freelancerId}/32/32`} 
                  alt={item.freelancerData?.displayName}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm text-gray-600">
                  {item.freelancerData?.displayName || 'Freelancer'}
                </span>
              </div>
              <div className="text-right text-gray-900 font-medium">
                {formatPrice(item.packageData?.price || 0)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Pesanan</h3>
        
        {/* Single Gig Info */}
        <div>
          <div className="font-medium text-gray-900 line-clamp-2">
            {orderData.title}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Paket {orderData.packageType === 'basic' ? 'Dasar' : 
                   orderData.packageType === 'standard' ? 'Standar' : 'Premium'}
          </div>
        </div>

        {/* Freelancer */}
        <div className="flex items-center gap-3 py-3 border-t border-gray-100">
          <img 
            src={orderData.freelancer?.profilePhoto || 'https://picsum.photos/40/40'} 
            alt={orderData.freelancer?.displayName}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <div className="font-medium text-gray-900">
              {orderData.freelancer?.displayName || 'Freelancer'}
            </div>
            <div className="text-sm text-gray-500">Freelancer</div>
          </div>
        </div>

        {/* Package Details */}
        <div className="space-y-2 py-3 border-t border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Waktu Pengerjaan:</span>
            <span className="text-gray-900">
              {typeof orderData.deliveryTime === 'string' 
                ? orderData.deliveryTime.includes('hari') 
                  ? orderData.deliveryTime 
                  : `${parseInt(orderData.deliveryTime) || 1} hari`
                : `${orderData.deliveryTime || 1} hari`
              }
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Revisi:</span>
            <span className="text-gray-900">
              {orderData.revisions === 'Unlimited' ? 'Tidak Terbatas' : `${orderData.revisions}x`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageContainer padding="px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Selesaikan pesanan Anda</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-700">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-green-700">{success}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Detail Pesanan</h2>
              
              <form onSubmit={handleSubmitOrder}>
                {/* Requirements */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jelaskan Kebutuhan Proyek Anda *
                  </label>
                  <textarea
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                    placeholder={isCartCheckout ? 
                      "Jelaskan kebutuhan untuk semua layanan yang dipesan. Setiap freelancer akan menerima pesan yang sama..." :
                      "Jelaskan secara detail apa yang Anda butuhkan, termasuk timeline, preferensi style, dan detail lainnya yang relevan..."
                    }
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {isCartCheckout ? 
                      "Pesan ini akan dikirim ke semua freelancer yang terlibat" :
                      "Berikan detail yang jelas untuk membantu freelancer memahami kebutuhan Anda"
                    }
                  </p>
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Metode Pembayaran
                  </label>
                  
                  <div className="space-y-3">
                    <label className="flex items-center p-3 border-2 border-[#010042] bg-blue-50 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="qris"
                        checked={paymentMethod === 'qris'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3 text-[#010042]"
                        disabled={true} // Only QRIS available
                      />
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-[#010042] rounded flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4z"/>
                            <path d="M15 13h1v1h-1zm0 2h1v1h-1zm2-2h1v1h-1zm0 2h1v1h-1zm2-2h1v1h-1zm0 2h1v1h-1zm0 2h1v1h-1zm-2 0h1v1h-1zm-2 0h1v1h-1z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">QRIS (Scan & Pay)</div>
                          <div className="text-sm text-gray-500">Scan QR Code dengan aplikasi e-wallet atau mobile banking Anda</div>
                        </div>
                      </div>
                    </label>

                    {/* Info about QRIS */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z"/>
                          </svg>
                        <div>
                          <div className="text-sm font-medium text-blue-900">Mendukung Semua E-Wallet</div>
                          <div className="text-xs text-blue-700 mt-1">
                            GoPay, OVO, DANA, LinkAja, ShopeePay, dan aplikasi mobile banking
                          </div>
                        </div>
                        </div>
                      </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#010042] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0100a3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm">
                        {loadingStep || 'Memproses...'}
                      </span>
                    </div>
                  ) : (
                    isCartCheckout ? `Buat ${cartItems.length} Pesanan` : 'Buat Pesanan'
                  )}
                </button>
                
                {/* Loading Progress Info */}
                {loading && loadingStep && (
                  <div className="mt-3 text-center">
                    <div className="text-xs text-gray-500">
                      Mohon tunggu, proses ini mungkin memerlukan waktu hingga 2 menit
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                      <div className="bg-[#010042] h-1 rounded-full animate-pulse" style={{
                        width: loadingStep.includes('Membuat') ? '25%' : 
                               loadingStep.includes('Membersihkan') ? '40%' :
                               loadingStep.includes('Menyiapkan') ? '60%' :
                               loadingStep.includes('Menghubungi') ? '80%' :
                               loadingStep.includes('Berhasil') ? '100%' : '50%'
                      }}></div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              {renderOrderSummary()}
              
              {/* Price Breakdown */}
              <div className="space-y-2 pt-4 border-t border-gray-100 mt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900">{formatPrice(calculateTotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Biaya Layanan (5%):</span>
                  <span className="text-gray-900">{formatPrice(calculateTotal() * 0.05)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-[#010042]">{formatPrice(calculateTotal() * 1.05)}</span>
                </div>
              </div>

              {/* Security Info */}
              <div className="bg-blue-50 p-3 rounded-lg mt-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z"/>
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-blue-900">Pembayaran Aman</div>
                    <div className="text-xs text-blue-700 mt-1">
                      Dana Anda dilindungi hingga proyek selesai
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>


    </div>
  );
} 