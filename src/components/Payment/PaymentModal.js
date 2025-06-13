import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import paymentService from '../../services/paymentService';

export default function PaymentModal({ isOpen, onClose, paymentData }) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(0);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (paymentData && paymentData.expiredAt) {
      const updateTimer = () => {
        const now = new Date();
        const expiry = new Date(paymentData.expiredAt);
        const diffInSeconds = Math.max(0, Math.floor((expiry - now) / 1000));
        setTimeLeft(diffInSeconds);

        if (diffInSeconds === 0) {
          // Payment expired
          onClose();
          navigate('/dashboard/client/transactions?payment=expired');
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    }
  }, [paymentData, onClose, navigate]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCheckPayment = async () => {
    setChecking(true);
    try {
      const status = await paymentService.checkPaymentStatus(paymentData.merchantRef);
      if (status.success && status.paid) {
        onClose();
        navigate('/dashboard/client/transactions?payment=success');
      }
    } catch (error) {
      console.error('Error checking payment:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleGoToTransactions = () => {
    onClose();
    navigate('/dashboard/client/transactions');
  };

  if (!isOpen || !paymentData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Pembayaran QRIS</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Timer - Full Width */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
                </svg>
                <div className="font-medium text-red-900">Batas Waktu Pembayaran</div>
              </div>
              <div className="text-3xl font-bold text-red-700">{formatTime(timeLeft)}</div>
            </div>
          </div>

          {/* QR Code */}
          {paymentData.qrString && (
            <div className="text-center mb-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block">
                <div 
                  className="w-48 h-48 mx-auto bg-gray-100 flex items-center justify-center rounded"
                  dangerouslySetInnerHTML={{ __html: paymentData.qrString }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Scan QR Code dengan aplikasi e-wallet atau mobile banking Anda
              </p>
            </div>
          )}

          {/* Payment Amount */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Pembayaran</div>
              <div className="text-2xl font-bold text-[#010042]">
                {paymentService.formatCurrency(paymentData.amount)}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Cara Pembayaran:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Buka aplikasi e-wallet atau mobile banking Anda</li>
              <li>Pilih menu "Scan QR" atau "QRIS"</li>
              <li>Arahkan kamera ke QR code di atas</li>
              <li>Periksa detail pembayaran dan konfirmasi</li>
              <li>Pembayaran akan diproses secara otomatis</li>
            </ol>
          </div>

          {/* Status Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z"/>
              </svg>
              <div>
                <div className="text-sm font-medium text-yellow-900">Menunggu Pembayaran</div>
                <div className="text-xs text-yellow-700 mt-1">
                  Setelah pembayaran berhasil, pesanan akan diteruskan ke freelancer untuk konfirmasi
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleCheckPayment}
              disabled={checking}
              className="w-full bg-[#010042] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0100a3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {checking ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Mengecek Pembayaran...
                </div>
              ) : (
                'Saya Sudah Bayar'
              )}
            </button>

            <button
              onClick={handleGoToTransactions}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Lihat Status di Transaksi
            </button>
          </div>

          {/* Help */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Butuh bantuan? Hubungi{' '}
              <a href="#" className="text-[#010042] hover:underline">
                Customer Service
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 