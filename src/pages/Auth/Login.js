import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sendEmailVerification } from 'firebase/auth';
import ParticleBackground from '../../components/UI/ParticleBackground';

export default function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Handler untuk memformat input email/username
  const handleEmailOrUsernameChange = (e) => {
    const rawValue = e.target.value;
    let sanitizedValue;
    
    // Cek apakah input berisi @ (kemungkinan email)
    if (rawValue.includes('@')) {
      // Format untuk email: huruf kecil, angka, dan karakter email yang valid
      sanitizedValue = rawValue.toLowerCase().replace(/[^a-z0-9@._-]/g, '');
    } else {
      // Format untuk username: hanya huruf kecil dan angka
      sanitizedValue = rawValue.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
    
    // Update field value jika nilai berubah
    if (rawValue !== sanitizedValue) {
      e.target.value = sanitizedValue;
    }
    
    setEmailOrUsername(sanitizedValue);
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerificationOption, setShowVerificationOption] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const navigate = useNavigate();
  const { login, error: authError, currentUser } = useAuth();

  // Redirect if user is already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/profile');
    }
  }, [currentUser, navigate]);

  // Update local error state when auth error changes
  useEffect(() => {
    if (authError) {
      // Convert Firebase error messages to user-friendly messages
      if (authError.includes('user-not-found') || authError.includes('wrong-password') || authError.includes('invalid-credential')) {
        setError('Email atau kata sandi tidak valid. Silakan coba lagi.');
      } else if (authError.includes('invalid-email')) {
        setError('Format email tidak valid. Silakan periksa kembali email Anda.');
      } else if (authError.includes('too-many-requests')) {
        setError('Terlalu banyak percobaan login yang gagal. Silakan coba lagi nanti atau reset kata sandi Anda.');
      } else if (authError.includes('network')) {
        setError('Kesalahan jaringan. Silakan periksa koneksi internet Anda dan coba lagi.');
      } else if (authError.includes('email-not-verified')) {
        setError('Email Anda belum diverifikasi. Silakan periksa kotak masuk Anda dan verifikasi alamat email Anda sebelum masuk.');
        setShowVerificationOption(true);
      } else {
        setError('Terjadi kesalahan saat login: ' + authError);
      }
    }
  }, [authError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!emailOrUsername || !password) {
      setError('Silakan masukkan email/username dan kata sandi.');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      setShowVerificationOption(false);
      setResendSuccess(false);
      await login(emailOrUsername, password);
      // Navigation is handled by the useEffect watching currentUser
    } catch (error) {
      // Error state is handled by the useEffect watching authError
      } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setResendLoading(true);
      
      // Create a temporary authentication to get the user object
      const tempAuth = await login(emailOrUsername, password).catch(() => null);
      
      if (tempAuth && tempAuth.user) {
        await sendEmailVerification(tempAuth.user);
        setResendSuccess(true);
        setError('');
      }
    } catch (error) {
      setError('Gagal mengirim ulang email verifikasi. Silakan coba lagi nanti.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <ParticleBackground />
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md relative z-10">
        <div>
          <div className="flex justify-center">
            <Link to="/" className="block text-center">
              <span className="text-2xl font-bold cursor-pointer bg-gradient-to-r from-[#010042] to-[#0100a3] bg-clip-text text-transparent" style={{letterSpacing: "0.5px"}}>SkillNusa</span>
            </Link>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Masuk ke akun Anda</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Atau{' '}
            <Link 
              to="/register" 
              state={{ resetForm: true }}
              className="font-medium text-[#010042] hover:text-[#0100a3]"
            >
              buat akun baru
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                {showVerificationOption && (
                  <div className="mt-2">
                    <button
                      onClick={handleResendVerification}
                      disabled={resendLoading || resendSuccess}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
                    >
                      {resendLoading ? 'Mengirim...' : resendSuccess ? 'Email verifikasi terkirim!' : 'Kirim ulang email verifikasi'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {resendSuccess && !error && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Email verifikasi terkirim! Silakan periksa kotak masuk Anda dan ikuti petunjuk untuk memverifikasi akun Anda.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="emailOrUsername" className="block text-sm font-medium text-gray-700">Email atau Username</label>
              <div className="mt-1">
                <input
                  id="emailOrUsername"
                  name="emailOrUsername"
                  type="text"
                  autoComplete="username"
                  required
                  value={emailOrUsername}
                  onChange={handleEmailOrUsernameChange}
                  placeholder="Masukkan email atau username"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Kata Sandi</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-[#010042] focus:border-[#010042] focus:z-10 sm:text-sm"
                placeholder="Kata Sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#010042] focus:ring-[#010042] border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Ingat saya
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-[#010042] hover:text-[#0100a3]">
                Lupa kata sandi?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042] disabled:opacity-70"
            >
              {loading ? 'Sedang masuk...' : 'Masuk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 