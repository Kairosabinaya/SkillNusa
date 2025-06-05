import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function DeleteAccountModal({ isOpen, onClose }) {
  const { deleteUserAccount, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: warning, 2: confirmation, 3: reauth, 4: processing, 5: result
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);
  const [authError, setAuthError] = useState('');
  const navigate = useNavigate();

  const handleClose = () => {
    if (!loading) {
      setStep(1);
      setConfirmText('');
      setPassword('');
      setResult(null);
      setAuthError('');
      onClose();
    }
  };

  const handleConfirmDelete = async () => {
    if (confirmText !== 'HAPUS AKUN SAYA') {
      return;
    }
    setStep(3); // Move to re-authentication step
  };

  const handleReauthAndDelete = async () => {
    if (!password.trim()) {
      setAuthError('Password wajib diisi');
      return;
    }

    setLoading(true);
    setStep(4); // Processing step
    setAuthError('');

    try {
      const result = await deleteUserAccount(password);
      setResult(result);

      if (result.success) {
        setStep(5); // Result step
        // Redirect to home page after successful deletion
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else if (result.requiresReauth) {
        // This shouldn't happen since we just re-authenticated, but handle it
        setStep(3);
        setAuthError('Verifikasi gagal. Silakan coba lagi.');
      } else {
        // Check if it's a password error
        if (result.message && result.message.includes('Password salah')) {
          setStep(3);
          setAuthError(result.message);
        } else {
          setStep(5); // Show result step for other errors
        }
      }
    } catch (error) {
      // Handle authentication errors by going back to re-auth step
      if (error.message && (
        error.message.includes('Password salah') || 
        error.message.includes('wrong-password') ||
        error.message.includes('auth/wrong-password')
      )) {
        setStep(3);
        setAuthError('Password salah. Silakan coba lagi.');
      } else {
        setResult({
          success: false,
          message: error.message || 'Gagal menghapus akun'
        });
        setStep(5);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        
        {/* Step 1: Warning */}
        {step === 1 && (
          <div className="p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Hapus Akun Permanen</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-4">
                    Anda akan menghapus akun <strong>{currentUser?.email}</strong> secara permanen.
                  </p>
                  
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                    <h4 className="text-sm font-medium text-red-800 mb-2">⚠️ PERINGATAN: Tindakan ini tidak dapat dibatalkan!</h4>
                    <p className="text-sm text-red-700">
                      Semua data berikut akan dihapus secara permanen:
                    </p>
                    <ul className="text-sm text-red-700 mt-2 list-disc list-inside space-y-1">
                      <li>Profil dan informasi akun</li>
                      <li>Semua gigs dan layanan</li>
                      <li>Riwayat pesanan dan transaksi</li>
                      <li>Pesan dan komunikasi</li>
                      <li>Review dan rating</li>
                      <li>Foto profil dan portfolio</li>
                      <li>Semua data terkait akun</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Saya Mengerti, Lanjutkan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Confirmation */}
        {step === 2 && (
          <div className="p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900">Konfirmasi Penghapusan</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-4">
                    Untuk mengkonfirmasi, ketik <strong>HAPUS AKUN SAYA</strong> di bawah ini:
                  </p>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="HAPUS AKUN SAYA"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-center"
                  />
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={confirmText !== 'HAPUS AKUN SAYA'}
                className={`inline-flex justify-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                  confirmText === 'HAPUS AKUN SAYA' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Hapus Akun Secara Permanen
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Re-authentication */}
        {step === 3 && (
          <div className="p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-4a2 2 0 00-2-2H6a2 2 0 00-2 2v4a2 2 0 002 2zM12 9V7a4 4 0 00-8 0v2m8 0V7a4 4 0 00-8 0v2" />
                </svg>
              </div>
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900">Verifikasi Identitas</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-4">
                    Untuk keamanan, masukkan password Anda untuk melanjutkan penghapusan akun:
                  </p>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setAuthError('');
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && password.trim() && !loading) {
                        handleReauthAndDelete();
                      }
                    }}
                    placeholder="Masukkan password Anda"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    disabled={loading}
                    autoFocus
                  />
                  {authError && (
                    <p className="mt-2 text-sm text-red-600">{authError}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={loading}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleReauthAndDelete}
                disabled={loading || !password.trim()}
                className={`inline-flex justify-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                  !loading && password.trim()
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? 'Memverifikasi...' : 'Verifikasi & Hapus Akun'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Processing */}
        {step === 4 && (
          <div className="p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900">Menghapus Akun...</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Sedang menghapus semua data Anda. Ini mungkin membutuhkan beberapa menit.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Result */}
        {step === 5 && result && (
          <div className="p-6">
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${
                result.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {result.success ? (
                  <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="mt-3">
                <h3 className={`text-lg font-medium ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                  {result.success ? 'Akun Berhasil Dihapus' : 'Penghapusan Gagal'}
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  {result.message}
                </p>
                
                {result.success && (
                  <p className="text-sm text-gray-500 mt-2">
                    Anda akan dialihkan ke halaman utama dalam 3 detik...
                  </p>
                )}
                
                {!result.success && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Tutup
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 