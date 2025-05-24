import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sendEmailVerification } from 'firebase/auth';

export default function VerifyEmail() {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [warningType, setWarningType] = useState('login'); // 'login' or 'home'
  const navigate = useNavigate();

  const handleResendVerification = async () => {
    if (!currentUser) {
      setError('Tidak ada pengguna yang masuk. Silakan masuk kembali.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      await sendEmailVerification(currentUser);
      setMessage('Email verifikasi berhasil dikirim ulang. Silakan periksa kotak masuk Anda.');
    } catch (error) {
      console.error('Error sending verification email:', error);
      setError('Gagal mengirim ulang email verifikasi. Silakan coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    setWarningType('login');
    setShowWarning(true);
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    setWarningType('home');
    setShowWarning(true);
  };

  const handleConfirm = async () => {
    // Log the user out before redirecting
    try {
      if (currentUser) {
        await logout();
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
    
    // Navigate based on warning type
    if (warningType === 'login') {
      navigate('/login');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div>
          <div className="flex justify-center">
            <a href="#" onClick={handleHomeClick} className="block text-center">
              <span className="text-2xl font-bold cursor-pointer bg-gradient-to-r from-[#010042] to-[#0100a3] bg-clip-text text-transparent" style={{letterSpacing: "0.5px"}}>SkillNusa</span>
            </a>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Verifikasi Email Anda</h2>
          <div className="mt-2 text-center text-sm text-gray-600">
            <p>
              Kami telah mengirimkan email verifikasi ke:{' '}
              <span className="font-medium text-[#010042]">
                {currentUser?.email}
              </span>
            </p>
            <p className="mt-2">
              Silakan periksa kotak masuk Anda dan ikuti instruksi untuk memverifikasi akun Anda.
            </p>
          </div>
        </div>
        
        {message && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{message}</p>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1v-3a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm text-blue-700">
                Tidak menerima email? Periksa folder spam Anda atau kirim ulang email verifikasi.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center space-y-4">
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={loading}
            className="text-center w-full inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
          >
            {loading ? 'Mengirim...' : 'Kirim Ulang Email Verifikasi'}
          </button>
          
          <button
            onClick={handleLoginClick}
            className="text-center w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
          >
            Kembali ke Halaman Login
          </button>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Setelah verifikasi email, Anda dapat mulai menggunakan akun SkillNusa Anda.
          </p>
        </div>
      </div>

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Perhatian!</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {warningType === 'login' 
                      ? 'Anda akan dialihkan ke halaman login. Pastikan Anda sudah memverifikasi email Anda dengan mengklik tautan yang telah kami kirimkan. Jika tidak, Anda tidak akan dapat masuk.'
                      : 'Anda akan dialihkan ke halaman utama. Anda perlu memverifikasi email sebelum dapat menggunakan layanan SkillNusa. Pastikan Anda sudah mengklik tautan verifikasi yang telah kami kirimkan.'}
                  </p>
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowWarning(false)}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-[#010042] border border-transparent rounded-md hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
                  >
                    Ya, Lanjutkan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 