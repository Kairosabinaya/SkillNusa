import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { uploadMultipleToCloudinary } from '../../config/cloudinary';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon,
  PhotoIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import ErrorPopup from '../../components/common/ErrorPopup';
import SuccessPopup from '../../components/common/SuccessPopup';

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
  'Programming & Tech': [
    'Website Development',
    'Mobile App Development',
    'API Development',
    'Database Design',
    'Software Testing',
    'DevOps & Cloud',
    'Cybersecurity'
  ],
  'Graphics & Design': [
    'Logo Design',
    'Brand Identity',
    'Web Design',
    'Print Design',
    'Packaging Design',
    'Illustration',
    'UI/UX Design'
  ],
  'Digital Marketing': [
    'Social Media Marketing',
    'SEO',
    'Content Marketing',
    'Email Marketing',
    'PPC Advertising',
    'Marketing Strategy',
    'Influencer Marketing'
  ],
  'Writing & Translation': [
    'Content Writing',
    'Copywriting',
    'Technical Writing',
    'Translation',
    'Proofreading',
    'Creative Writing',
    'Academic Writing'
  ],
  'Video & Animation': [
    'Video Editing',
    '2D Animation',
    '3D Animation',
    'Motion Graphics',
    'Whiteboard Animation',
    'Video Production',
    'Visual Effects'
  ],
  'Music & Audio': [
    'Music Production',
    'Audio Editing',
    'Voice Over',
    'Sound Design',
    'Mixing & Mastering',
    'Jingles & Intros',
    'Audio Ads'
  ],
  'Business': [
    'Business Plan',
    'Market Research',
    'Presentation Design',
    'Financial Consulting',
    'Legal Consulting',
    'HR Consulting',
    'Project Management'
  ],
  'Data': [
    'Data Analysis',
    'Data Visualization',
    'Data Entry',
    'Data Mining',
    'Machine Learning',
    'Statistical Analysis',
    'Database Management'
  ],
  'Photography': [
    'Portrait Photography',
    'Product Photography',
    'Event Photography',
    'Photo Editing',
    'Photo Retouching',
    'Real Estate Photography',
    'Stock Photography'
  ],
  'Lifestyle': [
    'Gaming',
    'Fitness Training',
    'Nutrition Consulting',
    'Life Coaching',
    'Travel Planning',
    'Relationship Advice',
    'Astrology & Readings'
  ]
};

const deliveryTimes = [
  { value: 1, label: '1 hari' },
  { value: 3, label: '3 hari' },
  { value: 5, label: '5 hari' },
  { value: 7, label: '7 hari' },
  { value: 14, label: '14 hari' },
  { value: 21, label: '21 hari' },
  { value: 30, label: '30 hari' }
];

const steps = [
  { id: 1, name: 'Info Dasar', description: 'Judul, kategori, dan deskripsi' },
  { id: 2, name: 'Paket & Harga', description: 'Atur paket layanan Anda' },
  { id: 3, name: 'Media', description: 'Tambahkan gambar' },
  { id: 4, name: 'Review', description: 'Periksa dan publikasikan' }
];

