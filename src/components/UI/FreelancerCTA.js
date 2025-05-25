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
    console.log("FreelancerCTA not showing because:", {
      noUserData: !userData,
      isFreelancer: userData?.isFreelancer,
      pendingStatus: userData?.freelancerStatus === FREELANCER_STATUS.PENDING
    });
    return null;
  }
  
  // Debugging - log when we are showing the CTA
  console.log("Showing FreelancerCTA with variant:", variant);
  
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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg overflow-hidden">
        <div className="px-6 py-6 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-indigo-800 mb-1">Jadilah Freelancer di SkillNusa</h3>
            <p className="text-indigo-600 text-sm">
              Dapatkan pendapatan tambahan dengan keahlian yang Anda miliki
            </p>
          </div>
          <Link
            to="/become-freelancer"
            className="mt-4 md:mt-0 inline-block bg-indigo-600 text-white font-medium px-5 py-2 rounded-md hover:bg-indigo-700 transition duration-300"
          >
            Menjadi Freelancer
          </Link>
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
