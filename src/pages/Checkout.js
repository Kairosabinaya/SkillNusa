import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import orderService from '../services/orderService';

export default function Checkout() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get order data from location state
  const orderData = location.state?.orderData;
  
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Redirect if no order data
    if (!orderData) {
      navigate('/browse');
      return;
    }
  }, [orderData, navigate]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (!requirements.trim()) {
      setError('Harap jelaskan kebutuhan proyek Anda');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const order = await orderService.createOrder({
        clientId: currentUser.uid,
        freelancerId: orderData.freelancerId,
        gigId: orderData.gigId,
        packageType: orderData.packageType,
        title: orderData.title,
        description: orderData.description,
        price: orderData.price,
        deliveryTime: orderData.deliveryTime,
        revisions: orderData.revisions,
        requirements: requirements.trim(),
        paymentStatus: 'pending'
      });

      setSuccess('Pesanan berhasil dibuat! Anda akan diarahkan ke dashboard.');
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard/client');
      }, 2000);

    } catch (error) {
      console.error('Error creating order:', error);
      setError('Gagal membuat pesanan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-6 py-8">
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
                    placeholder="Jelaskan secara detail apa yang Anda butuhkan, termasuk timeline, preferensi style, dan detail lainnya yang relevan..."
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Berikan detail yang jelas untuk membantu freelancer memahami kebutuhan Anda
                  </p>
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Metode Pembayaran
                  </label>
                  
                  <div className="space-y-3">
                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={paymentMethod === 'bank_transfer'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Transfer Bank</div>
                          <div className="text-sm text-gray-500">BCA, Mandiri, BNI, BRI</div>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="e_wallet"
                        checked={paymentMethod === 'e_wallet'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">E-Wallet</div>
                          <div className="text-sm text-gray-500">GoPay, OVO, Dana, LinkAja</div>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="credit_card"
                        checked={paymentMethod === 'credit_card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 6h16v2H4V6zm0 6h16v6H4v-6z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Kartu Kredit</div>
                          <div className="text-sm text-gray-500">Visa, Mastercard</div>
                        </div>
                      </div>
                    </label>
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
                      Memproses...
                    </div>
                  ) : (
                    'Buat Pesanan'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Pesanan</h3>
              
              <div className="space-y-4">
                {/* Gig Info */}
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
                    <span className="text-gray-900">{orderData.deliveryTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Revisi:</span>
                    <span className="text-gray-900">
                      {orderData.revisions === 'Unlimited' ? 'Tidak Terbatas' : `${orderData.revisions}x`}
                    </span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 pt-3 border-t border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900">{formatPrice(orderData.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Biaya Layanan:</span>
                    <span className="text-gray-900">{formatPrice(orderData.price * 0.05)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-[#010042]">{formatPrice(orderData.price * 1.05)}</span>
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
        </div>
      </div>
    </div>
  );
} 