import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { applyAsFreelancer } from '../../services/freelancerService';
import { FREELANCER_STATUS } from '../../utils/constants';
import BecomeFreelancerStep1 from '../../components/Profile/BecomeFreelancerStep1';
import BecomeFreelancerStep2 from '../../components/Profile/BecomeFreelancerStep2';
import BecomeFreelancerStep3 from '../../components/Profile/BecomeFreelancerStep3';

export default function BecomeFreelancer() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, refreshUserData } = useAuth();
  
  // Initial form values
  const initialValues = {
    // Step 1: Skills & Experience
    skills: [],
    experienceLevel: '',
    bio: user?.bio || '',
    
    // Step 2: Portfolio & Rates
    portfolioLinks: ['', '', ''],
    hourlyRate: '',
    availability: '',
    
    // Step 3: Verification & Agreement
    agreeToFreelancerTerms: false,
    agreeToQualityStandards: false
  };
  
  // Validation schemas for each step
  const validationSchemas = [
    // Step 1: Skills & Experience
    Yup.object({
      skills: Yup.array()
        .min(3, 'Pilih minimal 3 keahlian')
        .required('Keahlian wajib dipilih'),
      experienceLevel: Yup.string()
        .oneOf(['Beginner', 'Intermediate', 'Expert'], 'Pilih level pengalaman yang valid')
        .required('Level pengalaman wajib dipilih'),
      bio: Yup.string()
        .min(50, 'Bio minimal 50 karakter')
        .max(500, 'Bio maksimal 500 karakter')
        .required('Bio wajib diisi untuk Freelancer')
    }),
    
    // Step 2: Portfolio & Rates
    Yup.object({
      hourlyRate: Yup.number()
        .min(0, 'Tarif per jam tidak boleh negatif')
        .required('Tarif per jam wajib diisi'),
      availability: Yup.string()
        .oneOf(['Full-time', 'Part-time', 'Project-based'], 'Pilih ketersediaan yang valid')
        .required('Ketersediaan wajib dipilih')
    }),
    
    // Step 3: Verification & Agreement
    Yup.object({
      agreeToFreelancerTerms: Yup.boolean()
        .oneOf([true], 'Anda harus menyetujui Ketentuan Freelancer')
        .required('Anda harus menyetujui Ketentuan Freelancer'),
      agreeToQualityStandards: Yup.boolean()
        .oneOf([true], 'Anda harus menyetujui Standar Kualitas')
        .required('Anda harus menyetujui Standar Kualitas')
    })
  ];
  
  // Handle next step button click
  const handleNextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  
  // Handle previous step button click
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  // Handle form submission
  const handleSubmit = async (values, { setSubmitting }) => {
    if (currentStep < 3) {
      handleNextStep();
      setSubmitting(false);
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      // Apply as freelancer
      await applyAsFreelancer(user.uid, {
        skills: values.skills,
        experienceLevel: values.experienceLevel,
        bio: values.bio,
        portfolioLinks: values.portfolioLinks.filter(link => link !== ''),
        hourlyRate: values.hourlyRate,
        availability: values.availability
      });
      
      // Refresh user data to update role and freelancer status
      await refreshUserData();
      
      // Redirect to profile page
      navigate('/profile', { 
        state: { 
          message: 'Permohonan menjadi freelancer berhasil dikirim! Akun Anda sedang ditinjau.', 
          type: 'success' 
        } 
      });
    } catch (error) {
      console.error(error);
      setError('Gagal mengirim permohonan. ' + (error.message || ''));
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };
  
  // Check if user is already a freelancer
  if (user?.isFreelancer) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Menjadi Freelancer</h1>
          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1 md:flex md:justify-between">
                <p className="text-sm text-blue-700">
                  {user.freelancerStatus === FREELANCER_STATUS.PENDING ? 
                    'Permohonan Anda sedang ditinjau. Kami akan memberi tahu Anda setelah selesai.' :
                    user.freelancerStatus === FREELANCER_STATUS.APPROVED ?
                    'Anda sudah terdaftar sebagai freelancer! Anda dapat beralih ke dashboard freelancer dari menu profil.' :
                    'Permohonan Anda telah ditolak. Silakan hubungi dukungan untuk informasi lebih lanjut.'}
                </p>
                <p className="mt-3 text-sm md:mt-0 md:ml-6">
                  <a href="/profile" className="whitespace-nowrap font-medium text-blue-700 hover:text-blue-600">
                    Kembali ke profil <span aria-hidden="true">&rarr;</span>
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Menjadi Freelancer</h1>
        
        {/* Progress Indicator */}
        <div className="w-full mb-8">
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
                  {step === 1 && "Keahlian"}
                  {step === 2 && "Portfolio"}
                  {step === 3 && "Verifikasi"}
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
          <div className="rounded-md bg-red-50 p-4 mb-6">
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
          initialValues={initialValues}
          validationSchema={validationSchemas[currentStep - 1]}
          onSubmit={handleSubmit}
          validateOnMount={false}
          validateOnChange={true}
          validateOnBlur={true}
        >
          {formikProps => (
            <Form className="space-y-8">
              {/* Step 1: Skills & Experience */}
              {currentStep === 1 && (
                <BecomeFreelancerStep1 formikProps={formikProps} />
              )}
              
              {/* Step 2: Portfolio & Rates */}
              {currentStep === 2 && (
                <BecomeFreelancerStep2 formikProps={formikProps} />
              )}
              
              {/* Step 3: Verification & Agreement */}
              {currentStep === 3 && (
                <BecomeFreelancerStep3 formikProps={formikProps} />
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
                  disabled={loading}
                  className="py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Memproses...' : currentStep < 3 ? 'Lanjut' : 'Kirim Permohonan'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
