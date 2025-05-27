import { Link, useNavigate } from 'react-router-dom';
import { TypeAnimation } from 'react-type-animation';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import MeshGradientBackground from '../components/UI/MeshGradientBackground';
import GigCard from '../components/common/GigCard';
import gigService from '../services/gigService';
import FreelancerCTA from '../components/UI/FreelancerCTA';

export default function Home() {
  const { currentUser, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [gigs, setGigs] = useState([]);
  const [gigsLoading, setGigsLoading] = useState(true);
  const searchBoxRef = useRef(null);

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

  // Load gigs data (same as Browse page)
  useEffect(() => {
    const loadGigs = async () => {
      setGigsLoading(true);
      try {
        // Try to load from database first
        const gigData = await gigService.getFeaturedGigs(50);
        if (gigData && gigData.length > 0) {
          setGigs(gigData);
        } else {
          // Fallback to mock data (same as Browse)
          const mockGigs = [
            {
              id: '1',
              images: ["https://picsum.photos/seed/gig1/400/300"],
              image: "https://picsum.photos/seed/gig1/400/300",
              title: "I will build shopify ecommerce website, redesign online store",
              category: "Programming & Tech",
              freelancer: {
                name: "Fillinx Sol",
                displayName: "Fillinx Sol",
                avatar: "https://picsum.photos/seed/freelancer1/50/50",
                profilePhoto: "https://picsum.photos/seed/freelancer1/50/50",
                isVerified: true,
                isTopRated: true
              },
              rating: 4.9,
              reviews: 1234,
              totalReviews: 1234,
              price: 195000,
              startingPrice: 195000,
              packages: { basic: { price: 195000 } },
              deliveryTime: "7 days",
              location: "Pakistan"
            },
            {
              id: '2',
              images: ["https://picsum.photos/seed/logo1/400/300"],
              image: "https://picsum.photos/seed/logo1/400/300",
              title: "I will create professional logo design for your business",
              category: "Design & Creative",
              freelancer: {
                name: "Maya Design",
                displayName: "Maya Design",
                avatar: "https://picsum.photos/seed/freelancer2/50/50",
                profilePhoto: "https://picsum.photos/seed/freelancer2/50/50",
                isVerified: true,
                isTopRated: false
              },
              rating: 4.8,
              reviews: 287,
              totalReviews: 287,
              price: 150000,
              startingPrice: 150000,
              packages: { basic: { price: 150000 } },
              deliveryTime: "3 days",
              location: "Indonesia"
            },
            {
              id: '3',
              image: "https://picsum.photos/seed/gig3/400/300",
              title: "Professional Social Media Management",
              category: "Digital Marketing",
              freelancer: {
                name: "Dina Wijaya",
                displayName: "Dina Wijaya",
                avatar: "https://picsum.photos/seed/freelancer3/50/50",
                profilePhoto: "https://picsum.photos/seed/freelancer3/50/50",
                isVerified: false,
                isTopRated: true
              },
              rating: 4.7,
              reviews: 156,
              totalReviews: 156,
              price: 1200000,
              startingPrice: 1200000,
              packages: { basic: { price: 1200000 } },
              deliveryTime: "5 days",
              location: "Indonesia"
            },
            {
              id: '4',
              image: "https://picsum.photos/seed/gig4/400/300",
              title: "Mobile App Development iOS & Android",
              category: "Mobile Development",
              freelancer: {
                name: "Farhan Ahmad",
                displayName: "Farhan Ahmad", 
                avatar: "https://picsum.photos/seed/freelancer4/50/50",
                profilePhoto: "https://picsum.photos/seed/freelancer4/50/50",
                isVerified: true,
                isTopRated: true
              },
              rating: 5.0,
              reviews: 32,
              totalReviews: 32,
              price: 5000000,
              startingPrice: 5000000,
              packages: { basic: { price: 5000000 } },
              deliveryTime: "14 days",
              location: "Indonesia"
            },
            {
              id: '5',
              image: "https://picsum.photos/seed/gig5/400/300",
              title: "Content Writing Services",
              category: "Writing & Translation",
              freelancer: {
                name: "Elsa Putri",
                displayName: "Elsa Putri",
                avatar: "https://picsum.photos/seed/freelancer5/50/50",
                profilePhoto: "https://picsum.photos/seed/freelancer5/50/50",
                isVerified: true,
                isTopRated: false
              },
              rating: 4.9,
              reviews: 45,
              totalReviews: 45,
              price: 450000,
              startingPrice: 450000,
              packages: { basic: { price: 450000 } },
              deliveryTime: "2 days",
              location: "Indonesia"
            },
            {
              id: '6',
              image: "https://picsum.photos/seed/gig6/400/300",
              title: "Business Plan Development",
              category: "Business",
              freelancer: {
                name: "Gunawan Prawiro",
                displayName: "Gunawan Prawiro",
                avatar: "https://picsum.photos/seed/freelancer6/50/50",
                profilePhoto: "https://picsum.photos/seed/freelancer6/50/50",
                isVerified: true,
                isTopRated: true
              },
              rating: 4.8,
              reviews: 19,
              totalReviews: 19,
              price: 2000000,
              startingPrice: 2000000,
              packages: { basic: { price: 2000000 } },
              deliveryTime: "10 days",
              location: "Indonesia"
            }
          ];
          setGigs(mockGigs);
        }
      } catch (error) {
        console.error('Error loading gigs:', error);
        // Set empty array if error
        setGigs([]);
      } finally {
        setGigsLoading(false);
      }
    };

    loadGigs();
  }, []);



  // Categories data
  const categories = [
    { icon: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z", name: "Design & Creative" },
    { icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4", name: "Programming & Tech" },
    { icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", name: "Writing & Translation" },
    { icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", name: "Digital Marketing" },
    { icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z", name: "Mobile Development" },
    { icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", name: "Business" },
    { icon: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z", name: "Customer Support" },
    { icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z", name: "Video & Animation" }
  ];

  // Filter gigs based on selected category
  const filteredGigs = activeCategory === 'All' 
    ? gigs 
    : gigs.filter(gig => gig.category === activeCategory);

  // Take only 12 gigs for display
  const displayedGigs = filteredGigs.slice(0, 12);

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
      {/* Main content for logged in or non-logged in users */}
      {currentUser ? (
        // Logged in view (client or freelancer)
        <>
          {/* SkillBot AI Banner Section - untuk semua user yang sudah login */}
          <div className="bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-3 sm:px-4">
              <div className="bg-gradient-to-r from-[#010042]/95 to-[#0100a3]/95 rounded-xl p-8 md:p-12 shadow-xl">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="mb-6 md:mb-0 md:max-w-2xl">
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
                      Meet SkillBot: Your AI-Powered Freelancer Finder
                    </h2>
                    <p className="text-white/90 mb-6 text-base md:text-lg leading-relaxed">
                      Sistem rekomendasi AI kami membantu mencocokkan freelancer terbaik untuk proyek spesifik Anda. Biarkan SkillBot menemukan talenta yang tepat.
                    </p>
                    <Link
                      to="/skillbot"
                      className="inline-flex items-center px-8 py-4 bg-white rounded-lg text-[#010042] font-semibold transition-all hover:bg-opacity-90 hover:shadow-lg hover:transform hover:scale-105 text-lg">
                      Coba SkillBot
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </div>
                  <div className="hidden md:block md:ml-8">
                    <img
                      src="/images/robot.png"
                      alt="AI Matching"
                      className="rounded-lg shadow-lg h-48 w-auto object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        // Non-logged in view
        <>
          {/* Hero Section */}
          <div className="relative min-h-[85vh] flex items-center">
            <MeshGradientBackground />

            <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-20">
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div className="lg:flex lg:flex-col lg:justify-center space-y-8">
                  <h1 className="text-4xl md:text-5xl lg:text-8xl font-bold text-white lg:max-w-xl">
                    SkillNusa
                  </h1>
                  <div className="text-xl sm:text-2xl lg:text-3xl text-gray-200 leading-relaxed mb-1 lg:max-w-xl h-32">
                    <TypeAnimation
                      sequence={[
                        'SkillNusa adalah sebuah marketplace yang menghubungkan freelancer berbakat Indonesia dengan klien yang mencari layanan berkualitas.',
                        1500,
                        '',
                        'Temukan pasangan yang tepat untuk kebutuhan proyek Anda dari kumpulan profesional tepercaya kami.',
                        1500,
                        '',
                        'Selesaikan pekerjaan secara efisien, tepat waktu, dan sesuai dengan anggaran Anda.',
                        1500,
                        '',
                      ]}
                      wrapper="p"
                      speed={15}
                      deletionSpeed={80}
                      style={{ display: 'inline-block', height: '100%' }}
                      repeat={Infinity}
                    />
                  </div>
                  <div className="w-full max-w-lg">
                    <form 
                      className="w-full"
                      onSubmit={handleSearchSubmit}
                    >
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Cari layanan, keahlian, atau proyek..."
                          className={`w-full px-6 py-4 rounded-lg border text-base transition-all duration-300 ${
                            isSearchFocused 
                              ? 'bg-white text-gray-900 border-[#010042] ring-2 ring-[#010042] focus:outline-none' 
                              : 'bg-transparent text-white placeholder-white/80 border-white/50 focus:outline-none'
                          }`}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onFocus={() => setIsSearchFocused(true)}
                          onBlur={() => setIsSearchFocused(false)}
                        />
                        <button 
                          type="submit" 
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                            isSearchFocused ? 'text-[#010042]' : 'text-white'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <img
                    src="/images/hero-typing.jpeg"
                    alt="Person typing on laptop"
                    className="rounded-2xl object-cover shadow-xl w-full h-[600px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Popular Categories Section - Compact */}
      <div className="bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#010042] mb-4">Kategori Populer</h2>
            <Link 
              to="/browse"
              className="text-sm text-[#010042] hover:underline flex items-center gap-2 bg-transparent hover:text-[#0100a3] transition-all duration-200"
            >
              Lihat semua kategori
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 xl:grid-cols-9 gap-4">
            {[
              { icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4", name: "Programming & Tech", displayName: "Programming & Tech" },
              { icon: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z", name: "Design & Creative", displayName: "Design & Creative" },
              { icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", name: "Digital Marketing", displayName: "Digital Marketing" },
              { icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", name: "Writing & Translation", displayName: "Writing & Translation" },
              { icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z", name: "Video & Animation", displayName: "Video & Animation" },
              { icon: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3", name: "Music & Audio", displayName: "Music & Audio" },
              { icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", name: "Business", displayName: "Business" },
              { icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z", name: "Mobile Development", displayName: "Mobile Development" },
              { icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", name: "AI Services", displayName: "AI Services" }
            ].map((category, index) => (
              <Link key={index} to={`/browse?category=${encodeURIComponent(category.name)}`} className="group">
                <div className="bg-white rounded-lg p-4 border border-gray-200 transition-all duration-300 hover:shadow-md hover:border-[#010042]/30 h-full flex flex-col items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#010042]/10 transition-all duration-300 group-hover:bg-[#010042]/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#010042]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={category.icon} />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-800 text-sm">{category.displayName}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* SkillBot AI Banner Section - only shown to non-logged-in users */}
      {!currentUser && (
        <div className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <div className="bg-gradient-to-r from-[#010042]/95 to-[#0100a3]/95 rounded-xl p-8 md:p-12 shadow-xl">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-6 md:mb-0 md:max-w-2xl">
                  <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
                    Meet SkillBot: Your AI-Powered Freelancer Finder
                  </h2>
                  <p className="text-white/90 mb-6 text-base md:text-lg leading-relaxed">
                    Sistem rekomendasi AI kami membantu mencocokkan freelancer terbaik untuk proyek spesifik Anda. Biarkan SkillBot menemukan talenta yang tepat.
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex items-center px-8 py-4 bg-white rounded-lg text-[#010042] font-semibold transition-all hover:bg-opacity-90 hover:shadow-lg hover:transform hover:scale-105 text-lg">
                    Coba SkillBot
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
                <div className="hidden md:block md:ml-8">
                  <img
                    src="/images/robot.png"
                    alt="AI Matching"
                    className="rounded-lg shadow-lg h-48 w-auto object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gigs Section with Category Filter */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#010042]">Gigs Terbaru</h2>
            <Link 
              to="/browse"
              className="text-sm text-[#010042] hover:underline flex items-center gap-2 bg-transparent hover:text-[#0100a3] transition-all duration-200"
            >
              Lihat semua gigs
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Category Filters */}
          <div className="mb-6 overflow-x-auto pb-2">
            <div className="flex space-x-2 min-w-max">
              <button
                onClick={() => setActiveCategory('All')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
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
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                  <div className="bg-gray-300 h-48 rounded mb-4"></div>
                  <div className="bg-gray-300 h-4 rounded mb-2"></div>
                  <div className="bg-gray-300 h-4 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : displayedGigs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Tidak ada gigs yang ditemukan untuk kategori ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayedGigs.map((gig) => (
                <GigCard 
                  key={gig.id} 
                  gig={gig}
                  showFavoriteButton={true}
                />
              ))}
            </div>
          )}

          <div className="flex justify-center mt-10">
            <Link 
              to="/browse"
              className="px-6 py-2 text-sm font-medium bg-transparent border border-[#010042] text-[#010042] rounded-lg transition-all duration-300 hover:bg-[#010042] hover:text-white hover:shadow-md hover:transform hover:scale-105"
            >
              Lihat Semua Gigs
            </Link>
          </div>
        </div>
      </div>

      {/* Banner FreelancerCTA - ditampilkan hanya untuk user yang login sebagai client tapi belum menjadi freelancer */}
      {!isFreelancer && (
        <div className="mb-6 relative z-10">
          <FreelancerCTA variant="home" />
        </div>
      )}

      {/* Banner Ajakan Register - hanya ditampilkan untuk pengguna yang belum login */}
      {!currentUser && (
        <div className="bg-[#010042] py-12 border-t border-[#0100a3]">
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Siap untuk memulai dengan SkillNusa?</h2>
              <p className="text-white/80 max-w-2xl mx-auto mb-8 text-lg">
                Daftarkan diri Anda sekarang dan mulai mendapatkan akses ke ribuan freelancer berbakat atau klien potensial di seluruh Indonesia.
              </p>
              <Link 
                to="/register"
                className="inline-flex items-center px-6 py-3 bg-white rounded-lg text-[#010042] font-medium hover:bg-gray-100 transition-all text-base"
              >
                Daftar Sekarang
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
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