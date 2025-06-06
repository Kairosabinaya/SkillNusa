import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../../firebase/config';
import PageContainer from '../../components/common/PageContainer';

export default function AuthAction() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [mode, setMode] = useState('');
  const [actionCode, setActionCode] = useState('');
  const [continueUrl, setContinueUrl] = useState('');
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const mode = searchParams.get('mode');
    const actionCode = searchParams.get('oobCode');
    const continueUrl = searchParams.get('continueUrl');

    setMode(mode);
    setActionCode(actionCode);
    setContinueUrl(continueUrl);

    if (!mode || !actionCode) {
      setStatus('error');
      setMessage('Link tidak valid atau sudah kadaluarsa.');
      return;
    }

    handleAuthAction(mode, actionCode);
  }, [searchParams]);

  const handleAuthAction = async (mode, actionCode) => {
    try {
      switch (mode) {
        case 'verifyEmail':
          await applyActionCode(auth, actionCode);
          setStatus('success');
          setMessage('Email berhasil diverifikasi! Akun Anda sekarang sudah aktif.');
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          break;

        case 'resetPassword':
          const email = await verifyPasswordResetCode(auth, actionCode);
          setEmail(email);
          setStatus('resetPassword');
          setMessage('Silakan masukkan password baru Anda.');
          break;

        case 'recoverEmail':
          await applyActionCode(auth, actionCode);
          setStatus('success');
          setMessage('Email berhasil dipulihkan.');
          break;

        default:
          setStatus('error');
          setMessage('Mode aksi tidak dikenali.');
      }
    } catch (error) {
      setStatus('error');
      
      switch (error.code) {
        case 'auth/expired-action-code':
          setMessage('Link sudah kadaluarsa. Silakan minta link verifikasi baru.');
          break;
        case 'auth/invalid-action-code':
          setMessage('Link tidak valid. Pastikan Anda menggunakan link terbaru dari email.');
          break;
        case 'auth/user-disabled':
          setMessage('Akun telah dinonaktifkan.');
          break;
        case 'auth/user-not-found':
          setMessage('Pengguna tidak ditemukan.');
          break;
        default:
          setMessage('Terjadi kesalahan. Silakan coba lagi nanti.');
      }
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage('Password tidak cocok.');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password harus minimal 6 karakter.');
      return;
    }

    try {
      await confirmPasswordReset(auth, actionCode, newPassword);
      setStatus('success');
      setMessage('Password berhasil diubah! Anda dapat login dengan password baru.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setMessage('Gagal mengubah password. Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 relative">
      <PageContainer maxWidth="max-w-md" padding="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
          <div className="w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
            {/* Header */}
            <div>
              <div className="flex justify-center">
                <Link to="/" className="block text-center">
                  <span className="text-2xl font-bold cursor-pointer bg-gradient-to-r from-[#010042] to-[#0100a3] bg-clip-text text-transparent" style={{letterSpacing: "0.5px"}}>
                    SkillNusa
                  </span>
                </Link>
              </div>
              
              {mode === 'verifyEmail' && (
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                  Verifikasi Email
                </h2>
              )}
              
              {mode === 'resetPassword' && (
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                  Reset Password
                </h2>
              )}
              
              {mode === 'recoverEmail' && (
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                  Pemulihan Email
                </h2>
              )}
            </div>

            {/* Loading State */}
            {status === 'loading' && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#010042] mx-auto"></div>
                <p className="mt-4 text-gray-600">Memproses permintaan Anda...</p>
              </div>
            )}

            {/* Success State */}
            {status === 'success' && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Berhasil!</h3>
                    <p className="mt-1 text-sm text-green-700">{message}</p>
                    <p className="mt-2 text-sm text-green-600">
                      Anda akan dialihkan ke halaman login dalam beberapa detik...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Terjadi Kesalahan</h3>
                    <p className="mt-1 text-sm text-red-700">{message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Password Reset Form */}
            {status === 'resetPassword' && (
              <form onSubmit={handlePasswordReset} className="space-y-6">
                <div className="rounded-md bg-blue-50 p-4">
                  <p className="text-sm text-blue-700">
                    Reset password untuk: <strong>{email}</strong>
                  </p>
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    Password Baru
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#010042] focus:border-[#010042] focus:z-10 sm:text-sm"
                    placeholder="Masukkan password baru"
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Konfirmasi Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#010042] focus:border-[#010042] focus:z-10 sm:text-sm"
                    placeholder="Konfirmasi password baru"
                  />
                </div>
                
                {message && status === 'resetPassword' && (
                  <div className="rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-700">{message}</p>
                  </div>
                )}
                
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
                >
                  Ubah Password
                </button>
              </form>
            )}

            {/* Navigation Links */}
            <div className="text-center">
              <Link 
                to="/login" 
                className="text-sm font-medium text-[#010042] hover:text-[#0100a3]"
              >
                Kembali ke halaman login
              </Link>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
} 