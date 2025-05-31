import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import cartService from '../services/cartService';

export default function Cart() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Subscribe to real-time cart updates
  useEffect(() => {
    console.log('🔍 [Cart] useEffect triggered with currentUser:', currentUser?.uid);
    
    if (!currentUser) {
      console.log('❌ [Cart] No currentUser, setting empty cart');
      setCartItems([]);
      setLoading(false);
      return;
    }

    console.log('📡 [Cart] Setting up real-time subscription for user:', currentUser.uid);

    // Subscribe to real-time cart updates
    const unsubscribe = cartService.subscribeToCartItems(currentUser.uid, (cartData) => {
      console.log('📥 [Cart] Real-time cart update received:', {
        userId: currentUser.uid,
        count: cartData?.length || 0,
        cartItems: cartData
      });
      
      // Debug each cart item
      if (cartData && cartData.length > 0) {
        cartData.forEach((item, index) => {
          console.log(`🛒 [Cart] Item ${index + 1}:`, {
            id: item.id,
            gigId: item.gigId,
            userId: item.userId,
            packageType: item.packageType,
            quantity: item.quantity,
            gigData: item.gigData,
            packageData: item.packageData,
            freelancerData: item.freelancerData,
            createdAt: item.createdAt
          });
        });
      } else {
        console.log('⚠️ [Cart] No cart data received or empty array');
      }
      
      setCartItems(cartData || []);
      setLoading(false);
      setError('');
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('🧹 [Cart] Cleaning up subscription');
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  const removeFromCart = async (cartItemId) => {
    try {
      await cartService.removeFromCart(currentUser.uid, cartItemId);
      // No need to manually update state - real-time subscription will handle it
    } catch (error) {
      console.error('Error removing from cart:', error);
      setError('Gagal menghapus item dari keranjang');
      // Clear error after 3 seconds
      setTimeout(() => setError(''), 3000);
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    try {
      await cartService.updateCartItemQuantity(currentUser.uid, cartItemId, quantity);
      // No need to manually update state - real-time subscription will handle it
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError('Gagal mengupdate kuantitas');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = item.packageData?.price || 0;
      const quantity = item.quantity || 1;
      return total + (price * quantity);
    }, 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (!currentUser) {
    return null; // Will redirect
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-16 bg-gray-300 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                      <div className="w-20 h-6 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="h-6 bg-gray-300 rounded mb-4"></div>
                  <div className="space-y-3 mb-6">
                    <div className="h-4 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded"></div>
                  </div>
                  <div className="h-12 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Keranjang Belanja</h1>
          <p className="text-gray-600 mt-2">Kelola item yang akan dibeli</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {cartItems.length === 0 ? (
          /* Empty Cart */
          <div className="bg-white rounded-lg p-12 text-center">
            <svg className="w-24 h-24 text-gray-400 mx-auto mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.29977 5H21L19 12H7.37671M20 16H8L6 3H3M9 20C9 20.5523 8.55228 21 8 21C7.44772 21 7 20.5523 7 20C7 19.4477 7.44772 19 8 19C8.55228 19 9 19.4477 9 20ZM20 20C20 20.5523 19.5523 21 19 21C18.4477 21 18 20.5523 18 20C18 19.4477 18.4477 19 19 19C19.5523 19 20 19.4477 20 20Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Keranjang Kosong</h3>
            <p className="text-gray-600 mb-6">Tambahkan beberapa layanan ke keranjang Anda untuk memulai</p>
            <Link 
              to="/browse" 
              className="inline-flex items-center px-6 py-3 bg-[#010042] text-white font-medium rounded-lg hover:bg-[#000030] transition duration-200"
            >
              Jelajahi Layanan
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <Link to={`/gig/${item.gigId}`}>
                      <img 
                        src={item.gigData?.images?.[0] || 'https://picsum.photos/100/80'} 
                        alt={item.gigData?.title}
                        className="w-20 h-16 object-cover rounded hover:opacity-75 transition-opacity"
                      />
                    </Link>
                    <div className="flex-1">
                      <Link to={`/gig/${item.gigId}`}>
                        <h3 className="font-semibold text-gray-900 mb-1 hover:text-[#010042] transition-colors">
                          {item.gigData?.title}
                        </h3>
                      </Link>
                      <Link to={`/freelancer/${item.freelancerId}`}>
                        <p className="text-sm text-gray-600 mb-2 hover:text-[#010042] transition-colors">
                          {item.freelancerData?.displayName || 'Freelancer'}
                        </p>
                      </Link>
                      <p className="text-sm text-gray-500 mb-2">
                        {item.packageData?.name} - {item.packageData?.deliveryTime} hari
                      </p>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {item.packageData?.description}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-lg font-bold text-gray-900 mb-2">
                        {formatCurrency(item.packageData?.price || 0)}
                      </p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mb-2">
                        <button 
                          onClick={() => updateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity || 1}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 text-sm transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-6 border border-gray-200 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Pesanan</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(getTotalPrice())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Biaya Layanan</span>
                    <span className="font-medium">{formatCurrency(5000)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-lg font-bold text-[#010042]">
                        {formatCurrency(getTotalPrice() + 5000)}
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  className="w-full bg-[#010042] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#000030] transition duration-200"
                  onClick={() => navigate('/checkout', { state: { cartItems } })}
                >
                  Lanjut ke Checkout ({cartItems.length} item)
                </button>

                <p className="text-sm text-gray-500 mt-4 text-center">
                  Pembayaran aman dan terpercaya
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 