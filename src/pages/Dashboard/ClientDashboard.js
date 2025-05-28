import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import FreelancerCTA from '../../components/UI/FreelancerCTA';
import DeleteAccountModal from '../../components/Profile/DeleteAccountModal';
import { uploadProfilePhoto as uploadToCloudinary } from '../../services/cloudinaryService';
import { getUserProfile, updateUserProfile } from '../../services/userProfileService';
import { getIndonesianCities } from '../../services/profileService';
import orderService from '../../services/orderService';

export default function ClientDashboard() {
  const { userProfile, currentUser, loading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [combinedUserData, setCombinedUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Dashboard stats state
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalFavorites: 0,
    totalMessages: 0,
    totalCart: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Update combinedUserData when component data changes
  useEffect(() => {
    console.log('ClientDashboard - updating combinedUserData:', { userProfile, profileData });
    
    if (userProfile || profileData) {
      const combined = {
        ...userProfile,
        ...profileData
      };
      
      if (userProfile) {
        if (typeof userProfile.isFreelancer !== 'undefined') {
          combined.isFreelancer = userProfile.isFreelancer;
        }
      }
      
      setCombinedUserData(combined);
      console.log('ClientDashboard - combinedUserData updated:', combined);
    }
  }, [userProfile, profileData]);
  
  // Fetch cities for location dropdown
  useEffect(() => {
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const citiesData = await getIndonesianCities();
        setCities(citiesData);
      } catch (error) {
        console.error('Error fetching cities:', error);
      } finally {
        setLoadingCities(false);
      }
    };
    
    fetchCities();
  }, []);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser) {
        console.log('ClientDashboard - No currentUser for stats');
        return;
      }
      
      try {
        setStatsLoading(true);
        console.log('ClientDashboard - Fetching stats for user:', currentUser.uid);
        
        // Fetch transactions count
        const orders = await orderService.getOrdersWithDetails(currentUser.uid, 'client');
        
        // Fetch other stats from localStorage (since we don't have dedicated services yet)
        const favorites = JSON.parse(localStorage.getItem(`favorites_${currentUser.uid}`)) || [];
        const cart = JSON.parse(localStorage.getItem(`cart_${currentUser.uid}`)) || [];
        
        const newStats = {
          totalTransactions: orders.length,
          totalFavorites: favorites.length,
          totalMessages: 0, // TODO: Implement message counting
          totalCart: cart.length
        };
        
        console.log('ClientDashboard - Stats fetched:', newStats);
        setStats(newStats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    
    fetchStats();
  }, [currentUser]);

  useEffect(() => {
    async function fetchProfileData() {
      console.log('ClientDashboard - fetchProfileData called:', { 
        currentUser: !!currentUser, 
        authLoading,
        uid: currentUser?.uid 
      });
      
      if (!currentUser) {
        console.log('ClientDashboard - No currentUser, skipping profile fetch');
        if (!authLoading) {
          setLoading(false);
        }
        return;
      }
      
      try {
        console.log('ClientDashboard - Fetching profile for user:', currentUser.uid);
        const profileData = await getUserProfile(currentUser.uid);
        console.log('ClientDashboard - Profile data received:', profileData);
        
        if (profileData) {
          setProfileData(profileData);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        console.log('ClientDashboard - Profile fetch completed, setting loading to false');
        setLoading(false);
      }
    }

    // Only fetch profile data when auth is not loading
    if (!authLoading) {
      fetchProfileData();
    }
  }, [currentUser, authLoading]);
  
  // Handle loading states
  if (authLoading) {
    console.log('ClientDashboard - Auth is loading');
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size="large" text="Memuat autentikasi..." />
      </div>
    );
  }

  if (loading) {
    console.log('ClientDashboard - Profile is loading');
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size="large" text="Memuat profil..." />
      </div>
    );
  }

  console.log('ClientDashboard - Rendering dashboard with data:', {
    currentUser: !!currentUser,
    userProfile: !!userProfile,
    profileData: !!profileData,
    combinedUserData: !!combinedUserData
  });

  // Handle photo upload
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      alert('Mohon pilih file gambar (jpg, jpeg, png, etc.)');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB');
      return;
    }
    
    setPhotoFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };
  
  const uploadProfilePhotoToCloudinary = async () => {
    if (!photoFile || !currentUser) return null;
    
    const timeout = setTimeout(() => {
      if (uploadingPhoto) {
        setUploadingPhoto(false);
        alert('Waktu upload foto habis. Silakan coba lagi.');
      }
    }, 15000);
    
    try {
      setUploadingPhoto(true);
      const uploadResult = await uploadToCloudinary(photoFile, currentUser.uid);
      
      return {
        url: uploadResult.profileUrl || uploadResult.url,
        publicId: uploadResult.publicId
      };
    } catch (error) {
      alert('Gagal mengunggah foto: ' + error.message);
      return null;
    } finally {
      clearTimeout(timeout);
      setUploadingPhoto(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const toggleEditMode = () => {
    if (isEditing) {
      setIsEditing(false);
      setEditedData({});
      setPhotoFile(null);
      setPhotoPreview(null);
    } else {
      const combinedData = { ...userProfile, ...profileData };
      setEditedData({
        displayName: combinedData?.displayName || '',
        phoneNumber: combinedData?.phoneNumber || '',
        location: combinedData?.location || '',
        gender: combinedData?.gender || '',
        dateOfBirth: combinedData?.dateOfBirth || '',
        bio: combinedData?.bio || ''
      });
      setIsEditing(true);
    }
  };
  
  const saveProfileChanges = async () => {
    if (!currentUser) return;
    
    const saveTimeout = setTimeout(() => {
      if (saving) {
        setSaving(false);
        alert('Proses penyimpanan terlalu lama. Silakan coba lagi.');
      }
    }, 20000);
    
    try {
      setSaving(true);
      let photoURL = null;
      let photoPublicId = null;

      if (photoFile) {
        const uploadResult = await uploadProfilePhotoToCloudinary();
        if (uploadResult) {
          photoURL = uploadResult.url;
          photoPublicId = uploadResult.publicId;
        }
      }

      const updateData = {
        ...editedData,
        updatedAt: new Date()
      };

      if (photoURL) {
        updateData.profilePhoto = photoURL;
        updateData.profilePhotoPublicId = photoPublicId;
      }

      await updateUserProfile(currentUser.uid, updateData);
      
      setProfileData(prev => ({
        ...prev,
        ...updateData
      }));
      
      setIsEditing(false);
      setEditedData({});
      setPhotoFile(null);
      setPhotoPreview(null);
      alert('Profil berhasil diperbarui!');
      
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Gagal menyimpan profil: ' + error.message);
    } finally {
      clearTimeout(saveTimeout);
      setSaving(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  const statsData = [
    {
      title: 'Total Transaksi',
      value: statsLoading ? '-' : stats.totalTransactions,
      icon: (
        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-blue-100',
      link: '/dashboard/client/transactions'
    },
    {
      title: 'Favorit',
      value: statsLoading ? '-' : stats.totalFavorites,
      icon: (
        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      bgColor: 'bg-green-100',
      link: '/dashboard/client/favorites'
    },
    {
      title: 'Pesan',
      value: statsLoading ? '-' : stats.totalMessages,
      icon: (
        <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      bgColor: 'bg-purple-100',
      link: '/dashboard/client/messages'
    },
    {
      title: 'Keranjang',
      value: statsLoading ? '-' : stats.totalCart,
      icon: (
        <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z" />
        </svg>
      ),
      bgColor: 'bg-orange-100',
      link: '/dashboard/client/cart'
    }
  ];

  return (
    <motion.div 
      className="p-6 max-w-7xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Welcome Header */}
      <motion.div className="mb-8" variants={itemVariants}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Selamat datang, {combinedUserData?.displayName || currentUser?.displayName || 'Client'}!
        </h1>
        <p className="text-gray-600">Kelola profil dan aktivitas Anda di SkillNusa</p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        variants={containerVariants}
      >
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.title}
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-all duration-200"
            onClick={() => window.location.href = stat.link}
          >
            <div className="flex items-center">
              <motion.div 
                className={`p-3 rounded-full ${stat.bgColor}`}
                whileHover={{ rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {stat.icon}
              </motion.div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <motion.p 
                  className="text-2xl font-bold text-gray-900"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    delay: index * 0.1 + 0.5,
                    type: "spring",
                    stiffness: 500
                  }}
                >
                  {stat.value}
                </motion.p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Profile Section */}
      <motion.div 
        className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-8 mb-8"
        variants={itemVariants}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Profil Saya</h2>
          <motion.button
            onClick={toggleEditMode}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isEditing 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-[#010042] text-white hover:bg-[#010042]/90'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isEditing ? 'Batal' : 'Edit Profil'}
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Photo Section */}
          <motion.div 
            className="lg:col-span-1"
            variants={itemVariants}
          >
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <motion.div 
                  className="h-32 w-32 rounded-full bg-[#010042]/10 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg mx-auto"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {(photoPreview || combinedUserData?.profilePhoto) ? (
                    <img 
                      className="h-32 w-32 rounded-full object-cover" 
                      src={photoPreview || combinedUserData.profilePhoto} 
                      alt={combinedUserData?.displayName || currentUser?.email} 
                    />
                  ) : (
                    <span className="text-3xl font-bold text-[#010042]">
                      {(combinedUserData?.displayName || currentUser?.displayName)?.charAt(0).toUpperCase() || 
                      currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </motion.div>
                
                {isEditing && (
                  <motion.label 
                    className="absolute bottom-0 right-0 bg-[#010042] text-white p-2 rounded-full cursor-pointer hover:bg-[#010042]/90 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handlePhotoChange}
                    />
                  </motion.label>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900">
                {combinedUserData?.displayName || currentUser?.displayName || 'Pengguna'}
              </h3>
              <p className="text-gray-600">{combinedUserData?.email || currentUser?.email}</p>
              <div className="mt-2">
                <motion.span 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Client
                </motion.span>
              </div>
            </div>
          </motion.div>

          {/* Profile Information */}
          <motion.div 
            className="lg:col-span-2"
            variants={itemVariants}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="displayName"
                    value={editedData.displayName || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                    placeholder="Masukkan nama lengkap"
                  />
                ) : (
                  <p className="text-gray-900 py-2">
                    {combinedUserData?.displayName || '-'}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={editedData.phoneNumber || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                    placeholder="Masukkan nomor telepon"
                  />
                ) : (
                  <p className="text-gray-900 py-2">
                    {combinedUserData?.phoneNumber || '-'}
                  </p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lokasi
                </label>
                {isEditing ? (
                  <select
                    name="location"
                    value={editedData.location || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                    disabled={loadingCities}
                  >
                    <option value="">Pilih Kota</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 py-2">
                    {combinedUserData?.location?.charAt(0).toUpperCase() + combinedUserData?.location?.slice(1) || '-'}
                  </p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Kelamin
                </label>
                {isEditing ? (
                  <select
                    name="gender"
                    value={editedData.gender || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                ) : (
                  <p className="text-gray-900 py-2">
                    {combinedUserData?.gender === 'male' ? 'Laki-laki' : 
                     combinedUserData?.gender === 'female' ? 'Perempuan' : '-'}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Lahir
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={editedData.dateOfBirth || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 py-2">
                    {combinedUserData?.dateOfBirth ? 
                      new Date(combinedUserData.dateOfBirth).toLocaleDateString('id-ID') : '-'}
                  </p>
                )}
              </div>

              {/* Bio */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={editedData.bio || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                    placeholder="Ceritakan tentang diri Anda..."
                  />
                ) : (
                  <p className="text-gray-900 py-2">
                    {combinedUserData?.bio || 'Belum ada bio yang ditambahkan.'}
                  </p>
                )}
              </div>
            </div>

            {/* Save Button */}
            {isEditing && (
              <motion.div 
                className="mt-8 flex justify-end space-x-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.button
                  onClick={toggleEditMode}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Batal
                </motion.button>
                <motion.button
                  onClick={saveProfileChanges}
                  disabled={saving || uploadingPhoto}
                  className="px-6 py-2 bg-[#010042] text-white rounded-lg hover:bg-[#010042]/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {(saving || uploadingPhoto) && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {uploadingPhoto ? 'Mengunggah Foto...' : saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <Link
            to="/dashboard/client/transactions"
            className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 group block"
          >
            <div className="flex items-center">
              <motion.div 
                className="p-3 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors"
                whileHover={{ rotate: 5 }}
              >
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </motion.div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Daftar Transaksi</h3>
                <p className="text-gray-600">Lihat riwayat pesanan Anda</p>
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link
            to="/dashboard/client/favorites"
            className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 group block"
          >
            <div className="flex items-center">
              <motion.div 
                className="p-3 rounded-full bg-red-100 group-hover:bg-red-200 transition-colors"
                whileHover={{ rotate: 5 }}
              >
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </motion.div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Favorit</h3>
                <p className="text-gray-600">Layanan yang Anda sukai</p>
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link
            to="/browse"
            className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 group block"
          >
            <div className="flex items-center">
              <motion.div 
                className="p-3 rounded-full bg-green-100 group-hover:bg-green-200 transition-colors"
                whileHover={{ rotate: 5 }}
              >
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </motion.div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Telusuri Layanan</h3>
                <p className="text-gray-600">Cari freelancer dan layanan</p>
              </div>
            </div>
          </Link>
        </motion.div>
      </motion.div>

      {/* Freelancer CTA */}
      {!combinedUserData?.isFreelancer && (
        <motion.div className="mb-8" variants={itemVariants}>
          <FreelancerCTA />
        </motion.div>
      )}

      {/* Delete Account Section */}
      <motion.div 
        className="bg-red-50 border border-red-200 rounded-xl p-6"
        variants={itemVariants}
      >
        <p className="text-red-700 mb-4">
          Menghapus akun akan menghapus semua data Anda secara permanen. Tindakan ini tidak dapat dibatalkan.
        </p>
        <motion.button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Hapus Akun
        </motion.button>
      </motion.div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <DeleteAccountModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </motion.div>
  );
} 