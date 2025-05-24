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
  const [userRegistrationData, setUserRegistrationData] = useState(null);

  useEffect(() => {
    async function fetchProfileData() {
      if (!currentUser) return;
      
      try {
        // Fetch profile data
        const profileDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
        if (profileDoc.exists()) {
          setProfileData(profileDoc.data());
        }
        
        // Fetch user registration data
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserRegistrationData(userDoc.data());
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
          <LoadingSpinner size="large" text="Memuat profil..." />
        </div>
      </div>
    );
  }

  // Combine data from userProfile, profileData, and userRegistrationData
  const combinedUserData = {
    ...userProfile,
    ...profileData,
    ...userRegistrationData
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-[#010042] to-[#0100a3] h-32"></div>
          <div className="p-8 -mt-16">
            <div className="flex flex-col md:flex-row md:items-end">
              <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                {combinedUserData?.profilePhoto ? (
                  <img
                    className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
                    src={combinedUserData.profilePhoto}
                    alt={combinedUserData.displayName}
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-white shadow-lg flex items-center justify-center text-[#010042] text-4xl font-bold border-4 border-white">
                    {combinedUserData?.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="flex-1 mt-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  {combinedUserData?.displayName || combinedUserData?.username || 'Pengguna'}
                </h1>
                <p className="text-gray-500 mb-2">{combinedUserData?.email}</p>
                <div className="inline-block px-3 py-1 rounded-full bg-[#010042]/10 text-[#010042] text-sm font-medium mb-4">
                  {combinedUserData?.role === 'freelancer' ? 'Freelancer' : 
                   combinedUserData?.role === 'client' ? 'Klien' : 
                   combinedUserData?.role === 'admin' ? 'Administrator' : 'Pengguna'}
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Link
                    to="/profile/edit"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
                  >
                    Edit Profil
                  </Link>
                  {combinedUserData?.role === 'freelancer' && (
                    <Link
                      to="/services/new"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
                    >
                      Buat Layanan
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Informasi Profil</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="mt-1">{combinedUserData?.email || '-'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Nomor Telepon</h3>
                    <p className="mt-1">{combinedUserData?.phoneNumber || '-'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Lokasi</h3>
                    <p className="mt-1">{combinedUserData?.location || '-'}</p>
                  </div>
                  
                  {combinedUserData?.gender && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Jenis Kelamin</h3>
                      <p className="mt-1">{combinedUserData.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</p>
                    </div>
                  )}
                  
                  {combinedUserData?.dateOfBirth && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Tanggal Lahir</h3>
                      <p className="mt-1">{new Date(combinedUserData.dateOfBirth).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Bio</h2>
                <p className="text-gray-600">
                  {combinedUserData?.bio || 'Belum ada informasi bio.'}
                </p>
                
                {combinedUserData?.role === 'freelancer' && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Keahlian</h3>
                    {combinedUserData?.skills && combinedUserData.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {combinedUserData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-block px-3 py-1 rounded-full bg-[#010042]/10 text-[#010042] text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">Belum ada keahlian yang ditambahkan.</p>
                    )}
                  </div>
                )}
                
                {combinedUserData?.role === 'client' && combinedUserData?.companyName && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500">Perusahaan</h3>
                    <p className="mt-1 font-medium">{combinedUserData.companyName}</p>
                    
                    {combinedUserData?.industry && (
                      <div className="mt-2">
                        <h3 className="text-sm font-medium text-gray-500">Industri</h3>
                        <p className="mt-1">{combinedUserData.industry}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {combinedUserData?.role === 'freelancer' && (
              <div className="mt-8 border-t border-gray-200 pt-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Layanan Saya</h2>
                  <Link
                    to="/services/new"
                    className="text-sm font-medium text-[#010042] hover:text-[#0100a3]"
                  >
                    Tambah Layanan Baru
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
                    Anda belum membuat layanan apapun.
                  </p>
                  <Link
                    to="/services/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
                  >
                    Buat Layanan Pertama Anda
                  </Link>
                </div>
              </div>
            )}

            {combinedUserData?.role === 'client' && (
              <div className="mt-8 border-t border-gray-200 pt-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Pesanan Saya</h2>
                  <Link
                    to="/my-orders"
                    className="text-sm font-medium text-[#010042] hover:text-[#0100a3]"
                  >
                    Lihat Semua Pesanan
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
                    Anda belum membuat pesanan apapun.
                  </p>
                  <Link
                    to="/browse"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
                  >
                    Jelajahi Layanan
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