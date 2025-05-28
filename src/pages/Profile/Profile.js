import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import FreelancerCTA from '../../components/UI/FreelancerCTA';
import MeshGradientBackground from '../../components/UI/MeshGradientBackground';
import DeleteAccountModal from '../../components/Profile/DeleteAccountModal';
import { uploadProfilePhoto as uploadToCloudinary } from '../../services/cloudinaryService';
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Update combinedUserData when component data changes
  useEffect(() => {
    if (userProfile || profileData || userRegistrationData) {
      const combined = {
        ...userProfile,
        ...profileData,
        ...userRegistrationData
      };
      
      // Ensure critical freelancer-related fields are preserved from userProfile (from users collection)
      // These fields should come from the authoritative users collection
      if (userProfile) {
        if (typeof userProfile.isFreelancer !== 'undefined') {
          combined.isFreelancer = userProfile.isFreelancer;
        }
      }
      
      setCombinedUserData(combined);
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
  
  // Fungsi upload foto menggunakan Cloudinary dengan timeout dan error handling
  const uploadProfilePhotoToCloudinary = async () => {
    if (!photoFile || !currentUser) return null;
    
    // Set timeout untuk mencegah infinite loading
    const timeout = setTimeout(() => {
      if (uploadingPhoto) {
        setUploadingPhoto(false);
        alert('Waktu upload foto habis. Silakan coba lagi.');
        }
    }, 15000); // 15 detik timeout
    
    try {
      setUploadingPhoto(true);
      // Upload ke Cloudinary
      const uploadResult = await uploadToCloudinary(photoFile, currentUser.uid);
      
      return {
        url: uploadResult.profileUrl || uploadResult.url, // Use profileUrl for optimized display
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
        }
    }, 20000); // 20 detik timeout
    
    try {
      setSaving(true);
      // Penanganan foto baru menggunakan Cloudinary
      let photoURL = null;
      let photoPublicId = null;
      if (photoFile) {
        try {
          const uploadResult = await uploadProfilePhotoToCloudinary();
          if (!uploadResult) {
            // Jika upload foto gagal, hentikan proses update profil
            throw new Error('Gagal mengupload foto profil');
          }
          photoURL = uploadResult.url;
          photoPublicId = uploadResult.publicId;
          } catch (photoError) {
          throw new Error('Gagal mengupload foto: ' + (photoError.message || 'Unknown error'));
        }
      }
      
      // Prepare data to update
      const updateData = {
        ...editedData
      };
      
      // Add photo URL and public ID if uploaded
      if (photoURL) {
        updateData.profilePhoto = photoURL;
        updateData.profilePhotoPublicId = photoPublicId;
      }
      
      // Update profile using the centralized service
      const success = await updateUserProfile(currentUser.uid, updateData, true);
      if (success) {
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
        alert('Profil berhasil diperbarui!');
      } else {
        alert('Gagal menyimpan perubahan profil. Silakan coba lagi.');
      }
    } catch (error) {
      alert('Gagal menyimpan perubahan profil: ' + (error.message || 'Unknown error'));
    } finally {
      clearTimeout(saveTimeout);
      setSaving(false);
    }
  };

  // Check if user is a freelancer
  const isFreelancer = combinedUserData?.isFreelancer;

  return (
    <div className="min-h-screen bg-gray-50/50 relative">
      {/* Particle Background */}
      <div className="absolute inset-0 overflow-hidden opacity-80">
        <MeshGradientBackground variant="dashboard" />
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-12 pb-24 relative">
      
      {/* Display FreelancerCTA if user is a client and not a freelancer */}
      {!isFreelancer && (
        <div className="mb-6 relative z-10">
          <FreelancerCTA variant="profile" />
        </div>
      )}
      
      <div className="max-w-4xl mx-auto relative z-10">
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
              <div className="flex-1">
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
                <div className="text-sm font-medium text-gray-900 mb-4">
                  {combinedUserData?.activeRole?.charAt(0).toUpperCase() + combinedUserData?.activeRole?.slice(1)}
                </div>
                
                {/* Edit Profile Button */}
                {!isEditing && (
                  <button
                    onClick={toggleEditMode}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042] transition-colors duration-200"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                )}
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
                    maxLength={500}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#010042] focus:border-[#010042] text-sm"
                    style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  />
                  
                ) : (
                  <p className="text-gray-600 whitespace-pre-wrap break-words">
                    {combinedUserData?.bio || 'Belum ada informasi bio.'}
                  </p>
                )}
                
                {isFreelancer && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Keahlian</h3>
                    {combinedUserData?.skills && combinedUserData.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {combinedUserData.skills.map((skillItem, index) => {
                          // Handle both simple string skills and object skills {skill, experienceLevel}
                          const skillText = typeof skillItem === 'string' ? skillItem : skillItem.skill;
                          const expLevel = typeof skillItem === 'object' && skillItem.experienceLevel ? ` (${skillItem.experienceLevel})` : '';
                          
                          return (
                            <span
                              key={index}
                              className="inline-block px-3 py-1 rounded-full bg-[#010042]/10 text-[#010042] text-sm"
                            >
                              {skillText}{expLevel}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-600">Belum ada keahlian yang ditambahkan.</p>
                    )}
                  </div>
                )}
                
                {!isFreelancer && combinedUserData?.companyName && (
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

            {/* Tombol Simpan Perubahan - dipindahkan ke bagian paling bawah profil */}
            {isEditing && (
              <div className="mt-10 border-t border-gray-200 pt-6 flex justify-center">
                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={saveProfileChanges}
                    disabled={saving || uploadingPhoto}
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042] disabled:opacity-50"
                  >
                    {saving || uploadingPhoto ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                    className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042] disabled:opacity-50"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
      
      {/* Delete Account Modal */}
      <DeleteAccountModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
