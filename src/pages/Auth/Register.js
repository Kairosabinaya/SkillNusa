import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import RegisterStep1 from '../../components/Auth/RegisterStep1';
import RegisterStep2 from '../../components/Auth/RegisterStep2';
import RegisterStep3 from '../../components/Auth/RegisterStep3';
import RegisterStep4 from '../../components/Auth/RegisterStep4';
import { USER_ROLES } from '../../utils/constants';
import { createUserProfile } from '../../services/profileService';

export default function Register() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signup } = useAuth();

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
        role: USER_ROLES.FREELANCER,
        
        // Step 2 - Profile Details
        profilePhoto: null,
        profilePhotoURL: '',
        phoneNumber: '',
        dateOfBirth: '',
        gender: '',
        location: '',
        bio: '',
        
        // Step 3 - Role-Specific Info (Freelancer)
        skills: [],
        experienceLevel: '',
        portfolioLinks: ['', '', ''],
        hourlyRate: '',
        availability: '',
        
        // Step 3 - Role-Specific Info (Client)
        companyName: '',
        industry: '',
        companySize: '',
        budgetRange: '',
        primaryNeeds: [],
        
        // Step 4 - Terms & Verification
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
  
  const handleNextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  const handleSubmit = async (values, { setSubmitting }) => {
    if (currentStep < 4) {
      saveFormProgress(values);
      handleNextStep();
      setSubmitting(false);
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      // Register user with Firebase Auth
      const user = await signup(values.email, values.password, values.username, values.role);
      
      // Create complete user profile
      await createUserProfile(user.uid, {
        displayName: values.fullName,
        username: values.username,
        role: values.role,
        profilePhoto: values.profilePhotoURL,
        phoneNumber: values.phoneNumber,
        dateOfBirth: values.dateOfBirth,
        gender: values.gender,
        location: values.location,
        bio: values.bio,
        // Role-specific fields
        ...(values.role === USER_ROLES.FREELANCER 
          ? {
              skills: values.skills,
              experienceLevel: values.experienceLevel,
              portfolioLinks: values.portfolioLinks.filter(link => link !== ''),
              hourlyRate: values.hourlyRate,
              availability: values.availability
            }
          : {
              companyName: values.companyName,
              industry: values.industry,
              companySize: values.companySize,
              budgetRange: values.budgetRange,
              primaryNeeds: values.primaryNeeds
            }
        ),
        // Preferences
        marketingEmails: values.agreeToMarketing
      });
      
      // Clear saved form data
      clearSavedFormData();
      
      // Redirect to email verification page
      navigate('/verify-email');
    } catch (error) {
      console.error(error);
      setError('Gagal membuat akun. ' + (error.message || ''));
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
        .required('Username wajib diisi'),
      role: Yup.string()
        .oneOf([USER_ROLES.FREELANCER, USER_ROLES.CLIENT], 'Pilih peran yang valid')
        .required('Peran wajib dipilih')
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
        .when('role', ([role]) => {
          return role === USER_ROLES.FREELANCER
            ? Yup.string()
                .min(50, 'Bio minimal 50 karakter')
                .max(500, 'Bio maksimal 500 karakter')
                .required('Bio wajib diisi untuk Freelancer')
            : Yup.string();
        }),
    }),
    
    // Step 3 - Role-Specific Info
    Yup.object().shape({
      // Freelancer fields
      skills: Yup.array()
        .when('role', ([role]) => {
          return role === USER_ROLES.FREELANCER
            ? Yup.array()
                .min(3, 'Pilih minimal 3 keahlian')
                .required('Keahlian wajib dipilih')
            : Yup.array();
        }),
      experienceLevel: Yup.string()
        .when('role', ([role]) => {
          return role === USER_ROLES.FREELANCER
            ? Yup.string()
                .oneOf(['Beginner', 'Intermediate', 'Expert'], 'Pilih level pengalaman yang valid')
                .required('Level pengalaman wajib dipilih')
            : Yup.string();
        }),
      portfolioLinks: Yup.array()
        .when('role', ([role]) => {
          return role === USER_ROLES.FREELANCER
            ? Yup.array().of(
                Yup.string().url('URL tidak valid').nullable()
              )
            : Yup.array();
        }),
      availability: Yup.string()
        .when('role', ([role]) => {
          return role === USER_ROLES.FREELANCER
            ? Yup.string()
                .oneOf(['Full-time', 'Part-time', 'Project-based'], 'Pilih ketersediaan yang valid')
                .required('Ketersediaan wajib dipilih')
            : Yup.string();
        }),
      
      // Client fields
      industry: Yup.string()
        .when('role', ([role]) => {
          return role === USER_ROLES.CLIENT
            ? Yup.string()
                .required('Industri wajib dipilih')
            : Yup.string();
        }),
      companySize: Yup.string()
        .when('role', ([role]) => {
          return role === USER_ROLES.CLIENT
            ? Yup.string()
                .oneOf(['1-10', '11-50', '51-200', '200+', 'Individual'], 'Pilih ukuran perusahaan yang valid')
                .required('Ukuran perusahaan wajib dipilih')
            : Yup.string();
        }),
      budgetRange: Yup.string()
        .when('role', ([role]) => {
          return role === USER_ROLES.CLIENT
            ? Yup.string()
                .required('Rentang budget wajib dipilih')
            : Yup.string();
        }),
      primaryNeeds: Yup.array()
        .when('role', ([role]) => {
          return role === USER_ROLES.CLIENT
            ? Yup.array()
                .min(1, 'Pilih minimal 1 kebutuhan')
                .required('Kebutuhan utama wajib dipilih')
            : Yup.array();
        })
    }),
    
    // Step 4 - Terms & Verification
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-6 bg-white p-8 rounded-xl shadow-md">
        <div>
          <div className="flex justify-center">
            <Link to="/" className="block text-center">
              <span className="text-2xl font-bold cursor-pointer bg-gradient-to-r from-[#010042] to-[#0100a3] bg-clip-text text-transparent" style={{letterSpacing: "0.5px"}}>SkillNusa</span>
            </Link>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Buat Akun</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Atau{' '}
            <Link to="/login" className="font-medium text-[#010042] hover:text-[#0100a3]">
              masuk jika sudah memiliki akun
            </Link>
          </p>
        </div>
        
        {/* Progress Indicator */}
        <div className="w-full">
          <div className="flex justify-between items-center mb-4">
            {[1, 2, 3, 4].map((step) => (
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
                  {step === 3 && "Detail"}
                  {step === 4 && "Syarat"}
                </span>
              </div>
            ))}
          </div>
          <div className="relative w-full h-2 bg-gray-200 rounded-full">
            <div 
              className="absolute top-0 left-0 h-2 bg-[#010042] rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
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
                
                {/* Step 3 - Role-Specific Info */}
                {currentStep === 3 && (
                  <RegisterStep3 
                    formikProps={formikProps}
                  />
                )}
                
                {/* Step 4 - Terms & Verification */}
                {currentStep === 4 && (
                  <RegisterStep4 
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
                    disabled={loading || (currentStep === 4 && (!formikProps.values.agreeToTerms || !formikProps.values.agreeToPrivacy))}
                    className="group relative py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                    {loading ? 'Memproses...' : currentStep < 4 ? 'Lanjut' : 'Daftar'}
            </button>
          </div>

          <div className="flex items-center justify-center">
            <div className="text-sm">
              <Link to="/login" className="font-medium text-[#010042] hover:text-[#0100a3]">
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