const validationSchemas = [
  // Step 1: Basic Info
  Yup.object({
    title: Yup.string()
      .required('Judul gig harus diisi')
      .min(10, 'Judul minimal 10 karakter')
      .max(80, 'Judul maksimal 80 karakter'),
    category: Yup.string().required('Kategori harus dipilih'),
    subcategory: Yup.string().required('Subkategori harus dipilih'),
    description: Yup.string()
      .required('Deskripsi harus diisi')
      .min(100, 'Deskripsi minimal 100 karakter')
      .max(1200, 'Deskripsi maksimal 1200 karakter'),
    tags: Yup.array()
      .of(Yup.string())
      .min(1, 'Minimal 1 tag')
      .max(5, 'Maksimal 5 tags')
  }),
  
  // Step 2: Packages
  Yup.object({
    packages: Yup.object({
      basic: Yup.object({
        price: Yup.number()
          .required('Harga harus diisi')
          .min(50000, 'Harga minimal Rp 50.000'),
        description: Yup.string().required('Deskripsi paket harus diisi'),
        deliveryTime: Yup.number().required('Waktu pengerjaan harus diisi'),
        revisions: Yup.number().min(0, 'Revisi minimal 0'),
        features: Yup.array().of(Yup.string())
      }),
      standard: Yup.object({
        price: Yup.number()
          .required('Harga harus diisi')
          .min(50000, 'Harga minimal Rp 50.000'),
        description: Yup.string().required('Deskripsi paket harus diisi'),
        deliveryTime: Yup.number().required('Waktu pengerjaan harus diisi'),
        revisions: Yup.number().min(0, 'Revisi minimal 0'),
        features: Yup.array().of(Yup.string())
      }),
      premium: Yup.object({
        price: Yup.number()
          .required('Harga harus diisi')
          .min(50000, 'Harga minimal Rp 50.000'),
        description: Yup.string().required('Deskripsi paket harus diisi'),
        deliveryTime: Yup.number().required('Waktu pengerjaan harus diisi'),
        revisions: Yup.number().min(0, 'Revisi minimal 0'),
        features: Yup.array().of(Yup.string())
      })
    })
  }),

  // Step 3: Media
  Yup.object({
    images: Yup.array()
      .min(1, 'Minimal 1 gambar')
      .max(5, 'Maksimal 5 gambar')
  }),

  // Step 4: Review
  Yup.object({})
];

