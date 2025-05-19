import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

export default function Profile() {
  const { userProfile, currentUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfileData() {
      if (!currentUser) return;
      
      try {
        const profileDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
        if (profileDoc.exists()) {
          setProfileData(profileDoc.data());
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfileData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="large" text="Loading profile..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center">
              <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                {userProfile?.profilePhoto ? (
                  <img
                    className="h-32 w-32 rounded-full object-cover border-4 border-[#010042]/10"
                    src={userProfile.profilePhoto}
                    alt={userProfile.displayName}
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-[#010042]/10 flex items-center justify-center text-[#010042] text-4xl font-bold">
                    {userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {userProfile?.displayName || 'User'}
                </h1>
                <p className="text-gray-500 mb-2">{userProfile?.email}</p>
                <div className="inline-block px-3 py-1 rounded-full bg-[#010042]/10 text-[#010042] text-sm font-medium mb-4">
                  {userProfile?.role === 'freelancer' ? 'Freelancer' : 
                   userProfile?.role === 'client' ? 'Client' : 
                   userProfile?.role === 'admin' ? 'Administrator' : 'User'}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/profile/edit"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
                  >
                    Edit Profile
                  </Link>
                  {userProfile?.role === 'freelancer' && (
                    <Link
                      to="/services/new"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
                    >
                      Create Service
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
              <p className="text-gray-600">
                {userProfile?.bio || 'No bio information added yet.'}
              </p>
            </div>

            {userProfile?.role === 'freelancer' && (
              <div className="mt-8 border-t border-gray-200 pt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
                {profileData?.skills && profileData.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profileData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No skills added yet.</p>
                )}
              </div>
            )}

            {userProfile?.role === 'freelancer' && (
              <div className="mt-8 border-t border-gray-200 pt-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Services</h2>
                  <Link
                    to="/services/new"
                    className="text-sm font-medium text-[#010042] hover:text-[#0100a3]"
                  >
                    Add New Service
                  </Link>
                </div>
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto text-gray-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <p className="text-gray-600 mb-4">
                    You haven't created any services yet.
                  </p>
                  <Link
                    to="/services/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
                  >
                    Create Your First Service
                  </Link>
                </div>
              </div>
            )}

            {userProfile?.role === 'client' && (
              <div className="mt-8 border-t border-gray-200 pt-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">My Orders</h2>
                  <Link
                    to="/my-orders"
                    className="text-sm font-medium text-[#010042] hover:text-[#0100a3]"
                  >
                    View All Orders
                  </Link>
                </div>
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto text-gray-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className="text-gray-600 mb-4">
                    You haven't placed any orders yet.
                  </p>
                  <Link
                    to="/browse"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
                  >
                    Browse Services
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 