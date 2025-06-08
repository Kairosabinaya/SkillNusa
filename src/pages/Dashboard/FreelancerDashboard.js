import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSubscriptions } from '../../context/SubscriptionContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ShoppingBagIcon, 
  StarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PlusIcon,
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  BriefcaseIcon,
  EyeIcon,
  DocumentTextIcon,
  BellIcon,
  CalendarIcon,
  UserIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import freelancerRatingService from '../../services/freelancerRatingService';
import { updateFreelancerProfile } from '../../services/freelancerService';
import { uploadProfilePhoto as uploadToCloudinary } from '../../services/cloudinaryService';
import { getUserProfile, updateUserProfile } from '../../services/userProfileService';
import { getIndonesianCities } from '../../services/profileService';
import ErrorPopup from '../../components/common/ErrorPopup';
import SuccessPopup from '../../components/common/SuccessPopup';

export default function FreelancerDashboard() {
  const { currentUser, userProfile } = useAuth();
  const { counts } = useSubscriptions();
  
  // Count renders to detect excessive re-renders
  const renderCount = useRef(0);
  renderCount.current += 1;
  
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeOrders: 0,
    completedOrders: 0,
    averageRating: 0,
    totalReviews: 0,
    responseRate: 0,
    responseTime: '-'
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [freelancerProfile, setFreelancerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gigs, setGigs] = useState([]);
  const [showAllEducation, setShowAllEducation] = useState(false);
  const [showAllCertifications, setShowAllCertifications] = useState(false);

  // Profile editing states
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  // Handle photo upload
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      setError('Mohon pilih file gambar (jpg, jpeg, png, etc.)');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran file maksimal 2MB');
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
        setError('Waktu upload foto habis. Silakan coba lagi.');
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
      setError('Gagal mengunggah foto: ' + error.message);
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

  const handleSkillChange = (skillsArray) => {
    setEditedData(prev => ({
      ...prev,
      skills: skillsArray
    }));
  };

  const handleEducationChange = (educationArray) => {
    setEditedData(prev => ({
      ...prev,
      education: educationArray
    }));
  };

  const handleCertificationChange = (certificationArray) => {
    setEditedData(prev => ({
      ...prev,
      certifications: certificationArray
    }));
  };

  const handleWorkingHoursChange = (workingHours) => {
    setEditedData(prev => ({
      ...prev,
      workingHours: workingHours
    }));
  };

  const toggleEditMode = () => {
    if (isEditing) {
      setIsEditing(false);
      setEditedData({});
      setPhotoFile(null);
      setPhotoPreview(null);
    } else {
      const combinedData = { ...userProfile, ...freelancerProfile };
      setEditedData({
        displayName: combinedData?.displayName || '',
        phoneNumber: combinedData?.phoneNumber || '',
        location: combinedData?.location || '',
        gender: combinedData?.gender || '',
        dateOfBirth: combinedData?.dateOfBirth || '',
        bio: combinedData?.bio || '',
        skills: combinedData?.skills || [],
        availability: combinedData?.availability || '',
        workingHours: combinedData?.workingHours || '',
        education: combinedData?.education || [],
        certifications: combinedData?.certifications || []
      });
      setIsEditing(true);
    }
  };

  const saveProfileChanges = async () => {
    if (!currentUser) return;
    
    const saveTimeout = setTimeout(() => {
      if (saving) {
        setSaving(false);
        setError('Proses penyimpanan terlalu lama. Silakan coba lagi.');
      }
    }, 20000);
    
    try {
      setSaving(true);
      let photoURL = null;
      let photoPublicId = null;
      let photoWasUpdated = false;

      if (photoFile) {
        const uploadResult = await uploadProfilePhotoToCloudinary();
        if (uploadResult) {
          photoURL = uploadResult.url;
          photoPublicId = uploadResult.publicId;
          photoWasUpdated = true;
        }
      }

      // Separate user profile data from freelancer profile data
      const userProfileData = {
        displayName: editedData.displayName,
        phoneNumber: editedData.phoneNumber,
        location: editedData.location,
        gender: editedData.gender,
        dateOfBirth: editedData.dateOfBirth,
        updatedAt: new Date()
      };

      const freelancerProfileData = {
        bio: editedData.bio,
        skills: editedData.skills,
        availability: editedData.availability,
        workingHours: editedData.workingHours,
        education: editedData.education || [],
        certifications: editedData.certifications || [],
        updatedAt: new Date()
      };

      if (photoURL) {
        userProfileData.profilePhoto = photoURL;
        userProfileData.profilePhotoPublicId = photoPublicId;
      }

      // Update user profile
      const userSuccess = await updateUserProfile(currentUser.uid, userProfileData, true);
      
      // Update freelancer profile
      const freelancerSuccess = await updateFreelancerProfile(currentUser.uid, freelancerProfileData);
      
      if (userSuccess && freelancerSuccess) {
        // Refresh data
        const updatedProfile = await getUserProfile(currentUser.uid);
        const freelancerDoc = await getDoc(doc(db, 'freelancerProfiles', currentUser.uid));
        if (freelancerDoc.exists()) {
          setFreelancerProfile(freelancerDoc.data());
        }
        
        // Exit edit mode and reset all state
        setIsEditing(false);
        setEditedData({});
        setPhotoFile(null);
        setPhotoPreview(null);
        
        setSuccess('Profil berhasil diperbarui!');
        
        // Reload page if photo was updated
        if (photoWasUpdated) {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else {
        setError('Gagal menyimpan perubahan profil. Silakan coba lagi.');
      }
    } catch (error) {
      setError('Gagal menyimpan perubahan profil: ' + (error.message || 'Unknown error'));
    } finally {
      clearTimeout(saveTimeout);
      setSaving(false);
    }
  };

  // Check and fix user freelancer role if needed
  const checkAndFixFreelancerRole = async () => {
    if (!currentUser || !userProfile) return;
    
    const hasFreelancerRole = userProfile.roles?.includes('freelancer') || userProfile.isFreelancer;
    
    if (!hasFreelancerRole) {
      try {
        // Update user document to include freelancer role
        await updateDoc(doc(db, 'users', currentUser.uid), {
          isFreelancer: true,
          roles: userProfile.roles ? [...userProfile.roles, 'freelancer'] : ['client', 'freelancer'],
          updatedAt: serverTimestamp()
        });
        
        // Create freelancer profile if it doesn't exist
        const freelancerDoc = await getDoc(doc(db, 'freelancerProfiles', currentUser.uid));
        if (!freelancerDoc.exists()) {
          await setDoc(doc(db, 'freelancerProfiles', currentUser.uid), {
            userId: currentUser.uid,
            skills: [],
            experienceLevel: '',
            bio: '',
            portfolioLinks: [],
            hourlyRate: 0,
            availability: 'full-time',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        
        // Reload the page to get updated user data
        window.location.reload();
      } catch (error) {
        // Silent error handling
      }
    }
  };

  // Check and fix freelancer role on mount - ONCE only
  useEffect(() => {
    if (currentUser && userProfile) {
      checkAndFixFreelancerRole();
    }
  }, [currentUser?.uid]); // Only depend on user ID to prevent re-runs

  // Fetch freelancer profile
  useEffect(() => {
    async function fetchFreelancerProfile() {
      if (!currentUser) return;
      
      try {
        const profileDoc = await getDoc(doc(db, 'freelancerProfiles', currentUser.uid));
        if (profileDoc.exists()) {
          const profileData = profileDoc.data();
          setFreelancerProfile(profileData);
        }
      } catch (error) {
        // Silent error handling
      }
    }
    
    fetchFreelancerProfile();
  }, [currentUser]);

  // Fetch stats and data
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch orders using the correct field names
        const ordersQueryPrimary = query(
          collection(db, 'orders'),
          where('freelancerId', '==', currentUser.uid)
        );
        
        const ordersQueryFallback = query(
          collection(db, 'orders'),
          where('sellerId', '==', currentUser.uid)
        );
        
        const [ordersSnapshotPrimary, ordersSnapshotFallback] = await Promise.all([
          getDocs(ordersQueryPrimary),
          getDocs(ordersQueryFallback)
        ]);
        
        let totalEarnings = 0;
        let activeOrders = 0;
        let completedOrders = 0;
        
        // Process orders from both queries to avoid duplicates
        const processedOrderIds = new Set();
        [ordersSnapshotPrimary, ordersSnapshotFallback].forEach(snapshot => {
          snapshot.forEach(doc => {
            if (!processedOrderIds.has(doc.id)) {
              processedOrderIds.add(doc.id);
              const order = doc.data();
              
              if (order.status === 'completed') {
                // Use freelancerEarning field instead of amount
                const earnings = order.freelancerEarning || order.amount || 0;
                totalEarnings += earnings;
                completedOrders++;
              } else if (['pending', 'active', 'in_progress', 'in_revision'].includes(order.status)) {
                activeOrders++;
              }
            }
          });
        });

        // Fetch reviews using the new freelancer rating service
        const ratingStats = await freelancerRatingService.calculateFreelancerRatingStats(currentUser.uid);
        const averageRating = ratingStats.averageRating;
        const totalReviews = ratingStats.totalReviews;

        // Fetch gigs
        const gigsQueryPrimary = query(
          collection(db, 'gigs'),
          where('freelancerId', '==', currentUser.uid)
        );
        
        const gigsQueryFallback = query(
          collection(db, 'gigs'),
          where('userId', '==', currentUser.uid)
        );
        
        const [gigsSnapshotPrimary, gigsSnapshotFallback] = await Promise.all([
          getDocs(gigsQueryPrimary),
          getDocs(gigsQueryFallback)
        ]);
        
        const gigsData = [];
        const processedIds = new Set();
        
        // Process both snapshots to avoid duplicates
        [gigsSnapshotPrimary, gigsSnapshotFallback].forEach(snapshot => {
          snapshot.forEach(doc => {
            if (!processedIds.has(doc.id)) {
              processedIds.add(doc.id);
              gigsData.push({ id: doc.id, ...doc.data() });
            }
          });
        });
        
        setGigs(gigsData);

        // Calculate response rate and time from messages/chats data
        let responseRate = 95; // Default good response rate
        let responseTime = '< 1 jam';
        
        try {
          // Fetch chat messages without complex sorting to avoid index requirements
          const messagesQuery = query(
            collection(db, 'messages'),
            where('senderId', '==', currentUser.uid),
            limit(50)
          );
          
          const messagesSnapshot = await getDocs(messagesQuery);
          if (!messagesSnapshot.empty) {
            // Calculate basic response rate based on message count
            const totalMessages = messagesSnapshot.size;
            if (totalMessages > 0) {
              // Simple calculation: assume good response rate if user has sent messages
              responseRate = Math.min(95, Math.round((totalMessages / 50) * 100));
              
              // Calculate average response time from message timestamps
              const messages = messagesSnapshot.docs
                .map(doc => doc.data())
                .filter(msg => msg.timestamp) // Filter out messages without timestamp
                .sort((a, b) => {
                  // Sort by timestamp descending
                  const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp);
                  const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp);
                  return bTime - aTime;
                });
                
              if (messages.length >= 2) {
                const timeDiffs = [];
                for (let i = 0; i < messages.length - 1; i++) {
                  const current = messages[i].timestamp?.toDate?.() || new Date(messages[i].timestamp);
                  const previous = messages[i + 1].timestamp?.toDate?.() || new Date(messages[i + 1].timestamp);
                  if (current && previous) {
                    const diff = (current - previous) / (1000 * 60); // minutes
                    if (diff > 0 && diff < 1440) { // less than 24 hours
                      timeDiffs.push(diff);
                    }
                  }
                }
                
                if (timeDiffs.length > 0) {
                  const avgMinutes = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
                  if (avgMinutes < 60) {
                    responseTime = `${Math.round(avgMinutes)} menit`;
                  } else {
                    responseTime = `${Math.round(avgMinutes / 60)} jam`;
                  }
                }
              }
            }
          }
        } catch (error) {
          // Keep default values
        }

        // Update stats
        setStats({
          totalEarnings,
          activeOrders,
          completedOrders,
          averageRating,
          totalReviews,
          responseRate,
          responseTime
        });

        // Fetch recent activities
        fetchRecentActivities();
        
      } catch (error) {
        // Silent error handling
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Fetch recent activities with real-time updates
  const fetchRecentActivities = () => {
    if (!currentUser) return;

    const activitiesQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      limit(10)
    );

    const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
      const activities = [];
      snapshot.forEach(doc => {
        activities.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        });
      });
      
      // Sort by createdAt in JavaScript instead of Firestore
      activities.sort((a, b) => {
        const aTime = a.createdAt || new Date(0);
        const bTime = b.createdAt || new Date(0);
        return bTime - aTime; // desc order (newest first)
      });
      
      // Limit to 10 after sorting
      const limitedActivities = activities.slice(0, 10);
      
      setRecentActivities(limitedActivities);
    });

    return () => unsubscribe();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'new_order':
        return <ShoppingBagIcon className="h-5 w-5 text-green-500" />;
      case 'review':
        return <StarIcon className="h-5 w-5 text-yellow-500" />;
      case 'message':
        return <UserGroupIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} hari yang lalu`;
    if (hours > 0) return `${hours} jam yang lalu`;
    if (minutes > 0) return `${minutes} menit yang lalu`;
    return 'Baru saja';
  };

  // Format functions for profile display
  const formatAvailability = (availability) => {
    switch (availability) {
      case 'Full-time':
        return 'Full-time';
      case 'Part-time':
        return 'Part-time';
      case 'Project-Based':
        return 'Berbasis Proyek';
      // Legacy support
      case 'full-time':
        return 'Full-time';
      case 'part-time':
        return 'Part-time';
      case 'project-based':
        return 'Berbasis Proyek';
      default:
        return availability || 'Belum diisi';
    }
  };

  const formatGender = (gender) => {
    switch (gender) {
      case 'Male':
        return 'Laki-laki';
      case 'Female':
        return 'Perempuan';
      case 'Other':
        return 'Lainnya';
      case 'Prefer not to say':
        return 'Tidak ingin memberi tahu';
      // Legacy support
      case 'male':
        return 'Laki-laki';
      case 'female':
        return 'Perempuan';
      default:
        return gender || 'Belum diisi';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#010042]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Freelancer
          </h1>
        </div>
        <p className="text-gray-600">
          Selamat datang, <span className="font-semibold text-green-600">{userProfile?.displayName || 'Freelancer'}</span>! 
          Berikut ringkasan performa dan pesanan Anda hari ini
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Pendapatan</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalEarnings)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Sudah dipotong platform fee 10%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <Link 
            to="/dashboard/freelancer/analytics" 
            className="mt-4 flex items-center text-sm text-[#010042] hover:text-blue-700"
          >
            Lihat analytics
            <ArrowRightIcon className="h-4 w-4 ml-1" />
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pesanan Aktif</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeOrders}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <Link 
            to="/dashboard/freelancer/orders" 
            className="mt-4 flex items-center text-sm text-[#010042] hover:text-blue-700"
          >
            Lihat semua pesanan
            <ArrowRightIcon className="h-4 w-4 ml-1" />
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Rating & Ulasan</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-gray-900 mr-2">
                  {stats.averageRating.toFixed(1)}
                </p>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <StarSolid 
                      key={i} 
                      className={`h-5 w-5 ${
                        i < Math.floor(stats.averageRating) 
                          ? 'text-yellow-400' 
                          : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <StarIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            {stats.totalReviews} ulasan total
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Notifikasi</p>
              <p className="text-2xl font-bold text-gray-900">{counts.notifications || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <BellIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <Link 
            to="/notifications" 
            className="mt-4 flex items-center text-sm text-[#010042] hover:text-blue-700"
          >
            Lihat semua notifikasi
            <ArrowRightIcon className="h-4 w-4 ml-1" />
          </Link>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-8 mb-8">
        {/* Freelancer Profile Section - Full Width */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-lg overflow-hidden"
        >
          <div className="px-6 py-4 bg-gradient-to-r from-[#010042] to-[#0100a3] text-white flex justify-between items-center">
            <h2 className="text-xl font-bold">Profil Freelancer</h2>
            <div className="flex items-center space-x-2">
              {!(userProfile?.roles?.includes('freelancer') || userProfile?.isFreelancer) ? (
                <>
                  <span className="text-sm text-red-200">Akses Freelancer Diperlukan</span>
                  <Link 
                    to="/become-freelancer" 
                    className="inline-flex items-center px-4 py-2 border border-white text-sm font-medium rounded-md shadow-sm text-white bg-transparent hover:bg-white hover:text-[#010042] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
                  >
                    Daftar Freelancer
                  </Link>
                </>
              ) : (
                <button
                  onClick={toggleEditMode}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-white text-sm font-medium rounded-md shadow-sm text-white bg-transparent hover:bg-white hover:text-[#010042] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200 disabled:opacity-50"
                >
                  {isEditing ? (
                    <>
                      <XMarkIcon className="h-4 w-4 mr-2" />
                      Batal
                    </>
                  ) : (
                    <>
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit Profil
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          
          <div className="p-8">
            {/* Header Profile Section */}
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 mb-8 pb-8 border-b border-gray-200">
              <div className="flex flex-col items-center">
                {/* Profile Photo */}
                <div className="relative">
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="Profile Preview" 
                      className="w-40 h-40 rounded-full object-cover border-4 border-[#010042] shadow-lg" 
                    />
                  ) : userProfile?.profilePhoto ? (
                    <img 
                      src={userProfile.profilePhoto} 
                      alt="Profile" 
                      className="w-40 h-40 rounded-full object-cover border-4 border-[#010042] shadow-lg" 
                    />
                  ) : (
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-4 border-[#010042] shadow-lg">
                      <UserIcon className="h-20 w-20 text-gray-400" />
                    </div>
                  )}
                  
                  {isEditing && (
                    <div className="absolute bottom-0 right-0">
                      <label 
                        htmlFor="photo-upload" 
                        className="cursor-pointer bg-[#010042] text-white p-2 rounded-full shadow-lg hover:bg-[#0100a3] transition-colors"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </label>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
                
                <div className="mt-4 text-center">
                  {isEditing ? (
                    <input
                      type="text"
                      name="displayName"
                      value={editedData.displayName || ''}
                      onChange={handleInputChange}
                      className="text-2xl font-bold text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                      placeholder="Nama Freelancer"
                    />
                  ) : (
                    <h3 className="text-2xl font-bold text-gray-900">
                      {userProfile?.displayName || 'Nama Freelancer'}
                    </h3>
                  )}
                  <p className="text-gray-600 mt-1">
                    {userProfile?.email || 'email@example.com'}
                  </p>
                </div>
              </div>

              <div className="flex-1 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bio Card */}
                  <div className="col-span-full">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <DocumentTextIcon className="h-5 w-5 mr-2 text-[#010042]" />
                        Bio
                      </h4>
                      {isEditing ? (
                        <textarea
                          name="bio"
                          value={editedData.bio || ''}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                          placeholder="Ceritakan tentang keahlian dan pengalaman Anda sebagai freelancer..."
                        />
                      ) : (
                        <p className="text-gray-700 leading-relaxed">
                          {freelancerProfile?.bio || 'Belum ada bio profesional yang ditambahkan. Lengkapi profil freelancer Anda untuk menarik lebih banyak klien.'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Skills Card - Full Width */}
                  <div className="col-span-full bg-blue-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <BriefcaseIcon className="h-5 w-5 mr-2 text-[#010042]" />
                      Keahlian & Level Pengalaman
                    </h4>
                    <div className="space-y-4">
                      {isEditing ? (
                        <SkillsEditor 
                          skills={editedData.skills || []}
                          onChange={handleSkillChange}
                        />
                      ) : (
                        freelancerProfile?.skills && Array.isArray(freelancerProfile.skills) && freelancerProfile.skills.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {freelancerProfile.skills.map((skillItem, index) => {
                              // Extract skill name and experience level
                              let skillName = '';
                              let experienceLevel = '';
                              
                              try {
                                if (typeof skillItem === 'string') {
                                  skillName = skillItem;
                                  experienceLevel = 'Pemula';
                                } else if (typeof skillItem === 'object' && skillItem !== null) {
                                  skillName = skillItem.skill || skillItem.name || skillItem.skillName || '';
                                  experienceLevel = skillItem.experienceLevel || skillItem.level || 'Pemula';
                                }
                                
                                // Ensure skillName is a string
                                skillName = String(skillName).trim();
                                experienceLevel = String(experienceLevel).trim();
                              } catch (error) {
                                skillName = 'Invalid Skill';
                                experienceLevel = 'Pemula';
                              }
                              
                              // Only render if we have a valid skill name
                              return skillName ? (
                                <span 
                                  key={`skill-${index}-${skillName}`}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#010042] text-white"
                                >
                                  {skillName} ({experienceLevel})
                                </span>
                              ) : null;
                            }).filter(Boolean)}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">Belum ada keahlian yang ditambahkan</p>
                        )
                      )}
                    </div>
                  </div>

                  
                </div>
              </div>
            </div>

            {/* Detailed Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Education Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-[#010042]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                  Pendidikan
                </h4>
                <div className="space-y-4">
                  {isEditing ? (
                    <EducationEditor 
                      education={editedData.education || []}
                      onChange={handleEducationChange}
                    />
                  ) : (
                    freelancerProfile?.education && Array.isArray(freelancerProfile.education) && freelancerProfile.education.length > 0 ? (
                      <>
                        {(showAllEducation ? freelancerProfile.education : freelancerProfile.education.slice(0, 3)).map((edu, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-900">
                              {edu.degree || 'Tidak disebutkan'}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}
                            </h3>
                            <p className="text-gray-600">
                              {edu.university || 'Tidak disebutkan'}{edu.country ? ` (${edu.country})` : ''}
                            </p>
                            <p className="text-gray-500 text-sm">
                              ({edu.graduationYear || 'Tidak disebutkan'})
                            </p>
                          </div>
                        ))}
                        {freelancerProfile.education.length > 3 && (
                          <button
                            onClick={() => setShowAllEducation(!showAllEducation)}
                            className="w-full mt-3 px-4 py-2 text-sm font-medium text-[#010042] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center"
                          >
                            {showAllEducation ? (
                              <>
                                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                                Tampilkan lebih sedikit
                              </>
                            ) : (
                              <>
                                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                Lihat selengkapnya ({freelancerProfile.education.length - 3} lainnya)
                              </>
                            )}
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-gray-500 italic">Belum ada informasi pendidikan yang ditambahkan</p>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Certifications Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-[#010042]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Sertifikasi & Penghargaan
                </h4>
                <div className="space-y-4">
                  {isEditing ? (
                    <CertificationEditor 
                      certifications={editedData.certifications || []}
                      onChange={handleCertificationChange}
                    />
                  ) : (
                    freelancerProfile?.certifications && Array.isArray(freelancerProfile.certifications) && freelancerProfile.certifications.length > 0 ? (
                      <>
                        {(showAllCertifications ? freelancerProfile.certifications : freelancerProfile.certifications.slice(0, 3)).map((cert, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-900">
                              {cert.name || 'Tidak disebutkan'}
                            </h3>
                            <p className="text-gray-600">
                              {cert.issuedBy ? `dari ${cert.issuedBy}` : 'Penerbit tidak disebutkan'}
                            </p>
                            <p className="text-gray-500 text-sm">
                              ({cert.year || 'Tahun tidak disebutkan'})
                            </p>
                          </div>
                        ))}
                        {freelancerProfile.certifications.length > 3 && (
                          <button
                            onClick={() => setShowAllCertifications(!showAllCertifications)}
                            className="w-full mt-3 px-4 py-2 text-sm font-medium text-[#010042] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center"
                          >
                            {showAllCertifications ? (
                              <>
                                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                                Tampilkan lebih sedikit
                              </>
                            ) : (
                              <>
                                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                Lihat selengkapnya ({freelancerProfile.certifications.length - 3} lainnya)
                              </>
                            )}
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-gray-500 italic">Belum ada sertifikasi atau penghargaan yang ditambahkan</p>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Contact Information Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-[#010042]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Kontak
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Telepon:</span>
                    {isEditing ? (
                      <div className="flex mt-1">
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center px-3 py-2 text-sm text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md font-medium">
                            +62
                          </span>
                        </div>
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={editedData.phoneNumber ? editedData.phoneNumber.replace(/^\+62/, '') : ''}
                          onChange={(e) => {
                            // Get the raw input value
                            let inputValue = e.target.value;
                            
                            // Remove any +62 prefix if the user manually entered it
                            inputValue = inputValue.replace(/^\+62/, '');
                            
                            // Only allow numbers
                            inputValue = inputValue.replace(/[^0-9]/g, '');
                            
                            // Remove leading zeros if any
                            inputValue = inputValue.replace(/^0+/, '');
                            
                            // Set the value with +62 prefix internally
                            setEditedData(prev => ({
                              ...prev,
                              phoneNumber: inputValue ? '+62' + inputValue : ''
                            }));
                          }}
                          className="w-full rounded-none rounded-r-md px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                          placeholder="8xxxxxxxxxx"
                        />
                      </div>
                    ) : (
                      <p className="text-gray-700">{userProfile?.phoneNumber || 'Belum diisi'}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Lokasi:</span>
                    {isEditing ? (
                      <select
                        name="location"
                        value={editedData.location || ''}
                        onChange={handleInputChange}
                        className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                        disabled={loadingCities}
                      >
                        <option value="">Pilih kota</option>
                        {cities.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-700">
                        {userProfile?.location ? 
                          cities.find(city => city.id === userProfile.location)?.name ||
                          userProfile.location.charAt(0).toUpperCase() + userProfile.location.slice(1) : 
                          'Belum diisi'
                        }
                      </p>
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Jam Kerja:</span>
                    {isEditing ? (
                      <div className="mt-1">
                        <WorkingHoursEditor 
                          workingHours={editedData.workingHours || ''}
                          onChange={handleWorkingHoursChange}
                        />
                      </div>
                    ) : (
                      <p className="text-gray-700">{freelancerProfile?.workingHours || 'Belum diisi'}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Jenis Kelamin:</span>
                    {isEditing ? (
                      <select
                        name="gender"
                        value={editedData.gender || ''}
                        onChange={handleInputChange}
                        className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                      >
                        <option value="">Pilih Jenis Kelamin</option>
                        <option value="Male">Laki-laki</option>
                        <option value="Female">Perempuan</option>
                        <option value="Other">Lainnya</option>
                        <option value="Prefer not to say">Tidak ingin memberi tahu</option>
                      </select>
                    ) : (
                      <p className="text-gray-700">{formatGender(userProfile?.gender)}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Tanggal Lahir:</span>
                    {isEditing ? (
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={editedData.dateOfBirth || ''}
                        onChange={handleInputChange}
                        className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-700">{userProfile?.dateOfBirth || 'Belum diisi'}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Ketersediaan:</span>
                    {isEditing ? (
                      <select
                        name="availability"
                        value={editedData.availability || ''}
                        onChange={handleInputChange}
                        className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                      >
                        <option value="">Pilih ketersediaan</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Project-Based">Berbasis Proyek</option>
                      </select>
                    ) : (
                      <p className="text-gray-700">{freelancerProfile?.availability ? formatAvailability(freelancerProfile.availability) : 'Belum diisi'}</p>
                    )}
                  </div>


                </div>
              </div>
            </div>
            
            {/* Save Button when editing */}
            {isEditing && (
              <div className="mt-8 flex justify-end space-x-4 p-6 bg-gray-50 border-t border-gray-200">
                <button
                  type="button"
                  onClick={toggleEditMode}
                  disabled={saving}
                  className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042] disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={saveProfileChanges}
                  disabled={saving || uploadingPhoto}
                  className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042] disabled:opacity-50 flex items-center"
                >
                  {saving || uploadingPhoto ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {uploadingPhoto ? 'Mengupload foto...' : 'Menyimpan...'}
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Activities - Full Width */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-lg shadow mb-8"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Aktivitas Terbaru</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">Belum ada aktivitas terbaru</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Link 
          to="/dashboard/freelancer/gigs/create"
          className="flex items-center justify-center px-6 py-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <PlusIcon className="h-5 w-5 text-[#010042] mr-2" />
          <span className="font-medium text-gray-900">Buat Gig Baru</span>
        </Link>

        <Link 
          to="/dashboard/freelancer/guides"
          className="flex items-center justify-center px-6 py-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <ChartBarIcon className="h-5 w-5 text-[#010042] mr-2" />
          <span className="font-medium text-gray-900">Panduan Freelancer</span>
        </Link>

        <Link 
          to="/dashboard/freelancer/wallet"
          className="flex items-center justify-center px-6 py-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <CurrencyDollarIcon className="h-5 w-5 text-[#010042] mr-2" />
          <span className="font-medium text-gray-900">Kelola Wallet</span>
        </Link>
      </motion.div>

      {/* Error and Success Popups */}
      {error && (
        <ErrorPopup 
          message={error} 
          onClose={() => setError('')} 
        />
      )}
      
      {success && (
        <SuccessPopup 
          message={success} 
          onClose={() => setSuccess('')} 
        />
      )}
    </div>
  );
}

// Skills Editor Component
function SkillsEditor({ skills, onChange }) {
  const [newSkill, setNewSkill] = useState('');
  const [skillLevel, setSkillLevel] = useState('Pemula');

  const addSkill = () => {
    if (!newSkill.trim()) return;
    
    const skillObject = {
      skill: newSkill.trim().toLowerCase(), // Force lowercase
      experienceLevel: skillLevel
    };
    
    const updatedSkills = [...skills, skillObject];
    onChange(updatedSkills);
    setNewSkill('');
    setSkillLevel('Pemula');
  };

  const removeSkill = (index) => {
    const updatedSkills = skills.filter((_, i) => i !== index);
    onChange(updatedSkills);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Skills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {skills.map((skillObj, index) => {
          // Handle both string and object formats
          const skillName = typeof skillObj === 'string' ? skillObj : skillObj.skill;
          const skillLevel = typeof skillObj === 'object' ? skillObj.experienceLevel : 'Pemula';
          
          return (
            <div
              key={index}
              className="inline-flex items-center justify-between px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              <span className="mr-2">
                {skillName} 
                {skillLevel && skillLevel !== 'Pemula' && (
                  <span className="text-blue-600 text-xs ml-1">({skillLevel})</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => removeSkill(index)}
                className="text-blue-600 hover:text-blue-800 focus:outline-none"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* Add New Skill */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={newSkill}
          onChange={(e) => {
            // Convert to lowercase and prevent caps
            const value = e.target.value.toLowerCase();
            setNewSkill(value);
          }}
          onKeyPress={handleKeyPress}
          placeholder="Tambah keahlian baru..."
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
        />
        <select
          value={skillLevel}
          onChange={(e) => setSkillLevel(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
        >
          <option value="Pemula">Pemula</option>
          <option value="Menengah">Menengah</option>
          <option value="Ahli">Ahli</option>
        </select>
        <button
          type="button"
          onClick={addSkill}
          className="px-4 py-2 bg-[#010042] text-white rounded-md hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
        >
          Tambah
        </button>
      </div>
    </div>
  );
}

// Education Editor Component  
function EducationEditor({ education, onChange }) {
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editForm, setEditForm] = useState({
    country: '',
    university: '',
    degree: '',
    fieldOfStudy: '',
    graduationYear: ''
  });

  const countries = [
    'Indonesia',
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'Germany',
    'Netherlands',
    'Singapore',
    'Malaysia',
    'Thailand',
    'South Korea',
    'Japan'
  ];

  const degrees = [
    'Diploma (D1/D2/D3)',
    'Sarjana (S1)',
    'Magister (S2)', 
    'Doktor (S3)',
    'Certificate',
    'Associate Degree',
    'Bachelor Degree',
    'Master Degree',
    'PhD'
  ];

  const addEducation = () => {
    if (!editForm.university.trim() || !editForm.degree) return;
    
    const updatedEducation = [...education, { ...editForm }];
    onChange(updatedEducation);
    setEditForm({
      country: '',
      university: '',
      degree: '',
      fieldOfStudy: '',
      graduationYear: ''
    });
  };

  const updateEducation = () => {
    if (!editForm.university.trim() || !editForm.degree) return;
    
    const updatedEducation = [...education];
    updatedEducation[editingIndex] = { ...editForm };
    onChange(updatedEducation);
    setEditingIndex(-1);
    setEditForm({
      country: '',
      university: '',
      degree: '',
      fieldOfStudy: '',
      graduationYear: ''
    });
  };

  const removeEducation = (index) => {
    const updatedEducation = education.filter((_, i) => i !== index);
    onChange(updatedEducation);
    if (editingIndex === index) {
      setEditingIndex(-1);
      setEditForm({
        country: '',
        university: '',
        degree: '',
        fieldOfStudy: '',
        graduationYear: ''
      });
    }
  };

  const startEditing = (index) => {
    setEditingIndex(index);
    setEditForm({ ...education[index] });
  };

  const cancelEditing = () => {
    setEditingIndex(-1);
    setEditForm({
      country: '',
      university: '',
      degree: '',
      fieldOfStudy: '',
      graduationYear: ''
    });
  };

  const handleFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-4">
      {/* Education List */}
      {education.map((edu, index) => (
        <div key={index} className="p-4 bg-gray-50 rounded-lg">
          {editingIndex === index ? (
            // Edit form for this row
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Negara</label>
                  <select
                    value={editForm.country}
                    onChange={(e) => handleFormChange('country', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                  >
                    <option value="">Pilih Negara</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Universitas/Institusi</label>
                  <input
                    type="text"
                    value={editForm.university}
                    onChange={(e) => handleFormChange('university', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                    placeholder="Nama universitas"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gelar</label>
                  <select
                    value={editForm.degree}
                    onChange={(e) => handleFormChange('degree', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                  >
                    <option value="">Pilih Gelar</option>
                    {degrees.map((degree) => (
                      <option key={degree} value={degree}>{degree}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bidang Studi</label>
                  <input
                    type="text"
                    value={editForm.fieldOfStudy}
                    onChange={(e) => handleFormChange('fieldOfStudy', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                    placeholder="Contoh: Teknik Informatika"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Kelulusan</label>
                  <select
                    value={editForm.graduationYear}
                    onChange={(e) => handleFormChange('graduationYear', e.target.value)}
                    className="w-full md:w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                  >
                    <option value="">Pilih Tahun</option>
                    {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={updateEducation}
                  className="px-4 py-2 bg-[#010042] text-white rounded-md hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            // Display view
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">
                  {edu.degree || 'Tidak disebutkan'}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}
                </h4>
                <p className="text-gray-600 text-sm">
                  {edu.university || 'Tidak disebutkan'}{edu.country ? ` (${edu.country})` : ''}
                </p>
                <p className="text-gray-500 text-sm">
                  ({edu.graduationYear || 'Tidak disebutkan'})
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEditing(index)}
                  className="p-1 text-blue-600 hover:text-blue-800"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => removeEducation(index)}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add New Education Form */}
      {editingIndex === -1 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-semibold text-gray-900 mb-3">Tambah pendidikan baru:</h5>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Negara</label>
                <select
                  value={editForm.country}
                  onChange={(e) => handleFormChange('country', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                >
                  <option value="">Pilih Negara</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Universitas/Institusi</label>
                <input
                  type="text"
                  value={editForm.university}
                  onChange={(e) => handleFormChange('university', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                  placeholder="Nama universitas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gelar</label>
                <select
                  value={editForm.degree}
                  onChange={(e) => handleFormChange('degree', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                >
                  <option value="">Pilih Gelar</option>
                  {degrees.map((degree) => (
                    <option key={degree} value={degree}>{degree}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bidang Studi</label>
                <input
                  type="text"
                  value={editForm.fieldOfStudy}
                  onChange={(e) => handleFormChange('fieldOfStudy', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                  placeholder="Contoh: Teknik Informatika"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Kelulusan</label>
                <select
                  value={editForm.graduationYear}
                  onChange={(e) => handleFormChange('graduationYear', e.target.value)}
                  className="w-full md:w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                >
                  <option value="">Pilih Tahun</option>
                  {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={addEducation}
              className="w-full px-4 py-2 bg-[#010042] text-white rounded-md hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
            >
              Tambah Pendidikan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Certification Editor Component
function CertificationEditor({ certifications, onChange }) {
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editForm, setEditForm] = useState({
    name: '',
    issuedBy: '',
    year: ''
  });

  const addCertification = () => {
    if (!editForm.name.trim() || !editForm.issuedBy.trim()) return;
    
    const updatedCertifications = [...certifications, { ...editForm }];
    onChange(updatedCertifications);
    setEditForm({
      name: '',
      issuedBy: '',
      year: ''
    });
  };

  const updateCertification = () => {
    if (!editForm.name.trim() || !editForm.issuedBy.trim()) return;
    
    const updatedCertifications = [...certifications];
    updatedCertifications[editingIndex] = { ...editForm };
    onChange(updatedCertifications);
    setEditingIndex(-1);
    setEditForm({
      name: '',
      issuedBy: '',
      year: ''
    });
  };

  const removeCertification = (index) => {
    const updatedCertifications = certifications.filter((_, i) => i !== index);
    onChange(updatedCertifications);
    if (editingIndex === index) {
      setEditingIndex(-1);
      setEditForm({
        name: '',
        issuedBy: '',
        year: ''
      });
    }
  };

  const startEditing = (index) => {
    setEditingIndex(index);
    setEditForm({ ...certifications[index] });
  };

  const cancelEditing = () => {
    setEditingIndex(-1);
    setEditForm({
      name: '',
      issuedBy: '',
      year: ''
    });
  };

  const handleFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-4">
      {/* Certifications List */}
      {certifications.map((cert, index) => (
        <div key={index} className="p-4 bg-gray-50 rounded-lg">
          {editingIndex === index ? (
            // Edit form for this row
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sertifikasi</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                    placeholder="Contoh: Google Analytics Certified"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diterbitkan oleh</label>
                  <input
                    type="text"
                    value={editForm.issuedBy}
                    onChange={(e) => handleFormChange('issuedBy', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                    placeholder="Contoh: Google"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                  <select
                    value={editForm.year}
                    onChange={(e) => handleFormChange('year', e.target.value)}
                    className="w-full md:w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                  >
                    <option value="">Pilih Tahun</option>
                    {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={updateCertification}
                  className="px-4 py-2 bg-[#010042] text-white rounded-md hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            // Display view
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">
                  {cert.name || 'Tidak disebutkan'}
                </h4>
                <p className="text-gray-600 text-sm">
                  {cert.issuedBy ? `dari ${cert.issuedBy}` : 'Penerbit tidak disebutkan'}
                </p>
                <p className="text-gray-500 text-sm">
                  ({cert.year || 'Tahun tidak disebutkan'})
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEditing(index)}
                  className="p-1 text-blue-600 hover:text-blue-800"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => removeCertification(index)}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add New Certification Form */}
      {editingIndex === -1 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-semibold text-gray-900 mb-3">Tambah sertifikasi baru:</h5>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sertifikasi</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                  placeholder="Contoh: Google Analytics Certified"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diterbitkan oleh</label>
                <input
                  type="text"
                  value={editForm.issuedBy}
                  onChange={(e) => handleFormChange('issuedBy', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                  placeholder="Contoh: Google"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                <select
                  value={editForm.year}
                  onChange={(e) => handleFormChange('year', e.target.value)}
                  className="w-full md:w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                >
                  <option value="">Pilih Tahun</option>
                  {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={addCertification}
              className="w-full px-4 py-2 bg-[#010042] text-white rounded-md hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
            >
              Tambah Sertifikasi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Working Hours Editor Component
function WorkingHoursEditor({ workingHours, onChange }) {
  const parseExistingHours = () => {
    if (workingHours && workingHours.includes(' - ')) {
      const parts = workingHours.split(' - ');
      return {
        start: parts[0],
        end: parts[1].replace(' WIB', '')
      };
    }
    return { start: '08:00', end: '17:00' };
  };
  
  const [startHour, setStartHour] = useState(parseExistingHours().start);
  const [endHour, setEndHour] = useState(parseExistingHours().end);
  
  const timeOptions = [];
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0');
    timeOptions.push(`${hour}:00`);
    timeOptions.push(`${hour}:30`);
  }
  
  useEffect(() => {
    if (startHour && endHour) {
      onChange(`${startHour} - ${endHour} WIB`);
    }
  }, [startHour, endHour, onChange]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
      <div className="md:col-span-2">
        <label htmlFor="startHour" className="block text-sm font-medium text-gray-500 mb-1">Jam Mulai</label>
        <select
          id="startHour"
          value={startHour}
          onChange={(e) => setStartHour(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm"
        >
          {timeOptions.map((time) => (
            <option key={`start-${time}`} value={time}>{time}</option>
          ))}
        </select>
      </div>
      
      <div className="flex justify-center items-center">
        <span className="text-gray-500">sampai</span>
      </div>
      
      <div className="md:col-span-2">
        <label htmlFor="endHour" className="block text-sm font-medium text-gray-500 mb-1">Jam Selesai</label>
        <select
          id="endHour"
          value={endHour}
          onChange={(e) => setEndHour(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm"
        >
          {timeOptions.map((time) => (
            <option key={`end-${time}`} value={time}>{time}</option>
          ))}
        </select>
      </div>
    </div>
  );
} 