export default function CreateGig() {
  const { gigId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const initialValues = {
    title: '',
    category: '',
    subcategory: '',
    description: '',
    tags: [],
    packages: {
      basic: {
        name: 'Basic',
        price: 50000,
        description: '',
        deliveryTime: 3,
        revisions: 1,
        features: []
      },
      standard: {
        name: 'Standard',
        price: 100000,
        description: '',
        deliveryTime: 5,
        revisions: 2,
        features: []
      },
      premium: {
        name: 'Premium',
        price: 200000,
        description: '',
        deliveryTime: 7,
        revisions: 3,
        features: []
      }
    },
    images: []
  };

  const [formData, setFormData] = useState(initialValues);

  useEffect(() => {
    if (gigId) {
      fetchGigData();
    }
  }, [gigId]);



  // Force proper initialization of array fields
  useEffect(() => {
    if (!Array.isArray(formData.images)) {
      setFormData(prev => ({
        ...prev,
        images: []
      }));
    }
    if (!Array.isArray(formData.tags)) {
      setFormData(prev => ({
        ...prev,
        tags: []
      }));
    }
  }, [formData.images, formData.tags]);

  const fetchGigData = async () => {
    setLoading(true);
    try {
      const gigDoc = await getDoc(doc(db, 'gigs', gigId));
      if (gigDoc.exists()) {
        const data = gigDoc.data();
        setFormData({
          ...initialValues,
          ...data,
          // Ensure array fields are properly initialized
          images: data.images || [],
          tags: data.tags || [],
          packages: {
            basic: {
              ...initialValues.packages.basic,
              ...(data.packages?.basic || {}),
              features: data.packages?.basic?.features || []
            },
            standard: {
              ...initialValues.packages.standard,
              ...(data.packages?.standard || {}),
              features: data.packages?.standard?.features || []
            },
            premium: {
              ...initialValues.packages.premium,
              ...(data.packages?.premium || {}),
              features: data.packages?.premium?.features || []
            }
          }
        });
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error fetching gig:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e, setFieldValue, values) => {
    const files = Array.from(e.target.files);
    const currentImages = Array.isArray(values.images) ? values.images : [];
    
    if (currentImages.length + files.length > 5) {
      setError('Maksimal 5 gambar');
      return;
    }

    setUploadingImage(true);
    
    try {
      const uploadedUrls = await uploadMultipleToCloudinary(files);
      setFieldValue('images', [...currentImages, ...uploadedUrls]);
    } catch (error) {
      console.error('Error uploading images:', error);
      setError('Gagal upload gambar. Silakan coba lagi.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index, setFieldValue, values) => {
    const currentImages = Array.isArray(values.images) ? values.images : [];
    const newImages = currentImages.filter((_, i) => i !== index);
    setFieldValue('images', newImages);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Validate required fields
      if (!values.title || !values.category || !values.subcategory || !values.description) {
        setError('Mohon lengkapi semua field yang wajib diisi');
        setLoading(false);
        return;
      }

      if (!Array.isArray(values.images) || values.images.length === 0) {
        setError('Mohon tambahkan minimal satu gambar untuk gig Anda');
        setLoading(false);
        return;
      }

      // Clean up the data before saving - match the exact structure from example
      const gigData = {
        title: String(values.title || ''),
        category: String(values.category || ''),
        subcategory: String(values.subcategory || ''),
        description: String(values.description || ''),
        tags: Array.isArray(values.tags) ? values.tags.filter(tag => tag && typeof tag === 'string') : [],
        packages: {
          basic: {
            name: String(values.packages?.basic?.name || 'Basic'),
            price: Number(values.packages?.basic?.price || 0),
            description: String(values.packages?.basic?.description || ''),
            deliveryTime: Number(values.packages?.basic?.deliveryTime || 3),
            revisions: Number(values.packages?.basic?.revisions || 1),
            features: Array.isArray(values.packages?.basic?.features) 
              ? values.packages.basic.features.filter(f => f && typeof f === 'string') 
              : []
          },
          standard: {
            name: String(values.packages?.standard?.name || 'Standard'),
            price: Number(values.packages?.standard?.price || 0),
            description: String(values.packages?.standard?.description || ''),
            deliveryTime: Number(values.packages?.standard?.deliveryTime || 5),
            revisions: Number(values.packages?.standard?.revisions || 2),
            features: Array.isArray(values.packages?.standard?.features) 
              ? values.packages.standard.features.filter(f => f && typeof f === 'string') 
              : []
          },
          premium: {
            name: String(values.packages?.premium?.name || 'Premium'),
            price: Number(values.packages?.premium?.price || 0),
            description: String(values.packages?.premium?.description || ''),
            deliveryTime: Number(values.packages?.premium?.deliveryTime || 7),
            revisions: Number(values.packages?.premium?.revisions || 3),
            features: Array.isArray(values.packages?.premium?.features) 
              ? values.packages.premium.features.filter(f => f && typeof f === 'string') 
              : []
          }
        },
        images: Array.isArray(values.images) ? values.images : [],
        freelancerId: currentUser.uid,
        userId: currentUser.uid,
        isActive: true,
        rating: 0,
        totalOrders: 0,
        inQueue: 0,
        createdAt: isEditing ? values.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('Saving gig data:', gigData);

      if (isEditing) {
        await updateDoc(doc(db, 'gigs', gigId), gigData);
        setSuccess('Gig berhasil diupdate!');
        setTimeout(() => {
          navigate('/dashboard/freelancer/gigs');
        }, 2000);
      } else {
        const docRef = await addDoc(collection(db, 'gigs'), gigData);
        console.log('Gig created with ID:', docRef.id);
        setSuccess('Gig berhasil dipublikasikan!');
        setTimeout(() => {
          navigate('/dashboard/freelancer/gigs');
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving gig:', error);
      let errorMessage = 'Gagal menyimpan gig';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Anda tidak memiliki izin untuk membuat gig. Pastikan Anda sudah login sebagai freelancer.';
      } else if (error.code === 'invalid-argument') {
        errorMessage = 'Data gig tidak valid. Pastikan semua field sudah diisi dengan benar.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Layanan tidak tersedia saat ini. Silakan coba lagi nanti.';
      } else if (error.message) {
        errorMessage = `${errorMessage}: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Validate current step before allowing navigation
  const validateCurrentStep = (values) => {
    const currentSchema = validationSchemas[currentStep - 1];
    try {
      currentSchema.validateSync(values, { abortEarly: false });
      return true;
    } catch (error) {
      const errorMessages = error.inner.map(err => err.message).join(', ');
      setError(`Mohon lengkapi: ${errorMessages}`);
      return false;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#010042]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Edit Gig' : 'Buat Gig Baru'}
        </h1>
        <p className="text-gray-600 mt-1">
          Ikuti langkah-langkah berikut untuk membuat gig yang menarik
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {steps.map((step, stepIdx) => (
              <li key={step.id} className={`${stepIdx !== steps.length - 1 ? 'flex-1' : ''} relative`}>
                <div className={`flex items-center ${stepIdx !== steps.length - 1 ? 'w-full' : ''}`}>
                  <span
                    className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                      step.id < currentStep
                        ? 'bg-[#010042]'
                        : step.id === currentStep
                        ? 'border-2 border-[#010042] bg-white'
                        : 'border-2 border-gray-300 bg-white'
                    }`}
                  >
                    {step.id < currentStep ? (
                      <CheckIcon className="h-6 w-6 text-white" />
                    ) : (
                      <span className={`${
                        step.id === currentStep ? 'text-[#010042]' : 'text-gray-500'
                      }`}>
                        {step.id}
                      </span>
                    )}
                  </span>
                  {stepIdx !== steps.length - 1 && (
                    <div
                      className={`ml-4 hidden min-w-0 flex-1 md:block`}
                    >
                      <div
                        className={`h-0.5 w-full ${
                          step.id < currentStep ? 'bg-[#010042]' : 'bg-gray-300'
                        }`}
                      />
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <span className={`text-xs font-medium ${
                    step.id <= currentStep ? 'text-[#010042]' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Form */}
      <Formik
        initialValues={formData}
        enableReinitialize
        validationSchema={validationSchemas[currentStep - 1]}
        onSubmit={(values) => {
          if (currentStep === steps.length) {
            handleSubmit(values);
          } else {
            setFormData(values);
            nextStep();
          }
        }}
      >
        {({ values, errors, touched, setFieldValue, isSubmitting }) => (
          <Form>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-lg shadow p-6"
              >
                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Judul Gig *
                      </label>
                      <Field
                        name="title"
                        type="text"
                        placeholder="Saya akan..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                      />
                      {errors.title && touched.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {values.title ? values.title.length : 0}/80 karakter
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Kategori *
                        </label>
                        <Field
                          as="select"
                          name="category"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                          onChange={(e) => {
                            setFieldValue('category', e.target.value);
                            setFieldValue('subcategory', ''); // Reset subcategory when category changes
                          }}
                        >
                          <option value="">Pilih kategori</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </Field>
                        {errors.category && touched.category && (
                          <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subkategori *
                        </label>
                        <Field
                          as="select"
                          name="subcategory"
                          disabled={!values.category}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042] disabled:bg-gray-100"
                        >
                          <option value="">Pilih subkategori</option>
                          {values.category && subcategories[values.category]?.map(subcat => (
                            <option key={subcat} value={subcat}>{subcat}</option>
                          ))}
                        </Field>
                        {errors.subcategory && touched.subcategory && (
                          <p className="mt-1 text-sm text-red-600">{errors.subcategory}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deskripsi *
                      </label>
                      <Field
                        as="textarea"
                        name="description"
                        rows={6}
                        placeholder="Jelaskan layanan Anda secara detail..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                      />
                      {errors.description && touched.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {values.description ? values.description.length : 0}/1200 karakter
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags (Maksimal 5)
                      </label>
                      <FieldArray name="tags">
                        {({ push, remove }) => (
                          <div className="space-y-2">
                            {Array.isArray(values.tags) ? values.tags.map((tag, index) => (
                              <div key={index} className="flex gap-2">
                                <Field
                                  name={`tags.${index}`}
                                  type="text"
                                  placeholder="Contoh: logo design"
                                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                                />
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </div>
                            )) : null}
                            {Array.isArray(values.tags) && values.tags.length < 5 && (
                              <button
                                type="button"
                                onClick={() => push('')}
                                className="flex items-center gap-2 text-sm text-[#010042] hover:text-blue-700"
                              >
                                <PlusIcon className="h-4 w-4" />
                                Tambah tag
                              </button>
                            )}
                            {!Array.isArray(values.tags) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFieldValue('tags', ['']);
                                }}
                                className="flex items-center gap-2 text-sm text-[#010042] hover:text-blue-700"
                              >
                                <PlusIcon className="h-4 w-4" />
                                Tambah tag
                              </button>
                            )}
                          </div>
                        )}
                      </FieldArray>
                      {errors.tags && touched.tags && (
                        <p className="mt-1 text-sm text-red-600">{errors.tags}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Packages */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                      <div className="flex items-start">
                        <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="ml-3">
                          <p className="text-sm text-blue-800">
                            Anda harus mengisi ketiga paket (Basic, Standard, Premium) untuk memberikan pilihan lengkap kepada client
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* All Three Packages */}
                    {['basic', 'standard', 'premium'].map((packageType) => (
                      <div key={packageType} className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                          Paket {packageType === 'basic' ? 'Basic' : packageType === 'standard' ? 'Standard' : 'Premium'}
                        </h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Harga *
                              </label>
                              <Field
                                name={`packages.${packageType}.price`}
                                type="number"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                              />
                              {errors.packages?.[packageType]?.price && touched.packages?.[packageType]?.price && (
                                <p className="mt-1 text-sm text-red-600">{errors.packages[packageType].price}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Waktu Pengerjaan *
                              </label>
                              <Field
                                as="select"
                                name={`packages.${packageType}.deliveryTime`}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                              >
                                {deliveryTimes.map(time => (
                                  <option key={time.value} value={time.value}>
                                    {time.label}
                                  </option>
                                ))}
                              </Field>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Deskripsi Paket *
                            </label>
                            <Field
                              as="textarea"
                              name={`packages.${packageType}.description`}
                              rows={3}
                              placeholder={`Jelaskan apa yang termasuk dalam paket ${packageType}...`}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                            />
                            {errors.packages?.[packageType]?.description && touched.packages?.[packageType]?.description && (
                              <p className="mt-1 text-sm text-red-600">{errors.packages[packageType].description}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Jumlah Revisi
                            </label>
                            <Field
                              name={`packages.${packageType}.revisions`}
                              type="number"
                              min="0"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Fitur yang Termasuk
                            </label>
                            <FieldArray name={`packages.${packageType}.features`}>
                              {({ push, remove }) => (
                                <div className="space-y-2">
                                  {Array.isArray(values.packages[packageType]?.features) ? 
                                    values.packages[packageType].features.map((feature, index) => (
                                      <div key={index} className="flex gap-2">
                                        <Field
                                          name={`packages.${packageType}.features.${index}`}
                                          type="text"
                                          placeholder="Contoh: Logo design"
                                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => remove(index)}
                                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                          <TrashIcon className="h-5 w-5" />
                                        </button>
                                      </div>
                                    )) : null}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!Array.isArray(values.packages[packageType]?.features)) {
                                        setFieldValue(`packages.${packageType}.features`, ['']);
                                      } else {
                                        push('');
                                      }
                                    }}
                                    className="flex items-center gap-2 text-sm text-[#010042] hover:text-blue-700"
                                  >
                                    <PlusIcon className="h-4 w-4" />
                                    Tambah fitur
                                  </button>
                                </div>
                              )}
                            </FieldArray>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Step 3: Media */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gambar Gig (Minimal 1, Maksimal 5) *
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Array.isArray(values.images) ? values.images.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image}
                              alt={`Gig ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index, setFieldValue, values)}
                              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )) : null}
                        
                        {Array.isArray(values.images) && values.images.length < 5 && (
                          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleImageUpload(e, setFieldValue, values)}
                              className="hidden"
                            />
                            {uploadingImage ? (
                              <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#010042] mb-2"></div>
                                <span className="text-sm text-gray-600">Uploading...</span>
                              </div>
                            ) : (
                              <>
                                <CloudArrowUpIcon className="h-8 w-8 text-gray-400" />
                                <span className="mt-2 text-sm text-gray-600">
                                  Upload gambar
                                </span>
                              </>
                            )}
                          </label>
                        )}
                        
                        {!Array.isArray(values.images) && (
                          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleImageUpload(e, setFieldValue, values)}
                              className="hidden"
                            />
                            {uploadingImage ? (
                              <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#010042] mb-2"></div>
                                <span className="text-sm text-gray-600">Uploading...</span>
                              </div>
                            ) : (
                              <>
                                <CloudArrowUpIcon className="h-8 w-8 text-gray-400" />
                                <span className="mt-2 text-sm text-gray-600">
                                  Upload gambar
                                </span>
                              </>
                            )}
                          </label>
                        )}
                      </div>
                      {errors.images && touched.images && (
                        <p className="mt-1 text-sm text-red-600">{errors.images}</p>
                      )}
                      <p className="mt-2 text-sm text-gray-500">
                        Gambar akan diupload ke Cloudinary untuk performa yang optimal. 
                        Format yang didukung: JPG, PNG, GIF. Maksimal 10MB per gambar.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 4: Review */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Review Gig Anda
                    </h3>

                    {/* Preview Card */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {Array.isArray(values.images) && values.images[0] && (
                        <img
                          src={values.images[0]}
                          alt={values.title || 'Untitled Gig'}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-6">
                        <h4 className="text-xl font-semibold text-gray-900 mb-2">
                          {values.title || 'Untitled Gig'}
                        </h4>
                        <p className="text-gray-600 mb-4">
                          {values.description || 'No description provided'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            {values.category || 'No category'} • {values.subcategory || 'No subcategory'}
                          </span>
                          <span className="text-lg font-bold text-[#010042]">
                            Mulai dari {formatCurrency(values.packages?.basic?.price || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Package Summary */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-medium text-gray-900 mb-4">Ringkasan Paket</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium">Basic:</span>
                          <span className="ml-2">{formatCurrency(values.packages?.basic?.price || 0)}</span>
                          <span className="ml-2 text-sm text-gray-600">
                            ({values.packages?.basic?.deliveryTime || 0} hari)
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Standard:</span>
                          <span className="ml-2">{formatCurrency(values.packages?.standard?.price || 0)}</span>
                          <span className="ml-2 text-sm text-gray-600">
                            ({values.packages?.standard?.deliveryTime || 0} hari)
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Premium:</span>
                          <span className="ml-2">{formatCurrency(values.packages?.premium?.price || 0)}</span>
                          <span className="ml-2 text-sm text-gray-600">
                            ({values.packages?.premium?.deliveryTime || 0} hari)
                          </span>
                        </div>
                      </div>
                    </div>

                    {Array.isArray(values.tags) && values.tags.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h5 className="font-medium text-blue-900 mb-2">Tags</h5>
                        <div className="flex flex-wrap gap-2">
                          {values.tags.map((tag, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(values);
                      prevStep();
                    }}
                    disabled={currentStep === 1}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      currentStep === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                    Sebelumnya
                  </button>

                  {currentStep === steps.length ? (
                    <button
                      type="submit"
                      disabled={isSubmitting || loading || uploadingImage}
                      className="flex items-center gap-2 px-6 py-2 bg-[#010042] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Menyimpan...' : isEditing ? 'Update Gig' : 'Publikasikan Gig'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        // Validate current step before proceeding
                        if (validateCurrentStep(values)) {
                          // Save current form data and move to next step
                          setFormData(values);
                          nextStep();
                        }
                      }}
                      disabled={uploadingImage}
                      className="flex items-center gap-2 px-6 py-2 bg-[#010042] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingImage ? 'Uploading...' : 'Selanjutnya'}
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </Form>
        )}
      </Formik>
    </div>
  );
} 