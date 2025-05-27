import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import gigService from '../services/gigService';
import reviewService from '../services/reviewService';
import firebaseService from '../services/firebaseService';
import favoriteService from '../services/favoriteService';
import chatService from '../services/chatService';

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

  // Load gig data
  useEffect(() => {
    const loadGigData = async () => {
      setLoading(true);
      try {
        const gigData = await gigService.getGigById(gigId);
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

  // Handle package selection
  const handlePackageSelect = (packageType) => {
    setSelectedPackage(packageType);
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    const currentPackage = gig.packages[selectedPackage];
    const cartItem = {
      gigId: gig.id,
      gigTitle: gig.title,
      freelancerId: gig.freelancerId,
      freelancerName: gig.freelancer.displayName,
      packageType: selectedPackage,
      packageName: currentPackage.name,
      price: currentPackage.price,
      deliveryTime: currentPackage.deliveryTime,
      revisions: currentPackage.revisions,
      gigImage: gig.images[0]
    };
    
    // Add to cart (implement cart service)
    console.log('Adding to cart:', cartItem);
    // cartService.addToCart(cartItem);
    
    // Show success message
    alert('Item added to cart!');
  };

  // Handle direct checkout
  const handleDirectCheckout = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    const currentPackage = gig.packages[selectedPackage];
    navigate('/checkout', {
      state: {
        orderData: {
          gigId: gig.id,
          gigTitle: gig.title,
          freelancerId: gig.freelancerId,
          freelancerName: gig.freelancer.displayName,
          packageType: selectedPackage,
          packageName: currentPackage.name,
          price: currentPackage.price,
          deliveryTime: currentPackage.deliveryTime,
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
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Handle contact freelancer
  const handleContactFreelancer = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      // Create or find existing chat
      const chat = await chatService.createOrGetChat(currentUser.uid, gig.freelancer.id, gig.id);
      navigate(`/messages/${chat.id}`);
    } catch (error) {
      console.error('Error creating chat:', error);
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
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* 1. Title */}
        <div className="mb-8">
          <nav className="text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-gray-700">Home</Link>
            <span className="mx-2">›</span>
            <Link to="/browse" className="hover:text-gray-700">Browse</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-900">{gig.category}</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{gig.title}</h1>
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
                <div className={`${!showFullDescription ? 'line-clamp-4' : ''}`}>
                  {gig.description.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3 text-gray-700">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {gig.description.length > 300 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-blue-600 hover:text-blue-800 font-medium mt-2"
                  >
                    {showFullDescription ? 'Lihat Lebih Sedikit' : 'Lihat Selengkapnya'}
                  </button>
                )}
              </div>
            </div>

            {/* 5. Freelancer Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">About The Freelancer</h2>
              
              <div className="flex items-start space-x-4 mb-6">
                <img 
                  src={gig.freelancer.profilePhoto} 
                  alt={gig.freelancer.displayName}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{gig.freelancer.displayName}</h3>
                    {gig.freelancer.isVerified && (
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTierBadgeColor(gig.freelancer.tier)}`}>
                      {gig.freelancer.tier.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-medium">{gig.freelancer.rating}</span>
                      <span className="text-gray-500">({gig.freelancer.totalReviews} reviews)</span>
                    </div>
                    <span>•</span>
                    <span>{gig.freelancer.completedProjects} projects completed</span>
                  </div>
                  
                  <p className="text-gray-700 text-sm">{gig.freelancer.bio}</p>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {gig.freelancer.skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Education */}
              {gig.freelancer.education && gig.freelancer.education.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Education</h4>
                  {gig.freelancer.education.map((edu, index) => (
                    <div key={index} className="text-sm text-gray-700">
                      <div className="font-medium">{edu.degree}</div>
                      <div className="text-gray-600">{edu.institution} • {edu.year}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Certifications */}
              {gig.freelancer.certifications && gig.freelancer.certifications.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Certifications</h4>
                  {gig.freelancer.certifications.map((cert, index) => (
                    <div key={index} className="text-sm text-gray-700 mb-1">
                      <div className="font-medium">{cert.name}</div>
                      <div className="text-gray-600">{cert.issuer} • {cert.year}</div>
                    </div>
                  ))}
                </div>
              )}
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
                            {new Date(review.createdAt.seconds * 1000).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
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
                    {Object.entries(gig.packages).map(([key, pkg]) => (
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
                    ))}
                  </div>
                </div>

                {/* Selected Package Details */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{currentPackage.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{currentPackage.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-gray-900">{formatCurrency(currentPackage.price)}</span>
                    <div className="text-right text-sm text-gray-600">
                      <div>🚚 {currentPackage.deliveryTime} days delivery</div>
                      <div>🔄 {currentPackage.revisions} revisions</div>
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
                  <div className="space-y-3">
                    <button
                      onClick={handleDirectCheckout}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Continue ({formatCurrency(currentPackage.price)})
                    </button>
                    
                    <button
                      onClick={handleAddToCart}
                      className="w-full bg-white text-gray-900 py-3 px-4 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>

                  {/* Contact Freelancer */}
                  <div className="pt-4 border-t border-gray-200 mt-6">
                    <button
                      onClick={handleContactFreelancer}
                      className="w-full text-blue-600 hover:text-blue-800 font-medium py-2"
                    >
                      Contact Freelancer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
