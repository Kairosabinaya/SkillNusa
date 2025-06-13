import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import paymentService from '../../services/paymentService';

export default function PaymentModal({ isOpen, onClose, paymentData }) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(0);
  const [checking, setChecking] = useState(false);

  // Debug logging
  console.log('🔧 [PaymentModal] Rendered with props:', {
    isOpen,
    hasPaymentData: !!paymentData,
    paymentDataKeys: paymentData ? Object.keys(paymentData) : null
  });

  useEffect(() => {
    if (paymentData && paymentData.expiredAt) {
      const updateTimer = () => {
        try {
          const now = new Date();
          const expiry = new Date(paymentData.expiredAt);
          
          // Validate dates
          if (isNaN(expiry.getTime())) {
            console.error('❌ [PaymentModal] Invalid expiry date:', paymentData.expiredAt);
            return;
          }
          
          const diffInSeconds = Math.max(0, Math.floor((expiry - now) / 1000));
          setTimeLeft(diffInSeconds);

          if (diffInSeconds === 0) {
            // Payment expired
            console.log('⏰ [PaymentModal] Payment expired');
            onClose();
            navigate('/dashboard/client/transactions?payment=expired');
          }
        } catch (error) {
          console.error('❌ [PaymentModal] Timer error:', error);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    } else {
      // Reset timer if no payment data
      setTimeLeft(0);
    }
  }, [paymentData, onClose, navigate]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQRCode = () => {
    console.log('🎨 [PaymentModal] Rendering QR Code with data:', {
      hasPaymentData: !!paymentData,
      qrString: paymentData?.qrString ? 'Present' : 'Missing',
      qrUrl: paymentData?.qrUrl ? 'Present' : 'Missing',
      qrStringLength: paymentData?.qrString?.length || 0,
      qrStringPreview: paymentData?.qrString?.substring(0, 100) + '...' || 'N/A',
      qrStringFull: paymentData?.qrString || 'N/A' // Log full content for debugging
    });

    // Guard clause - ensure paymentData exists
    if (!paymentData) {
      console.log('❌ [PaymentModal] No payment data available');
      return (
        <div className="text-center mb-6">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="text-gray-600 mb-2">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">Data pembayaran tidak tersedia</p>
          </div>
        </div>
      );
    }

    // Handle QR string (SVG from Tripay)
    if (paymentData.qrString && paymentData.qrString !== 'undefined' && paymentData.qrString.trim() !== '') {
      console.log('✅ [PaymentModal] Rendering QR string');
      
      // Check if it's an SVG string (actual QR code)
      const isSVG = paymentData.qrString.trim().startsWith('<svg') || paymentData.qrString.includes('<svg');
      
      // Check if it's just placeholder text (like "SANDBOX MODE")
      const isPlaceholder = paymentData.qrString.length < 50 && 
                           (paymentData.qrString.includes('SANDBOX') || 
                            paymentData.qrString.includes('MODE') ||
                            !paymentData.qrString.includes('<'));
      
      if (isSVG && !isPlaceholder) {
        // Valid SVG QR code
        return (
          <div className="text-center mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block shadow-sm">
              <div 
                className="w-48 h-48 mx-auto flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: paymentData.qrString }}
                style={{ maxWidth: '192px', maxHeight: '192px' }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Scan QR Code dengan aplikasi e-wallet atau mobile banking Anda
            </p>
          </div>
        );
      } else if (isPlaceholder) {
        // Placeholder text detected - show sandbox mode message
        console.log('⚠️ [PaymentModal] Placeholder QR detected:', paymentData.qrString);
        return (
          <div className="text-center mb-6">
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <div className="text-yellow-600 mb-4">
                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="text-lg font-semibold text-yellow-900 mb-2">
                {paymentData.qrString}
              </div>
              <p className="text-sm text-yellow-800 mb-4">
                QR Code tidak tersedia dalam mode sandbox.<br/>
                Gunakan tombol di bawah untuk melanjutkan pembayaran.
              </p>
              {paymentData.paymentUrl && (
                <a 
                  href={paymentData.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#010042] text-white px-6 py-3 rounded-lg hover:bg-[#0100a3] transition-colors text-sm font-medium"
                >
                  Buka Halaman Pembayaran
                </a>
              )}
            </div>
          </div>
        );
      } else {
        // Non-SVG QR data
        return (
          <div className="text-center mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block shadow-sm">
              <div className="w-48 h-48 mx-auto bg-gray-100 flex items-center justify-center rounded text-xs text-gray-600 break-all p-2">
                {paymentData.qrString}
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Data QR Code tersedia - gunakan aplikasi pembayaran Anda
            </p>
          </div>
        );
      }
    } 
    
    // Handle QR URL (image)
    else if (paymentData.qrUrl && paymentData.qrUrl !== 'undefined' && paymentData.qrUrl.trim() !== '') {
      console.log('✅ [PaymentModal] Rendering QR URL:', paymentData.qrUrl);
      return (
        <div className="text-center mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block shadow-sm">
            <img 
              src={paymentData.qrUrl}
              alt="QR Code"
              className="w-48 h-48 mx-auto rounded"
              onLoad={() => console.log('✅ [PaymentModal] QR image loaded successfully')}
              onError={(e) => {
                console.error('❌ [PaymentModal] QR image failed to load:', paymentData.qrUrl);
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="w-48 h-48 mx-auto bg-gray-100 flex items-center justify-center rounded text-gray-500 text-sm" style={{display: 'none'}}>
              <div className="text-center">
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>QR Code tidak dapat dimuat</div>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Scan QR Code dengan aplikasi e-wallet atau mobile banking Anda
          </p>
        </div>
      );
    } 
    
    // Handle checkout URL as fallback
    else if (paymentData.paymentUrl && paymentData.paymentUrl !== 'undefined' && paymentData.paymentUrl.trim() !== '') {
      console.log('⚠️ [PaymentModal] No QR code available, showing payment URL');
      return (
        <div className="text-center mb-6">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="text-blue-600 mb-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <p className="text-sm text-blue-900 mb-4">QR Code sedang dimuat...</p>
            <a 
              href={paymentData.paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#010042] text-white px-4 py-2 rounded-lg hover:bg-[#0100a3] transition-colors text-sm font-medium"
            >
              Buka Halaman Pembayaran
            </a>
          </div>
        </div>
      );
    } 
    
    // No QR code or payment URL available
    else {
      console.error('❌ [PaymentModal] No QR code or payment URL available');
      return (
        <div className="text-center mb-6">
          <div className="bg-red-50 p-6 rounded-lg border border-red-200">
            <div className="text-red-600 mb-2">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-red-900 mb-2">QR Code tidak tersedia</p>
            <p className="text-xs text-red-700">Silakan coba lagi atau hubungi customer service</p>
          </div>
        </div>
      );
    }
  };

  const handleCheckPayment = async () => {
    if (!paymentData?.merchantRef) {
      console.error('❌ [PaymentModal] No merchant reference available');
      return;
    }

    setChecking(true);
    try {
      const status = await paymentService.checkPaymentStatus(paymentData.merchantRef);
      if (status.success && status.paid) {
        onClose();
        navigate('/dashboard/client/transactions?payment=success');
      }
    } catch (error) {
      console.error('❌ [PaymentModal] Error checking payment:', error);
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
          {renderQRCode()}

          {/* Payment Amount */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Pembayaran</div>
              <div className="text-2xl font-bold text-[#010042]">
                {paymentData?.amount ? paymentService.formatCurrency(paymentData.amount) : 'Rp 0'}
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