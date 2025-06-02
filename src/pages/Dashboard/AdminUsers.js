import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/adminService';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import {
  MagnifyingGlassIcon,
  TrashIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function AdminUsers() {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await adminService.getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      setError(err.message);
      console.error('Error loading users:', err);
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

      const results = await adminService.searchUsers(searchTerm);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!deleteConfirm || deleteConfirm !== userId) {
      setDeleteConfirm(userId);
      return;
    }

    try {
      setDeleting(userId);
      const result = await adminService.deleteUser(userId);
      
      if (result.success) {
        // Remove user from state
        setUsers(users.filter(user => user.id !== userId));
        setSearchResults(searchResults.filter(user => user.id !== userId));
        
        // Show success message
        alert(`Pengguna berhasil dihapus. Data yang terhapus: ${result.deletedData.length} item.`);
        
        if (result.errors.length > 0) {
          console.warn('Some errors occurred during deletion:', result.errors);
        }
      }
    } catch (err) {
      alert(`Gagal menghapus pengguna: ${err.message}`);
      console.error('Error deleting user:', err);
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

  const getUserBadge = (user) => {
    if (user.roles?.includes('admin')) {
      return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">Admin</span>;
    }
    if (user.isFreelancer) {
      return <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">Freelancer</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Client</span>;
  };

  const displayUsers = searchTerm.trim() ? searchResults : users;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" text="Memuat data pengguna..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Kelola Pengguna</h1>
          <p className="text-gray-600 mt-2">
            Kelola semua akun pengguna yang terdaftar di platform
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari pengguna berdasarkan email, username, atau nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {searchTerm.trim() && (
            <p className="text-sm text-gray-500 mt-2">
              Menampilkan {displayUsers.length} hasil untuk "{searchTerm}"
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Pengguna</p>
                <p className="text-xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Akun Aktif</p>
                <p className="text-xl font-bold text-gray-900">
                  {users.filter(user => user.isActive).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <XCircleIcon className="h-8 w-8 text-red-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Akun Tidak Aktif</p>
                <p className="text-xl font-bold text-gray-900">
                  {users.filter(user => !user.isActive).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Daftar Pengguna ({displayUsers.length})
            </h2>
          </div>
          
          {displayUsers.length === 0 ? (
            <div className="text-center py-12">
              <UserIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada pengguna</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm.trim() ? 'Tidak ada hasil pencarian.' : 'Belum ada pengguna yang terdaftar.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pengguna
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Terdaftar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.profilePhoto ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={user.profilePhoto}
                                alt={user.displayName || user.username}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.displayName || user.username}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getUserBadge(user)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {/* Prevent admin from deleting themselves or other admins */}
                        {user.id !== userProfile?.uid && !user.roles?.includes('admin') && (
                          <div className="flex space-x-2">
                            {deleteConfirm === user.id ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  disabled={deleting === user.id}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                >
                                  {deleting === user.id ? (
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
                                onClick={() => handleDeleteUser(user.id)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-4 w-4 mr-1" />
                                Hapus
                              </button>
                            )}
                          </div>
                        )}
                        {user.roles?.includes('admin') && (
                          <span className="text-xs text-gray-500">Admin tidak dapat dihapus</span>
                        )}
                        {user.id === userProfile?.uid && (
                          <span className="text-xs text-gray-500">Akun Anda</span>
                        )}
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