import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import FreelancerCTA from '../../components/UI/FreelancerCTA';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config';
import { getUserProfile, updateUserProfile } from '../../services/userProfileService';
import { getIndonesianCities } from '../../services/profileService';

export default function Profile() {
  const { userProfile, currentUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRegistrationData, setUserRegistrationData] = useState(null);
  const [combinedUserData, setCombinedUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // Update combinedUserData when component data changes
  useEffect(() => {
    if (userProfile || profileData || userRegistrationData) {
      setCombinedUserData({
        ...userProfile,
        ...profileData,
        ...userRegistrationData
      });
    }
  }, [userProfile, profileData, userRegistrationData]);
  
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

  useEffect(() => {
    async function fetchProfileData() {
      if (!currentUser) return;
      
      try {
        // Fetch complete profile data using the new service
        const profileData = await getUserProfile(currentUser.uid);
        if (profileData) {
          // Store the complete profile data
          setProfileData(profileData);
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

  // Handle photo upload
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // File validation
    if (!file.type.match('image.*')) {
      alert('Mohon pilih file gambar (jpg, jpeg, png, etc.)');
      return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB');
      return;
    }
    
    setPhotoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Fungsi upload foto dengan timeout dan error handling yang lebih baik
  const uploadProfilePhoto = async () => {
    if (!photoFile || !currentUser) return null;
    
    // Set timeout untuk mencegah infinite loading
    const timeout = setTimeout(() => {
      if (uploadingPhoto) {
        setUploadingPhoto(false);
        alert('Waktu upload foto habis. Silakan coba lagi.');
        console.error('Upload timeout reached');
      }
    }, 15000); // 15 detik timeout
    
    try {
      setUploadingPhoto(true);
      console.log('Mulai upload foto...');
      
      // Reference ke Firebase Storage - gunakan format berbeda
      const uniqueId = new Date().getTime();
      const storageRef = ref(storage, `profile_photos/${currentUser.uid}_${uniqueId}.jpg`);
      
      // Upload file secara langsung
      await uploadBytes(storageRef, photoFile);
      
      // Get download URL dengan try-catch terpisah
      try {
        const photoURL = await getDownloadURL(storageRef);
        console.log('URL foto berhasil didapat');
        return photoURL;
      } catch (urlError) {
        console.error('Error getting download URL:', urlError);
        alert('Foto terupload tapi gagal mendapatkan URL. Coba refresh halaman.');
        return null;
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Gagal mengunggah foto: ' + error.message);
      return null;
    } finally {
      clearTimeout(timeout);
      setUploadingPhoto(false);
    }
  };
  
  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      // Exiting edit mode without saving
      setIsEditing(false);
      setEditedData({});
      setPhotoFile(null);
      setPhotoPreview(null);
    } else {
      // Entering edit mode - pre-populate form with current data
      const combinedData = { ...userProfile, ...profileData, ...userRegistrationData };
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
  
  // Save profile changes dengan proteksi timeout untuk menghindari infinite loading
  const saveProfileChanges = async () => {
    if (!currentUser) return;
    
    // Set timeout untuk mencegah infinite saving
    const saveTimeout = setTimeout(() => {
      if (saving) {
        setSaving(false);
        alert('Proses penyimpanan terlalu lama. Silakan coba lagi.');
        console.error('Save timeout reached');
      }
    }, 20000); // 20 detik timeout
    
    try {
      setSaving(true);
      console.log('Memulai proses menyimpan profil...');
      
      // Penanganan foto baru lebih ketat
      let photoURL = null;
      if (photoFile) {
        console.log('Foto baru terdeteksi, memulai upload...');
        try {
          photoURL = await uploadProfilePhoto();
          if (!photoURL) {
            // Jika upload foto gagal, hentikan proses update profil
            throw new Error('Gagal mengupload foto profil');
          }
          console.log('Upload foto berhasil:', photoURL);
        } catch (photoError) {
          console.error('Error pada upload foto:', photoError);
          throw new Error('Gagal mengupload foto: ' + (photoError.message || 'Unknown error'));
        }
      }
      
      // Prepare data to update
      const updateData = {
        ...editedData
      };
      
      // Add photo URL if uploaded
      if (photoURL) {
        console.log('Menambahkan URL foto ke data profil');
        updateData.profilePhoto = photoURL;
      }
      
      console.log('Data yang akan diupdate:', updateData);
      
      // Update profile using the centralized service
      const success = await updateUserProfile(currentUser.uid, updateData, true);
      console.log('Hasil update profil:', success ? 'Berhasil' : 'Gagal');
      
      if (success) {
        console.log('Mengambil data profil terbaru...');
        // Fetch updated profile data
        const updatedProfile = await getUserProfile(currentUser.uid);
        setProfileData(updatedProfile);
        setCombinedUserData({
          ...userProfile,
          ...updatedProfile
        });
        
        // Exit edit mode dan reset semua state
        setIsEditing(false);
        setPhotoFile(null);
        setPhotoPreview(null);
        setEditedData({});
        console.log('Profil berhasil diperbarui!');
        alert('Profil berhasil diperbarui!');
      } else {
        console.error('Update profil gagal');
        alert('Gagal menyimpan perubahan profil. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error saving profile changes:', error);
      alert('Gagal menyimpan perubahan profil: ' + (error.message || 'Unknown error'));
    } finally {
      clearTimeout(saveTimeout);
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-end">
              <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6 relative">
                {isEditing ? (
                  <div className="relative">
                    <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                      {photoPreview ? (
                        <img 
                          src={photoPreview} 
                          alt="Preview" 
                          className="h-32 w-32 object-cover"
                        />
                      ) : combinedUserData?.profilePhoto ? (
                        <img
                          className="h-32 w-32 object-cover"
                          src={combinedUserData.profilePhoto}
                          alt={combinedUserData.displayName || combinedUserData.email}
                        />
                      ) : (
                        <div className="h-32 w-32 bg-white flex items-center justify-center text-[#010042] text-4xl font-bold">
                          {(combinedUserData?.displayName || combinedUserData?.email)?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <label 
                      htmlFor="profile-photo" 
                      className="absolute bottom-0 right-0 bg-[#010042] text-white p-1 rounded-full cursor-pointer shadow-md hover:bg-[#0100a3] transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                    </label>
                    <input 
                      type="file" 
                      id="profile-photo" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handlePhotoChange}
                    />
                  </div>
                ) : (
                  combinedUserData?.profilePhoto ? (
                    <img
                      className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
                      src={combinedUserData.profilePhoto}
                      alt={combinedUserData.displayName || combinedUserData.email}
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-white shadow-lg flex items-center justify-center text-[#010042] text-4xl font-bold border-4 border-white">
                      {(combinedUserData?.displayName || combinedUserData?.email)?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )
                )}
              </div>
              <div className="flex-1 mt-8">
                {isEditing ? (
                  <div className="mb-4">
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      id="displayName"
                      name="displayName"
                      value={editedData.displayName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#010042] focus:border-[#010042]"
                    />
                  </div>
                ) : (
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">
                    {combinedUserData?.displayName || combinedUserData?.username || combinedUserData?.email?.split('@')[0] || 'Pengguna'}
                  </h1>
                )}
                <p className="text-gray-500 mb-2">{combinedUserData?.email}</p>
                <div className="inline-block px-3 py-1 rounded-full bg-[#010042]/10 text-[#010042] text-sm font-medium mb-4">
                  {combinedUserData?.roles && combinedUserData.roles.includes('freelancer') ? 'Freelancer' :
                   combinedUserData?.isFreelancer ? 'Freelancer' :
                   combinedUserData?.role === 'freelancer' ? 'Freelancer' : 
                   combinedUserData?.role === 'client' || (combinedUserData?.roles && combinedUserData.roles.includes('client')) ? 'Klien' : 
                   combinedUserData?.role === 'admin' ? 'Administrator' : 'Pengguna'}
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={saveProfileChanges}
                        disabled={saving || uploadingPhoto}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042] disabled:opacity-50"
                      >
                        {saving || uploadingPhoto ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {uploadingPhoto ? 'Mengunggah Foto...' : 'Menyimpan...'}
                          </>
                        ) : 'Simpan Perubahan'}
                      </button>
                      <button
                        type="button"
                        onClick={toggleEditMode}
                        disabled={saving || uploadingPhoto}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042] disabled:opacity-50"
                      >
                        Batal
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={toggleEditMode}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Edit Profil
                    </button>
                  )}
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
                    {isEditing ? (
                      <input
                        type="text"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={editedData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="Masukkan nomor telepon"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#010042] focus:border-[#010042] text-sm"
                      />
                    ) : (
                      <p className="mt-1">{combinedUserData?.phoneNumber || '-'}</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Lokasi</h3>
                    {isEditing ? (
                      <select
                        id="location"
                        name="location"
                        value={editedData.location}
                        onChange={handleInputChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#010042] focus:border-[#010042] text-sm"
                      >
                        <option value="">Pilih kota</option>
                        {loadingCities ? (
                          <option value="" disabled>Loading...</option>
                        ) : (
                          cities.map(city => (
                            <option key={city.id} value={city.id}>
                              {city.name}
                            </option>
                          ))
                        )}
                      </select>
                    ) : (
                      <p className="mt-1">
                        {combinedUserData?.location ? 
                          cities.find(city => city.id === combinedUserData.location)?.name ||
                          combinedUserData.location.charAt(0).toUpperCase() + combinedUserData.location.slice(1) : 
                          '-'
                        }
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Jenis Kelamin</h3>
                    {isEditing ? (
                      <select
                        id="gender"
                        name="gender"
                        value={editedData.gender}
                        onChange={handleInputChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#010042] focus:border-[#010042] text-sm"
                      >
                        <option value="">Pilih jenis kelamin</option>
                        <option value="Male">Laki-laki</option>
                        <option value="Female">Perempuan</option>
                        <option value="Other">Lainnya</option>
                        <option value="Prefer not to say">Tidak ingin memberi tahu</option>
                      </select>
                    ) : (
                      <p className="mt-1">
                        {combinedUserData?.gender ? (
                          combinedUserData.gender === 'Male' || combinedUserData.gender === 'male' ? 'Laki-laki' : 
                          combinedUserData.gender === 'Female' || combinedUserData.gender === 'female' ? 'Perempuan' : 
                          combinedUserData.gender
                        ) : '-'}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Tanggal Lahir</h3>
                    {isEditing ? (
                      <input
                        type="date"
                        id="dateOfBirth"
                        name="dateOfBirth"
                        value={editedData.dateOfBirth}
                        onChange={handleInputChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#010042] focus:border-[#010042] text-sm"
                      />
                    ) : (
                      <p className="mt-1">
                        {combinedUserData?.dateOfBirth ? 
                          new Date(combinedUserData.dateOfBirth).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : '-'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Bio</h2>
                {isEditing ? (
                  <textarea
                    id="bio"
                    name="bio"
                    value={editedData.bio || ''}
                    onChange={handleInputChange}
                    placeholder="Tuliskan bio singkat tentang diri Anda"
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#010042] focus:border-[#010042] text-sm"
                  />
                ) : (
                  <p className="text-gray-600">
                    {combinedUserData?.bio || 'Belum ada informasi bio.'}
                  </p>
                )}
                
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
            
            {/* Freelancer CTA Banner - Only shown for clients who aren't freelancers yet */}
            {((combinedUserData?.activeRole === 'client') || 
              (combinedUserData?.roles && combinedUserData.roles.includes('client') && !combinedUserData.roles.includes('freelancer')) ||
              combinedUserData?.role === 'client') && 
             !combinedUserData?.isFreelancer && (
              <div className="mt-8 border-t border-gray-200 pt-8">
                <FreelancerCTA variant="profile" />
              </div>
            )}

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

            {/* Bagian Pesanan Saya hanya ditampilkan untuk klien yang sudah pernah melakukan pemesanan */}
            {false && combinedUserData?.role === 'client' && (
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