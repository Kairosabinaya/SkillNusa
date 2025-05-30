import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import favoriteService from '../services/favoriteService';

export default function Favorites() {
  const { currentUser } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFavorites();
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFavorites = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      console.log('Loading favorites for user:', currentUser.uid);
      const userFavorites = await favoriteService.getUserFavoritesWithGigs(currentUser.uid);
      console.log('Loaded favorites:', userFavorites);
      setFavorites(userFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setError('Gagal memuat favorit: ' + error.message);
    } finally {
      setLoading(false);
    }
  };



  const handleRemoveFavorite = async (gigId) => {
    try {
      await favoriteService.removeFromFavorites(currentUser.uid, gigId);
      // Remove from local state
      setFavorites(prev => prev.filter(fav => fav.gigId !== gigId));
    } catch (error) {
      console.error('Error removing favorite:', error);
      setError('Gagal menghapus dari favorit');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 ">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="h-48 bg-gray-300 rounded mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 ">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="text-red-500 text-lg">{error}</div>
            <button 
              onClick={loadFavorites}
              className="mt-4 bg-[#010042] text-white px-4 py-2 rounded-lg hover:bg-[#0100a3]"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Layanan Favorit</h1>
          <p className="text-gray-600">Layanan yang telah Anda simpan untuk referensi</p>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Belum Ada Favorit</h3>
            <p className="text-gray-500 mb-6">Mulai simpan layanan yang menarik untuk Anda</p>
            <Link 
              to="/browse" 
              className="inline-flex items-center px-6 py-3 bg-[#010042] text-white rounded-lg hover:bg-[#0100a3] transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Jelajahi Layanan
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 text-sm text-gray-600">
              {favorites.length} layanan disimpan
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map((favorite) => {
                const gig = favorite.gig;
                if (!gig) return null;

                return (
                  <div key={favorite.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                    <div className="relative">
                      <Link to={`/gig/${gig.id}`}>
                        <img 
                          src={gig.images?.[0] || 'https://picsum.photos/400/300'} 
                          alt={gig.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      </Link>
                      <button
                        onClick={() => handleRemoveFavorite(gig.id)}
                        className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-sm"
                        title="Hapus dari favorit"
                      >
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </button>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <img 
                          src={gig.freelancer?.profilePhoto || 'https://picsum.photos/32/32'} 
                          alt={gig.freelancer?.displayName}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm text-gray-600 truncate">
                          {gig.freelancer?.displayName || 'Freelancer'}
                        </span>
                        {gig.freelancer?.isTopRated && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                            Top Rated
                          </span>
                        )}
                      </div>
                      
                      <Link to={`/gig/${gig.id}`}>
                        <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-[#010042] hover:underline transition-colors">
                          {gig.title}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center gap-1 mt-2 mb-3">
                        <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                        </svg>
                        <span className="text-sm font-medium text-gray-900">
                          {gig.rating || 5.0}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({gig.totalReviews || 0})
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm text-gray-500">Mulai dari</span>
                          <div className="text-lg font-bold text-gray-900">
                            {formatPrice(gig.packages?.basic?.price || gig.startingPrice || 100000)}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Disimpan {new Date(favorite.createdAt?.seconds * 1000 || favorite.createdAt).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 