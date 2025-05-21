import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function VerifyEmail() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div>
          <div className="flex justify-center">
            <Link to="/" className="block text-center">
              <div className="w-16 h-16 rounded-full bg-[#010042] flex items-center justify-center mx-auto mb-4 shadow-md hover:shadow-lg transition-all duration-300">
                <span className="text-white text-2xl font-bold">SN</span>
              </div>
              <p className="text-sm font-medium text-gray-600">SkillNusa</p>
            </Link>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Verify your email</h2>
          <div className="mt-2 text-center text-sm text-gray-600">
            <p>
              We've sent a verification email to:{' '}
              <span className="font-medium text-[#010042]">
                {currentUser?.email}
              </span>
            </p>
            <p className="mt-2">
              Please check your inbox and follow the instructions to verify your account.
            </p>
          </div>
        </div>
        
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1v-3a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm text-blue-700">
                Didn't receive the email? Check your spam folder or try again later.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center mt-6">
          <Link
            to="/login"
            className="text-center w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#010042] hover:bg-[#0100a3]"
          >
            Go to login
          </Link>
        </div>
      </div>
    </div>
  );
} 