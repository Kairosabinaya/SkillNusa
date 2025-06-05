import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import cartService from '../services/cartService';
import PageContainer from '../components/common/PageContainer';

export default function Cart() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());

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
      // Remove from selected items if it was selected
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartItemId);
        return newSet;
      });
      // No need to manually update state - real-time subscription will handle it
    } catch (error) {
      console.error('Error removing from cart:', error);
      setError('Gagal menghapus item dari keranjang');
      // Clear error after 3 seconds
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map(item => item.id)));
    }
  };

  const getSelectedItems = () => {
    return cartItems.filter(item => selectedItems.has(item.id));
  };

  const getTotalPrice = () => {
    return getSelectedItems().reduce((total, item) => {
      const price = item.packageData?.price || 0;
      return total + price;
    }, 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleCheckout = () => {
    const selectedCartItems = getSelectedItems();
    if (selectedCartItems.length === 0) {
      setError('Pilih setidaknya satu item untuk checkout');
      setTimeout(() => setError(''), 3000);
      return;
    }
    navigate('/checkout', { state: { cartItems: selectedCartItems } });
  };

  if (!currentUser) {
    return null; // Will redirect
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageContainer padding="px-6 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#010042]"></div>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 ">
      <PageContainer padding="px-6 py-8">
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
              {/* Select All Header */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === cartItems.length && cartItems.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-[#010042] bg-gray-100 border-gray-300 rounded focus:ring-[#010042] focus:ring-2"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    Pilih Semua ({cartItems.length} item)
                  </span>
                </label>
              </div>

              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 pt-1">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="w-4 h-4 text-[#010042] bg-gray-100 border-gray-300 rounded focus:ring-[#010042] focus:ring-2"
                      />
                    </div>

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
                      <p className="text-lg font-bold text-gray-900 mb-4">
                        {formatCurrency(item.packageData?.price || 0)}
                      </p>
                      
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
                    <span className="text-gray-600">Subtotal ({selectedItems.size} item)</span>
                    <span className="font-medium">{formatCurrency(getTotalPrice())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Biaya Layanan (5%)</span>
                    <span className="font-medium">{formatCurrency(getTotalPrice() * 0.05)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-lg font-bold text-[#010042]">
                        {formatCurrency(getTotalPrice() * 1.05)}
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition duration-200 ${
                    selectedItems.size > 0 
                      ? 'bg-[#010042] text-white hover:bg-[#000030]' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={handleCheckout}
                  disabled={selectedItems.size === 0}
                >
                  {selectedItems.size > 0 
                    ? `Lanjut ke Checkout (${selectedItems.size} item)` 
                    : 'Pilih item untuk checkout'
                  }
                </button>

                <p className="text-sm text-gray-500 mt-4 text-center">
                  Pembayaran aman dan terpercaya
                </p>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
} 