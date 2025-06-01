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
import {
  StarIcon,
  MapPinIcon,
  ClockIcon,
  CheckBadgeIcon,
  ChatBubbleLeftRightIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  TrophyIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

export default function FreelancerProfile() {
  const { freelancerId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [freelancerData, setFreelancerData] = useState(null);
  const [freelancerProfile, setFreelancerProfile] = useState(null);
  const [freelancerGigs, setFreelancerGigs] = useState([]);
  const [freelancerReviews, setFreelancerReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    loadFreelancerData();
  }, [freelancerId]);

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

      // Load freelancer profile
      try {
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
          
          // Debug logging for education and certification data
          console.log('🎓 DEBUG: Education data:', profileData.education);
          console.log('📜 DEBUG: Certification data:', profileData.certifications);
          console.log('🔍 DEBUG: Full profile data:', profileData);
        }
        
        setFreelancerProfile(profileData);
      } catch (profileError) {
        console.error('Error loading freelancer profile:', profileError);
        setFreelancerProfile(null);
      }

      // Load freelancer gigs with error handling for missing index
      try {
        const gigsQuery = query(
          collection(db, 'gigs'),
          where('userId', '==', freelancerId),
          where('isActive', '==', true),
          orderBy('createdAt', 'desc')
        );
        
        const gigsSnapshot = await getDocs(gigsQuery);
        const gigsData = [];
        
        // Process each gig and calculate its rating
        for (const gigDoc of gigsSnapshot.docs) {
          const gigData = { id: gigDoc.id, ...gigDoc.data() };
          
          // Calculate rating for this specific gig
          try {
            const gigReviewsQuery = query(
              collection(db, 'reviews'),
              where('gigId', '==', gigDoc.id),
              where('status', '==', 'published')
            );
            
            const gigReviewsSnapshot = await getDocs(gigReviewsQuery);
            let totalRating = 0;
            let reviewCount = 0;
            
            gigReviewsSnapshot.forEach(reviewDoc => {
              const review = reviewDoc.data();
              totalRating += review.rating || 0;
              reviewCount++;
            });
            
            gigData.rating = reviewCount > 0 ? Math.round((totalRating / reviewCount) * 10) / 10 : 0;
            gigData.totalReviews = reviewCount;
            
            console.log(`📊 Gig "${gigData.title}" rating: ${gigData.rating} (${reviewCount} reviews)`);
          } catch (reviewError) {
            console.warn('Error calculating gig rating:', reviewError);
            gigData.rating = 0;
            gigData.totalReviews = 0;
          }
          
          gigsData.push(gigData);
        }
        
        setFreelancerGigs(gigsData);
        console.log('✅ Loaded gigs with ratings:', gigsData.map(g => `${g.title}: ${g.rating}`));
      } catch (gigsError) {
        console.info('📋 Using fallback query for gigs (no composite index):', gigsError.message);
        // Fallback: Load gigs without ordering if index is missing
        try {
          const fallbackGigsQuery = query(
            collection(db, 'gigs'),
            where('userId', '==', freelancerId),
            where('isActive', '==', true)
          );
          
          const fallbackGigsSnapshot = await getDocs(fallbackGigsQuery);
          const fallbackGigsData = [];
          
          // Process each gig and calculate its rating (fallback)
          for (const gigDoc of fallbackGigsSnapshot.docs) {
            const gigData = { id: gigDoc.id, ...gigDoc.data() };
            
            // Calculate rating for this specific gig
            try {
              const gigReviewsQuery = query(
                collection(db, 'reviews'),
                where('gigId', '==', gigDoc.id)
              );
              
              const gigReviewsSnapshot = await getDocs(gigReviewsQuery);
              let totalRating = 0;
              let reviewCount = 0;
              
              gigReviewsSnapshot.forEach(reviewDoc => {
                const review = reviewDoc.data();
                if (review.status === 'published') {
                  totalRating += review.rating || 0;
                  reviewCount++;
                }
              });
              
              gigData.rating = reviewCount > 0 ? Math.round((totalRating / reviewCount) * 10) / 10 : 0;
              gigData.totalReviews = reviewCount;
            } catch (reviewError) {
              console.warn('Error calculating gig rating (fallback):', reviewError);
              gigData.rating = 0;
              gigData.totalReviews = 0;
            }
            
            fallbackGigsData.push(gigData);
          }
          
          // Sort manually by createdAt if available
          fallbackGigsData.sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
          });
          
          setFreelancerGigs(fallbackGigsData);
          console.log('✅ Loaded gigs with ratings (fallback):', fallbackGigsData.map(g => `${g.title}: ${g.rating}`));
        } catch (fallbackError) {
          console.error('Error loading gigs with fallback query:', fallbackError);
          setFreelancerGigs([]);
        }
      }

      // Load freelancer reviews
      try {
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('freelancerId', '==', freelancerId),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsData = [];
        
        for (const reviewDoc of reviewsSnapshot.docs) {
          const reviewData = reviewDoc.data();
          
          // Get client data for each review
          try {
            const clientDoc = await getDoc(doc(db, 'users', reviewData.clientId));
            if (clientDoc.exists()) {
              reviewData.client = { id: clientDoc.id, ...clientDoc.data() };
            }
          } catch (clientError) {
            console.warn('Error loading client data for review:', clientError);
            reviewData.client = { displayName: 'Unknown Client' };
          }
          
          reviewsData.push({ id: reviewDoc.id, ...reviewData });
        }
        
        setFreelancerReviews(reviewsData);
      } catch (reviewsError) {
        console.info('📋 Using fallback query for reviews (no composite index):', reviewsError.message);
        // Fallback: Load reviews without ordering if index is missing
        try {
          const fallbackReviewsQuery = query(
            collection(db, 'reviews'),
            where('freelancerId', '==', freelancerId),
            limit(10)
          );
          
          const fallbackReviewsSnapshot = await getDocs(fallbackReviewsQuery);
          const fallbackReviewsData = [];
          
          for (const reviewDoc of fallbackReviewsSnapshot.docs) {
            const reviewData = reviewDoc.data();
            
            // Get client data for each review
            try {
              const clientDoc = await getDoc(doc(db, 'users', reviewData.clientId));
              if (clientDoc.exists()) {
                reviewData.client = { id: clientDoc.id, ...clientDoc.data() };
              }
            } catch (clientError) {
              console.warn('Error loading client data for review:', clientError);
              reviewData.client = { displayName: 'Unknown Client' };
            }
            
            fallbackReviewsData.push({ id: reviewDoc.id, ...reviewData });
          }
          
          // Sort manually by createdAt if available
          fallbackReviewsData.sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
          });
          
          setFreelancerReviews(fallbackReviewsData);
        } catch (fallbackError) {
          console.error('Error loading reviews with fallback query:', fallbackError);
          setFreelancerReviews([]);
        }
      }
      
    } catch (error) {
      console.error('Error loading freelancer data:', error);
      // Set default empty states on error to prevent crashes
      setFreelancerData(null);
      setFreelancerProfile(null);
      setFreelancerGigs([]);
      setFreelancerReviews([]);
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

  const getResponseTime = (profileData) => {
    if (profileData?.averageResponseTime) {
      const hours = profileData.averageResponseTime;
      if (hours < 1) return 'Kurang dari 1 jam';
      if (hours < 24) return `${Math.round(hours)} jam`;
      return `${Math.round(hours / 24)} hari`;
    }
    return 'Tidak tersedia';
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

  /**
   * Safely render a skill item, handling both string and object formats
   * @param {string|object} skillItem - The skill item to render
   * @param {number} index - The index for the React key
   * @returns {JSX.Element|null} The rendered skill component or null if invalid
   */
  const renderSkillItem = (skillItem, index) => {
    let skillName = '';
    let experienceLevel = '';
    
    if (typeof skillItem === 'string') {
      skillName = skillItem;
    } else if (typeof skillItem === 'object' && skillItem !== null) {
      skillName = skillItem.skill || skillItem.name || '';
      experienceLevel = skillItem.experienceLevel || '';
    }
    
    // Ensure we have a valid skill name
    if (!skillName) {
      console.warn('Invalid skill item at index', index, ':', skillItem);
      return null;
    }
    
    return (
      <span
        key={index}
        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
      >
        {skillName}
        {experienceLevel && (
          <span className="ml-1 text-blue-600 font-medium">
            ({experienceLevel})
          </span>
        )}
      </span>
    );
  };

  /**
   * Capitalize location name properly
   * @param {string} location - Location string
   * @returns {string} Properly capitalized location
   */
  const capitalizeLocation = (location) => {
    if (!location) return '';
    return location.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  /**
   * Check if array has valid data
   * @param {Array} arr - Array to check
   * @returns {boolean} True if array has valid data
   */
  const hasValidData = (arr) => {
    return Array.isArray(arr) && arr.length > 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#010042] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading freelancer profile...</p>
        </div>
      </div>
    );
  }

  if (!freelancerData) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
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
                  src={freelancerData.profilePhoto || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face&auto=format`}
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
                  </div>

                  {/* Location, Languages, and Website */}
                  <div className="flex flex-wrap items-center gap-6 text-gray-600">
                    {freelancerProfile?.location && (
                      <div className="flex items-center">
                        <MapPinIcon className="w-5 h-5 mr-2" />
                        {capitalizeLocation(freelancerProfile.location)}
                      </div>
                    )}
                    
                    {hasValidData(freelancerProfile?.languages) && (
                      <div className="flex items-center">
                        <GlobeAltIcon className="w-5 h-5 mr-2" />
                        {freelancerProfile.languages.map(lang => 
                          typeof lang === 'string' ? lang : lang.language || lang
                        ).join(', ')}
                      </div>
                    )}
                    
                    {freelancerProfile?.website && (
                      <div className="flex items-center">
                        <GlobeAltIcon className="w-5 h-5 mr-2" />
                        <a 
                          href={freelancerProfile.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Website
                        </a>
                      </div>
                    )}
                    
                    {freelancerProfile?.averageResponseTime && (
                      <div className="flex items-center">
                        <ClockIcon className="w-5 h-5 mr-2" />
                        Response time: {getResponseTime(freelancerProfile)}
                      </div>
                    )}
                  </div>
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
                    {freelancerProfile?.completedProjects || 0}
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
                    {Math.round(((freelancerProfile?.completedProjects || 0) / Math.max((freelancerProfile?.completedProjects || 0) + (freelancerProfile?.cancelledProjects || 0), 1)) * 100)}%
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
                {(freelancerProfile?.bio || freelancerData?.bio) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {freelancerProfile?.bio || freelancerData?.bio}
                    </p>
                  </div>
                )}

                {/* Skills */}
                {hasValidData(freelancerProfile?.skills) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {freelancerProfile.skills.map(renderSkillItem)}
                    </div>
                  </div>
                )}

                {/* Education */}
                {hasValidData(freelancerProfile?.education) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Education</h3>
                    <div className="space-y-4">
                      {freelancerProfile.education.map((edu, index) => {
                        // Handle different possible field names for education
                        const degree = edu.degree || edu.title || 'Unknown Degree';
                        const institution = edu.university || edu.institution || edu.school || 'Unknown Institution';
                        const year = edu.graduationYear || edu.year || edu.endYear || '';
                        const fieldOfStudy = edu.fieldOfStudy || edu.major || '';
                        
                        return (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start">
                              <AcademicCapIcon className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">
                                  {degree}
                                  {fieldOfStudy && ` in ${fieldOfStudy}`}
                                </h4>
                                <p className="text-gray-600 mt-1">{institution}</p>
                                {year && (
                                  <p className="text-blue-600 text-sm mt-1">{year}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Work Experience */}
                {hasValidData(freelancerProfile?.workExperience) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Experience</h3>
                    <div className="space-y-4">
                      {freelancerProfile.workExperience.map((work, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start">
                            <BriefcaseIcon className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              {work.position && <h4 className="font-medium text-gray-900">{work.position}</h4>}
                              {work.company && <p className="text-gray-600 mt-1">{work.company}</p>}
                              {work.duration && <p className="text-blue-600 text-sm mt-1">{work.duration}</p>}
                              {work.description && (
                                <p className="text-gray-600 text-sm mt-2">{work.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {hasValidData(freelancerProfile?.certifications) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h3>
                    <div className="space-y-4">
                      {freelancerProfile.certifications.map((cert, index) => {
                        // Handle different possible field names for certifications
                        const name = cert.name || cert.title || 'Unknown Certification';
                        const issuer = cert.issuedBy || cert.issuer || cert.organization || 'Unknown Issuer';
                        const year = cert.year || cert.issueYear || cert.date || '';
                        
                        return (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start">
                              <TrophyIcon className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{name}</h4>
                                <p className="text-gray-600 mt-1">{issuer}</p>
                                {year && (
                                  <p className="text-blue-600 text-sm mt-1">{year}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
                          src={review.client?.profilePhoto || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face&auto=format`}
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
                          <p className="text-gray-600">{review.comment}</p>
                          {review.response && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-600 font-medium mb-1">Freelancer response:</p>
                              <p className="text-gray-700">{review.response}</p>
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
      </div>
    </div>
  );
} 