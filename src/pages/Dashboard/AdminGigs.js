import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/adminService';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import {
  MagnifyingGlassIcon,
  TrashIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  StarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export default function AdminGigs() {
  const { userProfile } = useAuth();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadGigs();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const loadGigs = async () => {
    try {
      setLoading(true);
      const allGigs = await adminService.getAllGigs();
      setGigs(allGigs);
    } catch (err) {
      setError(err.message);
      console.error('Error loading gigs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      const results = await adminService.searchGigs(searchTerm);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching gigs:', err);
    }
  };

  const handleDeleteGig = async (gigId) => {
    if (!deleteConfirm || deleteConfirm !== gigId) {
      setDeleteConfirm(gigId);
      return;
    }

    try {
      setDeleting(gigId);
      const result = await adminService.deleteGig(gigId);
      
      if (result.success) {
        // Remove gig from state
        setGigs(gigs.filter(gig => gig.id !== gigId));
        setSearchResults(searchResults.filter(gig => gig.id !== gigId));
        
        // Show success message
        alert(`Gig berhasil dihapus. Data yang terhapus: ${result.deletedData.length} item.`);
        
        if (result.errors.length > 0) {
          console.warn('Some errors occurred during deletion:', result.errors);
        }
      }
    } catch (err) {
      alert(`Gagal menghapus gig: ${err.message}`);
      console.error('Error deleting gig:', err);
    } finally {
      setDeleting(null);
      setDeleteConfirm(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getStatusBadge = (gig) => {
    if (gig.isActive) {
      return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Aktif</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">Tidak Aktif</span>;
  };

  const displayGigs = searchTerm.trim() ? searchResults : gigs;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" text="Memuat data gigs..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Kelola Gigs</h1>
          <p className="text-gray-600 mt-2">
            Kelola semua gig yang terdaftar di platform
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari gig berdasarkan judul, deskripsi, atau tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {searchTerm.trim() && (
            <p className="text-sm text-gray-500 mt-2">
              Menampilkan {displayGigs.length} hasil untuk "{searchTerm}"
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <BriefcaseIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Gigs</p>
                <p className="text-xl font-bold text-gray-900">{gigs.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Gigs Aktif</p>
                <p className="text-xl font-bold text-gray-900">
                  {gigs.filter(gig => gig.isActive).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <XCircleIcon className="h-8 w-8 text-red-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Gigs Tidak Aktif</p>
                <p className="text-xl font-bold text-gray-900">
                  {gigs.filter(gig => !gig.isActive).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gigs Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Daftar Gigs ({displayGigs.length})
            </h2>
          </div>
          
          {displayGigs.length === 0 ? (
            <div className="text-center py-12">
              <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada gigs</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm.trim() ? 'Tidak ada hasil pencarian.' : 'Belum ada gig yang terdaftar.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gig
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Freelancer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Harga
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dibuat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayGigs.map((gig) => (
                    <tr key={gig.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {gig.images && gig.images.length > 0 ? (
                              <img
                                className="h-12 w-12 rounded-lg object-cover"
                                src={gig.images[0].url || gig.images[0]}
                                alt={gig.title}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gray-300 flex items-center justify-center">
                                <BriefcaseIcon className="h-6 w-6 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">
                              {gig.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {gig.category || 'Tidak ada kategori'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {gig.freelancer?.displayName || gig.freelancer?.username || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {gig.freelancer?.email || 'No email'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {gig.packages?.basic?.price ? formatPrice(gig.packages.basic.price) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-sm text-gray-900">
                            {gig.averageRating ? gig.averageRating.toFixed(1) : '0.0'}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">
                            ({gig.reviewCount || 0})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(gig)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(gig.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {/* View Gig Link */}
                          <a
                            href={`/gig/${gig.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            Lihat
                          </a>
                          
                          {/* Delete Button */}
                          {deleteConfirm === gig.id ? (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleDeleteGig(gig.id)}
                                disabled={deleting === gig.id}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                              >
                                {deleting === gig.id ? (
                                  <>
                                    <LoadingSpinner size="small" />
                                    <span className="ml-1">Menghapus...</span>
                                  </>
                                ) : (
                                  <>
                                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                    Konfirmasi
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleDeleteGig(gig.id)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-4 w-4 mr-1" />
                              Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 