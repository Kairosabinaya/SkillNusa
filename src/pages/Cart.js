import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // For now, we'll use sessionStorage to store cart items
  useEffect(() => {
    const savedCart = sessionStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  const removeFromCart = (index) => {
    const newCart = cartItems.filter((_, i) => i !== index);
    setCartItems(newCart);
    sessionStorage.setItem('cart', JSON.stringify(newCart));
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price, 0);
  };

  if (!currentUser) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Keranjang Belanja</h1>
          <p className="text-gray-600 mt-2">Kelola item yang akan dibeli</p>
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart */
          <div className="bg-white rounded-lg p-12 text-center">
            <svg className="w-24 h-24 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6.5-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
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
              {cartItems.map((item, index) => (
                <div key={index} className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <img 
                      src={item.image || 'https://picsum.photos/100/80'} 
                      alt={item.title}
                      className="w-20 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{item.freelancerName}</p>
                      <p className="text-sm text-gray-500">{item.packageType} - {item.deliveryTime}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        Rp {item.price?.toLocaleString('id-ID')}
                      </p>
                      <button 
                        onClick={() => removeFromCart(index)}
                        className="text-red-500 hover:text-red-700 text-sm mt-2"
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
                    <span className="font-medium">Rp {getTotalPrice().toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Biaya Layanan</span>
                    <span className="font-medium">Rp 5.000</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-lg font-bold text-[#010042]">
                        Rp {(getTotalPrice() + 5000).toLocaleString('id-ID')}
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