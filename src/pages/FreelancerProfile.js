import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  getDoc, 
  doc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/config';
import chatService from '../services/chatService';
import freelancerRatingService from '../services/freelancerRatingService';
import reviewService from '../services/reviewService';
import {
  StarIcon,
  MapPinIcon,
  ClockIcon,
  CheckBadgeIcon,
  ChatBubbleLeftRightIcon,
  GlobeAltIcon,
  BriefcaseIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import PageContainer from '../components/common/PageContainer';

export default function FreelancerProfile() {
  const { freelancerId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [freelancerData, setFreelancerData] = useState(null);
  const [freelancerProfile, setFreelancerProfile] = useState(null);
  const [freelancerGigs, setFreelancerGigs] = useState([]);
  const [freelancerReviews, setFreelancerReviews] = useState([]);
  const [freelancerStats, setFreelancerStats] = useState({
    completedProjects: 0,
    successRate: 0,
    totalOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [showAllEducation, setShowAllEducation] = useState(false);
  const [showAllCertifications, setShowAllCertifications] = useState(false);

  useEffect(() => {
    loadFreelancerData();
  }, [freelancerId]);

  // Calculate actual completed projects from orders
  const calculateCompletedProjects = async (gigIds) => {
    try {
      let totalCompleted = 0;
      let totalOrders = 0;
      let acceptedOrders = 0;

      for (const gigId of gigIds) {
        const ordersQuery = query(
          collection(db, 'orders'),
          where('gigId', '==', gigId)
        );
        
        const ordersSnapshot = await getDocs(ordersQuery);
        const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        totalOrders += orders.length;
        
        // Count completed orders
        const completedCount = orders.filter(order => order.status === 'completed').length;
        totalCompleted += completedCount;
        
        // Count accepted orders (not rejected/cancelled by freelancer)
        const acceptedCount = orders.filter(order => 
          order.status !== 'rejected' && order.status !== 'cancelled_by_freelancer'
        ).length;
        acceptedOrders += acceptedCount;
      }

      const successRate = totalOrders > 0 ? (acceptedOrders / totalOrders) * 100 : 0;

      return {
        completedProjects: totalCompleted,
        successRate: Math.round(successRate),
        totalOrders
      };
    } catch (error) {
      console.error('Error calculating completed projects:', error);
      return {
        completedProjects: 0,
        successRate: 0,
        totalOrders: 0
      };
    }
  };

  const loadFreelancerData = async () => {
    try {
      setLoading(true);
      
      // Load freelancer basic data
      const userDoc = await getDoc(doc(db, 'users', freelancerId));
      if (!userDoc.exists()) {
        navigate('/not-found');
        return;
      }
      
      const userData = { id: userDoc.id, ...userDoc.data() };
      setFreelancerData(userData);
      
      // Load freelancer profile with calculated rating
      const profileQuery = query(
        collection(db, 'freelancerProfiles'),
        where('userId', '==', freelancerId),
        limit(1)
      );
      
      const profileSnapshot = await getDocs(profileQuery);
      let profileData = null;
      
      if (!profileSnapshot.empty) {
        const profileDoc = profileSnapshot.docs[0];
        profileData = { id: profileDoc.id, ...profileDoc.data() };
      }
      
      // Get calculated rating stats from all gigs
      const ratingStats = await freelancerRatingService.calculateFreelancerRatingStats(freelancerId);
      
      // Merge profile data with calculated rating stats
      if (profileData) {
        profileData = {
          ...profileData,
          rating: ratingStats.averageRating,
          totalReviews: ratingStats.totalReviews
        };
      }
      
      setFreelancerProfile(profileData);

      // Load freelancer gigs with fallback query
      let gigIds = [];
      try {
        // Try compound query first
        try {
          const gigsQuery = query(
            collection(db, 'gigs'),
            where('freelancerId', '==', freelancerId),
            where('isActive', '==', true),
            orderBy('createdAt', 'desc')
          );
          
          const gigsSnapshot = await getDocs(gigsQuery);
          const gigsData = [];
          
          gigsSnapshot.forEach((doc) => {
            const gigData = { id: doc.id, ...doc.data() };
            gigsData.push(gigData);
            gigIds.push(doc.id);
          });
          
          // Add rating stats to each gig
          const gigsWithRatings = await Promise.all(
            gigsData.map(async (gig) => {
              try {
                const ratingStats = await reviewService.getGigRatingStats(gig.id);
                return {
                  ...gig,
                  rating: ratingStats.averageRating,
                  totalReviews: ratingStats.totalReviews
                };
              } catch (error) {
                console.error('Error getting rating stats for gig:', gig.id, error);
                return {
                  ...gig,
                  rating: 0,
                  totalReviews: 0
                };
              }
            })
          );
          
          setFreelancerGigs(gigsWithRatings);
        } catch (indexError) {
          console.log('Index not available for gigs query, using fallback...');
          
          // Fallback: Simple query without orderBy
          const gigsQuery = query(
            collection(db, 'gigs'),
            where('freelancerId', '==', freelancerId),
            where('isActive', '==', true)
          );
          
          const gigsSnapshot = await getDocs(gigsQuery);
          const gigsData = [];
          
          gigsSnapshot.forEach((doc) => {
            const gigData = { id: doc.id, ...doc.data() };
            gigsData.push(gigData);
            gigIds.push(doc.id);
          });
          
          // Client-side sorting by createdAt desc
          gigsData.sort((a, b) => {
            const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return bDate - aDate;
          });
          
          // Add rating stats to each gig (fallback query)
          const gigsWithRatings = await Promise.all(
            gigsData.map(async (gig) => {
              try {
                const ratingStats = await reviewService.getGigRatingStats(gig.id);
                return {
                  ...gig,
                  rating: ratingStats.averageRating,
                  totalReviews: ratingStats.totalReviews
                };
              } catch (error) {
                console.error('Error getting rating stats for gig:', gig.id, error);
                return {
                  ...gig,
                  rating: 0,
                  totalReviews: 0
                };
              }
            })
          );
          
          setFreelancerGigs(gigsWithRatings);
        }
      } catch (error) {
        console.error('Error loading freelancer gigs:', error);
        setFreelancerGigs([]);
      }

      // Calculate real stats from orders
      const realStats = await calculateCompletedProjects(gigIds);
      setFreelancerStats(realStats);

      // Load all freelancer reviews from all gigs using new service
      const allReviews = await freelancerRatingService.getAllFreelancerReviews(freelancerId, { limit: 10 });
      
      // Get client data for each review
      const reviewsWithClientData = await Promise.all(
        allReviews.map(async (review) => {
          const clientDoc = await getDoc(doc(db, 'users', review.clientId));
          if (clientDoc.exists()) {
            review.client = { id: clientDoc.id, ...clientDoc.data() };
          }
          return review;
        })
      );
      
      setFreelancerReviews(reviewsWithClientData);
      
    } catch (error) {
      console.error('Error loading freelancer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactFreelancer = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.uid === freelancerId) {
      return; // Can't message yourself
    }

    try {
      const chat = await chatService.createOrGetChat(currentUser.uid, freelancerId);
      navigate(`/messages?chatId=${chat.id}`);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getWorkingHours = (profileData) => {
    if (profileData?.workingHours) {
      // If it's already a formatted string like "08:00 - 17:00 WIB"
      if (typeof profileData.workingHours === 'string') {
        return profileData.workingHours;
      }
      // If it's an object with start/end
      if (profileData.workingHours.start && profileData.workingHours.end) {
        return `${profileData.workingHours.start} - ${profileData.workingHours.end}`;
      }
    }
    if (profileData?.availableHours) {
      return profileData.availableHours;
    }
    return '09:00 - 17:00 WIB';
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i}>
          {i <= rating ? (
            <StarSolid className="w-4 h-4 text-yellow-400" />
          ) : (
            <StarIcon className="w-4 h-4 text-gray-300" />
          )}
        </span>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <PageContainer className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#010042] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading freelancer profile...</p>
          </div>
        </PageContainer>
      </div>
    );
  }

  if (!freelancerData) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <PageContainer className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Freelancer tidak ditemukan</h2>
            <p className="text-gray-600 mb-6">Freelancer yang Anda cari tidak tersedia.</p>
            <Link 
              to="/browse" 
              className="inline-flex items-center px-6 py-3 bg-[#010042] text-white rounded-lg hover:bg-[#000030] transition-colors"
            >
              Kembali ke Browse
            </Link>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageContainer padding="px-6 py-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Kembali
        </motion.button>

        {/* Freelancer Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-8 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            {/* Profile Picture and Basic Info */}
            <div className="flex flex-col items-center lg:items-start">
              <div className="relative">
                <img
                  src={freelancerData.profilePhoto || `https://picsum.photos/seed/${freelancerId}/150/150`}
                  alt={freelancerData.displayName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
                {freelancerData.isVerified && (
                  <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-2">
                    <CheckBadgeIcon className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Main Info */}
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {freelancerData.displayName}
                  </h1>
                  {freelancerProfile?.title && (
                    <p className="text-xl text-gray-600 mb-3">{freelancerProfile.title}</p>
                  )}
                  
                  {/* Rating and Reviews */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      {renderStars(Math.round(freelancerProfile?.rating || 0))}
                      <span className="text-lg font-semibold text-gray-900 ml-2">
                        {freelancerProfile?.rating?.toFixed(1) || '0.0'}
                      </span>
                      <span className="text-gray-600 ml-1">
                        ({freelancerProfile?.totalReviews || 0} ulasan)
                      </span>
                    </div>
                    
                    {freelancerProfile?.tier && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        freelancerProfile.tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                        freelancerProfile.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                        freelancerProfile.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {freelancerProfile.tier.charAt(0).toUpperCase() + freelancerProfile.tier.slice(1)}
                      </span>
                    )}
                  </div>

                  {/* Location, Languages, and Portfolio Links */}
                  <div className="flex flex-wrap items-center gap-6 text-gray-600">
                    {freelancerData.location && (
                      <div className="flex items-center">
                        <MapPinIcon className="w-5 h-5 mr-2" />
                        {freelancerData.location.charAt(0).toUpperCase() + freelancerData.location.slice(1)}
                      </div>
                    )}
                    
                    {freelancerProfile?.languages && freelancerProfile.languages.length > 0 && (
                      <div className="flex items-center">
                        <GlobeAltIcon className="w-5 h-5 mr-2" />
                        {freelancerProfile.languages.map(lang => lang.language).join(', ')}
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <ClockIcon className="w-5 h-5 mr-2" />
                      Working Hours: {getWorkingHours(freelancerProfile)}
                    </div>
                  </div>

                  {/* Portfolio/Website Links */}
                  {(freelancerData.portfolioLink || freelancerData.portfolioLinks || freelancerProfile?.portfolioLink || freelancerProfile?.portfolioLinks) && (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-3">
                        {((freelancerData.portfolioLink ? [freelancerData.portfolioLink] : freelancerData.portfolioLinks) || 
                          (freelancerProfile?.portfolioLink ? [freelancerProfile.portfolioLink] : freelancerProfile?.portfolioLinks) || []).map((link, index) => (
                          <a
                            key={index}
                            href={link.startsWith('http') ? link : `https://${link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                          >
                            <GlobeAltIcon className="w-4 h-4 mr-1.5" />
                            Portfolio
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Button */}
                {currentUser && currentUser.uid !== freelancerId && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleContactFreelancer}
                    className="flex items-center px-6 py-3 bg-[#010042] text-white rounded-lg hover:bg-[#000030] transition-colors mt-4 lg:mt-0"
                  >
                    <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                    Contact Freelancer
                  </motion.button>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {freelancerStats.completedProjects}
                  </div>
                  <div className="text-sm text-gray-600">Projects Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {freelancerGigs.length}
                  </div>
                  <div className="text-sm text-gray-600">Active Gigs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {freelancerProfile?.totalReviews || 0}
                  </div>
                  <div className="text-sm text-gray-600">Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {freelancerStats.successRate}%
                  </div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm mb-8"
        >
          <div className="border-b border-gray-200">
            <nav className="px-8 flex space-x-8">
              {[
                { key: 'about', label: 'About', count: null },
                { key: 'gigs', label: 'Gigs', count: freelancerGigs.length },
                { key: 'reviews', label: 'Reviews', count: freelancerReviews.length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'border-[#010042] text-[#010042]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* About Tab */}
            {activeTab === 'about' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Bio */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {freelancerProfile?.bio || freelancerData.bio || 'No bio available.'}
                  </p>
                </div>

                {/* Skills */}
                {freelancerProfile?.skills && freelancerProfile.skills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {freelancerProfile.skills.map((skill, index) => {
                        // Handle both string skills and object skills {skill, experienceLevel}
                        let skillText = '';
                        let expLevel = '';
                        
                        if (typeof skill === 'string') {
                          skillText = skill;
                        } else if (typeof skill === 'object' && skill !== null) {
                          skillText = skill.skill || skill.name || skill.skillName || String(skill);
                          expLevel = skill.experienceLevel ? ` (${skill.experienceLevel})` : '';
                        } else {
                          skillText = String(skill);
                        }
                        
                        return (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {skillText}{expLevel}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Education & Certifications - Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Education Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-[#010042]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                      Education
                    </h3>
                    <div className="space-y-4">
                      {((freelancerProfile?.education && Array.isArray(freelancerProfile.education) && freelancerProfile.education.length > 0) || 
                        (freelancerData?.education && Array.isArray(freelancerData.education) && freelancerData.education.length > 0)) ? (
                        <>
                          {(showAllEducation 
                            ? (freelancerProfile?.education || freelancerData?.education || [])
                            : (freelancerProfile?.education || freelancerData?.education || []).slice(0, 3)
                          ).map((edu, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-semibold text-gray-900">
                                {edu?.degree || edu?.title || edu?.name || edu?.major || edu?.fieldOfStudy || 'Unknown Degree'}
                                {edu?.fieldOfStudy && edu?.fieldOfStudy !== (edu?.degree || edu?.title || edu?.name || edu?.major) ? ` in ${edu.fieldOfStudy}` : ''}
                              </h4>
                              <p className="text-gray-600">
                                {edu?.institution || edu?.university || edu?.school || edu?.college || 'Unknown Institution'}
                                {edu?.country ? ` (${edu.country})` : ''}
                              </p>
                              <p className="text-gray-500 text-sm">
                                ({edu?.year || edu?.graduationYear || edu?.endYear || edu?.duration || edu?.period || 'Unknown Year'})
                              </p>
                            </div>
                          ))}
                          {(freelancerProfile?.education || freelancerData?.education || []).length > 3 && (
                            <button
                              onClick={() => setShowAllEducation(!showAllEducation)}
                              className="w-full mt-3 px-4 py-2 text-sm font-medium text-[#010042] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center"
                            >
                              {showAllEducation ? (
                                <>
                                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                  Show less
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                  Show more ({(freelancerProfile?.education || freelancerData?.education || []).length - 3} more)
                                </>
                              )}
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                          <p className="text-gray-500 italic">No education information available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Certifications Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-[#010042]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      Certifications
                    </h3>
                    <div className="space-y-4">
                      {((freelancerProfile?.certifications && Array.isArray(freelancerProfile.certifications) && freelancerProfile.certifications.length > 0) || 
                        (freelancerData?.certifications && Array.isArray(freelancerData.certifications) && freelancerData.certifications.length > 0)) ? (
                        <>
                          {(showAllCertifications 
                            ? (freelancerProfile?.certifications || freelancerData?.certifications || [])
                            : (freelancerProfile?.certifications || freelancerData?.certifications || []).slice(0, 3)
                          ).map((cert, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-semibold text-gray-900">
                                {cert?.name || cert?.title || cert?.certification || 'Unknown Certification'}
                              </h4>
                              <p className="text-gray-600">
                                {cert?.issuer || cert?.issuedBy || cert?.organization || cert?.company ? 
                                  `dari ${cert?.issuer || cert?.issuedBy || cert?.organization || cert?.company}` : 
                                  'Penerbit tidak disebutkan'}
                              </p>
                              <p className="text-gray-500 text-sm">
                                ({cert?.year || cert?.issueYear || cert?.date || cert?.issueDate || 'Tahun tidak disebutkan'})
                              </p>
                              {cert?.description && (
                                <p className="text-gray-600 text-sm mt-2">{cert.description}</p>
                              )}
                              {cert?.credentialId && (
                                <p className="text-gray-500 text-xs mt-1">ID: {cert.credentialId}</p>
                              )}
                            </div>
                          ))}
                          {(freelancerProfile?.certifications || freelancerData?.certifications || []).length > 3 && (
                            <button
                              onClick={() => setShowAllCertifications(!showAllCertifications)}
                              className="w-full mt-3 px-4 py-2 text-sm font-medium text-[#010042] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center"
                            >
                              {showAllCertifications ? (
                                <>
                                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                  Show less
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                  Show more ({(freelancerProfile?.certifications || freelancerData?.certifications || []).length - 3} more)
                                </>
                              )}
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                          <p className="text-gray-500 italic">No certifications available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Work Experience */}
                {(freelancerProfile?.workExperience || freelancerData?.workExperience) && (freelancerProfile?.workExperience || freelancerData?.workExperience).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Experience</h3>
                    <div className="space-y-4">
                      {(freelancerProfile?.workExperience || freelancerData?.workExperience || []).map((work, index) => (
                        <div key={index} className="flex items-start">
                          <BriefcaseIcon className="w-6 h-6 text-gray-400 mr-3 mt-1" />
                          <div>
                            <h4 className="font-medium text-gray-900">{work.position}</h4>
                            <p className="text-gray-600">{work.company}</p>
                            <p className="text-gray-500 text-sm">{work.duration}</p>
                            {work.description && (
                              <p className="text-gray-600 text-sm mt-2">{work.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Gigs Tab */}
            {activeTab === 'gigs' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {freelancerGigs.length > 0 ? (
                  freelancerGigs.map((gig) => (
                    <motion.div
                      key={gig.id}
                      whileHover={{ y: -5 }}
                      className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
                    >
                      <Link to={`/gig/${gig.id}`}>
                        <img
                          src={gig.images?.[0] || 'https://picsum.photos/400/250'}
                          alt={gig.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                            {gig.title}
                          </h3>
                          <div className="flex items-center gap-1 mb-3">
                            {renderStars(Math.round(gig.rating || 0))}
                            <span className="text-sm text-gray-600 ml-1">
                              ({gig.totalReviews || 0})
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Starting at</span>
                            <span className="text-lg font-bold text-gray-900">
                              {formatCurrency(gig.packages?.basic?.price || 0)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">No active gigs found.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {freelancerReviews.length > 0 ? (
                  freelancerReviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex items-start gap-4">
                        <img
                          src={review.client?.profilePhoto || `https://picsum.photos/seed/${review.clientId}/40/40`}
                          alt={review.client?.displayName || 'Client'}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {review.client?.displayName || 'Client'}
                              </h4>
                              <div className="flex items-center gap-1 mt-1">
                                {renderStars(review.rating)}
                                <span className="text-sm text-gray-600 ml-2">
                                  {new Date(review.createdAt?.seconds * 1000).toLocaleDateString('id-ID')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-600 whitespace-pre-wrap">{review.comment}</p>
                          {review.response && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-600 font-medium mb-1">Freelancer response:</p>
                              <p className="text-gray-700 whitespace-pre-wrap">{review.response}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No reviews yet.</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </PageContainer>
    </div>
  );
} 