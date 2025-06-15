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

  // Guides state for freelancer section
  const [guides, setGuides] = useState([]);
  const [guidesLoading, setGuidesLoading] = useState(true);
  const [selectedGuide, setSelectedGuide] = useState(null);

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

  // Sample guides data - same structure as FreelancerGuides.js
  const sampleGuides = [
    {
      id: '1',
      title: 'Cara Membuat Gigs di Fiverr bagi Pemula 2025',
      description: 'Cara membuat Gigs secara cepat dan mudah.',
      thumbnail: 'https://img.youtube.com/vi/4NMJW_YRog8/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/4NMJW_YRog8',
      duration: '13:35',
      category: 'Membuat Gig',
      views: 1234,
      likes: 89,
      publishedAt: new Date('2024-02-28')
    },
    {
      id: '2',
      title: 'Rumus Untuk Menentukan Harga Jasa Freelance Kita',
      description: 'Berbagi pengalaman profesional di dunia freelance, khususnya dalam menentukan strategi harga yang tepat',
      thumbnail: 'https://img.youtube.com/vi/2q7G5NouvBo/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/2q7G5NouvBo',
      duration: '7:55',
      category: 'Pricing Strategy',
      views: 2341,
      likes: 156,
      publishedAt: new Date('2021-03-09')
    },
    {
      id: '3',
      title: 'Komunikasi Efektif dengan Client',
      description: 'Cara berkomunikasi profesional untuk membangun hubungan jangka panjang',
      thumbnail: 'https://img.youtube.com/vi/lCioIb6GLXY/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/lCioIb6GLXY',
      duration: '10:06',
      category: 'Komunikasi Client',
      views: 3456,
      likes: 234,
      publishedAt: new Date('2023-10-11')
    },
    {
      id: '4',
      title: 'Tips Memulai Karir Sebagai Freelancer Pemula!',
      description: 'Membagikan tips dan cara untuk memulai karir sebagai seorang freelancer pemula',
      thumbnail: 'https://img.youtube.com/vi/4ao9ie7vneE/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/4ao9ie7vneE',
      duration: '5:49',
      category: 'Memulai',
      views: 5678,
      likes: 456,
      publishedAt: new Date('2023-03-07')
    },
    {
      id: '5',
      title: 'Cara Membuat Portofolio Kerja Remote untuk Pemula',
      description: 'Membahas langkah-langkah dalam menyusun portofolio profesional.',
      thumbnail: 'https://img.youtube.com/vi/AP39tJnIQP8/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/AP39tJnIQP8',
      duration: '7:06',
      category: 'Portfolio',
      views: 4321,
      likes: 321,
      publishedAt: new Date('2025-01-14')
    },
    {
      id: '6',
      title: 'Belajar Digital Marketing dari 0',
      description: 'Strategi pemasaran personal branding untuk meningkatkan visibility',
      thumbnail: 'https://img.youtube.com/vi/aQbZdee5PXI/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/aQbZdee5PXI',
      duration: '9:24',
      category: 'Marketing',
      views: 2890,
      likes: 198,
      publishedAt: new Date('2023-10-01')
    },
    {
      id: '7',
      title: 'Gimana sih Jadi Freelancer? Dari Pemula Jadi FREELANCER Sukses di 2021!',
      description: 'Video ini membahas tentang bagaimana menjadi seorang freelancer yang sukses, mulai dari pemula hingga menjadi profesional di tahun 2021.',
      thumbnail: 'https://img.youtube.com/vi/BoXWT9Rv8ZA/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/BoXWT9Rv8ZA',
      duration: '23:11',
      category: 'Tips Sukses',
      views: 171415,
      likes: 6771,
      publishedAt: new Date('2021-02-19')
    },
    {
      id: '8',
      title: "Cara Merespon Client Yang Pesan Desain & Minta Revisi Terus",
      description: "Video ini memberikan tips tentang cara merespons klien yang memesan desain dan terus-menerus meminta revisi.",
      thumbnail: "https://img.youtube.com/vi/5P_L-7rnaFc/maxresdefault.jpg",
      videoUrl: "https://www.youtube.com/embed/5P_L-7rnaFc",
      duration: "12:13",
      category: "Komunikasi Client",
      views: 56764,
      likes: 2649,
      publishedAt: new Date('2019-03-22')
    },
    {
      id: '9',
      title: "CARA SAYA MENENTUKAN HARGA JASA FREELANCE | WEB DESIGN, WEB DEVELOPMENT, WORDPRESS DEVELOPMENT",
      description: "Video ini membahas cara menentukan harga jasa freelance untuk desain web, pengembangan web, dan pengembangan WordPress.",
      thumbnail: "https://img.youtube.com/vi/G1AZX_2cMNg/maxresdefault.jpg",
      videoUrl: "https://www.youtube.com/embed/G1AZX_2cMNg",
      duration: "5:51",
      category: "Pricing Strategy",
      views: 3679,
      likes: 101,
      publishedAt: new Date('2020-08-07')
    },
    {
      id: '10',
      title: "Buat portofolio dari NOL, tanpa pengalaman kerja!",
      description: "Video ini menjelaskan cara membuat portofolio dari awal, bahkan tanpa pengalaman kerja sebelumnya.",
      thumbnail: "https://img.youtube.com/vi/Vg_De3SGOL4/maxresdefault.jpg",
      videoUrl: "https://www.youtube.com/embed/Vg_De3SGOL4",
      duration: "8:04",
      category: "Portfolio",
      views: 48304,
      likes: 1408,
      publishedAt: new Date('2023-11-02')
    }
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

  // Fetch guides for freelancer section
  useEffect(() => {
    const fetchGuides = () => {
      setGuidesLoading(true);
      try {
        // Sort guides by publishedAt in descending order (newest first) and take first 8
        const sortedGuides = sampleGuides
          .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
          .slice(0, 8);
        setGuides(sortedGuides);
      } catch (error) {
        console.error('Error fetching guides:', error);
      } finally {
        setGuidesLoading(false);
      }
    };

    fetchGuides();
  }, []);

  // Handle modal keyboard events and body scroll
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && selectedGuide) {
        setSelectedGuide(null);
      }
    };

    if (selectedGuide) {
      // Disable body scroll when modal is open
      document.body.style.overflow = 'hidden';
      // Add keyboard event listener
      document.addEventListener('keydown', handleKeyDown);
    } else {
      // Re-enable body scroll when modal is closed
      document.body.style.overflow = 'unset';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedGuide]);

  // Helper function to format views
  const formatViews = (views) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  // Helper function to format date
  const formatDate = (date) => {
    const publishDate = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - publishDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 hari yang lalu';
    if (diffDays <= 7) return `${diffDays} hari yang lalu`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} minggu yang lalu`;
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} bulan yang lalu`;
    return `${Math.ceil(diffDays / 365)} tahun yang lalu`;
  };

  // Video Guide Modal Component
  const GuideVideoModal = ({ guide, onClose }) => {
    if (!guide) return null;

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-lg w-[90%] max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="aspect-video bg-black">
              <iframe
                src={guide.videoUrl}
                title={guide.title}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{guide.title}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span>{formatViews(guide.views)} tayangan</span>
                <span>{formatDate(guide.publishedAt)}</span>
                <span className="bg-[#010042] text-white text-xs px-2 py-1 rounded-full">
                  {guide.category}
                </span>
              </div>
              <p className="text-gray-700">{guide.description}</p>
              
              <div className="flex items-center gap-4 mt-6">
                <Link 
                  to="/dashboard/freelancer/guides"
                  className="px-4 py-2 bg-[#010042] text-white rounded-lg hover:bg-[#0100a3] transition-colors"
                >
                  Lihat Panduan Lainnya
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
  
  // Additional check for freelancer role in roles array
  const hasFreelancerRole = !!userData && (userData.roles?.includes('freelancer') || userData.isFreelancer === true);
  
  
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
            <source src="https://res.cloudinary.com/dk45bajkj/video/upload/v1749849506/skillnusa_video2_mqmwxg.mp4" type="video/mp4" />
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
              { icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4", name: "Programming & Tech", displayName: "Programming" },
              { icon: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z", name: "Design & Creative", displayName: "Design & Creative" },
              { icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", name: "Digital Marketing", displayName: "Digital Marketing" },
              { icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", name: "Writing & Translation", displayName: "Writing" },
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

      {/* Panduan Freelancer Section - Only for freelancers */}
      {currentUser && hasFreelancerRole && (
        <div className="bg-gray-50 py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#010042] text-center sm:text-left">Panduan Freelancer</h2>
              <Link 
                to="/dashboard/freelancer/guides"
                className="text-sm text-[#010042] hover:underline flex items-center justify-center sm:justify-start gap-2 bg-transparent hover:text-[#0100a3] transition-all duration-200"
              >
                Lihat semua panduan
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Guides Grid */}
            {guidesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg border border-gray-200 animate-pulse">
                    <div className="bg-gray-300 aspect-video rounded-t-lg mb-4"></div>
                    <div className="p-4">
                      <div className="bg-gray-300 h-4 rounded mb-2"></div>
                      <div className="bg-gray-300 h-3 rounded w-3/4 mb-2"></div>
                      <div className="bg-gray-300 h-3 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : guides.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-gray-600 text-sm sm:text-base">Tidak ada panduan yang tersedia saat ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {guides.map((guide) => (
                  <div
                    key={guide.id}
                    onClick={() => setSelectedGuide(guide)}
                    className="bg-white rounded-lg border border-gray-200 shadow hover:shadow-lg transition-all duration-300 hover:scale-105 group cursor-pointer"
                  >
                    <div className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                      <div className="absolute top-2 left-2 z-10">
                        <span className="bg-[#010042] text-white text-xs px-2 py-1 rounded-full">
                          {guide.category}
                        </span>
                      </div>
                      <img 
                        src={guide.thumbnail} 
                        alt={guide.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {guide.duration}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm leading-tight">
                        {guide.title}
                      </h3>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                        {guide.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatViews(guide.views)} tayangan</span>
                        <span>{formatDate(guide.publishedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-center mt-8 sm:mt-10">
              <Link 
                to="/dashboard/freelancer/guides"
                className="px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium bg-transparent border border-[#010042] text-[#010042] rounded-lg transition-all duration-300 hover:bg-[#010042] hover:text-white hover:shadow-md hover:transform hover:scale-105"
              >
                Lihat Semua Panduan
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Guide Video Modal */}
      {selectedGuide && (
        <GuideVideoModal 
          guide={selectedGuide} 
          onClose={() => setSelectedGuide(null)} 
        />
      )}

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