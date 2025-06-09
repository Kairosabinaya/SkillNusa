import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import RegisterStep1 from '../../components/Auth/RegisterStep1';
import RegisterStep2 from '../../components/Auth/RegisterStep2';
import RegisterStep3 from '../../components/Auth/RegisterStep3';
import { USER_ROLES } from '../../utils/constants';
import { createUserProfile } from '../../services/profileService';
import ParticleBackground from '../../components/UI/ParticleBackground';

export default function Register() {
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signup } = useAuth();
  
  // Reset form data when directly navigating to Register page
  useEffect(() => {
    // If the user directly clicked on register link, clear previous form data
    if (location.state && location.state.resetForm) {
      localStorage.removeItem('skillnusa_register_form');
    }
  }, [location]);

  // Retrieve saved form data from localStorage if available
  const savedFormValues = localStorage.getItem('skillnusa_register_form');
  const initialFormValues = savedFormValues 
    ? JSON.parse(savedFormValues) 
    : {
        // Step 1 - Basic Account Info
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        username: '',
        // All users register as clients by default in the new architecture
        roles: [USER_ROLES.CLIENT],
        
        // Step 2 - Profile Details
        profilePhoto: null,
        profilePhotoURL: '',
        phoneNumber: '',
        dateOfBirth: '',
        gender: '',
        location: '',
        bio: '',
        
        // Step 3 - Terms & Verification (previously Step 4)
        agreeToTerms: false,
        agreeToPrivacy: false,
        agreeToMarketing: false
      };
  
  // Save form values to localStorage whenever they change
  const saveFormProgress = (values) => {
    localStorage.setItem('skillnusa_register_form', JSON.stringify(values));
  };
  
  // Clear saved form data after successful registration
  const clearSavedFormData = () => {
    localStorage.removeItem('skillnusa_register_form');
  };
  
  // Handle tab close and navigation away from registration page
  useEffect(() => {
    // Function to handle beforeunload event (tab close/refresh)
    const handleBeforeUnload = (e) => {
      const formData = localStorage.getItem('skillnusa_register_form');
      if (formData) {
        // Standard way to show a confirmation dialog
        e.preventDefault();
        e.returnValue = 'Anda yakin ingin keluar dari halaman pendaftaran? Data yang sudah dimasukkan akan hilang.';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  const handleNextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  const handleSubmit = async (values, { setSubmitting }) => {
    if (currentStep < 3) {
      saveFormProgress(values);
      handleNextStep();
      setSubmitting(false);
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      // Register user with Firebase Auth (always as client in new architecture)
      const normalizedUsername = values.username.trim().toLowerCase();
      const user = await signup(values.email, values.password, normalizedUsername, USER_ROLES.CLIENT);
      
      // Create complete user profile with multi-role architecture
      await createUserProfile(user.uid, {
        displayName: values.fullName,
        username: normalizedUsername,
        // Multi-role fields
        roles: [USER_ROLES.CLIENT],
        activeRole: USER_ROLES.CLIENT,
        isFreelancer: false,
        // Profile fields
        profilePhoto: values.profilePhotoURL,
        phoneNumber: values.phoneNumber,
        dateOfBirth: values.dateOfBirth,
        gender: values.gender,
        location: values.location,
        bio: values.bio,
        // Preferences
        marketingEmails: values.agreeToMarketing
      });
      
      // Successful registration
      clearSavedFormData();
      navigate('/verify-email');
    } catch (error) {
      // Provide user-friendly error messages in Indonesian
      if (error.code === 'auth/email-already-in-use') {
        setError('Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password terlalu lemah. Gunakan minimal 6 karakter dengan kombinasi huruf dan angka.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Format email tidak valid. Periksa kembali email Anda.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Koneksi internet bermasalah. Periksa koneksi Anda dan coba lagi.');
      } else if (error.code) {
        setError(`Terjadi kesalahan: ${error.code}. Silakan coba lagi.`);
      } else {
        setError('Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };
  
  // Validation schemas for each step
  const validationSchemas = [
    // Step 1 - Basic Account Info
    Yup.object({
      email: Yup.string()
        .email('Format email tidak valid')
        .required('Email wajib diisi'),
      password: Yup.string()
        .min(8, 'Password minimal 8 karakter')
        .matches(/[A-Z]/, 'Password harus mengandung minimal 1 huruf besar')
        .matches(/[a-z]/, 'Password harus mengandung minimal 1 huruf kecil')
        .matches(/[0-9]/, 'Password harus mengandung minimal 1 angka')
        .required('Password wajib diisi'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Password harus sama')
        .required('Konfirmasi password wajib diisi'),
      fullName: Yup.string()
        .required('Nama lengkap wajib diisi'),
      username: Yup.string()
        .min(3, 'Username minimal 3 karakter')
        .max(20, 'Username maksimal 20 karakter')
        .matches(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh berisi huruf, angka, dan underscore')
        .required('Username wajib diisi')
      // Removed role validation as users always register as clients
    }),
    
    // Step 2 - Profile Details
    Yup.object({
      phoneNumber: Yup.string()
        .matches(/^\+62[0-9]{8,11}$/, 'Nomor telepon harus diikuti 8-11 digit angka')
        .required('Nomor telepon wajib diisi'),
      dateOfBirth: Yup.date()
        .max(new Date(), 'Tanggal lahir tidak boleh lebih dari hari ini')
        .required('Tanggal lahir wajib diisi'),
      gender: Yup.string()
        .oneOf(['Male', 'Female', 'Other', 'Prefer not to say'], 'Pilih jenis kelamin yang valid')
        .required('Jenis kelamin wajib dipilih'),
      location: Yup.string()
        .required('Kota wajib dipilih'),
      bio: Yup.string()
        .max(500, 'Bio maksimal 500 karakter')
    }),
    
    // Step 3 - Terms & Verification (previously Step 4)
    Yup.object({
      agreeToTerms: Yup.boolean()
        .oneOf([true], 'Anda harus menyetujui Syarat & Ketentuan')
        .required('Anda harus menyetujui Syarat & Ketentuan'),
      agreeToPrivacy: Yup.boolean()
        .oneOf([true], 'Anda harus menyetujui Kebijakan Privasi')
        .required('Anda harus menyetujui Kebijakan Privasi')
    })
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 relative">
      <ParticleBackground variant="login" />
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-xl shadow-md relative z-10">
            <div>
              <div className="flex justify-center">
                <Link 
                  to="/" 
                  className="block text-center"
                  onClick={(e) => {
                    if (localStorage.getItem('skillnusa_register_form')) {
                      const confirmed = window.confirm('Anda yakin ingin keluar dari halaman pendaftaran? Data yang sudah dimasukkan akan hilang.');
                      if (confirmed) {
                        clearSavedFormData();
                      } else {
                        e.preventDefault();
                      }
                    }
                  }}
                >
                  <span className="text-2xl font-bold cursor-pointer bg-gradient-to-r from-[#010042] to-[#0100a3] bg-clip-text text-transparent" style={{letterSpacing: "0.5px"}}>SkillNusa</span>
                </Link>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Buat Akun</h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Sudah memiliki akun?{' '}
                <Link 
                  to="/login" 
                  className="font-medium text-[#010042] hover:text-[#0100a3]"
                  onClick={(e) => {
                    if (localStorage.getItem('skillnusa_register_form')) {
                      const confirmed = window.confirm('Anda yakin ingin keluar dari halaman pendaftaran? Data yang sudah dimasukkan akan hilang.');
                      if (confirmed) {
                        clearSavedFormData();
                      } else {
                        e.preventDefault();
                      }
                    }
                  }}
                >
                  Masuk di sini
                </Link>
              </p>
            </div>
            
            {/* Progress Indicator */}
            <div className="w-full">
              <div className="flex justify-between items-center mb-4">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex flex-col items-center">
                    <div 
                      className={`w-10 h-10 flex items-center justify-center rounded-full ${
                        currentStep === step 
                          ? 'bg-[#010042] text-white' 
                          : currentStep > step 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {currentStep > step ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step
                      )}
                    </div>
                    <span className="text-xs mt-2 text-gray-600">
                      {step === 1 && "Akun"}
                      {step === 2 && "Profil"}
                      {step === 3 && "Syarat"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="relative w-full h-2 bg-gray-200 rounded-full">
                <div 
                  className="absolute top-0 left-0 h-2 bg-[#010042] rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                />
              </div>
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
                  </div>
                </div>
              </div>
            )}
            
            <Formik
              initialValues={initialFormValues}
              validationSchema={validationSchemas[currentStep - 1]}
              onSubmit={handleSubmit}
              validateOnMount={false}
              validateOnChange={true}
              validateOnBlur={true}
            >
              {formikProps => {
                // Save form progress when touched values change
                if (Object.keys(formikProps.touched).length > 0) {
                  saveFormProgress(formikProps.values);
                }
                
                return (
                  <Form className="mt-8 space-y-6">
                    {/* Step 1 - Basic Account Info */}
                    {currentStep === 1 && (
                      <RegisterStep1 
                        formikProps={formikProps}
                      />
                    )}
                    
                    {/* Step 2 - Profile Details */}
                    {currentStep === 2 && (
                      <RegisterStep2 
                        formikProps={formikProps}
                      />
                    )}
                    
                    {/* Step 3 - Terms & Verification (previously Step 4) */}
                    {currentStep === 3 && (
                      <RegisterStep3 
                        formikProps={formikProps}
                      />
                    )}
                    
                    <div className="flex justify-between items-center">
                      {currentStep > 1 ? (
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
                        >
                          Kembali
                        </button>
                      ) : (
                        <div></div>
                      )}
                      
                      <button
                        type="submit"
                        disabled={loading || (currentStep === 3 && (!formikProps.values.agreeToTerms || !formikProps.values.agreeToPrivacy))}
                        className="group relative py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Memproses...' : currentStep < 3 ? 'Lanjut' : 'Daftar'}
                      </button>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="text-sm">
                        <Link 
                          to="/login" 
                          className="font-medium text-[#010042] hover:text-[#0100a3]"
                          onClick={(e) => {
                            if (localStorage.getItem('skillnusa_register_form')) {
                              const confirmed = window.confirm('Anda yakin ingin keluar dari halaman pendaftaran? Data yang sudah dimasukkan akan hilang.');
                              if (confirmed) {
                                clearSavedFormData();
                              } else {
                                e.preventDefault();
                              }
                            }
                          }}
                        >
                          Sudah punya akun? Masuk
                        </Link>
                      </div>
                    </div>
                  </Form>
                );
              }}
            </Formik>
      </div>
    </div>
  );
} 