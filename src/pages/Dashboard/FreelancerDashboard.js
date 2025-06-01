import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
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
  UserIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

export default function FreelancerDashboard() {
  const { currentUser, userProfile } = useAuth();
  
  console.log('🚀 DEBUG: FreelancerDashboard component rendered');
  console.log('🚀 DEBUG: currentUser:', currentUser?.uid);
  console.log('🚀 DEBUG: userProfile at component render:', userProfile);
  
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeOrders: 0,
    completedOrders: 0,
    averageRating: 0,
    totalReviews: 0,
    responseRate: 100,
    responseTime: '1 jam'
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [freelancerProfile, setFreelancerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gigs, setGigs] = useState([]);
  const [level, setLevel] = useState({
    current: 'New Seller',
    next: 'Level 1 Seller',
    progress: 0,
    requirements: []
  });

  // Debug state changes
  useEffect(() => {
    console.log('📊 DEBUG: freelancerProfile state updated:', freelancerProfile);
    if (freelancerProfile?.skills) {
      console.log('📊 DEBUG: Skills in state:', freelancerProfile.skills);
    }
  }, [freelancerProfile]);

  // Check and fix user freelancer role if needed
  const checkAndFixFreelancerRole = async () => {
    if (!currentUser || !userProfile) return;
    
    console.log('🔧 DEBUG: Checking freelancer role...');
    console.log('🔧 DEBUG: currentUser:', currentUser?.uid);
    console.log('🔧 DEBUG: userProfile:', userProfile);
    console.log('🔧 DEBUG: userProfile.roles:', userProfile.roles);
    console.log('🔧 DEBUG: userProfile.isFreelancer:', userProfile.isFreelancer);
    
    const hasFreelancerRole = userProfile.roles?.includes('freelancer') || userProfile.isFreelancer;
    console.log('🔧 DEBUG: hasFreelancerRole:', hasFreelancerRole);
    
    if (!hasFreelancerRole) {
      console.log('🔧 DEBUG: User is accessing freelancer dashboard but lacks freelancer role, upgrading...');
      try {
        console.log('🔧 DEBUG: Updating user document...');
        // Update user document to include freelancer role
        await updateDoc(doc(db, 'users', currentUser.uid), {
          isFreelancer: true,
          roles: userProfile.roles ? [...userProfile.roles, 'freelancer'] : ['client', 'freelancer'],
          updatedAt: serverTimestamp()
        });
        
        console.log('🔧 DEBUG: Checking/creating freelancer profile...');
        // Create freelancer profile if it doesn't exist
        const freelancerDoc = await getDoc(doc(db, 'freelancerProfiles', currentUser.uid));
        if (!freelancerDoc.exists()) {
          console.log('🔧 DEBUG: Creating new freelancer profile...');
          await setDoc(doc(db, 'freelancerProfiles', currentUser.uid), {
            userId: currentUser.uid,
            skills: [],
            experienceLevel: '',
            bio: '',
            portfolioLinks: [],
            hourlyRate: 0,
            availability: 'available',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          console.log('🔧 DEBUG: Freelancer profile created successfully');
        } else {
          console.log('🔧 DEBUG: Freelancer profile already exists');
        }
        
        console.log('🔧 DEBUG: User role upgraded to freelancer successfully');
        // Reload the page to get updated user data
        window.location.reload();
      } catch (error) {
        console.error('🔧 DEBUG: Error upgrading user to freelancer:', error);
      }
    } else {
      console.log('🔧 DEBUG: User already has freelancer role');
    }
  };

  // Calculate profile completion
  useEffect(() => {
    const calculateProfileCompletion = () => {
      if (!userProfile || !freelancerProfile) return 0;
      
      let completed = 0;
      const checks = [
        userProfile.profilePhoto,
        userProfile.bio,
        freelancerProfile?.skills?.length > 0,
        freelancerProfile?.experienceLevel,
        freelancerProfile?.hourlyRate > 0,
        freelancerProfile?.portfolioLinks?.length > 0,
        gigs.length > 0
      ];
      
      completed = checks.filter(Boolean).length;
      return Math.round((completed / checks.length) * 100);
    };
    
    setProfileCompletion(calculateProfileCompletion());
  }, [userProfile, freelancerProfile, gigs]);

  // Check and fix freelancer role on mount
  useEffect(() => {
    if (currentUser && userProfile) {
      checkAndFixFreelancerRole();
    }
  }, [currentUser, userProfile]);

  // Fetch freelancer profile
  useEffect(() => {
    async function fetchFreelancerProfile() {
      if (!currentUser) return;
      
      try {
        console.log('🔍 DEBUG: Fetching freelancer profile for user:', currentUser.uid);
        const profileDoc = await getDoc(doc(db, 'freelancerProfiles', currentUser.uid));
        if (profileDoc.exists()) {
          const profileData = profileDoc.data();
          console.log('📄 DEBUG: Raw freelancer profile data:', profileData);
          console.log('🎯 DEBUG: Skills data from profile:', profileData.skills);
          console.log('🎯 DEBUG: Skills data type:', typeof profileData.skills);
          console.log('🎯 DEBUG: Is skills an array?', Array.isArray(profileData.skills));
          
          if (profileData.skills) {
            console.log('🎯 DEBUG: Skills array length:', profileData.skills.length);
            profileData.skills.forEach((skill, index) => {
              console.log(`🎯 DEBUG: Skill[${index}]:`, skill);
              console.log(`🎯 DEBUG: Skill[${index}] type:`, typeof skill);
              console.log(`🎯 DEBUG: Skill[${index}] keys:`, typeof skill === 'object' ? Object.keys(skill) : 'N/A');
            });
          }
          
          setFreelancerProfile(profileData);
        } else {
          console.log('❌ DEBUG: No freelancer profile found');
        }
      } catch (error) {
        console.error('❌ DEBUG: Error fetching freelancer profile:', error);
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
              console.log('📊 FreelancerDashboard: Processing order:', { id: doc.id, status: order.status, amount: order.amount });
              
              if (order.status === 'completed') {
                totalEarnings += order.amount || 0;
                completedOrders++;
              } else if (['pending', 'active', 'in_progress', 'in_revision'].includes(order.status)) {
                activeOrders++;
              }
            }
          });
        });

        console.log('📊 FreelancerDashboard: Order stats calculated:', { 
          totalEarnings, 
          activeOrders, 
          completedOrders 
        });

        // Fetch reviews using the correct field names
        const reviewsQueryPrimary = query(
          collection(db, 'reviews'),
          where('freelancerId', '==', currentUser.uid)
        );
        
        const reviewsQueryFallback = query(
          collection(db, 'reviews'),
          where('sellerId', '==', currentUser.uid)
        );
        
        const [reviewsSnapshotPrimary, reviewsSnapshotFallback] = await Promise.all([
          getDocs(reviewsQueryPrimary),
          getDocs(reviewsQueryFallback)
        ]);
        
        let totalRating = 0;
        let totalReviews = 0;
        
        // Process reviews from both queries to avoid duplicates
        const processedReviewIds = new Set();
        [reviewsSnapshotPrimary, reviewsSnapshotFallback].forEach(snapshot => {
          snapshot.forEach(doc => {
            if (!processedReviewIds.has(doc.id)) {
              processedReviewIds.add(doc.id);
              const review = doc.data();
              totalRating += review.rating || 0;
              totalReviews++;
            }
          });
        });
        
        const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

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
        
        console.log(`📊 FreelancerDashboard: Found ${gigsData.length} gigs for user ${currentUser.uid}`);
        console.log('Dashboard gigs data:', gigsData);
        
        setGigs(gigsData);

        // Update stats
        setStats({
          totalEarnings,
          activeOrders,
          completedOrders,
          averageRating,
          totalReviews,
          responseRate: 98, // This would be calculated from actual response data
          responseTime: '1 jam'
        });

        // Calculate seller level
        calculateSellerLevel(completedOrders, averageRating, totalEarnings);

        // Fetch recent activities
        fetchRecentActivities();
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
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

  // Calculate seller level
  const calculateSellerLevel = (completedOrders, averageRating, totalEarnings) => {
    let currentLevel = 'New Seller';
    let nextLevel = 'Level 1 Seller';
    let progress = 0;
    let requirements = [];

    if (completedOrders >= 50 && averageRating >= 4.8 && totalEarnings >= 10000000) {
      currentLevel = 'Level 2 Seller';
      nextLevel = 'Top Rated Seller';
      requirements = [
        { name: 'Pesanan Selesai', current: completedOrders, target: 100, met: completedOrders >= 100 },
        { name: 'Rating Minimal', current: averageRating, target: 4.9, met: averageRating >= 4.9 },
        { name: 'Total Pendapatan', current: totalEarnings, target: 50000000, met: totalEarnings >= 50000000 },
        { name: 'Tingkat Respon', current: stats.responseRate, target: 95, met: stats.responseRate >= 95 }
      ];
      progress = calculateProgress(requirements);
    } else if (completedOrders >= 10 && averageRating >= 4.5 && totalEarnings >= 2000000) {
      currentLevel = 'Level 1 Seller';
      nextLevel = 'Level 2 Seller';
      requirements = [
        { name: 'Pesanan Selesai', current: completedOrders, target: 50, met: completedOrders >= 50 },
        { name: 'Rating Minimal', current: averageRating, target: 4.8, met: averageRating >= 4.8 },
        { name: 'Total Pendapatan', current: totalEarnings, target: 10000000, met: totalEarnings >= 10000000 },
        { name: 'Tingkat Respon', current: stats.responseRate, target: 90, met: stats.responseRate >= 90 }
      ];
      progress = calculateProgress(requirements);
    } else {
      requirements = [
        { name: 'Pesanan Selesai', current: completedOrders, target: 10, met: completedOrders >= 10 },
        { name: 'Rating Minimal', current: averageRating, target: 4.5, met: averageRating >= 4.5 },
        { name: 'Total Pendapatan', current: totalEarnings, target: 2000000, met: totalEarnings >= 2000000 },
        { name: 'Profil Lengkap', current: profileCompletion, target: 100, met: profileCompletion >= 100 }
      ];
      progress = calculateProgress(requirements);
    }

    setLevel({ current: currentLevel, next: nextLevel, progress, requirements });
  };

  const calculateProgress = (requirements) => {
    const met = requirements.filter(req => req.met).length;
    return Math.round((met / requirements.length) * 100);
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
  const formatCertifications = (certifications) => {
    if (!certifications || !Array.isArray(certifications) || certifications.length === 0) return '-';
    
    return certifications.map(cert => {
      if (typeof cert === 'object' && cert !== null) {
        const name = cert.name || '';
        const issuedBy = cert.issuedBy || '';
        const year = cert.year || '';
        return `${name}${issuedBy ? ` dari ${issuedBy}` : ''}${year ? ` (${year})` : ''}`;
      } else if (typeof cert === 'string') {
        return cert;
      }
      return '';
    }).filter(Boolean).join(', ');
  };

  const formatGender = (gender) => {
    if (gender === 'male') return 'Laki-laki';
    if (gender === 'female') return 'Perempuan';
    return '-';
  };

  const getExperienceLevelLabel = (level) => {
    const levels = {
      'pemula': 'Pemula',
      'menengah': 'Menengah',
      'ahli': 'Ahli'
    };
    return levels[level?.toLowerCase()] || level || '-';
  };

  const formatEducation = (education) => {
    if (!education || !Array.isArray(education) || education.length === 0) return '-';
    
    return education.map(edu => {
      if (typeof edu === 'object' && edu !== null) {
        const degree = edu.degree || '-';
        const university = edu.university || edu.institution || '-';
        const fieldOfStudy = edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : '';
        const graduationYear = edu.graduationYear || '-';
        const country = edu.country ? ` (${edu.country})` : '';
        return `${degree}${fieldOfStudy} di ${university}${country} (${graduationYear})`;
      } else if (typeof edu === 'string') {
        return edu;
      }
      return '';
    }).filter(Boolean).join(', ');
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Selamat datang kembali, {userProfile?.displayName || 'Freelancer'}!
        </h1>
        <p className="text-gray-600">
          Berikut ringkasan performa Anda hari ini
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
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-500">+12%</span>
            <span className="text-gray-500 ml-1">dari bulan lalu</span>
          </div>
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
              <p className="text-sm text-gray-600 mb-1">Tingkat Respon</p>
              <p className="text-2xl font-bold text-gray-900">{stats.responseRate}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Waktu respon: {stats.responseTime}
          </p>
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
            {(userProfile?.roles?.includes('freelancer') || userProfile?.isFreelancer) ? (
              <Link 
                to="/dashboard/freelancer/settings" 
                className="inline-flex items-center px-4 py-2 border border-white text-sm font-medium rounded-md shadow-sm text-white bg-transparent hover:bg-white hover:text-[#010042] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
              >
                Edit Profil
              </Link>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-red-200">Akses Freelancer Diperlukan</span>
                <Link 
                  to="/become-freelancer" 
                  className="inline-flex items-center px-4 py-2 border border-white text-sm font-medium rounded-md shadow-sm text-white bg-transparent hover:bg-white hover:text-[#010042] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
                >
                  Daftar Freelancer
                </Link>
              </div>
            )}
          </div>
          
          <div className="p-8">
            {/* Header Profile Section */}
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 mb-8 pb-8 border-b border-gray-200">
              <div className="flex flex-col items-center">
                {userProfile?.profilePhoto ? (
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
                <div className="mt-4 text-center">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {userProfile?.displayName || 'Nama Freelancer'}
                  </h3>
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
                      <p className="text-gray-700 leading-relaxed">
                        {userProfile?.bio || 'Belum ada bio yang ditambahkan. Lengkapi profil Anda untuk menarik lebih banyak klien.'}
                      </p>
                    </div>
                  </div>

                  {/* Skills Card */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <BriefcaseIcon className="h-5 w-5 mr-2 text-[#010042]" />
                      Keahlian
                    </h4>
                    <div className="space-y-2">
                      {(() => {
                        console.log('🎨 DEBUG: Rendering Skills Card');
                        console.log('🎨 DEBUG: freelancerProfile?.skills:', freelancerProfile?.skills);
                        console.log('🎨 DEBUG: Is skills array?', Array.isArray(freelancerProfile?.skills));
                        console.log('🎨 DEBUG: Skills length:', freelancerProfile?.skills?.length);
                        
                        if (freelancerProfile?.skills && Array.isArray(freelancerProfile.skills) && freelancerProfile.skills.length > 0) {
                          console.log('🎨 DEBUG: About to map skills:', freelancerProfile.skills);
                          return (
                            <div className="flex flex-wrap gap-2">
                              {freelancerProfile.skills.map((skillItem, index) => {
                                console.log(`🎨 DEBUG: Processing skill[${index}]:`, skillItem);
                                
                                // More robust handling of skill data
                                let skillName = '';
                                
                                try {
                                  if (typeof skillItem === 'string') {
                                    skillName = skillItem;
                                    console.log(`🎨 DEBUG: Skill[${index}] is string:`, skillName);
                                  } else if (typeof skillItem === 'object' && skillItem !== null) {
                                    console.log(`🎨 DEBUG: Skill[${index}] is object with keys:`, Object.keys(skillItem));
                                    // Handle various possible object structures
                                    skillName = skillItem.skill || skillItem.name || skillItem.skillName || '';
                                    console.log(`🎨 DEBUG: Extracted skill name:`, skillName);
                                    
                                    // If still no skill name found, convert object to string representation
                                    if (!skillName && Object.keys(skillItem).length > 0) {
                                      skillName = `${Object.values(skillItem)[0] || 'Unknown Skill'}`;
                                      console.log(`🎨 DEBUG: Using first object value as skill name:`, skillName);
                                    }
                                  }
                                  
                                  // Ensure skillName is a string
                                  skillName = String(skillName).trim();
                                  console.log(`🎨 DEBUG: Final skill name[${index}]:`, skillName);
                                } catch (error) {
                                  console.error(`🎨 DEBUG: Error processing skill[${index}]:`, skillItem, error);
                                  skillName = 'Invalid Skill';
                                }
                                
                                // Only render if we have a valid skill name
                                const shouldRender = !!skillName;
                                console.log(`🎨 DEBUG: Should render skill[${index}]:`, shouldRender);
                                
                                return shouldRender ? (
                                  <span 
                                    key={`skill-${index}-${skillName}`}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#010042] text-white"
                                  >
                                    {skillName}
                                  </span>
                                ) : null;
                              }).filter(skill => {
                                console.log('🎨 DEBUG: Filtering skill:', skill);
                                return Boolean(skill);
                              })}
                            </div>
                          );
                        } else {
                          console.log('🎨 DEBUG: No skills to display, showing placeholder');
                          return <p className="text-gray-500 italic">Belum ada keahlian yang ditambahkan</p>;
                        }
                      })()}
                    </div>
                  </div>

                  {/* Experience Level Card */}
                  <div className="bg-purple-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <ChartBarIcon className="h-5 w-5 mr-2 text-[#010042]" />
                      Level Pengalaman
                    </h4>
                    <p className="text-lg font-semibold text-[#010042]">
                      {getExperienceLevelLabel(freelancerProfile?.experienceLevel)}
                    </p>
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
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900">Bachelor, Computer Science and Statistics</h3>
                    <p className="text-gray-600">Universitas Bina Nusantara (Indonesia)</p>
                    <p className="text-gray-500 text-sm">(2026)</p>
                  </div>
                  {/* Add more education items here if needed */}
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
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900">AWS Cloud Architecture</h3>
                    <p className="text-gray-600">dari AWS</p>
                    <p className="text-gray-500 text-sm">(2024)</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900">AWS Cloud Foundation</h3>
                    <p className="text-gray-600">dari AWS</p>
                    <p className="text-gray-500 text-sm">(2024)</p>
                  </div>
                  {/* Add more certification items here if needed */}
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
                    <p className="text-gray-700">{userProfile?.phoneNumber || '+628129416196'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Lokasi:</span>
                    <p className="text-gray-700">{userProfile?.location ? userProfile.location.charAt(0).toUpperCase() + userProfile.location.slice(1) : 'Jakarta'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Jam Kerja:</span>
                    <p className="text-gray-700">{freelancerProfile?.workingHours || '08:00 - 17:00 WIB'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Section: Activities and Level Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Activities */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow"
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

        {/* Seller Level Progress */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Level Seller</h2>
          </div>
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#010042] rounded-full mb-3">
                <span className="text-white text-2xl font-bold">
                  {level.current === 'New Seller' ? 'NS' : 
                   level.current === 'Level 1 Seller' ? 'L1' :
                   level.current === 'Level 2 Seller' ? 'L2' : 'TR'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{level.current}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Progress menuju {level.next}
              </p>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{level.progress}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-[#010042] h-3 rounded-full transition-all duration-500"
                  style={{ width: `${level.progress}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Persyaratan:</h4>
              {level.requirements.map((req, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    {req.met ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full mr-2" />
                    )}
                    <span className={req.met ? 'text-gray-900' : 'text-gray-500'}>
                      {req.name}
                    </span>
                  </div>
                  <span className={req.met ? 'text-green-600' : 'text-gray-500'}>
                    {req.name.includes('Pendapatan') 
                      ? formatCurrency(req.current)
                      : req.name.includes('Rating')
                      ? req.current.toFixed(1)
                      : req.current}
                    {req.name.includes('Pendapatan') 
                      ? ` / ${formatCurrency(req.target)}`
                      : ` / ${req.target}`}
                  </span>
                </div>
              ))}
            </div>

            <Link 
              to="/dashboard/freelancer/analytics"
              className="mt-6 block w-full text-center py-2 px-4 bg-[#010042] text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Lihat Detail Analytics
            </Link>
          </div>
        </motion.div>
      </div>

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
    </div>
  );
} 