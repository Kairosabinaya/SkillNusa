import { Field, ErrorMessage } from 'formik';
import { USER_ROLES } from '../../utils/constants';

export default function RegisterStep1({ formikProps }) {
  const { values, errors, touched, handleChange, handleBlur } = formikProps;
  
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-medium text-gray-900">Informasi Akun Dasar</h3>
      
      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <Field
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Masukkan email Anda"
            className={`appearance-none block w-full px-3 py-2 border ${
              errors.email && touched.email ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm`}
          />
          <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-600" />
        </div>
      </div>
      
      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <Field
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimal 8 karakter dengan huruf besar, kecil, dan angka"
            className={`appearance-none block w-full px-3 py-2 border ${
              errors.password && touched.password ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm`}
          />
          <ErrorMessage name="password" component="div" className="mt-1 text-sm text-red-600" />
        </div>
      </div>
      
      {/* Confirm Password Field */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Konfirmasi Password <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <Field
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Masukkan kembali password Anda"
            className={`appearance-none block w-full px-3 py-2 border ${
              errors.confirmPassword && touched.confirmPassword ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm`}
          />
          <ErrorMessage name="confirmPassword" component="div" className="mt-1 text-sm text-red-600" />
        </div>
      </div>
      
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
      
      {/* Username Field */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <Field
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="Masukkan username (3-20 karakter, hanya huruf, angka, underscore)"
            className={`appearance-none block w-full px-3 py-2 border ${
              errors.username && touched.username ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm`}
          />
          <ErrorMessage name="username" component="div" className="mt-1 text-sm text-red-600" />
        </div>
      </div>
      
      {/* Role Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Gabung sebagai <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`relative flex items-center justify-center px-4 py-3 rounded-lg border ${
              values.role === USER_ROLES.FREELANCER ? 'bg-[#010042]/5 border-[#010042]' : 'border-gray-300'
            } cursor-pointer hover:border-[#010042] transition-all`}>
              <Field
                type="radio"
                name="role"
                value={USER_ROLES.FREELANCER}
                className="sr-only"
              />
              <span className={`text-sm font-medium ${
                values.role === USER_ROLES.FREELANCER ? 'text-[#010042]' : 'text-gray-700'
              }`}>Freelancer</span>
              {values.role === USER_ROLES.FREELANCER && (
                <svg className="h-5 w-5 text-[#010042] absolute top-2 right-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </label>
          </div>
          <div>
            <label className={`relative flex items-center justify-center px-4 py-3 rounded-lg border ${
              values.role === USER_ROLES.CLIENT ? 'bg-[#010042]/5 border-[#010042]' : 'border-gray-300'
            } cursor-pointer hover:border-[#010042] transition-all`}>
              <Field
                type="radio"
                name="role"
                value={USER_ROLES.CLIENT}
                className="sr-only"
              />
              <span className={`text-sm font-medium ${
                values.role === USER_ROLES.CLIENT ? 'text-[#010042]' : 'text-gray-700'
              }`}>Client</span>
              {values.role === USER_ROLES.CLIENT && (
                <svg className="h-5 w-5 text-[#010042] absolute top-2 right-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </label>
          </div>
        </div>
        <ErrorMessage name="role" component="div" className="mt-1 text-sm text-red-600" />
      </div>
      
      <div className="pt-2">
        <p className="text-xs text-gray-500">
          <span className="text-red-500">*</span> Wajib diisi
        </p>
      </div>
    </div>
  );
} 