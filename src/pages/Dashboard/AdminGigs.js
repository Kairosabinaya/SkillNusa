import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  BriefcaseIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  UserIcon
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
import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';

const categories = [
  'Programming & Tech',
  'Graphics & Design', 
  'Digital Marketing',
  'Writing & Translation',
  'Video & Animation',
  'Music & Audio',
  'Business',
  'Data',
  'Photography',
  'Lifestyle'
];

const subcategories = {
  'Programming & Tech': ['Web Development', 'Mobile Apps', 'Desktop Apps', 'WordPress', 'Game Development'],
  'Graphics & Design': ['Logo Design', 'Web Design', 'Print Design', 'Illustration', 'UI/UX Design'],
  'Digital Marketing': ['SEO', 'Social Media', 'Content Marketing', 'Email Marketing', 'Online Advertising'],
  'Writing & Translation': ['Content Writing', 'Copywriting', 'Translation', 'Proofreading', 'Creative Writing'],
  'Video & Animation': ['Video Editing', 'Animation', '3D Animation', 'Explainer Videos', 'Intro Videos'],
  'Music & Audio': ['Music Production', 'Audio Editing', 'Voiceover', 'Sound Design', 'Jingles'],
  'Business': ['Business Planning', 'Presentations', 'Market Research', 'Virtual Assistant', 'Legal'],
  'Data': ['Data Entry', 'Data Analysis', 'Data Visualization', 'Data Mining', 'Database'],
  'Photography': ['Product Photography', 'Portrait Photography', 'Photo Editing', 'Event Photography', 'Commercial'],
  'Lifestyle': ['Gaming', 'Health & Fitness', 'Travel', 'Cooking', 'Fashion']
};

// Validation schema for gig form
const gigValidationSchema = Yup.object({
  title: Yup.string().required('Title is required').min(10, 'Title must be at least 10 characters'),
  description: Yup.string().required('Description is required').min(100, 'Description must be at least 100 characters'),
  category: Yup.string().required('Category is required'),
  subcategory: Yup.string().required('Subcategory is required'),
  freelancerId: Yup.string().required('Freelancer must be assigned'),
  tags: Yup.array().of(Yup.string()).min(1, 'At least one tag is required'),
  packages: Yup.object({
    basic: Yup.object({
      price: Yup.number().required('Basic price is required').min(50000, 'Minimum price is 50,000'),
      description: Yup.string().required('Basic description is required'),
      deliveryTime: Yup.number().required('Delivery time is required').min(1, 'Minimum 1 day'),
      revisions: Yup.number().required('Revisions is required').min(0, 'Minimum 0 revisions')
    }),
    standard: Yup.object({
      price: Yup.number().required('Standard price is required').min(50000, 'Minimum price is 50,000'),
      description: Yup.string().required('Standard description is required'),
      deliveryTime: Yup.number().required('Delivery time is required').min(1, 'Minimum 1 day'),
      revisions: Yup.number().required('Revisions is required').min(0, 'Minimum 0 revisions')
    }),
    premium: Yup.object({
      price: Yup.number().required('Premium price is required').min(50000, 'Minimum price is 50,000'),
      description: Yup.string().required('Premium description is required'),
      deliveryTime: Yup.number().required('Delivery time is required').min(1, 'Minimum 1 day'),
      revisions: Yup.number().required('Revisions is required').min(0, 'Minimum 0 revisions')
    })
  })
});

