import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import favoriteService from '../../services/favoriteService';

export default function GigCard({ gig, showFavoriteButton = true, className = "", imageClassName = "" }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Check if gig is favorited when component mounts
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (currentUser && gig?.id) {
        try {
          console.log('Checking favorite status for gig:', gig.id, 'user:', currentUser.uid);
          const favorited = await favoriteService.isFavorited(currentUser.uid, gig.id);
          console.log('Favorite status:', favorited);
          setIsFavorited(favorited);
        } catch (error) {
          console.error('Error checking favorite status:', error);
          setIsFavorited(false); // Set to false on error
        }
      } else {
        setIsFavorited(false); // Reset if no user or gig
      }
    };

    checkFavoriteStatus();
  }, [currentUser, gig?.id]);

  // Handle favorite toggle
  const handleFavoriteToggle = async (e) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Stop event bubbling

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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (!gig) return null;

  return (
    <div className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 ${className}`}>
      <div className="relative">
        <Link to={`/gig/${gig.id}`}>
          <img 
            src={gig.images?.[0] || gig.image || 'https://picsum.photos/400/300'} 
            alt={gig.title}
            className={`w-full rounded-t-lg ${imageClassName || 'h-48 object-cover'}`}
          />
        </Link>
        
        {showFavoriteButton && (
          <button
            onClick={handleFavoriteToggle}
            disabled={favoriteLoading}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${
              isFavorited
                ? 'bg-red-100 border border-red-200 text-red-600 hover:bg-red-200'
                : 'bg-white/90 border border-gray-200 text-gray-600 hover:bg-white hover:text-red-500'
            } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
            title={isFavorited ? 'Hapus dari favorit' : 'Tambah ke favorit'}
          >
            {favoriteLoading ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
            ) : (
              <svg 
                className="w-5 h-5" 
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
            )}
          </button>
        )}
      </div>
      
      <div className="p-4">
        {/* Freelancer Info */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <img 
              src={gig.freelancer?.profilePhoto || gig.freelancer?.profileImage || 'https://picsum.photos/32/32'} 
              alt={gig.freelancer?.displayName || gig.freelancer?.name || 'Freelancer'}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-sm text-gray-600 truncate">
              {gig.freelancer?.displayName || gig.freelancer?.name || 'Freelancer'}
            </span>
          </div>
          {(gig.freelancer?.isTopRated || gig.isTopRated) && (
            <div className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
              <svg className="w-4 h-4" viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M26,7H24V6a2.0023,2.0023,0,0,0-2-2H10A2.0023,2.0023,0,0,0,8,6V7H6A2.0023,2.0023,0,0,0,4,9v3a4.0045,4.0045,0,0,0,4,4h.322A8.1689,8.1689,0,0,0,15,21.9341V26H10v2H22V26H17V21.9311A7.9661,7.9661,0,0,0,23.74,16H24a4.0045,4.0045,0,0,0,4-4V9A2.0023,2.0023,0,0,0,26,7ZM8,14a2.0023,2.0023,0,0,1-2-2V9H8Zm14,0a6,6,0,0,1-6.1855,5.9971A6.1991,6.1991,0,0,1,10,13.7065V6H22Zm4-2a2.0023,2.0023,0,0,1-2,2V9h2Z"></path>
              </svg>
              Top Rated
            </div>
          )}
        </div>
        
        {/* Gig Title */}
        <Link to={`/gig/${gig.id}`}>
          <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-[#010042] hover:underline transition-colors mb-2">
            {gig.title}
          </h3>
        </Link>
        
        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
          <span className="text-sm font-medium text-gray-900">
            {gig.rating || 5.0}
          </span>
          <span className="text-sm text-gray-500">
            ({gig.totalReviews || gig.reviewCount || 0})
          </span>
        </div>
        
        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500">Mulai dari</span>
            <div className="text-lg font-bold text-gray-900">
              {formatPrice(
                gig.packages?.basic?.price || 
                gig.startingPrice || 
                gig.price || 
                100000
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 