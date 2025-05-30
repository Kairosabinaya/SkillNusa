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

const categories = [
  'Desain Grafis',
  'Pemrograman & Teknologi',
  'Penulisan & Terjemahan',
  'Video & Animasi',
  'Musik & Audio',
  'Digital Marketing',
  'Bisnis',
  'Lifestyle',
  'Data',
  'Fotografi'
];

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
  { id: 3, name: 'Media', description: 'Tambahkan gambar dan video' },
  { id: 4, name: 'Detail', description: 'FAQ dan informasi tambahan' },
  { id: 5, name: 'Review', description: 'Periksa dan publikasikan' }
];

const validationSchemas = [
  // Step 1: Basic Info
  Yup.object({
    title: Yup.string()
      .required('Judul gig harus diisi')
      .min(10, 'Judul minimal 10 karakter')
      .max(80, 'Judul maksimal 80 karakter'),
    category: Yup.string().required('Kategori harus dipilih'),
    subcategory: Yup.string(),
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
        name: Yup.string().required('Nama paket harus diisi'),
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
      .max(5, 'Maksimal 5 gambar'),
    video: Yup.string().url('URL video tidak valid')
  }),

  // Step 4: Details
  Yup.object({
    requirements: Yup.string(),
    faqs: Yup.array().of(
      Yup.object({
        question: Yup.string().required('Pertanyaan harus diisi'),
        answer: Yup.string().required('Jawaban harus diisi')
      })
    )
  }),

  // Step 5: Review
  Yup.object({})
];

