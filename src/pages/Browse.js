import { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import gigService from '../services/gigService';
import GigCard from '../components/common/GigCard';
import PageContainer from '../components/common/PageContainer';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { COLLECTIONS } from '../utils/constants';

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
    "Business"
  ];

  // Load gigs data from database
  useEffect(() => {
    const loadGigs = async () => {
      setLoading(true);
      try {
        // Get gigs from database using the new service
        const gigData = await gigService.getGigs({}, { limit: 50 });
        
        if (gigData && gigData.length > 0) {
          // Transform the data to match our component's expected format
          const transformedGigs = await Promise.all(gigData.map(async gig => {
            // Get reviews for this gig
            const reviewsQuery = query(
              collection(db, COLLECTIONS.REVIEWS),
              where('gigId', '==', gig.id)
            );
            const reviewsSnapshot = await getDocs(reviewsQuery);
            
            // Calculate average rating
            let totalRating = 0;
            let reviewCount = reviewsSnapshot.size;
            
            reviewsSnapshot.forEach(doc => {
              const review = doc.data();
              totalRating += review.rating || 0;
            });
            
            const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;
            
            return {
              id: gig.id,
              images: gig.images || [],
              image: gig.images?.[0] || 'https://via.placeholder.com/400x300',
              title: gig.title,
              category: gig.category,
              freelancer: {
                name: gig.freelancer.displayName || gig.freelancer.name,
                displayName: gig.freelancer.displayName || gig.freelancer.name,
                avatar: gig.freelancer.profilePhoto || gig.freelancer.avatar,
                profilePhoto: gig.freelancer.profilePhoto || gig.freelancer.avatar,
                isVerified: gig.freelancer.isVerified
              },
              rating: averageRating,
              totalReviews: reviewCount,
              price: gig.packages?.basic?.price || 0,
              startingPrice: gig.packages?.basic?.price || 0,
              deliveryTime: gig.packages?.basic?.deliveryTime + ' days' || 'N/A',
              location: gig.freelancer.location || 'Unknown'
            };
          }));
          
          setGigs(transformedGigs);
        } else {
          setGigs([]);
        }
      } catch (error) {
        console.error('Error loading gigs:', error);
        setGigs([]);
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
      deliveryTime: ''
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
      <PageContainer padding="px-6 py-3">
        <nav className="flex items-center space-x-2 text-sm text-gray-500 py-2">
          <Link to="/" className="hover:text-gray-900">Home</Link>
          <span className="text-gray-400 mx-1">›</span>
          {filters.category ? (
            <>
              <Link to="/browse" className="hover:text-gray-900">Browse</Link>
              <span className="text-gray-400 mx-1">›</span>
              <span className="text-gray-900">{filters.category}</span>
            </>
          ) : (
            <span className="text-gray-900">Browse Gigs</span>
          )}
        </nav>
      </PageContainer>

      <PageContainer padding="px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Filters */}
          <div className="w-full lg:w-80 bg-white rounded-lg p-4 sm:p-6 h-fit lg:sticky lg:top-6">
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
                {[4.0, 3.0, 2.0, 1.0].map((rating) => (
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

            
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                    {searchQuery ? `Hasil pencarian untuk "${searchQuery}"` : 
                     filters.category ? `Gigs dalam ${filters.category}` : 'Semua Gigs'}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Menampilkan {startIndex + 1}-{Math.min(endIndex, totalGigs)} dari {totalGigs} gigs
                    {totalPages > 1 && ` (Halaman ${currentPage} dari ${totalPages})`}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  {/* View Mode Toggle - Hidden on mobile */}
                  <div className="hidden sm:flex border border-gray-300 rounded">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                      title="Grid View"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-2 ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                      title="List View"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Sort Dropdown */}
                  <div className="relative min-w-0 flex-1 sm:flex-none">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full sm:w-auto appearance-none bg-white border border-gray-300 rounded px-3 sm:px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-[#010042]"
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
            </div>

            {/* Gigs Grid/List */}
            {totalGigs === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.78-6.22-2.09l-.44-.41C5.86 12.25 6 12 6 12h.01L6 12z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada gigs yang ditemukan</h3>
                <p className="text-gray-600 text-sm sm:text-base">Coba ubah filter atau kata kunci pencarian Anda</p>
              </div>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
                  : "space-y-4"
              }>
                {currentGigs.map((gig) => (
                  <GigCard 
                    key={gig.id} 
                    gig={{
                      ...gig,
                      freelancer: {
                        ...gig.freelancer,
                        profilePhoto: gig.freelancer.avatar,
                        displayName: gig.freelancer.name
                      }
                    }}
                    showFavoriteButton={true}
                    imageClassName="aspect-[16/9] object-cover"
                  />
                ))}
              </div>
            )}

            {/* Pagination - only show if more than 1 page */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 sm:mt-8">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-2 sm:px-3 py-2 border border-gray-300 rounded text-sm transition-colors ${
                      currentPage === 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">‹</span>
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(window.innerWidth < 640 ? 3 : 5, totalPages) }, (_, i) => {
                    let pageNum;
                    const maxPages = window.innerWidth < 640 ? 3 : 5;
                    if (totalPages <= maxPages) {
                      pageNum = i + 1;
                    } else if (currentPage <= Math.floor(maxPages/2) + 1) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - Math.floor(maxPages/2)) {
                      pageNum = totalPages - maxPages + 1 + i;
                    } else {
                      pageNum = currentPage - Math.floor(maxPages/2) + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-2 sm:px-3 py-2 rounded text-sm transition-colors ${
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
                    className={`px-2 sm:px-3 py-2 border border-gray-300 rounded text-sm transition-colors ${
                      currentPage === totalPages 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">›</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  );
} 