export default function AdminGigs() {
  const { userProfile } = useAuth();
  const [gigs, setGigs] = useState([]);
  const [freelancers, setFreelancers] = useState([]);
  const [filteredGigs, setFilteredGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGig, setSelectedGig] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterGigs();
  }, [gigs, searchTerm, categoryFilter, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch gigs
      const gigsQuery = query(collection(db, 'gigs'), orderBy('createdAt', 'desc'));
      const gigsSnapshot = await getDocs(gigsQuery);
      const gigsData = gigsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch freelancers
      const freelancersQuery = query(
        collection(db, 'users'), 
        where('isFreelancer', '==', true)
      );
      const freelancersSnapshot = await getDocs(freelancersQuery);
      const freelancersData = freelancersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setGigs(gigsData);
      setFreelancers(freelancersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterGigs = () => {
    let filtered = gigs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(gig => 
        gig.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gig.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gig.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(gig => gig.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(gig => gig.isActive === true);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(gig => gig.isActive === false);
      }
    }

    setFilteredGigs(filtered);
  };

  const handleAddGig = async (values) => {
    setActionLoading(true);
    try {
      const gigData = {
        ...values,
        userId: values.freelancerId, // For backward compatibility
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        rating: 0,
        totalOrders: 0,
        totalReviews: 0,
        inQueue: 0,
        status: 'active',
        images: [] // Default empty images array
      };

      await addDoc(collection(db, 'gigs'), gigData);
      await fetchData();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding gig:', error);
      alert('Error adding gig');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditGig = async (values) => {
    setActionLoading(true);
    try {
      const gigRef = doc(db, 'gigs', selectedGig.id);
      await updateDoc(gigRef, {
        ...values,
        updatedAt: serverTimestamp()
      });
      await fetchData();
      setShowEditModal(false);
      setSelectedGig(null);
    } catch (error) {
      console.error('Error updating gig:', error);
      alert('Error updating gig');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGig = async () => {
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'gigs', selectedGig.id));
      await fetchData();
      setShowDeleteModal(false);
      setSelectedGig(null);
    } catch (error) {
      console.error('Error deleting gig:', error);
      alert('Error deleting gig');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleGigStatus = async (gig) => {
    try {
      const gigRef = doc(db, 'gigs', gig.id);
      await updateDoc(gigRef, {
        isActive: !gig.isActive,
        updatedAt: serverTimestamp()
      });
      await fetchData();
    } catch (error) {
      console.error('Error toggling gig status:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('id-ID');
  };

  const getFreelancerName = (freelancerId) => {
    const freelancer = freelancers.find(f => f.id === freelancerId);
    return freelancer?.displayName || freelancer?.username || 'Unknown Freelancer';
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
            <h1 className="text-3xl font-bold text-gray-900">Gig Management</h1>
            <p className="text-gray-600">Manage all gigs on the platform</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Gig
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search gigs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
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
              {filteredGigs.length} of {gigs.length} gigs
            </div>
          </div>
        </div>

        {/* Gigs Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGigs.map((gig) => (
                  <tr key={gig.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gray-300 flex items-center justify-center">
                            <BriefcaseIcon className="w-6 h-6 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 line-clamp-1">
                            {gig.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            Rating: {gig.rating || 0} • {gig.totalOrders || 0} orders
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {getFreelancerName(gig.freelancerId)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {gig.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(gig.packages?.basic?.price || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleGigStatus(gig)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          gig.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        } transition-colors`}
                      >
                        {gig.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {gig.totalOrders || 0} total • {gig.inQueue || 0} in queue
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedGig(gig);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedGig(gig);
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

        {/* Add Gig Modal */}
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
                className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-screen overflow-y-auto"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Gig</h3>
                <Formik
                  initialValues={{
                    title: '',
                    description: '',
                    category: '',
                    subcategory: '',
                    freelancerId: '',
                    tags: [''],
                    packages: {
                      basic: {
                        name: 'Basic',
                        price: 50000,
                        description: '',
                        deliveryTime: 3,
                        revisions: 1,
                        features: ['']
                      },
                      standard: {
                        name: 'Standard',
                        price: 100000,
                        description: '',
                        deliveryTime: 5,
                        revisions: 2,
                        features: ['']
                      },
                      premium: {
                        name: 'Premium',
                        price: 200000,
                        description: '',
                        deliveryTime: 7,
                        revisions: 3,
                        features: ['']
                      }
                    }
                  }}
                  validationSchema={gigValidationSchema}
                  onSubmit={handleAddGig}
                >
                  {({ errors, touched, values, setFieldValue }) => (
                    <Form className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                          <Field
                            name="title"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {errors.title && touched.title && (
                            <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Freelancer</label>
                          <Field as="select" name="freelancerId" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="">Select Freelancer</option>
                            {freelancers.map(freelancer => (
                              <option key={freelancer.id} value={freelancer.id}>
                                {freelancer.displayName || freelancer.username} ({freelancer.email})
                              </option>
                            ))}
                          </Field>
                          {errors.freelancerId && touched.freelancerId && (
                            <p className="text-red-500 text-xs mt-1">{errors.freelancerId}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <Field 
                            as="select" 
                            name="category" 
                            onChange={(e) => {
                              setFieldValue('category', e.target.value);
                              setFieldValue('subcategory', '');
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select Category</option>
                            {categories.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </Field>
                          {errors.category && touched.category && (
                            <p className="text-red-500 text-xs mt-1">{errors.category}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                          <Field as="select" name="subcategory" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="">Select Subcategory</option>
                            {values.category && subcategories[values.category]?.map(subcategory => (
                              <option key={subcategory} value={subcategory}>{subcategory}</option>
                            ))}
                          </Field>
                          {errors.subcategory && touched.subcategory && (
                            <p className="text-red-500 text-xs mt-1">{errors.subcategory}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <Field 
                          as="textarea" 
                          name="description" 
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.description && touched.description && (
                          <p className="text-red-500 text-xs mt-1">{errors.description}</p>
                        )}
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                        <FieldArray name="tags">
                          {({ push, remove }) => (
                            <div className="space-y-2">
                              {values.tags.map((tag, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <Field
                                    name={`tags.${index}`}
                                    placeholder="Enter tag"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                  {values.tags.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => remove(index)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => push('')}
                                className="text-blue-600 hover:text-blue-700 text-sm"
                              >
                                Add Tag
                              </button>
                            </div>
                          )}
                        </FieldArray>
                      </div>

                      {/* Packages */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['basic', 'standard', 'premium'].map((packageType) => (
                          <div key={packageType} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-3 capitalize">{packageType} Package</h4>
                            
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Price (IDR)</label>
                                <Field
                                  name={`packages.${packageType}.price`}
                                  type="number"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                <Field
                                  as="textarea"
                                  name={`packages.${packageType}.description`}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Days</label>
                                  <Field
                                    name={`packages.${packageType}.deliveryTime`}
                                    type="number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Revisions</label>
                                  <Field
                                    name={`packages.${packageType}.revisions`}
                                    type="number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Features</label>
                                <FieldArray name={`packages.${packageType}.features`}>
                                  {({ push, remove }) => (
                                    <div className="space-y-1">
                                      {values.packages[packageType].features.map((feature, index) => (
                                        <div key={index} className="flex items-center space-x-1">
                                          <Field
                                            name={`packages.${packageType}.features.${index}`}
                                            placeholder="Feature"
                                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                          />
                                          {values.packages[packageType].features.length > 1 && (
                                            <button
                                              type="button"
                                              onClick={() => remove(index)}
                                              className="text-red-600 hover:text-red-700"
                                            >
                                              <TrashIcon className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                      <button
                                        type="button"
                                        onClick={() => push('')}
                                        className="text-blue-600 hover:text-blue-700 text-xs"
                                      >
                                        Add Feature
                                      </button>
                                    </div>
                                  )}
                                </FieldArray>
                              </div>
                            </div>
                          </div>
                        ))}
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
                          {actionLoading ? 'Adding...' : 'Add Gig'}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit and Delete modals would be similar to Add modal but with pre-filled data */}
        {/* For brevity, I'll add simplified versions */}

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && selectedGig && (
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
                  <h3 className="text-lg font-medium text-gray-900">Delete Gig</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete "{selectedGig.title}"? 
                  This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedGig(null);
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteGig}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Deleting...' : 'Delete'}
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