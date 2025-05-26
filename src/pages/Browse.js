import { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import gigService from '../services/gigService';

export default function Browse() {
  const { currentUser } = useAuth();
  const location = useLocation();
  
  // Get search params from URL
  const searchParams = new URLSearchParams(location.search);
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || '';
  
  // State management
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [currentPage, setCurrentPage] = useState(1);
  const gigsPerPage = 12;
  
  // Filter states
  const [filters, setFilters] = useState({
    category: initialCategory,
    priceMin: '',
    priceMax: '',
    rating: '',
    deliveryTime: '',
    location: ''
  });

  // Categories for filter
  const categories = [
    "Programming & Tech",
    "Design & Creative", 
    "Digital Marketing",
    "Writing & Translation",
    "Video & Animation",
    "Music & Audio",
    "Business",
    "Mobile Development",
    "AI Services"
  ];

  // Mock gigs data (akan diganti dengan data dari database)
  const mockGigs = [
    {
      id: '1',
      image: "https://picsum.photos/seed/gig1/400/300",
      title: "I will build shopify ecommerce website, redesign online store",
      category: "Programming & Tech",
      freelancer: {
        name: "Fillinx Sol",
        avatar: "https://picsum.photos/seed/freelancer1/50/50",
        isVerified: true,
        isTopRated: true
      },
      rating: 4.9,
      reviews: 1234,
      price: 195000,
      deliveryTime: "7 days",
      location: "Pakistan"
    },
    {
      id: '2',
      image: "https://picsum.photos/seed/logo1/400/300",
      title: "I will create professional logo design for your business",
      category: "Design & Creative",
      freelancer: {
        name: "Maya Design",
        avatar: "https://picsum.photos/seed/freelancer2/50/50",
        isVerified: true,
        isTopRated: false
      },
      rating: 4.8,
      reviews: 287,
      price: 150000,
      deliveryTime: "3 days",
      location: "Indonesia"
    },
    // Add more mock data to demonstrate filtering
    {
      id: '3',
      image: "https://picsum.photos/seed/gig3/400/300",
      title: "Professional Social Media Management",
      category: "Digital Marketing",
      freelancer: {
        name: "Dina Wijaya",
        avatar: "https://picsum.photos/seed/freelancer3/50/50",
        isVerified: false,
        isTopRated: true
      },
      rating: 4.7,
      reviews: 156,
      price: 1200000,
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
        avatar: "https://picsum.photos/seed/freelancer4/50/50",
        isVerified: true,
        isTopRated: true
      },
      rating: 5.0,
      reviews: 32,
      price: 5000000,
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
        avatar: "https://picsum.photos/seed/freelancer5/50/50",
        isVerified: true,
        isTopRated: false
      },
      rating: 4.9,
      reviews: 45,
      price: 450000,
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
        avatar: "https://picsum.photos/seed/freelancer6/50/50",
        isVerified: true,
        isTopRated: true
      },
      rating: 4.8,
      reviews: 19,
      price: 2000000,
      deliveryTime: "10 days",
      location: "Indonesia"
    }
  ];

  // Load gigs data
  useEffect(() => {
    const loadGigs = async () => {
      setLoading(true);
      try {
        // Try to load from database first
        const gigData = await gigService.getFeaturedGigs(50);
        if (gigData && gigData.length > 0) {
          setGigs(gigData);
        } else {
          // Fallback to mock data
          setGigs(mockGigs);
        }
      } catch (error) {
        console.error('Error loading gigs:', error);
        setGigs(mockGigs);
      } finally {
        setLoading(false);
      }
    };

    loadGigs();
  }, []);

  // Update search query and category from URL params when they change
  useEffect(() => {
    const newSearchParams = new URLSearchParams(location.search);
    const urlSearch = newSearchParams.get('search') || '';
    const urlCategory = newSearchParams.get('category') || '';
    
    setSearchQuery(urlSearch);
    setFilters(prev => ({
      ...prev,
      category: urlCategory
    }));
  }, [location.search]);

  // Filter and sort gigs
  const filteredAndSortedGigs = useMemo(() => {
    let filtered = [...gigs];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(gig => 
        gig.title.toLowerCase().includes(query) ||
        gig.category.toLowerCase().includes(query) ||
        gig.freelancer.name.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(gig => gig.category === filters.category);
    }

    // Apply price filter
    if (filters.priceMin) {
      filtered = filtered.filter(gig => gig.price >= parseInt(filters.priceMin));
    }
    if (filters.priceMax) {
      filtered = filtered.filter(gig => gig.price <= parseInt(filters.priceMax));
    }

    // Apply rating filter
    if (filters.rating) {
      filtered = filtered.filter(gig => gig.rating >= parseFloat(filters.rating));
    }

    // Apply location filter
    if (filters.location) {
      filtered = filtered.filter(gig => gig.location.toLowerCase().includes(filters.location.toLowerCase()));
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        filtered.sort((a, b) => b.reviews - a.reviews);
        break;
      case 'newest':
        // For demo, we'll randomize since we don't have real dates
        filtered.sort(() => Math.random() - 0.5);
        break;
      default: // relevance
        break;
    }

    return filtered;
  }, [gigs, searchQuery, filters, sortBy]);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: '',
      priceMin: '',
      priceMax: '',
      rating: '',
      deliveryTime: '',
      location: ''
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Calculate pagination
  const totalGigs = filteredAndSortedGigs.length;
  const totalPages = Math.ceil(totalGigs / gigsPerPage);
  const startIndex = (currentPage - 1) * gigsPerPage;
  const endIndex = startIndex + gigsPerPage;
  const currentGigs = filteredAndSortedGigs.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortBy]);



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#010042] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading gigs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-[#010042]">Home</Link>
            <span>•</span>
            {filters.category ? (
              <>
                <Link to="/browse" className="hover:text-[#010042]">Browse</Link>
                <span>•</span>
                <span className="text-gray-900">{filters.category}</span>
              </>
            ) : (
              <span className="text-gray-900">Browse Gigs</span>
            )}
          </nav>
        </div>
      </div>



      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <div className="w-80 bg-white rounded-lg p-6 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Filter</h3>
              <button 
                onClick={clearFilters}
                className="text-sm text-[#010042] hover:underline"
              >
                Reset
              </button>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Kategori</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    value=""
                    checked={filters.category === ''}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="text-[#010042] focus:ring-[#010042]"
                  />
                  <span className="ml-2 text-sm text-gray-700">Semua Kategori</span>
                </label>
                {categories.map((category) => (
                  <label key={category} className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value={category}
                      checked={filters.category === category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="text-[#010042] focus:ring-[#010042]"
                    />
                    <span className="ml-2 text-sm text-gray-700">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Harga</h4>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Harga Minimum (Rp)"
                  value={filters.priceMin}
                  onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#010042]"
                />
                <input
                  type="number"
                  placeholder="Harga Maximum (Rp)"
                  value={filters.priceMax}
                  onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#010042]"
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Rating</h4>
              <div className="space-y-2">
                {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                  <label key={rating} className="flex items-center">
                    <input
                      type="radio"
                      name="rating"
                      value={rating}
                      checked={filters.rating === rating.toString()}
                      onChange={(e) => handleFilterChange('rating', e.target.value)}
                      className="text-[#010042] focus:ring-[#010042]"
                    />
                    <div className="ml-2 flex items-center">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-1 text-sm text-gray-700">& up</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Lokasi</h4>
              <input
                type="text"
                placeholder="Cari lokasi..."
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#010042]"
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {searchQuery ? `Hasil pencarian untuk "${searchQuery}"` : 
                   filters.category ? `Gigs dalam ${filters.category}` : 'Semua Gigs'}
                </h2>
                <p className="text-gray-600 text-sm">
                  Menampilkan {startIndex + 1}-{Math.min(endIndex, totalGigs)} dari {totalGigs} gigs
                  {totalPages > 1 && ` (Halaman ${currentPage} dari ${totalPages})`}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 rounded">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded px-4 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-[#010042]"
                  >
                    <option value="relevance">Paling Relevan</option>
                    <option value="newest">Terbaru</option>
                    <option value="rating">Rating Tertinggi</option>
                    <option value="reviews">Paling Banyak Review</option>
                    <option value="price-low">Harga Terendah</option>
                    <option value="price-high">Harga Tertinggi</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Gigs Grid/List */}
            {totalGigs === 0 ? (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.78-6.22-2.09l-.44-.41C5.86 12.25 6 12 6 12h.01L6 12z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada gigs yang ditemukan</h3>
                <p className="text-gray-600">Coba ubah filter atau kata kunci pencarian Anda</p>
              </div>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }>
                {currentGigs.map((gig) => (
                  <Link 
                    key={gig.id} 
                    to={`/gig/${gig.id}`}
                    className={
                      viewMode === 'grid'
                        ? "block group"
                        : "block"
                    }
                  >
                    {viewMode === 'grid' ? (
                      // Grid View
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-[#010042]/30 group-hover:transform group-hover:scale-105">
                        <div className="aspect-w-4 aspect-h-3">
                          <img 
                            src={gig.image} 
                            alt={gig.title}
                            className="w-full h-48 object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <img
                              src={gig.freelancer.avatar}
                              alt={gig.freelancer.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="text-sm text-gray-600">{gig.freelancer.name}</span>
                            {gig.freelancer.isVerified && (
                              <span className="text-blue-500">✓</span>
                            )}
                            {gig.freelancer.isTopRated && (
                              <span className="bg-orange-100 text-orange-800 text-xs px-1 py-0.5 rounded">Top Rated</span>
                            )}
                          </div>
                          <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 text-sm">
                            {gig.title}
                          </h3>
                          <div className="flex items-center gap-1 mb-3">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} className={`w-3 h-3 ${i < Math.floor(gig.rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-xs text-gray-600">({gig.reviews})</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-gray-900">
                              Rp {gig.price.toLocaleString('id-ID')}
                            </span>
                            <span className="text-xs text-gray-500">{gig.deliveryTime}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // List View
                      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-300">
                        <div className="flex gap-4">
                          <img 
                            src={gig.image} 
                            alt={gig.title}
                            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <img
                                src={gig.freelancer.avatar}
                                alt={gig.freelancer.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                              <span className="text-sm text-gray-600">{gig.freelancer.name}</span>
                              {gig.freelancer.isVerified && (
                                <span className="text-blue-500">✓</span>
                              )}
                              {gig.freelancer.isTopRated && (
                                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">Top Rated</span>
                              )}
                            </div>
                            <h3 className="font-medium text-gray-900 mb-2">
                              {gig.title}
                            </h3>
                            <div className="flex items-center gap-4 mb-2">
                              <div className="flex items-center gap-1">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <svg key={i} className={`w-4 h-4 ${i < Math.floor(gig.rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                                <span className="text-sm text-gray-600">({gig.reviews})</span>
                              </div>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">{gig.location}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-semibold text-gray-900">
                                Rp {gig.price.toLocaleString('id-ID')}
                              </span>
                              <span className="text-sm text-gray-500">{gig.deliveryTime}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination - only show if more than 1 page */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 border border-gray-300 rounded transition-colors ${
                      currentPage === 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded transition-colors ${
                          currentPage === pageNum
                            ? 'bg-[#010042] text-white'
                            : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 border border-gray-300 rounded transition-colors ${
                      currentPage === totalPages 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 