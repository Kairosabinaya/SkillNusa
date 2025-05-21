import { Link, useNavigate } from 'react-router-dom';
import { TypeAnimation } from 'react-type-animation';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../routes';
import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const { currentUser } = useAuth();
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

  return (
    <div>
      {/* Hero Section */}
      <div className="relative min-h-[65vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[#010042] to-[#0100a3]"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="lg:flex lg:flex-col lg:justify-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white lg:max-w-xl">
                Connect with skilled freelancers across Indonesia
              </h1>
              <div className="text-lg sm:text-xl text-gray-200 leading-relaxed mb-1 lg:max-w-xl h-24">
                <TypeAnimation
                  sequence={[
                    'SkillNusa is a marketplace connecting talented Indonesian freelancers with clients looking for quality services.',
                    1500,
                    '',
                    'Find the perfect match for your project needs from our pool of verified professionals.',
                    1500,
                    '',
                    'Get your work done efficiently, on time, and within your budget.',
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
              <div className="w-full">
                <form 
                  className="w-full max-w-lg"
                  onSubmit={handleSearchSubmit}
                >
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search for services, skills, or projects..."
                      className={`w-full px-6 py-3 rounded-lg border transition-all duration-300 ${
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
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                src="https://picsum.photos/seed/skillnusa/987/740"
                alt="Freelancer working"
                className="rounded-2xl object-cover shadow-xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Popular Categories Section - Compact */}
      <div className="bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#010042]">Popular Categories</h2>
            <button 
              className="text-sm text-[#010042] hover:underline flex items-center gap-2 bg-transparent hover:text-[#0100a3] transition-all duration-200"
              onClick={(e) => handleAuthRequiredClick(e, '/browse')}
            >
              View all categories
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((category, index) => (
              <div key={index} className="group block cursor-pointer" onClick={(e) => handleAuthRequiredClick(e, '/browse')}>
                <div className="bg-white rounded-lg p-4 border border-gray-200 transition-all duration-300 hover:shadow-md hover:border-[#010042]/30 flex items-center gap-3 hover:transform hover:scale-105">
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

      {/* SkillBot AI Banner Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="bg-gradient-to-r from-[#010042]/90 to-[#0100a3]/90 rounded-xl p-8 md:p-10 shadow-lg">
            <div className="md:flex items-center justify-between">
              <div className="mb-6 md:mb-0 md:max-w-2xl">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Meet SkillBot: Your AI-Powered Freelancer Finder
                </h2>
                <p className="text-white/90 mb-6 text-base md:text-lg">
                  Our AI-powered recommendation system helps match you with the best freelancers based on your specific project needs. Let SkillBot find the perfect talent for your next project.
                </p>
                <Link
                  to="/no-page"
                  className="inline-flex items-center px-6 py-3 bg-white rounded-lg text-[#010042] font-medium transition-all hover:bg-opacity-90 hover:shadow-md hover:transform hover:scale-105 text-base"
                >
                  Try SkillBot
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
              <div className="hidden md:block md:ml-6">
                <img
                  src="https://picsum.photos/seed/ai-matching/500/300"
                  alt="AI Matching"
                  className="rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gigs Section with Category Filter */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex justify-end mb-6">
            <button 
              className="text-sm text-[#010042] hover:underline flex items-center gap-2 bg-transparent hover:text-[#0100a3] transition-all duration-200"
              onClick={(e) => handleAuthRequiredClick(e, '/browse')}
            >
              View all gigs
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
                All
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
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {displayedGigs.slice(0, 15).map((gig, index) => (
              <div key={index} className="block group cursor-pointer" onClick={(e) => handleAuthRequiredClick(e, '/service/detail')}>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-[#010042]/30 hover:transform hover:scale-105">
                  <div className="h-32 overflow-hidden">
                    <img 
                      src={gig.image} 
                      alt={gig.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm mb-1 text-gray-800 line-clamp-1">
                      {gig.title}
                    </h3>
                    <div className="flex items-center gap-1 mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs font-medium">{gig.rating}</span>
                      <span className="text-xs text-gray-500">({gig.reviews})</span>
                    </div>
                    <div className="pt-1 border-t border-gray-100">
                      <p className="text-[#010042] font-semibold text-xs">
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
              View All Gigs
            </button>
          </div>
        </div>
      </div>

      {/* Freelancer Guides Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-3 text-[#010042]">Guides for Freelancers</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm">
              Resources and tutorials to help you succeed as a freelancer on SkillNusa
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                image: "https://picsum.photos/seed/guide1/600/400",
                title: "How to Create an Outstanding Profile",
                description: "Learn how to make your SkillNusa profile stand out to potential clients.",
                youtubeUrl: "https://youtube.com/watch?v=example1"
              },
              {
                image: "https://picsum.photos/seed/guide2/600/400",
                title: "Pricing Strategies for Freelancers",
                description: "Discover effective pricing strategies to maximize your earnings.",
                youtubeUrl: "https://youtube.com/watch?v=example2"
              },
              {
                image: "https://picsum.photos/seed/guide3/600/400",
                title: "Communication Skills for Success",
                description: "Master the art of client communication to ensure project success.",
                youtubeUrl: "https://youtube.com/watch?v=example3"
              }
            ].map((guide, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer hover:transform hover:scale-105 border border-gray-100">
                <div className="relative h-48">
                  <img 
                    src={guide.image} 
                    alt={guide.title} 
                    className="w-full h-full object-cover"
                  />
                  <a 
                    href={guide.youtubeUrl} 
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-white bg-opacity-80 flex items-center justify-center hover:bg-opacity-100 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#010042]" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  </a>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-2 text-gray-800">{guide.title}</h3>
                  <p className="text-gray-600 text-sm">{guide.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Client Guides Section */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-3 text-[#010042]">Guides for Clients</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm">
              Resources and tutorials to help you find and work with the right freelancers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                image: "https://picsum.photos/seed/client1/600/400",
                title: "How to Write Effective Project Briefs",
                description: "Create clear project briefs that attract the right freelancers.",
                youtubeUrl: "https://youtube.com/watch?v=example4"
              },
              {
                image: "https://picsum.photos/seed/client2/600/400",
                title: "Evaluating Freelancer Portfolios",
                description: "Learn how to assess freelancer portfolios to find the right fit.",
                youtubeUrl: "https://youtube.com/watch?v=example5"
              },
              {
                image: "https://picsum.photos/seed/client3/600/400",
                title: "Managing Remote Freelance Teams",
                description: "Tips and strategies for effectively managing freelancers remotely.",
                youtubeUrl: "https://youtube.com/watch?v=example6"
              }
            ].map((guide, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer hover:transform hover:scale-105 border border-gray-100">
                <div className="relative h-48">
                  <img 
                    src={guide.image} 
                    alt={guide.title} 
                    className="w-full h-full object-cover"
                  />
                  <a 
                    href={guide.youtubeUrl} 
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-white bg-opacity-80 flex items-center justify-center hover:bg-opacity-100 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#010042]" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
                  </a>
            </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-2 text-gray-800">{guide.title}</h3>
                  <p className="text-gray-600 text-sm">{guide.description}</p>
            </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#010042] to-[#0100a3] py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to get started with SkillNusa?</h2>
            <p className="text-lg text-gray-200 mb-6 max-w-2xl mx-auto">
              Join thousands of freelancers and clients already growing their businesses with SkillNusa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="text-sm px-6 py-3 rounded-lg bg-white text-[#010042] font-medium transition duration-300 hover:bg-opacity-90 hover:shadow-lg hover:transform hover:scale-105"
              >
                Sign Up as Freelancer
              </Link>
              <Link
                to="/register"
                className="text-sm px-6 py-3 rounded-lg bg-[#0100a3] text-white border border-white font-medium transition duration-300 hover:bg-[#0100a3]/80 hover:transform hover:scale-105"
              >
                Hire a Freelancer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}