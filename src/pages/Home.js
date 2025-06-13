import { Link, useNavigate } from 'react-router-dom';
import { TypeAnimation } from 'react-type-animation';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../utils/constants';
import GigCard from '../components/common/GigCard';
import gigService from '../services/gigService';
import FreelancerCTA from '../components/UI/FreelancerCTA';
import ErrorPopup from '../components/common/ErrorPopup';
import SuccessPopup from '../components/common/SuccessPopup';

export default function Home() {
  const { currentUser, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [gigs, setGigs] = useState([]);
  const [gigsLoading, setGigsLoading] = useState(true);
  const searchBoxRef = useRef(null);
  
  // Notification states
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Handle clicks outside the search box
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };

    // Add event listener when search is focused
    if (isSearchFocused) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchFocused]);

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Categories data
  const categories = [
    { icon: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z", name: "Design & Creative" },
    { icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4", name: "Programming & Tech" },
    { icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", name: "Writing & Translation" },
    { icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", name: "Digital Marketing" },
    { icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", name: "Business" },
    { icon: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z", name: "Customer Support" },
    { icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z", name: "Video & Animation" }
  ];

  // Fetch gigs and calculate reviews
  useEffect(() => {
    const fetchGigsAndReviews = async () => {
      setGigsLoading(true);
      try {
        // Fetch gigs
        const fetchedGigs = await gigService.getFeaturedGigs(12);
        
        // For each gig, fetch and calculate its reviews
        const gigsWithReviews = await Promise.all(
          fetchedGigs.map(async (gig) => {
            // Query reviews for this specific gig
            const reviewsQuery = query(
              collection(db, COLLECTIONS.REVIEWS),
              where('gigId', '==', gig.id)
            );
            const reviewsSnapshot = await getDocs(reviewsQuery);
            
            // Calculate average rating and total reviews
            let totalRating = 0;
            const reviews = [];
            
            reviewsSnapshot.forEach((doc) => {
              const review = doc.data();
              reviews.push({ id: doc.id, ...review });
              totalRating += review.rating || 0;
            });
            
            const totalReviews = reviews.length;
            const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;
            
            // Calculate rating distribution
            const ratingDistribution = {
              5: reviews.filter(r => r.rating === 5).length,
              4: reviews.filter(r => r.rating === 4).length,
              3: reviews.filter(r => r.rating === 3).length,
              2: reviews.filter(r => r.rating === 2).length,
              1: reviews.filter(r => r.rating === 1).length
            };
            
            return {
              ...gig,
              rating: averageRating,
              totalReviews,
              ratingDistribution
            };
          })
        );
        
        setGigs(gigsWithReviews);
      } catch (error) {
        console.error('Error fetching gigs and reviews:', error);
      } finally {
        setGigsLoading(false);
      }
    };

    fetchGigsAndReviews();
  }, []);

  // Filter gigs based on selected category
  const filteredGigs = activeCategory === 'All' 
    ? gigs 
    : gigs.filter(gig => gig.category === activeCategory);

  // Sort gigs by newest first (createdAt in descending order)
  const sortedGigs = filteredGigs.sort((a, b) => {
    // Handle cases where createdAt might be a Firestore Timestamp or Date object
    let aDate, bDate;
    
    if (a.createdAt?.toDate) {
      // Firestore Timestamp
      aDate = a.createdAt.toDate();
    } else if (a.createdAt instanceof Date) {
      // JavaScript Date
      aDate = a.createdAt;
    } else if (typeof a.createdAt === 'string') {
      // String date
      aDate = new Date(a.createdAt);
    } else {
      // Fallback to current time for gigs without date
      aDate = new Date(0);
    }
    
    if (b.createdAt?.toDate) {
      // Firestore Timestamp
      bDate = b.createdAt.toDate();
    } else if (b.createdAt instanceof Date) {
      // JavaScript Date
      bDate = b.createdAt;
    } else if (typeof b.createdAt === 'string') {
      // String date
      bDate = new Date(b.createdAt);
    } else {
      // Fallback to current time for gigs without date
      bDate = new Date(0);
    }
    
    // Sort in descending order (newest first)
    return bDate.getTime() - aDate.getTime();
  });

  // Take only 12 gigs for display
  const displayedGigs = sortedGigs.slice(0, 12);

  // Gabungkan data user dari currentUser dan userProfile untuk mendapatkan gambaran lengkap
  // PENTING: userProfile harus didahulukan untuk memastikan field isFreelancer dari users collection digunakan
  let userData = null;
  
  // Hanya proses data jika tidak sedang loading dan ada currentUser
  if (!loading && currentUser) {
    userData = { ...userProfile, ...currentUser };
    
    // Pastikan field penting dari userProfile (authoritative source) tidak tertimpa
    if (userProfile) {
      if (typeof userProfile.isFreelancer !== 'undefined') {
        userData.isFreelancer = userProfile.isFreelancer;
      }
      if (userProfile.roles) {
        userData.roles = userProfile.roles;
      }
    }
  }
  
  // CRITICAL: Don't show freelancer banner if data is still loading or userProfile is null
  // This prevents the race condition where banner shows before data loads
  const isDataReady = !loading && currentUser && userProfile !== null;
  
  // User bisa dianggap client jika tidak ada freelancer flag
  const isClient = !!userData && !userData.isFreelancer;
                  
  // User dianggap freelancer jika secara eksplisit ditandai dengan isFreelancer = true
  const isFreelancer = !!userData && userData.isFreelancer === true;
  
  
  // Logging detail untuk debugging
  console.log('HOME.js DEBUG - Data Sources:');
  console.log('- loading:', loading);
  console.log('- currentUser:', currentUser);
  console.log('- userProfile:', userProfile);
  console.log('- userData (combined):', userData);
  console.log('- isDataReady:', isDataReady);
  console.log('');
  console.log('HOME.js DEBUG - Freelancer Detection:');
  console.log('- userData.isFreelancer:', userData?.isFreelancer);
  console.log('- isClient:', isClient);
  console.log('- isFreelancer:', isFreelancer);

  return (
    <div className="font-sans">
      {/* Error and Success Popups */}
      {error && <ErrorPopup message={error} onClose={() => setError('')} />}
      {success && <SuccessPopup message={success} onClose={() => setSuccess('')} />}

      {/* Main content for logged in or non-logged in users */}
      {/* Hero Section with Video Background - Always shown */}
      <div className="relative h-[90vh] flex items-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full">
          {/* Video for desktop and tablet */}
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover hidden sm:block"
            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Crect width='1920' height='1080' fill='%23010042'/%3E%3C/svg%3E"
            onLoadStart={() => console.log('Video loading started')}
            onCanPlay={() => console.log('Video can play')}
            onError={(e) => console.error('Video error:', e)}
          >
            <source src="https://res.cloudinary.com/dk45bajkj/video/upload/v1749840053/thumbnail_video_thtrm4.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Fallback gradient background for mobile */}
          <div className="absolute inset-0 w-full h-full sm:hidden bg-gradient-to-br from-[#010042] via-[#0100a3] to-[#010042]"></div>
          
          {/* Dark overlay to ensure text readability - Fiverr style gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>
        </div>

        {/* Floating animation elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white/40 rounded-full animate-ping"></div>
          <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce"></div>
          <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-white/30 rounded-full animate-pulse"></div>
        </div>

        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
            <div className="text-left space-y-3 sm:space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-lg">
                SkillNusa
              </h1>
              <div className="text-lg sm:text-xl lg:text-2xl text-white leading-relaxed mb-4 w-full">
                <div className="min-h-[70px] sm:min-h-[80px] lg:min-h-[90px] flex items-center">
                  <TypeAnimation
                    sequence={[
                      'Hubungkan dengan freelancer terbaik Indonesia',
                      2500,
                      'Wujudkan proyek impian dengan talenta lokal',
                      2500,
                      'Kembangkan bisnis bersama ahli teknologi',
                      2500,
                      'Solusi kreatif dari para profesional muda',
                      2500,
                    ]}
                    wrapper="p"
                    speed={60}
                    deletionSpeed={50}
                    style={{ 
                      display: 'block',
                      width: '100%',
                      textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
                      fontWeight: '600',
                      lineHeight: '1.3'
                    }}
                    repeat={Infinity}
                  />
                </div>
              </div>
              
              {/* Search section - only show for non-logged in users */}
              {!currentUser && (
                <div className="w-full max-w-3xl">
                  <form 
                    className="w-full mb-4"
                    onSubmit={handleSearchSubmit}
                  >
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Apa yang ingin Anda kerjakan hari ini?"
                          className="w-full px-8 py-4 rounded-2xl border-none text-base bg-white/95 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-2xl transition-all duration-300 focus:bg-white"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button 
                          type="submit" 
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-[#010042] to-[#0100a3] text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 font-medium text-sm"
                        >
                          Cari
                        </button>
                      </div>
                    </div>
                  </form>
                  
                  {/* Enhanced service categories without emoticons */}
                  <div className="space-y-2">
                    <p className="text-white/90 text-sm font-medium">Layanan Populer:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Website Development', 
                        'iOS Development',
                        'UI/UX Design',
                        'Android Development',
                      ].map((service, index) => (
                        <button
                          key={index}
                          onClick={() => navigate(`/browse?search=${encodeURIComponent(service)}`)}
                          className="px-3 py-1.5 bg-white/15 backdrop-blur-sm text-white text-sm rounded-full hover:bg-white/25 transition-all duration-300 hover:scale-105 hover:shadow-lg border border-white/20 font-medium"
                        >
                          {service}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Stats showcase - SkillNusa Innovation */}
              <div className="w-full max-w-3xl mt-6 lg:mt-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  {[
                    { title: 'Terpercaya', description: 'Keamanan Terjamin' },
                    { title: 'Proses Cepat', description: 'Respons dalam 24 jam' },
                    { title: 'Kualitas Terbaik', description: 'Freelancer terverifikasi' },
                    { title: 'AI-Powered', description: 'Matching otomatis' }
                  ].map((feature, index) => (
                    <div key={index} className="text-left group">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 lg:p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                        <div className="text-base lg:text-lg font-bold text-white mb-1">{feature.title}</div>
                        <div className="text-white/70 text-xs lg:text-sm">{feature.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SkillBot AI Banner Section - untuk semua user yang sudah login */}
      {currentUser && (
        <div className="bg-gray-50 py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="bg-gradient-to-r from-[#010042]/95 to-[#0100a3]/95 rounded-xl p-6 sm:p-8 lg:p-12 shadow-xl">
              <div className="flex flex-col lg:flex-row items-center justify-between">
                <div className="mb-6 lg:mb-0 lg:max-w-2xl text-center lg:text-left">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4">
                    Meet SkillBot: Your AI-Powered Freelancer Finder
                  </h2>
                  <p className="text-white/90 mb-6 text-sm sm:text-base lg:text-lg leading-relaxed">
                    Sistem rekomendasi AI kami membantu mencocokkan freelancer terbaik untuk proyek spesifik Anda. Biarkan SkillBot menemukan talenta yang tepat.
                  </p>
                  <Link
                    to="/messages?chatId=skillbot"
                    className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-white rounded-lg text-[#010042] font-semibold transition-all hover:bg-opacity-90 hover:shadow-lg hover:transform hover:scale-105 text-sm sm:text-base lg:text-lg">
                    Coba SkillBot
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 ml-2 sm:ml-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
                <div className="hidden lg:block lg:ml-8 flex-shrink-0">
                  <img
                    src="https://res.cloudinary.com/dk45bajkj/image/upload/v1749731668/robot_fmhoet.png"
                    alt="AI Matching"
                    className="rounded-lg shadow-lg h-40 xl:h-48 w-auto object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popular Categories Section - Compact */}
      <div className="bg-gray-50 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-[#010042] text-center sm:text-left">Kategori Populer</h2>
            <Link 
              to="/browse"
              className="text-sm text-[#010042] hover:underline flex items-center justify-center sm:justify-start gap-2 bg-transparent hover:text-[#0100a3] transition-all duration-200"
            >
              Lihat semua kategori
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3 sm:gap-4">
            {[
              { icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4", name: "Programming & Tech", displayName: "Programming & Tech" },
              { icon: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z", name: "Design & Creative", displayName: "Design & Creative" },
              { icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", name: "Digital Marketing", displayName: "Digital Marketing" },
              { icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", name: "Writing & Translation", displayName: "Writing & Translation" },
              { icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z", name: "Video & Animation", displayName: "Video & Animation" },
              { icon: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3", name: "Music & Audio", displayName: "Music & Audio" },
              { icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", name: "Business", displayName: "Business" }
            ].map((category, index) => (
              <Link key={index} to={`/browse?category=${encodeURIComponent(category.name)}`} className="group">
                <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 transition-all duration-300 hover:shadow-md hover:border-[#010042]/30 h-full flex flex-col items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-[#010042]/10 transition-all duration-300 group-hover:bg-[#010042]/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-[#010042]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={category.icon} />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-800 text-xs sm:text-sm text-center leading-tight">{category.displayName}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Gigs Section with Category Filter */}
      <div className="bg-gray-50 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-[#010042] text-center sm:text-left">Gigs Terbaru</h2>
            <Link 
              to="/browse"
              className="text-sm text-[#010042] hover:underline flex items-center justify-center sm:justify-start gap-2 bg-transparent hover:text-[#0100a3] transition-all duration-200"
            >
              Lihat semua gigs
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Category Filters */}
          <div className="mb-6 overflow-x-auto pb-2">
            <div className="flex space-x-2 min-w-max px-1">
              <button
                onClick={() => setActiveCategory('All')}
                className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeCategory === 'All' 
                    ? 'bg-[#010042] text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Semua
              </button>
              
              {categories.map((category, index) => (
                <button
                  key={index}
                  onClick={() => setActiveCategory(category.name)}
                  className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    activeCategory === category.name 
                      ? 'bg-[#010042] text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Gigs Grid */}
          {gigsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                  <div className="bg-gray-300 h-40 sm:h-48 rounded mb-4"></div>
                  <div className="bg-gray-300 h-4 rounded mb-2"></div>
                  <div className="bg-gray-300 h-4 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : displayedGigs.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-gray-600 text-sm sm:text-base">Tidak ada gigs yang ditemukan untuk kategori ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {displayedGigs.map((gig) => (
                <GigCard 
                  key={gig.id} 
                  gig={gig}
                  showFavoriteButton={true}
                />
              ))}
            </div>
          )}

          <div className="flex justify-center mt-8 sm:mt-10">
            <Link 
              to="/browse"
              className="px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium bg-transparent border border-[#010042] text-[#010042] rounded-lg transition-all duration-300 hover:bg-[#010042] hover:text-white hover:shadow-md hover:transform hover:scale-105"
            >
              Lihat Semua Gigs
            </Link>
          </div>
        </div>
      </div>

      {/* Banner `Freelancer`CTA - ditampilkan hanya untuk user yang login sebagai client tapi belum menjadi freelancer */}
      {currentUser && !isFreelancer && (
        <div className="mb-6 relative z-10">
          <FreelancerCTA variant="home" />
        </div>
      )}

      {/* Banner Ajakan Register - hanya ditampilkan untuk pengguna yang belum login */}
      {!currentUser && (
        <div className="bg-[#010042] py-8 sm:py-12 border-t border-[#0100a3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Siap untuk memulai dengan SkillNusa?</h2>
              <p className="text-white/80 max-w-2xl mx-auto mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg">
                Daftarkan diri Anda sekarang dan mulai mendapatkan akses ke ribuan freelancer berbakat atau klien potensial di seluruh Indonesia.
              </p>
              <Link 
                to="/register"
                className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white rounded-lg text-[#010042] font-medium hover:bg-gray-100 transition-all text-sm sm:text-base"
              >
                Daftar Sekarang
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}