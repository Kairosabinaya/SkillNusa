import { useState, useEffect, useRef } from 'react';
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
  UserIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import freelancerRatingService from '../../services/freelancerRatingService';

export default function FreelancerDashboard() {
  const { currentUser, userProfile } = useAuth();
  
  // Count renders to detect excessive re-renders
  const renderCount = useRef(0);
  renderCount.current += 1;
  
  console.log('🚀 DEBUG: FreelancerDashboard component rendered (render #' + renderCount.current + ')');
  console.log('🚀 DEBUG: currentUser:', currentUser?.uid);
  console.log('🚀 DEBUG: userProfile at component render:', userProfile);
  
  // Warn if too many renders
  if (renderCount.current > 10) {
    console.error('🚨 [FreelancerDashboard] Excessive re-renders detected! Render count:', renderCount.current);
  }
  
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
        
        console.log(`📊 FreelancerDashboard: Found ${gigsData.length} gigs for user ${currentUser.uid}`);
        console.log('Dashboard gigs data:', gigsData);
        console.log('📊 Rating stats from new service:', ratingStats);
        
        setGigs(gigsData);

        // Calculate response rate and time from messages/chats data
        let responseRate = 0;
        let responseTime = 'Belum tersedia';
        
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
          console.log('Could not calculate response metrics:', error);
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
  const formatGender = (gender) => {
    if (gender === 'male') return 'Laki-laki';
    if (gender === 'female') return 'Perempuan';
    return '-';
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
                        {freelancerProfile?.bio || 'Belum ada bio profesional yang ditambahkan. Lengkapi profil freelancer Anda untuk menarik lebih banyak klien.'}
                      </p>
                    </div>
                  </div>

                  {/* Skills Card - Full Width */}
                  <div className="col-span-full bg-blue-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <BriefcaseIcon className="h-5 w-5 mr-2 text-[#010042]" />
                      Keahlian & Level Pengalaman
                    </h4>
                    <div className="space-y-2">
                      {freelancerProfile?.skills && Array.isArray(freelancerProfile.skills) && freelancerProfile.skills.length > 0 ? (
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
                              console.error(`Error processing skill[${index}]:`, skillItem, error);
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
                  {freelancerProfile?.education && Array.isArray(freelancerProfile.education) && freelancerProfile.education.length > 0 ? (
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
                  {freelancerProfile?.certifications && Array.isArray(freelancerProfile.certifications) && freelancerProfile.certifications.length > 0 ? (
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
                    <p className="text-gray-700">{userProfile?.phoneNumber || 'Belum diisi'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Lokasi:</span>
                    <p className="text-gray-700">{userProfile?.location ? userProfile.location.charAt(0).toUpperCase() + userProfile.location.slice(1) : 'Belum diisi'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Jam Kerja:</span>
                    <p className="text-gray-700">{freelancerProfile?.workingHours || 'Belum diisi'}</p>
                  </div>
                </div>
              </div>
            </div>
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
    </div>
  );
} 