import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FREELANCER_STATUS } from '../../utils/constants';

/**
 * FreelancerCTA - Call to Action banner for encouraging clients to become freelancers
 * @param {Object} props - Component props
 * @param {string} props.variant - Variant of the banner ('home', 'profile', 'dashboard')
 */
export default function FreelancerCTA({ variant = 'home' }) {
  const { userProfile, currentUser } = useAuth();
  
  // Combine data to ensure we have all fields
  const userData = { ...currentUser, ...userProfile };
  
  // Don't show the CTA if:
  // - User is not logged in
  // - User is already a freelancer
  // - User has already applied to be a freelancer
  if (!userData || 
      userData.isFreelancer || 
      userData.freelancerStatus === FREELANCER_STATUS.PENDING) {
    return null;
  }
  
  // Debugging - log when we are showing the CTA
  // Home page variant (large, prominent)
  if (variant === 'home') {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-12 md:px-12 text-center md:text-left flex flex-col md:flex-row items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">Mulai Hasilkan Pendapatan dari Keahlian Anda</h2>
            <p className="text-blue-100 mb-6">
              Gabung sebagai freelancer dan dapatkan akses ke ribuan project dari klien di seluruh Indonesia.
            </p>
            <Link
              to="/become-freelancer"
              className="inline-block bg-white text-indigo-600 font-semibold px-6 py-3 rounded-lg hover:bg-indigo-50 transition duration-300"
            >
              Menjadi Freelancer
            </Link>
          </div>
          <div className="mt-6 md:mt-0 md:ml-6 hidden md:block">
            <img
              src="/images/freelancer-illustration.svg"
              alt="Freelancer"
              className="w-64 h-64"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>
      </div>
    );
  }
  
  // Profile page variant (contextual)
  if (variant === 'profile') {
    return (
      <div className="bg-gradient-to-r from-[#010042]/90 to-[#0100a3]/90 rounded-xl overflow-hidden shadow-lg">
        <div className="px-8 py-8 md:py-10 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 md:max-w-2xl">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Meet SkillBot: Your AI-Powered Freelancer Finder
            </h3>
            <p className="text-white/90 text-base md:text-lg mb-6">
              Sistem rekomendasi AI kami membantu mencocokkan freelancer terbaik untuk proyek spesifik Anda. Biarkan SkillBot menemukan talenta yang tepat.
            </p>
            <Link
              to="/skillbot"
              className="inline-flex items-center px-6 py-3 bg-white rounded-lg text-[#010042] font-semibold transition-all hover:bg-opacity-90 hover:shadow-md hover:transform hover:scale-105"
            >
              Coba SkillBot
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
          <div className="hidden md:block md:ml-8">
            <img
              src="/images/robot.png"
              alt="AI Matching"
              className="rounded-lg shadow-lg h-32 w-auto object-contain"
            />
          </div>
        </div>
      </div>
    );
  }
  
  // Dashboard variant (subtle reminder)
  if (variant === 'dashboard') {
    return (
      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1 flex items-center justify-between">
            <p className="text-sm text-indigo-700">
              Ingin menjadi freelancer? Hasilkan pendapatan dari keahlian Anda.
            </p>
            <Link
              to="/become-freelancer"
              className="ml-4 whitespace-nowrap inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Daftar
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Default minimal variant
  return (
    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-md border border-gray-200">
      <span className="text-sm text-gray-700">Ingin menjadi freelancer?</span>
      <Link
        to="/become-freelancer"
        className="text-sm text-indigo-600 font-medium hover:text-indigo-800"
      >
        Daftar sekarang
      </Link>
    </div>
  );
}
