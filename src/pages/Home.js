import { Link, useNavigate } from 'react-router-dom';
import { TypeAnimation } from 'react-type-animation';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../routes';
import { useState, useRef, useEffect } from 'react';
import FreelancerCTA from '../components/UI/FreelancerCTA';
import MeshGradientBackground from '../components/UI/MeshGradientBackground';

export default function Home() {
  const { currentUser, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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
      if (!currentUser) {
        navigate(ROUTES.LOGIN);
      } else {
        navigate(`/browse?search=${encodeURIComponent(searchQuery)}`);
      }
    }
  };

  // Fungsi untuk menangani klik pada link yang memerlukan login
  const handleAuthRequiredClick = (e, targetPath) => {
    if (!currentUser) {
      e.preventDefault();
      navigate(ROUTES.LOGIN);
    } else {
      navigate(targetPath);
    }
  };

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

  // Mock gigs data for the "For You" section
  const allGigs = [
              {
                image: "https://picsum.photos/seed/gig1/400/300",
                title: "Professional Logo Design",
                category: "Design & Creative",
                freelancer: "Andi Pratama",
                rating: "4.9",
                reviews: "87",
                price: "Rp 750.000"
              },
              {
                image: "https://picsum.photos/seed/gig2/400/300",
                title: "Full-Stack Web Development",
                category: "Programming & Tech",
                freelancer: "Budi Santoso",
                rating: "4.8",
                reviews: "124",
                price: "Rp 3.500.000"
              },
              {
                image: "https://picsum.photos/seed/gig3/400/300",
                title: "Social Media Management",
                category: "Digital Marketing",
                freelancer: "Dina Wijaya",
                rating: "4.7",
                reviews: "56",
                price: "Rp 1.200.000"
              },
              {
                image: "https://picsum.photos/seed/gig4/400/300",
                title: "Mobile App Development",
                category: "Mobile Development",
                freelancer: "Farhan Ahmad",
                rating: "5.0",
                reviews: "32",
                price: "Rp 5.000.000"
    },
    {
      image: "https://picsum.photos/seed/gig5/400/300",
      title: "Content Writing Services",
      category: "Writing & Translation",
      freelancer: "Elsa Putri",
      rating: "4.9",
      reviews: "45",
      price: "Rp 450.000"
    },
    {
      image: "https://picsum.photos/seed/gig6/400/300",
      title: "Business Plan Development",
      category: "Business",
      freelancer: "Gunawan Prawiro",
      rating: "4.8",
      reviews: "19",
      price: "Rp 2.000.000"
    },
    {
      image: "https://picsum.photos/seed/gig7/400/300",
      title: "Customer Support Management",
      category: "Customer Support",
      freelancer: "Hana Wijaya",
      rating: "4.7",
      reviews: "28",
      price: "Rp 1.100.000"
    },
    {
      image: "https://picsum.photos/seed/gig8/400/300",
      title: "Promotional Video Creation",
      category: "Video & Animation",
      freelancer: "Indra Maulana",
      rating: "4.9",
      reviews: "63",
      price: "Rp 1.800.000"
    },
    {
      image: "https://picsum.photos/seed/gig9/400/300",
      title: "Website Design Overhaul",
      category: "Design & Creative",
      freelancer: "Jasmine Putri",
      rating: "4.6",
      reviews: "41",
      price: "Rp 2.300.000"
    },
    {
      image: "https://picsum.photos/seed/gig10/400/300",
      title: "Backend API Development",
      category: "Programming & Tech",
      freelancer: "Khalid Rahman",
      rating: "4.9",
      reviews: "37",
      price: "Rp 4.200.000"
    },
    {
      image: "https://picsum.photos/seed/gig11/400/300",
      title: "Advanced SEO Optimization",
      category: "Digital Marketing",
      freelancer: "Lina Susanti",
      rating: "5.0",
      reviews: "52",
      price: "Rp 1.500.000"
    },
    {
      image: "https://picsum.photos/seed/gig12/400/300",
      title: "iOS App Development",
      category: "Mobile Development",
      freelancer: "Muhammad Rizki",
      rating: "4.8",
      reviews: "29",
      price: "Rp 6.000.000"
    },
    {
      image: "https://picsum.photos/seed/gig13/400/300",
      title: "Technical Documentation",
      category: "Writing & Translation",
      freelancer: "Nina Halim",
      rating: "4.7",
      reviews: "18",
      price: "Rp 800.000"
    },
    {
      image: "https://picsum.photos/seed/gig14/400/300",
      title: "Market Research & Analysis",
      category: "Business",
      freelancer: "Oscar Pratama",
      rating: "4.9",
      reviews: "33",
      price: "Rp 3.200.000"
    },
    {
      image: "https://picsum.photos/seed/gig15/400/300",
      title: "Multilingual Customer Support",
      category: "Customer Support",
      freelancer: "Putri Rahma",
      rating: "4.8",
      reviews: "21",
      price: "Rp 1.400.000"
    },
    {
      image: "https://picsum.photos/seed/gig16/400/300",
      title: "3D Animation Services",
      category: "Video & Animation",
      freelancer: "Qori Hidayat",
      rating: "5.0",
      reviews: "48",
      price: "Rp 3.800.000"
    },
    {
      image: "https://picsum.photos/seed/gig17/400/300",
      title: "UI/UX Design Services",
      category: "Design & Creative",
      freelancer: "Rama Wijaya",
      rating: "4.9",
      reviews: "72",
      price: "Rp 2.800.000"
    },
    {
      image: "https://picsum.photos/seed/gig18/400/300",
      title: "WordPress Development",
      category: "Programming & Tech",
      freelancer: "Sinta Dewi",
      rating: "4.7",
      reviews: "39",
      price: "Rp 1.600.000"
    }
  ];

  // Filter gigs based on selected category
  const filteredGigs = activeCategory === 'All' 
    ? allGigs 
    : allGigs.filter(gig => gig.category === activeCategory);

  // Take only 18 gigs for display (6x3 grid)
  const displayedGigs = filteredGigs.slice(0, 18);

  // Periksa apakah pengguna adalah klien (non-freelancer) untuk menampilkan CTA
  // PENTING: Dalam arsitektur multi-role, kita perlu memeriksa berbagai kombinasi kemungkinan
  
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
      if (userProfile.role) {
        userData.role = userProfile.role;
      }
      if (userProfile.freelancerStatus) {
        userData.freelancerStatus = userProfile.freelancerStatus;
      }
    }
  }
  
  // CRITICAL: Don't show freelancer banner if data is still loading or userProfile is null
  // This prevents the race condition where banner shows before data loads
  const isDataReady = !loading && currentUser && userProfile !== null;
  
  // Logging untuk debug
  // Periksa jika user sudah login dan role-nya
  // User bisa dianggap client jika:
  // 1. Memiliki role = 'client'
  // 2. Memiliki roles array yang include 'client'
  // 3. Tidak memiliki role spesifik (default role adalah client)
  const isClient = !!userData && (
    userData.role === 'client' || 
    (userData.roles && userData.roles.includes('client')) ||
    (!userData.role && !userData.roles)
  );
                  
  // User dianggap freelancer jika:
  // 1. Secara eksplisit ditandai dengan isFreelancer = true
  // 2. Memiliki role = 'freelancer'
  // 3. Memiliki roles array yang include 'freelancer'
  const isFreelancer = !!userData && (
    userData.isFreelancer === true ||
    userData.role === 'freelancer' ||
    (userData.roles && userData.roles.includes('freelancer'))
  );
  
  // Periksa juga jika user sudah dalam proses apply menjadi freelancer
  const isPendingFreelancer = !!userData && userData.freelancerStatus === 'pending';
                       
  // Menentukan apakah perlu menampilkan FreelancerCTA 
  // Syarat: data ready + user login + client + bukan freelancer + bukan pending freelancer
  const showFreelancerCTA = isDataReady && !!currentUser && isClient && !isFreelancer && !isPendingFreelancer;
  
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
  console.log('- userData.role:', userData?.role);
  console.log('- userData.roles:', userData?.roles);
  console.log('- isClient:', isClient);
  console.log('- isFreelancer:', isFreelancer);
  console.log('- isPendingFreelancer:', isPendingFreelancer);
  console.log('- showFreelancerCTA:', showFreelancerCTA);
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
            <button 
              className="text-sm text-[#010042] hover:underline flex items-center gap-2 bg-transparent hover:text-[#0100a3] transition-all duration-200"
              onClick={(e) => handleAuthRequiredClick(e, '/browse')}
            >
              Lihat semua kategori
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 xl:grid-cols-9 gap-4">
            {[
              { icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4", name: "Pemrograman & Teknologi" },
              { icon: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z", name: "Grafis & Desain" },
              { icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", name: "Pemasaran Digital" },
              { icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", name: "Penulisan & Terjemahan" },
              { icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z", name: "Video & Animasi" },
              { icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", name: "Layanan AI" },
              { icon: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3", name: "Musik & Audio" },
              { icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", name: "Bisnis" },
              { icon: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z", name: "Konsultasi" }
            ].map((category, index) => (
              <div key={index} className="group cursor-pointer" onClick={(e) => handleAuthRequiredClick(e, '/browse')}>
                <div className="bg-white rounded-lg p-4 border border-gray-200 transition-all duration-300 hover:shadow-md hover:border-[#010042]/30 h-full flex flex-col items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#010042]/10 transition-all duration-300 group-hover:bg-[#010042]/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#010042]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={category.icon} />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-800 text-sm">{category.name}</span>
                </div>
              </div>
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
            <button 
              className="text-sm text-[#010042] hover:underline flex items-center gap-2 bg-transparent hover:text-[#0100a3] transition-all duration-200"
              onClick={(e) => handleAuthRequiredClick(e, '/browse')}
            >
              Lihat semua gigs
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
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
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedGigs.slice(0, 12).map((gig, index) => (
              <div key={index} className="block group cursor-pointer" onClick={(e) => handleAuthRequiredClick(e, '/service/detail')}>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-[#010042]/30 hover:transform hover:scale-105">
                  <div className="aspect-w-4 aspect-h-2 overflow-hidden">
                    <img 
                      src={gig.image} 
                      alt={gig.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-sm text-gray-800 line-clamp-2">
                      {gig.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-medium ml-1">{gig.rating}</span>
                        <span className="text-sm text-gray-500 ml-1">({gig.reviews})</span>
                      </div>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{gig.freelancer}</span>
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-[#010042] font-semibold">
                        {gig.price}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-10">
            <button 
              onClick={(e) => handleAuthRequiredClick(e, '/browse')}
              className="px-6 py-2 text-sm font-medium bg-transparent border border-[#010042] text-[#010042] rounded-lg transition-all duration-300 hover:bg-[#010042] hover:text-white hover:shadow-md hover:transform hover:scale-105"
            >
              Lihat Semua Gigs
            </button>
          </div>
        </div>
      </div>

      {/* Banner FreelancerCTA - ditampilkan hanya untuk user yang login sebagai client tapi belum menjadi freelancer */}
      {showFreelancerCTA && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 py-16 border-t border-blue-400">
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="md:max-w-xl">
                <h2 className="text-3xl font-bold text-white mb-3">Menjadi Freelancer</h2>
                <p className="text-blue-100 text-lg">
                  Gunakan keahlian Anda untuk mendapatkan pendapatan tambahan. Jadilah bagian dari komunitas freelancer SkillNusa dan dapatkan akses ke klien dari seluruh Indonesia.
                </p>
              </div>
              <div className="flex-shrink-0 flex justify-center">
                <Link
                  to="/become-freelancer"
                  className="inline-block bg-white text-indigo-600 font-semibold px-8 py-4 rounded-lg hover:bg-blue-50 transition duration-300 text-lg shadow-lg"
                >
                  Menjadi Freelancer
                </Link>
              </div>
            </div>
          </div>
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