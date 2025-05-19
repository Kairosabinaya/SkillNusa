import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function VerifyEmail() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-[#010042]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Check your email</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a verification link to{' '}
            <span className="font-medium text-[#010042]">
              {currentUser?.email || 'your email address'}
            </span>
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Verification required</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Please check your email and click the verification link to complete your registration. If you don't see the email, check your spam folder.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <Link 
              to="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
            >
              Go to Login
            </Link>
            
            <button 
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
              onClick={() => window.location.href = 'mailto:'}
            >
              Open email app
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Didn't receive the email?{' '}
              <button 
                className="font-medium text-[#010042] hover:text-[#0100a3]"
                // In a real implementation, you would add a resend email function here
              >
                Click here to resend
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 