export default function CreateGig() {
  const { gigId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const initialValues = {
    title: '',
    category: '',
    subcategory: '',
    description: '',
    tags: [],
    packages: {
      basic: {
        name: 'Paket Basic',
        price: 50000,
        description: '',
        deliveryTime: 3,
        revisions: 1,
        features: []
      },
      standard: {
        enabled: false,
        name: 'Paket Standard',
        price: 100000,
        description: '',
        deliveryTime: 5,
        revisions: 2,
        features: []
      },
      premium: {
        enabled: false,
        name: 'Paket Premium',
        price: 200000,
        description: '',
        deliveryTime: 7,
        revisions: 3,
        features: []
      }
    },
    images: [],
    video: '',
    requirements: '',
    faqs: []
  };

  const [formData, setFormData] = useState(initialValues);

  useEffect(() => {
    if (gigId) {
      fetchGigData();
    }
  }, [gigId]);

  const fetchGigData = async () => {
    setLoading(true);
    try {
      const gigDoc = await getDoc(doc(db, 'gigs', gigId));
      if (gigDoc.exists()) {
        const data = gigDoc.data();
        setFormData({
          ...initialValues,
          ...data
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
    const currentImages = values.images || [];
    
    if (currentImages.length + files.length > 5) {
      alert('Maksimal 5 gambar');
      return;
    }

    setUploadingImage(true);
    
    // In production, upload to Cloudinary
    // For now, we'll use placeholder URLs
    const newImages = files.map(file => URL.createObjectURL(file));
    setFieldValue('images', [...currentImages, ...newImages]);
    
    setUploadingImage(false);
  };

  const removeImage = (index, setFieldValue, values) => {
    const newImages = values.images.filter((_, i) => i !== index);
    setFieldValue('images', newImages);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const gigData = {
        ...values,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'User',
        status: 'active',
        views: 0,
        orders: 0,
        rating: 0,
        reviewCount: 0,
        createdAt: isEditing ? values.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (isEditing) {
        await updateDoc(doc(db, 'gigs', gigId), gigData);
      } else {
        await addDoc(collection(db, 'gigs'), gigData);
      }

      navigate('/dashboard/freelancer/gigs');
    } catch (error) {
      console.error('Error saving gig:', error);
      alert('Gagal menyimpan gig. Silakan coba lagi.');
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
                        {values.title.length}/80 karakter
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kategori *
                      </label>
                      <Field
                        as="select"
                        name="category"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
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
                        {values.description.length}/1200 karakter
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags (Maksimal 5)
                      </label>
                      <FieldArray name="tags">
                        {({ push, remove }) => (
                          <div className="space-y-2">
                            {values.tags.map((tag, index) => (
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
                            ))}
                            {values.tags.length < 5 && (
                              <button
                                type="button"
                                onClick={() => push('')}
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
                            Tawarkan beberapa paket untuk memberikan pilihan kepada client
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Basic Package */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Paket Basic (Wajib)
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nama Paket
                          </label>
                          <Field
                            name="packages.basic.name"
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Harga
                            </label>
                            <Field
                              name="packages.basic.price"
                              type="number"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                            />
                            {errors.packages?.basic?.price && touched.packages?.basic?.price && (
                              <p className="mt-1 text-sm text-red-600">{errors.packages.basic.price}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Waktu Pengerjaan
                            </label>
                            <Field
                              as="select"
                              name="packages.basic.deliveryTime"
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
                            Deskripsi Paket
                          </label>
                          <Field
                            as="textarea"
                            name="packages.basic.description"
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jumlah Revisi
                          </label>
                          <Field
                            name="packages.basic.revisions"
                            type="number"
                            min="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Optional Packages Toggle */}
                    <div className="flex items-center gap-4">
                      <label className="flex items-center">
                        <Field
                          type="checkbox"
                          name="packages.standard.enabled"
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Tambah Paket Standard
                        </span>
                      </label>
                      <label className="flex items-center">
                        <Field
                          type="checkbox"
                          name="packages.premium.enabled"
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Tambah Paket Premium
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 3: Media */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gambar Gig (Minimal 1, Maksimal 5)
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {values.images.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image}
                              alt={`Gig image ${index + 1}`}
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
                        ))}
                        
                        {values.images.length < 5 && (
                          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleImageUpload(e, setFieldValue, values)}
                              className="hidden"
                            />
                            {uploadingImage ? (
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#010042]"></div>
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
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Video URL (Opsional)
                      </label>
                      <Field
                        name="video"
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                      />
                      {errors.video && touched.video && (
                        <p className="mt-1 text-sm text-red-600">{errors.video}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Tambahkan video YouTube untuk menjelaskan layanan Anda
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 4: Details */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Persyaratan dari Buyer (Opsional)
                      </label>
                      <Field
                        as="textarea"
                        name="requirements"
                        rows={4}
                        placeholder="Apa yang Anda butuhkan dari buyer untuk memulai pekerjaan?"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        FAQ (Frequently Asked Questions)
                      </label>
                      <FieldArray name="faqs">
                        {({ push, remove }) => (
                          <div className="space-y-4">
                            {values.faqs.map((faq, index) => (
                              <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Pertanyaan
                                    </label>
                                    <Field
                                      name={`faqs.${index}.question`}
                                      type="text"
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Jawaban
                                    </label>
                                    <Field
                                      as="textarea"
                                      name={`faqs.${index}.answer`}
                                      rows={2}
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                                    />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="mt-3 text-sm text-red-600 hover:text-red-700"
                                >
                                  Hapus FAQ
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => push({ question: '', answer: '' })}
                              className="flex items-center gap-2 text-sm text-[#010042] hover:text-blue-700"
                            >
                              <PlusIcon className="h-4 w-4" />
                              Tambah FAQ
                            </button>
                          </div>
                        )}
                      </FieldArray>
                    </div>
                  </div>
                )}

                {/* Step 5: Review */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Review Gig Anda
                    </h3>

                    {/* Preview Card */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {values.images[0] && (
                        <img
                          src={values.images[0]}
                          alt={values.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-6">
                        <h4 className="text-xl font-semibold text-gray-900 mb-2">
                          {values.title}
                        </h4>
                        <p className="text-gray-600 mb-4">
                          {values.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            {values.category}
                          </span>
                          <span className="text-lg font-bold text-[#010042]">
                            Mulai dari {formatCurrency(values.packages.basic.price)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Package Summary */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-medium text-gray-900 mb-4">Ringkasan Paket</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium">{values.packages.basic.name}:</span>
                          <span className="ml-2">{formatCurrency(values.packages.basic.price)}</span>
                          <span className="ml-2 text-sm text-gray-600">
                            ({values.packages.basic.deliveryTime} hari)
                          </span>
                        </div>
                        {values.packages.standard.enabled && (
                          <div>
                            <span className="font-medium">{values.packages.standard.name}:</span>
                            <span className="ml-2">{formatCurrency(values.packages.standard.price)}</span>
                            <span className="ml-2 text-sm text-gray-600">
                              ({values.packages.standard.deliveryTime} hari)
                            </span>
                          </div>
                        )}
                        {values.packages.premium.enabled && (
                          <div>
                            <span className="font-medium">{values.packages.premium.name}:</span>
                            <span className="ml-2">{formatCurrency(values.packages.premium.price)}</span>
                            <span className="ml-2 text-sm text-gray-600">
                              ({values.packages.premium.deliveryTime} hari)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
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

                  <button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className="flex items-center gap-2 px-6 py-2 bg-[#010042] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentStep === steps.length ? (
                      <>
                        {loading ? 'Menyimpan...' : isEditing ? 'Update Gig' : 'Publikasikan Gig'}
                      </>
                    ) : (
                      <>
                        Selanjutnya
                        <ChevronRightIcon className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </Form>
        )}
      </Formik>
    </div>
  );
} 