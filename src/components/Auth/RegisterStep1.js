import { useState, useEffect } from 'react';
import { Field, ErrorMessage } from 'formik';
import { checkEmailExists, checkUsernameExists, isValidUsernameFormat } from '../../services/validationService';

export default function RegisterStep1({ formikProps }) {
  const { values, errors, touched, handleChange, handleBlur, setFieldError, setFieldTouched } = formikProps;
  
  // State for loading indicators
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  
  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Debounced validation for email
  useEffect(() => {
    let timer;
    if (values.email && touched.email && !errors.email) {
      setIsCheckingEmail(true);
      timer = setTimeout(async () => {
        try {
          const exists = await checkEmailExists(values.email);
          if (exists) {
            setFieldError('email', 'Email ini sudah terdaftar. Silakan gunakan email lain.');
          }
        } catch (error) {
          console.error('Error checking email:', error);
        } finally {
          setIsCheckingEmail(false);
        }
      }, 500);
    }
    return () => clearTimeout(timer);
  }, [values.email, touched.email, errors.email, setFieldError]);
  
  // Debounced validation for username
  useEffect(() => {
    let timer;
    if (values.username && touched.username) {
      // First check format
      if (!isValidUsernameFormat(values.username)) {
        setFieldError('username', 'Username hanya boleh berisi huruf kecil dan angka.');
        return;
      }
      
      setIsCheckingUsername(true);
      timer = setTimeout(async () => {
        try {
          const exists = await checkUsernameExists(values.username);
          if (exists) {
            setFieldError('username', 'Username ini sudah digunakan. Silakan pilih username lain.');
          }
        } catch (error) {
          console.error('Error checking username:', error);
        } finally {
          setIsCheckingUsername(false);
        }
      }, 500);
    }
    return () => clearTimeout(timer);
  }, [values.username, touched.username, setFieldError]);
  
  // Handler for username input to force lowercase
  const handleUsernameChange = (e) => {
    // Convert to lowercase and remove special characters
    const rawValue = e.target.value;
    const sanitizedValue = rawValue.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Update field value manually if it changed
    if (rawValue !== sanitizedValue) {
      e.target.value = sanitizedValue;
    }
    
    // Call the original handler
    handleChange(e);
  };
  
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-medium text-gray-900">Informasi Akun Dasar</h3>

      {/* Full Name Field */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
          Nama Lengkap <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <Field
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder="Masukkan nama lengkap Anda"
            className={`appearance-none block w-full px-3 py-2 border ${
              errors.fullName && touched.fullName ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm`}
          />
          <ErrorMessage name="fullName" component="div" className="mt-1 text-sm text-red-600" />
        </div>
      </div>
      
      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 relative">
          <Field
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Masukkan email Anda"
            className={`appearance-none block w-full px-3 py-2 border ${
              errors.email && touched.email ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm`}
            onBlur={(e) => {
              handleBlur(e);
              setFieldTouched('email', true);
            }}
          />
          {isCheckingEmail && (
            <div className="absolute right-2 top-2">
              <svg className="animate-spin h-5 w-5 text-[#010042]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
          <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-600" />
        </div>
      </div>
      
      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 relative">
          <Field
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Minimal 8 karakter dengan huruf besar, kecil, dan angka"
            className={`appearance-none block w-full px-3 py-2 border ${
              errors.password && touched.password ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm pr-10`}
          />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          <ErrorMessage name="password" component="div" className="mt-1 text-sm text-red-600" />
        </div>
      </div>
      
      {/* Confirm Password Field */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Konfirmasi Password <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 relative">
          <Field
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Masukkan kembali password Anda"
            className={`appearance-none block w-full px-3 py-2 border ${
              errors.confirmPassword && touched.confirmPassword ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm pr-10`}
          />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          <ErrorMessage name="confirmPassword" component="div" className="mt-1 text-sm text-red-600" />
        </div>
      </div>
      
      {/* Username Field */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 relative">
          <Field
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="Masukkan username (3-20 karakter, hanya huruf kecil dan angka)"
            onChange={handleUsernameChange}
            className={`appearance-none block w-full px-3 py-2 border ${
              errors.username && touched.username ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm`}
            onBlur={(e) => {
              handleBlur(e);
              setFieldTouched('username', true);
            }}
          />
          {isCheckingUsername && (
            <div className="absolute right-2 top-2">
              <svg className="animate-spin h-5 w-5 text-[#010042]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
          <ErrorMessage name="username" component="div" className="mt-1 text-sm text-red-600" />
          <p className="mt-1 text-xs text-gray-500">
            Username hanya boleh menggunakan huruf kecil dan angka. Tidak boleh mengandung spasi, tanda hubung (-), atau garis bawah (_).
          </p>
        </div>
      </div>

      
      <div className="pt-0">
        <p className="text-xs text-gray-500">
          <span className="text-red-500">*</span> Wajib diisi
        </p>
      </div>
    </div>
  );
} 