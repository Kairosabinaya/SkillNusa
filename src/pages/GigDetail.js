import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import gigService from '../services/gigService';
import reviewService from '../services/reviewService';
import firebaseService from '../services/firebaseService';
import favoriteService from '../services/favoriteService';
import cartService from '../services/cartService';
import chatService from '../services/chatService';
import ErrorPopup from '../components/common/ErrorPopup';
import SuccessPopup from '../components/common/SuccessPopup';

export default function GigDetail() {
  const { gigId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState('basic');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsSortBy, setReviewsSortBy] = useState('date');
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if current user is the gig owner
  const isOwnGig = currentUser && gig && currentUser.uid === gig.freelancerId;

  // Load gig data
  useEffect(() => {
    const loadGigData = async () => {
      setLoading(true);
      try {
        const gigData = await gigService.getGigById(gigId);
        
        // Debug logging for freelancer data
        console.log('🔍 GigDetail: Full gig data received:', gigData);
        console.log('👤 GigDetail: Freelancer data:', gigData.freelancer);
        console.log('🎓 GigDetail: Education data:', gigData.freelancer?.education);
        console.log('📜 GigDetail: Certification data:', gigData.freelancer?.certifications);
        
        setGig(gigData);
        setReviews(gigData.reviews || []);
      } catch (error) {
        console.error('Error loading gig:', error);
        // Handle error state - maybe redirect to 404
      } finally {
        setLoading(false);
      }
    };

    if (gigId) {
      loadGigData();
    }
  }, [gigId]);

  // Check if gig is favorited when component mounts
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (currentUser && gig) {
        try {
          const favorited = await favoriteService.isFavorited(currentUser.uid, gig.id);
          setIsFavorited(favorited);
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
      }
    };

    checkFavoriteStatus();
  }, [currentUser, gig]);

  // Check if item is in cart when package changes
  useEffect(() => {
    const checkCartStatus = async () => {
      if (currentUser && gig) {
        try {
          const inCart = await cartService.isInCart(currentUser.uid, gig.id, selectedPackage);
          setIsInCart(inCart);
        } catch (error) {
          console.error('Error checking cart status:', error);
        }
      }
    };

    checkCartStatus();
  }, [currentUser, gig, selectedPackage]);

  // Handle package selection
  const handlePackageSelect = (packageType) => {
    setSelectedPackage(packageType);
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!gig) return;

    // Prevent freelancer from adding own gig to cart
    if (isOwnGig) {
      setError('You cannot add your own gig to cart');
      return;
    }

    setCartLoading(true);
    try {
      await cartService.addToCart(currentUser.uid, {
        gigId: gig.id,
        packageType: selectedPackage,
        quantity: 1
      });

      setIsInCart(true);
      
      // Replace alert with success state
      setSuccess('Item berhasil ditambahkan ke keranjang!');
      
      // Refresh cart count in dashboard if available
      if (window.refreshClientOrdersCount) {
        window.refreshClientOrdersCount();
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Replace alert with error state
      setError('Gagal menambahkan ke keranjang: ' + error.message);
    } finally {
      setCartLoading(false);
    }
  };

  // Handle direct checkout
  const handleDirectCheckout = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (!gig) return;

    // Prevent freelancer from checking out own gig
    if (isOwnGig) {
      setError('You cannot purchase your own gig');
      return;
    }
    
    const currentPackage = gig.packages[selectedPackage];
    navigate('/checkout', {
      state: {
        orderData: {
          gigId: gig.id,
          title: gig.title,
          description: currentPackage.description,
          freelancerId: gig.freelancerId,
          freelancer: gig.freelancer,
          packageType: selectedPackage,
          price: currentPackage.price,
          deliveryTime: `${currentPackage.deliveryTime} hari`,
          revisions: currentPackage.revisions,
          features: currentPackage.features
        }
      }
    });
  };

  // Handle reviews sorting
  const handleReviewsSort = (sortBy) => {
    setReviewsSortBy(sortBy);
    const sortedReviews = [...reviews].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      return 0;
    });
    setReviews(sortedReviews);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Get tier badge color
  const getTierBadgeColor = (tier) => {
    const colors = {
      bronze: 'bg-orange-100 text-orange-800',
      silver: 'bg-gray-100 text-gray-800',
      gold: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-purple-100 text-purple-800'
    };
    return colors[tier] || colors.bronze;
  };

  // Handle freelancer profile click
  const handleFreelancerProfileClick = () => {
    navigate(`/freelancer/${gig.freelancerId}`);
  };

  // Handle contact freelancer
  const handleContactFreelancer = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Prevent freelancer from contacting themselves
    if (isOwnGig) {
      setError('You cannot contact yourself');
      return;
    }

    try {
      // Create or get chat with gig context
      const chat = await chatService.createOrGetChat(
        currentUser.uid, 
        gig.freelancerId, 
        gig.id
      );

      // Navigate to messages with specific chat
      navigate(`/messages?chatId=${chat.id}`);
    } catch (error) {
      console.error('Error contacting freelancer:', error);
      // Replace alert with error state
      setError('Gagal memulai chat. Silakan coba lagi.');
    }
  };

  // Handle favorite toggle
  const handleFavoriteToggle = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setFavoriteLoading(true);
    try {
      const result = await favoriteService.toggleFavorite(currentUser.uid, gig.id);
      setIsFavorited(result.isFavorited);
      
      // Replace alerts with success state
      if (result.isFavorited) {
        setSuccess('Ditambahkan ke favorit!');
      } else {
        setSuccess('Dihapus dari favorit!');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Replace alert with error state
      setError('Gagal memproses favorit. Silakan coba lagi.');
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-3/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-300 rounded-lg mb-6"></div>
                <div className="h-32 bg-gray-300 rounded mb-6"></div>
              </div>
              <div>
                <div className="h-64 bg-gray-300 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Gig not found</h1>
          <Link to="/browse" className="text-blue-600 hover:text-blue-800">
            Browse all gigs
          </Link>
        </div>
      </div>
    );
  }

  const currentPackage = gig.packages[selectedPackage];

  return (
    <div className="min-h-screen bg-gray-50 pt-[40px]">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Add Error and Success Popups */}
        <ErrorPopup 
          message={error} 
          onClose={() => setError('')} 
          duration={3000}
        />
        
        <SuccessPopup 
          message={success} 
          onClose={() => setSuccess('')} 
          duration={3000}
        />
        
        {/* 1. Title */}
        <div className="mb-6">
          <nav className="text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-gray-700">Home</Link>
            <span className="mx-2">›</span>
            <Link to="/browse" className="hover:text-gray-700">Browse</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-900">{gig.category}</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{gig.title}</h1>
          
          {/* Freelancer Quick Info */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-3">
              <img 
                src={gig.freelancer.profilePhoto} 
                alt={gig.freelancer.displayName}
                className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-[#010042] transition-all"
                onClick={handleFreelancerProfileClick}
                title="Lihat profil freelancer"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span 
                    className="font-medium text-gray-900 cursor-pointer hover:text-[#010042] hover:underline transition-colors"
                    onClick={handleFreelancerProfileClick}
                    title="Lihat profil freelancer"
                  >
                    {gig.freelancer.displayName}
                  </span>
                  {gig.freelancer.isVerified && (
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${getTierBadgeColor(gig.freelancer.tier)}`}>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.1459 7.02251C11.5259 6.34084 11.7159 6 12 6C12.2841 6 12.4741 6.34084 12.8541 7.02251L12.9524 7.19887C13.0603 7.39258 13.1143 7.48944 13.1985 7.55334C13.2827 7.61725 13.3875 7.64097 13.5972 7.68841L13.7881 7.73161C14.526 7.89857 14.895 7.98205 14.9828 8.26432C15.0706 8.54659 14.819 8.84072 14.316 9.42898L14.1858 9.58117C14.0429 9.74833 13.9714 9.83191 13.9392 9.93531C13.9071 10.0387 13.9179 10.1502 13.9395 10.3733L13.9592 10.5763C14.0352 11.3612 14.0733 11.7536 13.8435 11.9281C13.6136 12.1025 13.2682 11.9435 12.5773 11.6254L12.3986 11.5431C12.2022 11.4527 12.1041 11.4075 12 11.4075C11.8959 11.4075 11.7978 11.4527 11.6014 11.5431L11.4227 11.6254C10.7318 11.9435 10.3864 12.1025 10.1565 11.9281C9.92674 11.7536 9.96476 11.3612 10.0408 10.5763L10.0605 10.3733C10.0821 10.1502 10.0929 10.0387 10.0608 9.93531C10.0286 9.83191 9.95713 9.74833 9.81418 9.58117L9.68403 9.42898C9.18097 8.84072 8.92945 8.54659 9.01723 8.26432C9.10501 7.98205 9.47396 7.89857 10.2119 7.73161L10.4028 7.68841C10.6125 7.64097 10.7173 7.61725 10.8015 7.55334C10.8857 7.48944 10.9397 7.39258 11.0476 7.19887L11.1459 7.02251Z" stroke="currentColor" strokeWidth="1.5"></path>
                      <path d="M7.35111 15L6.71424 17.323C6.0859 19.6148 5.77173 20.7607 6.19097 21.3881C6.3379 21.6079 6.535 21.7844 6.76372 21.9008C7.41635 22.2331 8.42401 21.7081 10.4393 20.658C11.1099 20.3086 11.4452 20.1339 11.8014 20.0959C11.9335 20.0818 12.0665 20.0818 12.1986 20.0959C12.5548 20.1339 12.8901 20.3086 13.5607 20.658C15.576 21.7081 16.5837 22.2331 17.2363 21.9008C17.465 21.7844 17.6621 21.6079 17.809 21.3881C18.2283 20.7607 17.9141 19.6148 17.2858 17.323L16.6489 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                      <path d="M5.5 6.39691C5.17745 7.20159 5 8.08007 5 9C5 12.866 8.13401 16 12 16C15.866 16 19 12.866 19 9C19 5.13401 15.866 2 12 2C11.0801 2 10.2016 2.17745 9.39691 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                    </svg>
                    {gig.freelancer.tier.toUpperCase()}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-medium">{gig.freelancer.rating}</span>
                    <span className="text-gray-500 ml-1">({gig.freelancer.totalReviews})</span>
                  </div>
                  <span>•</span>
                  <span>{gig.freelancer.completedProjects} orders completed</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">{gig.category}</span>
            {gig.tags.map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 2. Photos */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="aspect-video bg-gray-200">
                <img 
                  src={gig.images[selectedImageIndex]} 
                  alt={gig.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {gig.images.length > 1 && (
                <div className="p-4 border-t">
                  <div className="flex space-x-2 overflow-x-auto">
                    {gig.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${
                          selectedImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                        }`}
                      >
                        <img src={image} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. About Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About This Gig</h2>
              <div className="prose prose-gray max-w-none">
                <div>
                  {gig.description.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3 text-gray-700">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. Freelancer Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">About The Freelancer</h2>
              
              {/* Profile Section */}
              <div className="flex flex-col items-start mb-6">
                <div className="flex items-start w-full mb-4">
                  <img 
                    src={gig.freelancer.profilePhoto} 
                    alt={gig.freelancer.displayName}
                    className="w-24 h-24 rounded-full object-cover mr-4 flex-shrink-0 cursor-pointer hover:ring-4 hover:ring-[#010042]/20 transition-all"
                    onClick={handleFreelancerProfileClick}
                    title="Lihat profil freelancer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 
                        className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-[#010042] hover:underline transition-colors"
                        onClick={handleFreelancerProfileClick}
                        title="Lihat profil freelancer"
                      >
                        {gig.freelancer.displayName}
                      </h3>
                      {gig.freelancer.isVerified && (
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                        </svg>
                        <span className="ml-1 text-sm font-medium text-gray-900">
                          {gig.freelancer.rating || 5.0}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        ({gig.freelancer.totalReviews || 0} reviews)
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-500">
                        {gig.freelancer.completedProjects || 0} orders completed
                      </span>
                    </div>
                    <div className="flex">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${getTierBadgeColor(gig.freelancer.tier)}`}>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.1459 7.02251C11.5259 6.34084 11.7159 6 12 6C12.2841 6 12.4741 6.34084 12.8541 7.02251L12.9524 7.19887C13.0603 7.39258 13.1143 7.48944 13.1985 7.55334C13.2827 7.61725 13.3875 7.64097 13.5972 7.68841L13.7881 7.73161C14.526 7.89857 14.895 7.98205 14.9828 8.26432C15.0706 8.54659 14.819 8.84072 14.316 9.42898L14.1858 9.58117C14.0429 9.74833 13.9714 9.83191 13.9392 9.93531C13.9071 10.0387 13.9179 10.1502 13.9395 10.3733L13.9592 10.5763C14.0352 11.3612 14.0733 11.7536 13.8435 11.9281C13.6136 12.1025 13.2682 11.9435 12.5773 11.6254L12.3986 11.5431C12.2022 11.4527 12.1041 11.4075 12 11.4075C11.8959 11.4075 11.7978 11.4527 11.6014 11.5431L11.4227 11.6254C10.7318 11.9435 10.3864 12.1025 10.1565 11.9281C9.92674 11.7536 9.96476 11.3612 10.0408 10.5763L10.0605 10.3733C10.0821 10.1502 10.0929 10.0387 10.0608 9.93531C10.0286 9.83191 9.95713 9.74833 9.81418 9.58117L9.68403 9.42898C9.18097 8.84072 8.92945 8.54659 9.01723 8.26432C9.10501 7.98205 9.47396 7.89857 10.2119 7.73161L10.4028 7.68841C10.6125 7.64097 10.7173 7.61725 10.8015 7.55334C10.8857 7.48944 10.9397 7.39258 11.0476 7.19887L11.1459 7.02251Z" stroke="currentColor" strokeWidth="1.5"></path>
                          <path d="M7.35111 15L6.71424 17.323C6.0859 19.6148 5.77173 20.7607 6.19097 21.3881C6.3379 21.6079 6.535 21.7844 6.76372 21.9008C7.41635 22.2331 8.42401 21.7081 10.4393 20.658C11.1099 20.3086 11.4452 20.1339 11.8014 20.0959C11.9335 20.0818 12.0665 20.0818 12.1986 20.0959C12.5548 20.1339 12.8901 20.3086 13.5607 20.658C15.576 21.7081 16.5837 22.2331 17.2363 21.9008C17.465 21.7844 17.6621 21.6079 17.809 21.3881C18.2283 20.7607 17.9141 19.6148 17.2858 17.323L16.6489 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                          <path d="M5.5 6.39691C5.17745 7.20159 5 8.08007 5 9C5 12.866 8.13401 16 12 16C15.866 16 19 12.866 19 9C19 5.13401 15.866 2 12 2C11.0801 2 10.2016 2.17745 9.39691 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                        </svg>
                        {gig.freelancer.tier.toUpperCase()}
                      </div>
                    </div>
                    
                  </div>
                    

                </div>
                <p className="text-gray-700 text-base w-full">
                  {gig.freelancer.bio}
                </p>
              </div>

              {/* Detailed Sections */}
              <div className="space-y-6">
                {/* Skills Section */}
                <div className="border-t pt-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {gig.freelancer.skills.map((skill, index) => {
                      // Handle both string skills and object skills {skill, experienceLevel}
                      const skillText = typeof skill === 'string' ? skill : skill?.skill || skill;
                      const expLevel = typeof skill === 'object' && skill?.experienceLevel ? ` (${skill.experienceLevel})` : '';
                      
                      return (
                        <span key={index} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                          {skillText}{expLevel}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Education Section */}
                {gig.freelancer.education && gig.freelancer.education.length > 0 && (
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                      Education
                    </h4>
                    <div className="space-y-4">
                      {gig.freelancer.education.map((edu, index) => {
                        // Debug logging for each education entry
                        console.log(`🎓 Education entry ${index}:`, edu);
                        
                        // Handle different possible field names
                        const degree = edu.degree || edu.title || 'Unknown Degree';
                        const institution = edu.university || edu.institution || edu.school || 'Unknown Institution';
                        const year = edu.graduationYear || edu.year || edu.endYear || 'Unknown Year';
                        const fieldOfStudy = edu.fieldOfStudy || edu.major || '';
                        
                        return (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="font-medium text-gray-900">
                              {degree}
                              {fieldOfStudy && ` in ${fieldOfStudy}`}
                            </div>
                            <div className="text-gray-600 mt-1 text-sm">
                              {institution}
                              <span className="mx-2">•</span>
                              <span className="text-blue-600">{year}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Debug: Show if education array exists but is empty */}
                {gig.freelancer.education && gig.freelancer.education.length === 0 && (
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                      Education
                    </h4>
                    <div className="text-gray-500 text-sm">
                      No education information available
                    </div>
                  </div>
                )}

                {/* Certifications Section */}
                {gig.freelancer.certifications && gig.freelancer.certifications.length > 0 && (
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-2" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                        <g id="Layer_2" data-name="Layer 2">
                          <g id="icons_Q2" data-name="icons Q2">
                            <g>
                              <path d="M20,39H6V9H40a2,2,0,0,0,0-4H4A2,2,0,0,0,2,7V41a2,2,0,0,0,2,2H20a2,2,0,0,0,0-4Z"></path>
                              <path d="M46,24A13,13,0,0,0,33,11a12.8,12.8,0,0,0-8.3,3H12a2,2,0,0,0,0,4h9.5a11.1,11.1,0,0,0-1.3,4H12a2,2,0,0,0,0,4h8.2a11.1,11.1,0,0,0,1.3,4H12a2,2,0,0,0,0,4H24.7l1.3.9v9.7A2.3,2.3,0,0,0,28,47a1.8,1.8,0,0,0,1.3-.6L33,43l3.7,3.4A1.8,1.8,0,0,0,38,47a2.3,2.3,0,0,0,2-2.4V35A13.2,13.2,0,0,0,46,24ZM36,32.5v7.8l-3-2.8-3,2.8V32.5A9.1,9.1,0,0,1,24,24a9,9,0,0,1,18,0A9.1,9.1,0,0,1,36,32.5Z"></path>
                              <circle cx="33" cy="24" r="5"></circle>
                            </g>
                          </g>
                        </g>
                      </svg>
                      Certification
                    </h4>
                    <div className="space-y-4">
                      {gig.freelancer.certifications.map((cert, index) => {
                        // Debug logging for each certification entry
                        console.log(`📜 Certification entry ${index}:`, cert);
                        
                        // Handle different possible field names
                        const name = cert.name || cert.title || 'Unknown Certification';
                        const issuer = cert.issuedBy || cert.issuer || cert.organization || 'Unknown Issuer';
                        const year = cert.year || cert.issueYear || cert.date || 'Unknown Year';
                        
                        return (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="font-medium text-gray-900">{name}</div>
                            <div className="text-gray-600 mt-1 text-sm">
                              {issuer}
                              <span className="mx-2">•</span>
                              <span className="text-blue-600">{year}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Debug: Show if certifications array exists but is empty */}
                {gig.freelancer.certifications && gig.freelancer.certifications.length === 0 && (
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-2" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                        <g id="Layer_2" data-name="Layer 2">
                          <g id="icons_Q2" data-name="icons Q2">
                            <g>
                              <path d="M20,39H6V9H40a2,2,0,0,0,0-4H4A2,2,0,0,0,2,7V41a2,2,0,0,0,2,2H20a2,2,0,0,0,0-4Z"></path>
                              <path d="M46,24A13,13,0,0,0,33,11a12.8,12.8,0,0,0-8.3,3H12a2,2,0,0,0,0,4h9.5a11.1,11.1,0,0,0-1.3,4H12a2,2,0,0,0,0,4h8.2a11.1,11.1,0,0,0,1.3,4H12a2,2,0,0,0,0,4H24.7l1.3.9v9.7A2.3,2.3,0,0,0,28,47a1.8,1.8,0,0,0,1.3-.6L33,43l3.7,3.4A1.8,1.8,0,0,0,38,47a2.3,2.3,0,0,0,2-2.4V35A13.2,13.2,0,0,0,46,24ZM36,32.5v7.8l-3-2.8-3,2.8V32.5A9.1,9.1,0,0,1,24,24a9,9,0,0,1,18,0A9.1,9.1,0,0,1,36,32.5Z"></path>
                              <circle cx="33" cy="24" r="5"></circle>
                            </g>
                          </g>
                        </g>
                      </svg>
                      Certification
                    </h4>
                    <div className="text-gray-500 text-sm">
                      No certification information available
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 6. Reviews */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Reviews ({reviews.length})
                </h2>
                <select 
                  value={reviewsSortBy}
                  onChange={(e) => handleReviewsSort(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="date">Sort by Date</option>
                  <option value="rating">Sort by Rating</option>
                </select>
              </div>

              {reviews.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No reviews yet</p>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex items-start space-x-3">
                        <img 
                          src={review.client.avatar || 'https://via.placeholder.com/40'} 
                          alt={review.client.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900">{review.client.name}</h4>
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm mb-2">{review.comment}</p>
                          <p className="text-gray-500 text-xs">
                            {(() => {
                              let date;
                              if (review.createdAt && review.createdAt.seconds) {
                                // Firestore timestamp
                                date = new Date(review.createdAt.seconds * 1000);
                              } else if (review.createdAt) {
                                // Regular date string or Date object
                                date = new Date(review.createdAt);
                              } else {
                                date = new Date();
                              }
                              
                              return date.toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              });
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Package Selection */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-lg shadow-sm p-6">
                
                {/* 3. Package Selection */}
                <div className="mb-6">
                  <div className="flex border-b border-gray-200">
                    {['basic', 'standard', 'premium'].filter(key => gig.packages[key]).map((key) => {
                      const pkg = gig.packages[key];
                      return (
                        <button
                          key={key}
                          onClick={() => handlePackageSelect(key)}
                          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 ${
                            selectedPackage === key
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Package Details */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{currentPackage.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{currentPackage.description}</p>
                  
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-gray-900">{formatCurrency(currentPackage.price)}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" viewBox="0 0 50 50" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 11C4.898438 11 0 15.898438 0 22C0 24.300781 0.699219 26.5 2 28.300781L2 42C2 43.601563 3.398438 45 5 45L7.09375 45C7.574219 47.828125 10.042969 50 13 50C15.957031 50 18.425781 47.828125 18.90625 45L28.097656 45C29.699219 45 30.902344 43.699219 30.902344 42.199219L30.902344 17.902344C31 16.300781 29.699219 15 28.199219 15L19.5 15C17.5 12.601563 14.398438 11 11 11 Z M 11 13C16 13 20 17 20 22C20 27 16 31 11 31C6 31 2 27 2 22C2 17 6 13 11 13 Z M 34 20C32.898438 20 32 20.898438 32 22L32 43C32 43.839844 32.527344 44.5625 33.265625 44.855469C33.6875 47.753906 36.191406 50 39.199219 50C42.15625 50 44.628906 47.828125 45.109375 45L47 45C48.699219 45 50 43.699219 50 42L50 32.402344C50 30.402344 48.601563 28.300781 48.402344 28.097656L46.097656 25L44.199219 22.5C43.199219 21.398438 41.699219 20 40 20 Z M 38 25L43.597656 25L46.800781 29.199219C47.101563 29.699219 48 31.199219 48 32.300781L48 33L38 33C37 33 36 32 36 31L36 27C36 25.898438 37 25 38 25 Z M 13 40C15.199219 40 17 41.800781 17 44C17 46.199219 15.199219 48 13 48C10.800781 48 9 46.199219 9 44C9 41.800781 10.800781 40 13 40 Z M 39.199219 40C41.398438 40 43.199219 41.800781 43.199219 44C43.199219 46.199219 41.398438 48 39.199219 48C37 48 35.199219 46.199219 35.199219 44C35.199219 41.800781 37 40 39.199219 40Z"/>
                      </svg>
                      <span>{currentPackage.deliveryTime} hari delivery</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" viewBox="0 0 298.807 298.807" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M223.383,255.164l-9.54-33.76c-71.4,63.126-130.786,5.012-141.612-11.675l5.504-3.399c2.433-1.508,3.857-4.221,3.707-7.081 c-0.149-2.857-1.846-5.41-4.423-6.654l-49.377-23.802c-1.08-0.523-2.239-0.782-3.399-0.782c-1.433,0-2.861,0.398-4.121,1.175 c-2.279,1.403-3.682,3.871-3.722,6.548l-0.841,54.812c-0.045,2.861,1.478,5.519,3.965,6.937c1.205,0.682,2.539,1.02,3.872,1.02 c1.429,0,2.857-0.389,4.121-1.169l2.633-1.627c45.271,73.442,149.175,80.638,205.414,32.69 C229.663,266.098,225.12,261.325,223.383,255.164z M56.666,169.026c-5.809-31.47,15.082-95.47,84.416-103.008v0.836c0,2.861,1.563,5.499,4.071,6.873 c1.174,0.647,2.474,0.965,3.767,0.965c1.469,0,2.936-0.413,4.221-1.234l46.196-29.5c2.26-1.443,3.623-3.931,3.623-6.608 c0-2.678-1.363-5.166-3.618-6.609L153.14,1.234C151.856,0.413,150.388,0,148.919,0c-1.293,0-2.593,0.318-3.767,0.965 c-2.508,1.374-4.071,4.011-4.071,6.873v8.639C73.737,16.189,2.111,79.857,6.727,165.732c0,0,10.425-10.112,17.517-10.112 C30.207,155.62,31.274,156.788,56.666,169.026z M292.123,212.351c-0.592-2.802-2.662-5.061-5.405-5.887l-5.652-1.707c16.622-46.53,11.226-126.807-66.247-171.649 c0.293,1.383,0.532,2.787,0.532,4.24c0,6.942-3.494,13.317-9.346,17.054l-26.679,17.035c23.634,6.821,77.648,48.932,54.274,118.997 l-3.384-1.02c-0.746-0.223-1.508-0.338-2.265-0.338c-2.025,0-4.006,0.792-5.488,2.249c-2.045,2.005-2.832,4.966-2.056,7.723 l14.899,52.746c0.727,2.574,2.717,4.599,5.275,5.375c0.741,0.223,1.507,0.333,2.265,0.333c1.846,0,3.662-0.658,5.105-1.892 l41.604-35.691C291.73,218.055,292.715,215.153,292.123,212.351z"/>
                      </svg>
                      <span>{currentPackage.revisions === 'Unlimited' ? 'Unlimited' : `${currentPackage.revisions}`} revisions</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">What's included:</h4>
                    <ul className="space-y-1">
                      {currentPackage.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-700">
                          <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  {isOwnGig ? (
                    // Show different buttons for gig owner
                    <div className="space-y-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <h4 className="font-medium text-blue-900 mb-2">This is your gig</h4>
                        <p className="text-sm text-blue-700 mb-3">
                          You can manage your gig from your dashboard
                        </p>
                        <div className="flex flex-col gap-2">
                          <Link 
                            to={`/dashboard/freelancer/gigs/edit/${gig.id}`}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
                          >
                            Edit Gig
                          </Link>
                          <Link 
                            to="/dashboard/freelancer/gigs"
                            className="w-full bg-white text-blue-600 py-2 px-4 rounded-lg font-medium border border-blue-200 hover:bg-blue-50 transition-colors text-center"
                          >
                            Manage Gigs
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Show regular buttons for other users
                    <div className="space-y-3">
                      <button
                        onClick={handleDirectCheckout}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Continue ({formatCurrency(currentPackage.price)})
                      </button>
                      
                      <button
                        onClick={handleAddToCart}
                        disabled={cartLoading || isInCart}
                        className="w-full bg-white text-gray-900 py-3 px-4 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cartLoading ? 'Adding...' : isInCart ? 'Already in Cart' : 'Add to Cart'}
                      </button>

                      <button
                        onClick={handleContactFreelancer}
                        className="w-full bg-white text-blue-600 py-3 px-4 rounded-lg font-medium border border-blue-200 hover:bg-blue-50 transition-colors"
                      >
                        Contact Freelancer
                      </button>

                      {/* Add to Favorites Button */}
                      <button
                        onClick={handleFavoriteToggle}
                        disabled={favoriteLoading}
                        className={`w-full py-3 px-4 rounded-lg font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          isFavorited
                            ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {favoriteLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-current"></div>
                            <span className="ml-2">Processing...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <svg 
                              className="w-5 h-5 mr-2" 
                              fill={isFavorited ? 'currentColor' : 'none'} 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                              />
                            </svg>
                            {isFavorited ? 'Go to Favorites' : 'Add to Favorites'}
                          </div>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
