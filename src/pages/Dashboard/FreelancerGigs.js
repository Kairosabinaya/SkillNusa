import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  StarIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  XMarkIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

export default function FreelancerGigs() {
  const { currentUser } = useAuth();
  const [gigs, setGigs] = useState([]);
  const [filteredGigs, setFilteredGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGig, setSelectedGig] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stats, setStats] = useState({
    totalGigs: 0,
    totalViews: 0,
    totalOrders: 0,
    averageRating: 0
  });

  useEffect(() => {
    fetchGigs();
  }, [currentUser]);

  useEffect(() => {
    filterGigs();
  }, [searchQuery, gigs]);

  const fetchGigs = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Primary query using freelancerId (this is how gigs are saved)
      const gigsQueryPrimary = query(
        collection(db, 'gigs'),
        where('freelancerId', '==', currentUser.uid)
      );

      // Fallback query using userId for backward compatibility
      const gigsQueryFallback = query(
        collection(db, 'gigs'),
        where('userId', '==', currentUser.uid)
      );

      const [primarySnapshot, fallbackSnapshot] = await Promise.all([
        getDocs(gigsQueryPrimary),
        getDocs(gigsQueryFallback)
      ]);

      const gigsData = [];
      let totalViews = 0;
      let totalOrders = 0;
      let totalRating = 0;
      let reviewCount = 0;

      // Process both snapshots and avoid duplicates
      const processedIds = new Set();

      const processSnapshot = async (snapshot) => {
        for (const doc of snapshot.docs) {
          if (processedIds.has(doc.id)) continue; // Skip duplicates
          processedIds.add(doc.id);

          const gigData = { id: doc.id, ...doc.data() };
          
          // Fetch orders for this gig
          try {
            const ordersQuery = query(
              collection(db, 'orders'),
              where('gigId', '==', doc.id)
            );
            const ordersSnapshot = await getDocs(ordersQuery);
            gigData.orderCount = ordersSnapshot.size;
            totalOrders += ordersSnapshot.size;
          } catch (orderError) {
            console.error('Error fetching orders for gig:', orderError);
            gigData.orderCount = 0;
          }

          // Fetch reviews for this gig
          try {
            const reviewsQuery = query(
              collection(db, 'reviews'),
              where('gigId', '==', doc.id)
            );
            const reviewsSnapshot = await getDocs(reviewsQuery);
            
            let gigRating = 0;
            let gigReviewCount = 0;
            reviewsSnapshot.forEach(reviewDoc => {
              const review = reviewDoc.data();
              gigRating += review.rating || 0;
              gigReviewCount++;
            });
            
            gigData.rating = gigReviewCount > 0 ? gigRating / gigReviewCount : 0;
            gigData.reviewCount = gigReviewCount;
            
            totalRating += gigRating;
            reviewCount += gigReviewCount;
          } catch (reviewError) {
            console.error('Error fetching reviews for gig:', reviewError);
            gigData.rating = 0;
            gigData.reviewCount = 0;
          }
          
          totalViews += gigData.views || 0;
          gigsData.push(gigData);
        }
      };

      // Process primary results first (freelancerId)
      await processSnapshot(primarySnapshot);
      // Then process fallback results (userId) to catch any missing gigs
      await processSnapshot(fallbackSnapshot);
      
      // Client-side sorting by createdAt (newest first)
      gigsData.sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return bDate - aDate; // Descending order (newest first)
      });

      setGigs(gigsData);
      setFilteredGigs(gigsData);

      // Calculate stats
      const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;

      setStats({
        totalGigs: gigsData.length,
        totalViews,
        totalOrders,
        averageRating
      });
      
    } catch (error) {
      console.error('Error fetching gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterGigs = () => {
    let filtered = [...gigs];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(gig => 
        gig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gig.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gig.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredGigs(filtered);
  };

  const deleteGig = async () => {
    if (!selectedGig) return;

    try {
      await deleteDoc(doc(db, 'gigs', selectedGig.id));
      
      // Update local state
      setGigs(prevGigs => prevGigs.filter(gig => gig.id !== selectedGig.id));
      setShowDeleteModal(false);
      setSelectedGig(null);
    } catch (error) {
      console.error('Error deleting gig:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#010042]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gigs Saya</h1>
            <p className="text-gray-600 mt-1">Kelola dan pantau performa gig Anda</p>
          </div>
          <Link 
            to="/dashboard/freelancer/gigs/create"
            className="flex items-center gap-2 px-4 py-2 bg-[#010042] text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Buat Gig Baru</span>
          </Link>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Gigs</p>
            <DocumentDuplicateIcon className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalGigs}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Views</p>
            <EyeIcon className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalViews)}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Orders</p>
            <ChartBarIcon className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Avg. Rating</p>
            <StarIcon className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
        </div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6 bg-white p-4 rounded-lg shadow"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari gig..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <FunnelIcon className="h-5 w-5 text-gray-600" />
              <span>Filter</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Gigs List */}
      <div className="space-y-4">
        {filteredGigs.length > 0 ? (
          filteredGigs.map((gig, index) => (
            <motion.div
              key={gig.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Gig Image */}
                  <div className="flex-shrink-0">
                    {gig.images?.[0] ? (
                      <img 
                        src={gig.images[0]} 
                        alt={gig.title}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center">
                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Gig Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {gig.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {gig.category} • Mulai dari {formatCurrency(gig.startingPrice || 0)}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <EyeIcon className="h-4 w-4" />
                            <span>{gig.views || 0} views</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ChartBarIcon className="h-4 w-4" />
                            <span>{gig.orderCount || 0} orders</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {gig.rating > 0 ? (
                              <>
                                <StarSolid className="h-4 w-4 text-yellow-400" />
                                <span>{gig.rating.toFixed(1)} ({gig.reviewCount})</span>
                              </>
                            ) : (
                              <>
                                <StarIcon className="h-4 w-4" />
                                <span>Belum ada rating</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-4">
                      <Link 
                        to={`/gig/${gig.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span>Lihat</span>
                      </Link>
                      <Link 
                        to={`/dashboard/freelancer/gigs/edit/${gig.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span>Edit</span>
                      </Link>
                      <button 
                        onClick={() => {
                          setSelectedGig(gig);
                          setShowDeleteModal(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <DocumentDuplicateIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'Tidak ada gig yang sesuai filter' : 'Belum ada gig'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Coba ubah filter pencarian Anda' : 'Mulai buat gig pertama Anda untuk menawarkan jasa'}
            </p>
            {!searchQuery && (
              <Link 
                to="/dashboard/freelancer/gigs/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#010042] text-white rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Buat Gig Pertama</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedGig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg max-w-md w-full p-6"
          >
            <div className="mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
                <XCircleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Hapus Gig?
              </h3>
              <p className="text-gray-600">
                Apakah Anda yakin ingin menghapus gig "{selectedGig.title}"? 
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedGig(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={deleteGig}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Hapus Gig
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
} 