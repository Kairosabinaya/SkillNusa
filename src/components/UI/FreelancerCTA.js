import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * FreelancerCTA - Call to Action banner for encouraging clients to become freelancers
 * @param {Object} props - Component props
 * @param {string} props.variant - Variant of the banner ('home', 'profile')
 */
export default function FreelancerCTA({ variant = 'home' }) {
  const { userProfile, currentUser } = useAuth();
  
  // Combine data to ensure we have all fields
  const userData = { ...currentUser, ...userProfile };
  
  // Don't show the CTA if:
  // - User is not logged in
  // - User is already a freelancer
  if (!userData || userData.isFreelancer) {
    return null;
  }
  
  // Home page variant (large, prominent)
  if (variant === 'home') {
    return (
      <div className="bg-[#010042] py-12 border-t border-[#0100a3]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Mulai Hasilkan Pendapatan dari Keahlian Anda</h2>
            <p className="text-blue-100 mb-6">
              Gabung sebagai freelancer dan dapatkan akses ke ribuan project dari klien di seluruh Indonesia.
            </p>
            <Link
              to="/become-freelancer"
              className="inline-flex items-center px-6 py-3 bg-white rounded-lg text-[#010042] font-medium hover:bg-gray-100 transition-all text-base"
            >
              Menjadi Freelancer
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
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
      <div class="max-w-4xl mx-auto relative z-10">
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
