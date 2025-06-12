import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import favoriteService from '../../services/favoriteService';
import { formatPrice } from '../../utils/helpers';

export default function GigCard({ gig, showFavoriteButton = true, className = "", imageClassName = "", onFavoriteChange = null }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  
  // Check if current user is the gig owner
  const isOwnGig = currentUser && gig && currentUser.uid === gig.freelancerId;

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

    // Prevent freelancer from liking their own gig
    if (isOwnGig) {
      return; // Silently return for own gigs
    }

    setFavoriteLoading(true);
    try {
      const result = await favoriteService.toggleFavorite(currentUser.uid, gig.id);
      setIsFavorited(result.isFavorited);
      
      // Call the callback to show notification
      if (onFavoriteChange) {
        onFavoriteChange(result.isFavorited ? 'Ditambahkan ke favorit' : 'Dihapus dari favorit', true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Call the callback to show error notification
      if (onFavoriteChange) {
        onFavoriteChange('Gagal memperbarui favorit', false);
      }
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (!gig) return null;

  return (
    <Link to={`/gig/${gig.id}`} className={`block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 ${className}`}>
      <div className="relative">
        <img 
          src={gig.images?.[0] || gig.image || 'https://picsum.photos/400/300'} 
          alt={gig.title}
          className={`w-full rounded-t-lg ${imageClassName || 'h-48 object-cover'}`}
        />
        
        {showFavoriteButton && (
          <button
            onClick={handleFavoriteToggle}
            disabled={favoriteLoading || isOwnGig}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${
              isOwnGig
                ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                : isFavorited
                ? 'bg-red-100 border border-red-200 text-red-600 hover:bg-red-200'
                : 'bg-white/90 border border-gray-200 text-gray-600 hover:bg-white hover:text-red-500'
            } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : !isOwnGig ? 'hover:scale-105' : ''}`}
            title={isOwnGig ? 'Gig Anda sendiri' : isFavorited ? 'Hapus dari favorit' : 'Tambah ke favorit'}
          >
            {favoriteLoading ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
            ) : (
              <svg 
                className="w-5 h-5" 
                fill={isFavorited && !isOwnGig ? 'currentColor' : 'none'} 
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
        <div className="flex items-center justify-between mb-3">
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
        </div>
        
        {/* Gig Tags (if available) */}
        {gig.tags && Array.isArray(gig.tags) && gig.tags.length > 0 && (
          <div className="mb-2">
            <div className="flex flex-wrap gap-1">
              {gig.tags.slice(0, 3).map((tag, index) => {
                return (
                  <span key={index} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                    #{tag}
                  </span>
                );
              })}
              {gig.tags.length > 3 && (
                <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded flex items-center">+{gig.tags.length - 3} more</span>
              )}
            </div>
          </div>
        )}
        
        {/* Gig Title */}
        <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-[#010042] transition-colors mb-2">
          {gig.title}
        </h3>
        
        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
          <span className="text-sm font-medium text-gray-900">
            {gig.rating ? gig.rating.toFixed(1) : '0.0'}
          </span>
          <span className="text-sm text-gray-500">
            ({gig.totalReviews || 0})
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
    </Link>
  );
} 