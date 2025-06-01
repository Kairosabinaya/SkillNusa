import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  UsersIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc, 
  addDoc, 
  query, 
  orderBy, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

// Validation schema for user form
const userValidationSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email is required'),
  username: Yup.string().required('Username is required'),
  displayName: Yup.string().required('Display name is required'),
  phoneNumber: Yup.string(),
  isFreelancer: Yup.boolean(),
  roles: Yup.array().of(Yup.string())
});

function AdminUsers() {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter out deleted users by default
    filtered = filtered.filter(user => !user.isDeleted);

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      if (roleFilter === 'freelancer') {
        filtered = filtered.filter(user => user.isFreelancer === true);
      } else if (roleFilter === 'client') {
        filtered = filtered.filter(user => user.isFreelancer !== true);
      } else if (roleFilter === 'admin') {
        filtered = filtered.filter(user => user.roles?.includes('admin'));
      }
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(user => user.isActive !== false);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(user => user.isActive === false);
      }
    }

    setFilteredUsers(filtered);
  };

  const handleAddUser = async (values) => {
    setActionLoading(true);
    try {
      const userData = {
        ...values,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        emailVerified: false
      };

      await addDoc(collection(db, 'users'), userData);
      await fetchUsers();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Error adding user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = async (values) => {
    setActionLoading(true);
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        ...values,
        updatedAt: serverTimestamp()
      });
      await fetchUsers();
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user');
    } finally {
      setActionLoading(false);
    }
  };

  // Improved delete function - deactivates user instead of deleting
  const handleDeactivateUser = async () => {
    setActionLoading(true);
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        isActive: false,
        isDeleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: userProfile.id,
        updatedAt: serverTimestamp()
      });
      
      await fetchUsers();
      setShowDeleteModal(false);
      setSelectedUser(null);
      
      // Show warning about Authentication cleanup
      alert(`✅ User telah dinonaktifkan dan ditandai sebagai terhapus.

⚠️ PENTING: User masih ada di Firebase Authentication!

Untuk menghapus sepenuhnya:
1. Buka Firebase Console → Authentication
2. Cari user: ${selectedUser.email}
3. Hapus secara manual

💡 Atau implementasikan Cloud Functions untuk sinkronisasi otomatis.`);
      
    } catch (error) {
      console.error('Error deactivating user:', error);
      alert('Error menonaktifkan user');
    } finally {
      setActionLoading(false);
    }
  };

  // Permanent delete with strong warning
  const handlePermanentDelete = async () => {
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'users', selectedUser.id));
      await fetchUsers();
      setShowDeleteModal(false);
      setSelectedUser(null);
      
      alert(`🗑️ User telah dihapus dari database Firestore.

🚨 PERINGATAN KEAMANAN:
User masih ada di Firebase Authentication!
Email: ${selectedUser.email}

❌ User masih bisa login jika mengetahui password!

Untuk menghapus dari Authentication:
1. Firebase Console → Authentication
2. Cari dan hapus user secara manual`);
      
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error menghapus user');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleUserStatus = async (user) => {
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        isActive: !user.isActive,
        updatedAt: serverTimestamp()
      });
      await fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('id-ID');
  };

  const getUserRole = (user) => {
    if (user.roles?.includes('admin')) return 'Admin';
    if (user.isFreelancer) return 'Freelancer';
    return 'Client';
  };

  if (!userProfile?.roles?.includes('admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-2 text-lg font-medium text-gray-900">Access Denied</h1>
          <p className="mt-1 text-sm text-gray-500">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage all users on the platform</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add User
          </button>
        </div>

        {/* Warning Banner */}
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <ShieldExclamationIcon className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Firebase Authentication Notice:</p>
              <p>Menghapus user dari admin panel hanya menghapus dari database Firestore. User akan tetap ada di Firebase Authentication dan masih bisa login. Gunakan opsi "Nonaktifkan" untuk keamanan yang lebih baik.</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="freelancer">Freelancer</option>
              <option value="client">Client</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Results count */}
            <div className="flex items-center text-sm text-gray-600">
              {filteredUsers.length} of {users.filter(u => !u.isDeleted).length} users
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {(user.displayName || user.username || 'U')[0].toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || user.username || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.roles?.includes('admin') 
                          ? 'bg-purple-100 text-purple-800'
                          : user.isFreelancer 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {getUserRole(user)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleUserStatus(user)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive !== false
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        } transition-colors`}
                      >
                        {user.isActive !== false ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add User Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg max-w-md w-full p-6"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New User</h3>
                <Formik
                  initialValues={{
                    email: '',
                    username: '',
                    displayName: '',
                    phoneNumber: '',
                    isFreelancer: false,
                    roles: []
                  }}
                  validationSchema={userValidationSchema}
                  onSubmit={handleAddUser}
                >
                  {({ errors, touched, values, setFieldValue }) => (
                    <Form className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <Field
                          name="email"
                          type="email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.email && touched.email && (
                          <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <Field
                          name="username"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.username && touched.username && (
                          <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                        <Field
                          name="displayName"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.displayName && touched.displayName && (
                          <p className="text-red-500 text-xs mt-1">{errors.displayName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <Field
                          name="phoneNumber"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center">
                          <Field
                            name="isFreelancer"
                            type="checkbox"
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Is Freelancer</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={values.roles.includes('admin')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFieldValue('roles', [...values.roles, 'admin']);
                              } else {
                                setFieldValue('roles', values.roles.filter(role => role !== 'admin'));
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Is Admin</span>
                        </label>
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowAddModal(false)}
                          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {actionLoading ? 'Adding...' : 'Add User'}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit User Modal */}
        <AnimatePresence>
          {showEditModal && selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg max-w-md w-full p-6"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
                <Formik
                  initialValues={{
                    email: selectedUser.email || '',
                    username: selectedUser.username || '',
                    displayName: selectedUser.displayName || '',
                    phoneNumber: selectedUser.phoneNumber || '',
                    isFreelancer: selectedUser.isFreelancer || false,
                    roles: selectedUser.roles || []
                  }}
                  validationSchema={userValidationSchema}
                  onSubmit={handleEditUser}
                >
                  {({ errors, touched, values, setFieldValue }) => (
                    <Form className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <Field
                          name="email"
                          type="email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.email && touched.email && (
                          <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <Field
                          name="username"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.username && touched.username && (
                          <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                        <Field
                          name="displayName"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.displayName && touched.displayName && (
                          <p className="text-red-500 text-xs mt-1">{errors.displayName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <Field
                          name="phoneNumber"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center">
                          <Field
                            name="isFreelancer"
                            type="checkbox"
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Is Freelancer</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={values.roles.includes('admin')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFieldValue('roles', [...values.roles, 'admin']);
                              } else {
                                setFieldValue('roles', values.roles.filter(role => role !== 'admin'));
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Is Admin</span>
                        </label>
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowEditModal(false);
                            setSelectedUser(null);
                          }}
                          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {actionLoading ? 'Updating...' : 'Update User'}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg max-w-md w-full p-6"
              >
                <div className="flex items-center mb-4">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Manage User</h3>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">
                    Anda akan mengelola user: <strong>{selectedUser.displayName || selectedUser.username}</strong>
                  </p>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex">
                      <ShieldExclamationIcon className="w-5 h-5 text-yellow-400 mr-2" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium">Perhatian Firebase Authentication:</p>
                        <p>User akan tetap ada di Firebase Authentication dan masih bisa login setelah dihapus dari database.</p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    Pilih tindakan yang ingin dilakukan:
                  </p>
                </div>
                
                <div className="flex flex-col space-y-3">
                  <button
                    onClick={handleDeactivateUser}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 text-sm"
                  >
                    {actionLoading ? 'Menonaktifkan...' : '✅ Nonaktifkan User (Rekomendasi)'}
                  </button>
                  
                  <button
                    onClick={handlePermanentDelete}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                  >
                    {actionLoading ? 'Menghapus...' : '🗑️ Hapus dari Database (Tidak Aman)'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedUser(null);
                    }}
                    className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Batal
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AdminUsers; 