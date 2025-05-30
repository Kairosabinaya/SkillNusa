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
  onSnapshot
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

  // Fetch freelancer profile
  useEffect(() => {
    async function fetchFreelancerProfile() {
      if (!currentUser) return;
      
      try {
        const profileDoc = await getDoc(doc(db, 'freelancerProfiles', currentUser.uid));
        if (profileDoc.exists()) {
          setFreelancerProfile(profileDoc.data());
        }
      } catch (error) {
        console.error('Error fetching freelancer profile:', error);
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
        // Fetch orders
        const ordersQuery = query(
          collection(db, 'orders'),
          where('sellerId', '==', currentUser.uid)
        );
        
        const ordersSnapshot = await getDocs(ordersQuery);
        let totalEarnings = 0;
        let activeOrders = 0;
        let completedOrders = 0;
        
        ordersSnapshot.forEach(doc => {
          const order = doc.data();
          if (order.status === 'completed') {
            totalEarnings += order.amount || 0;
            completedOrders++;
          } else if (['pending', 'active', 'in_revision'].includes(order.status)) {
            activeOrders++;
          }
        });

        // Fetch reviews
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('sellerId', '==', currentUser.uid)
        );
        
        const reviewsSnapshot = await getDocs(reviewsQuery);
        let totalRating = 0;
        let totalReviews = 0;
        
        reviewsSnapshot.forEach(doc => {
          const review = doc.data();
          totalRating += review.rating || 0;
          totalReviews++;
        });
        
        const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

        // Fetch gigs
        const gigsQuery = query(
          collection(db, 'gigs'),
          where('userId', '==', currentUser.uid)
        );
        
        const gigsSnapshot = await getDocs(gigsQuery);
        const gigsData = [];
        gigsSnapshot.forEach(doc => {
          gigsData.push({ id: doc.id, ...doc.data() });
        });
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
      orderBy('createdAt', 'desc'),
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
      setRecentActivities(activities);
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
  const formatSkills = (skills) => {
    if (!skills || !Array.isArray(skills) || skills.length === 0) return '-';
    
    return skills.map(skillObj => {
      if (typeof skillObj === 'object' && skillObj !== null) {
        const skill = skillObj.skill || '';
        const level = skillObj.experienceLevel || '';
        return `${skill}${level ? ` (${getExperienceLevelLabel(level)})` : ''}`;
      } else if (typeof skillObj === 'string') {
        return skillObj;
      }
      return '';
    }).filter(Boolean).join(', ');
  };

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

      {/* Profile Completion Alert */}
      {profileCompletion < 100 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
          <div className="flex items-start">
            <ExclamationCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Profil Anda {profileCompletion}% lengkap
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Lengkapi profil Anda untuk meningkatkan visibilitas dan mendapatkan lebih banyak pesanan
              </p>
              <div className="mt-3 flex items-center gap-4">
                {!userProfile?.profilePhoto && (
                  <Link to="/profile/edit" className="text-sm font-medium text-yellow-800 hover:text-yellow-900">
                    + Tambah foto profil
                  </Link>
                )}
                {!freelancerProfile?.skills?.length && (
                  <Link to="/dashboard/freelancer/settings" className="text-sm font-medium text-yellow-800 hover:text-yellow-900">
                    + Tambah keahlian
                  </Link>
                )}
                {gigs.length === 0 && (
                  <Link to="/dashboard/freelancer/gigs/create" className="text-sm font-medium text-yellow-800 hover:text-yellow-900">
                    + Buat gig pertama
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="bg-yellow-200 rounded-full h-2">
              <div 
                className="bg-yellow-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Freelancer Profile Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Profil Freelancer</h2>
              <Link 
                to="/dashboard/freelancer/settings" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#010042] hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Edit Profil
              </Link>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Profile Picture and Basic Info */}
                <div className="md:col-span-1">
                  <div className="flex flex-col items-center">
                    {userProfile?.profilePhoto ? (
                      <img 
                        src={userProfile.profilePhoto} 
                        alt="Profile" 
                        className="w-32 h-32 rounded-full object-cover border-4 border-[#010042]" 
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-[#010042]">
                        <UserIcon className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-gray-900 mt-4">
                      {userProfile?.displayName || 'Nama Freelancer'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {userProfile?.email || 'email@example.com'}
                    </p>
                  </div>
                </div>

                {/* Bio & Skills Section */}
                <div className="md:col-span-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Bio</h4>
                        <p className="text-sm text-gray-900">
                          {userProfile?.bio || '-'}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Keahlian</h4>
                        <p className="text-sm text-gray-900">
                          {formatSkills(freelancerProfile?.skills)}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Pendidikan</h4>
                        <p className="text-sm text-gray-900">
                          {formatEducation(freelancerProfile?.education)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Sertifikasi & Penghargaan</h4>
                        <p className="text-sm text-gray-900">
                          {formatCertifications(freelancerProfile?.certifications)}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Kontak</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-900">
                          <div>
                            <span className="text-gray-500">Telepon:</span> {userProfile?.phoneNumber || '-'}
                          </div>
                          <div>
                            <span className="text-gray-500">Lokasi:</span> {userProfile?.location ? userProfile.location.charAt(0).toUpperCase() + userProfile.location.slice(1) : '-'}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Ketersediaan</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-900">
                          <div>
                            <span className="text-gray-500">Status:</span>{' '}
                            <span className={`${freelancerProfile?.availability === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                              {freelancerProfile?.availability === 'available' ? 'Tersedia' : 'Tidak Tersedia'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Jam Kerja:</span> {freelancerProfile?.workingHours || '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent Activities */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="bg-white rounded-lg shadow">
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
            </div>
          </motion.div>
        </div>

        {/* Seller Level Progress */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow h-full"
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