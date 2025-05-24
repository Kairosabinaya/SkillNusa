import { useEffect, useState, useRef } from 'react';
import { Field, ErrorMessage } from 'formik';
import { getIndonesianCities } from '../../services/profileService';
import { USER_ROLES } from '../../utils/constants';

export default function RegisterStep2({ formikProps }) {
  const { values, errors, touched, setFieldValue } = formikProps;
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Fetch cities for dropdown
  useEffect(() => {
    const fetchCities = async () => {
      setLoading(true);
      try {
        const citiesData = await getIndonesianCities();
        setCities(citiesData);
      } catch (error) {
        console.error('Error fetching cities:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCities();
  }, []);
  
  // Update phone number display when it changes
  useEffect(() => {
    // Update the display value initially when the component mounts
    if (values.phoneNumber && values.phoneNumber.startsWith('+62')) {
      const displayValue = values.phoneNumber.replace(/^\+62/, '');
      // Set the display value without altering the internal formik value
      document.getElementById('phoneNumber').value = displayValue;
    }
  }, [values.phoneNumber]);
  
  // Update date of birth dropdown selections when the date changes
  useEffect(() => {
    if (values.dateOfBirth) {
      try {
        // Parse the date in YYYY-MM-DD format
        const [year, month, day] = values.dateOfBirth.split('-');
        
        // Set dropdown values
        const dayElement = document.getElementById('birthDay');
        const monthElement = document.getElementById('birthMonth');
        const yearElement = document.getElementById('birthYear');
        
        if (dayElement) dayElement.value = day;
        if (monthElement) monthElement.value = month;
        if (yearElement) yearElement.value = year;
      } catch (error) {
        console.error('Error parsing date:', error);
      }
    }
  }, [values.dateOfBirth]);
  
  // Handle profile photo change
  const handlePhotoChange = (event) => {
    const file = event.currentTarget.files[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.match('image.*')) {
      alert('Mohon pilih file gambar (jpg, jpeg, png, etc.)');
      return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB');
      return;
    }
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setFieldValue('profilePhotoURL', e.target.result);
    };
    reader.readAsDataURL(file);
    
    // Save file to form values
    setFieldValue('profilePhoto', file);
  };
  
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-medium text-gray-900">Detail Profil</h3>
      
      {/* Profile Photo Upload */}
      <div>
        <label htmlFor="profilePhoto" className="block text-sm font-medium text-gray-700">
          Foto Profil
        </label>
        <div className="mt-2 flex items-center space-x-5">
          <div className="flex-shrink-0">
            <div className="relative">
              {values.profilePhotoURL ? (
                <img
                  src={values.profilePhotoURL}
                  alt="Profile Preview"
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg className="h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              )}
              
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="absolute bottom-0 right-0 bg-white rounded-full p-1 border border-gray-300 shadow-sm"
              >
                <svg className="h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            <input
              ref={fileInputRef}
              id="profilePhoto"
              name="profilePhoto"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handlePhotoChange}
            />
          </div>
          <div>
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
              onClick={() => fileInputRef.current.click()}
            >
              Ubah
            </button>
            {values.profilePhotoURL && (
              <button
                type="button"
                className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={() => {
                  setFieldValue('profilePhoto', null);
                  setFieldValue('profilePhotoURL', '');
                }}
              >
                Hapus
              </button>
            )}
            <p className="mt-1 text-xs text-gray-500">JPG, PNG, atau GIF. Maksimal 2MB.</p>
          </div>
        </div>
      </div>
      
      {/* Phone Number Field */}
      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
          Nomor Telepon <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="inline-flex items-center px-3 py-2 text-sm text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md font-medium">
                +62
              </span>
            </div>
            <Field
              id="phoneNumber"
              name="phoneNumber"
              type="text"
              autoComplete="tel"
              placeholder="8xxxxxxxxxx"
              className={`appearance-none block w-full rounded-none rounded-r-md px-3 py-2 border ${
                errors.phoneNumber && touched.phoneNumber ? 'border-red-300' : 'border-gray-300'
              } shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm`}
              onChange={(e) => {
                // Get the raw input value
                let inputValue = e.target.value;
                
                // Remove any +62 prefix if the user manually entered it
                inputValue = inputValue.replace(/^\+62/, '');
                
                // Remove leading zeros if any
                inputValue = inputValue.replace(/^0+/, '');
                
                // Set the value with +62 prefix internally
                setFieldValue('phoneNumber', '+62' + inputValue);
                
                // Keep just the cleaned input in the field
                e.target.value = inputValue;
              }}
              // Show the number without +62 prefix in the input field
              value={values.phoneNumber ? values.phoneNumber.replace(/^\+62/, '') : ''}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Masukkan nomor telepon tanpa 0 di depan (contoh: 812xxxxxxx)</p>
          <ErrorMessage name="phoneNumber" component="div" className="mt-1 text-sm text-red-600" />
        </div>
      </div>
      
      {/* Date of Birth Field */}
      <div>
        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
          Tanggal Lahir <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 relative">
          {/* Custom date input for Indonesian format */}
          <div className="flex">
            <div className="w-1/3 mr-2">
              <select
                className={`appearance-none block w-full px-3 py-2 border ${
                  errors.dateOfBirth && touched.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm`}
                onChange={(e) => {
                  const day = e.target.value;
                  const month = document.getElementById('birthMonth').value;
                  const year = document.getElementById('birthYear').value;
                  
                  if (day && month && year) {
                    // Create date in yyyy-mm-dd format for internal storage
                    setFieldValue('dateOfBirth', `${year}-${month}-${day}`);
                  }
                }}
                id="birthDay"
              >
                <option value="">Tanggal</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day.toString().padStart(2, '0')}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-1/3 mr-2">
              <select
                className={`appearance-none block w-full px-3 py-2 border ${
                  errors.dateOfBirth && touched.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm`}
                onChange={(e) => {
                  const day = document.getElementById('birthDay').value;
                  const month = e.target.value;
                  const year = document.getElementById('birthYear').value;
                  
                  if (day && month && year) {
                    // Create date in yyyy-mm-dd format for internal storage
                    setFieldValue('dateOfBirth', `${year}-${month}-${day}`);
                  }
                }}
                id="birthMonth"
              >
                <option value="">Bulan</option>
                <option value="01">Januari</option>
                <option value="02">Februari</option>
                <option value="03">Maret</option>
                <option value="04">April</option>
                <option value="05">Mei</option>
                <option value="06">Juni</option>
                <option value="07">Juli</option>
                <option value="08">Agustus</option>
                <option value="09">September</option>
                <option value="10">Oktober</option>
                <option value="11">November</option>
                <option value="12">Desember</option>
              </select>
            </div>
            <div className="w-1/3">
              <select
                className={`appearance-none block w-full px-3 py-2 border ${
                  errors.dateOfBirth && touched.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm`}
                onChange={(e) => {
                  const day = document.getElementById('birthDay').value;
                  const month = document.getElementById('birthMonth').value;
                  const year = e.target.value;
                  
                  if (day && month && year) {
                    // Create date in yyyy-mm-dd format for internal storage
                    setFieldValue('dateOfBirth', `${year}-${month}-${day}`);
                  }
                }}
                id="birthYear"
              >
                <option value="">Tahun</option>
                {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Hidden original date field for Formik */}
          <Field
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            className="sr-only"
          />
          
          <ErrorMessage name="dateOfBirth" component="div" className="mt-1 text-sm text-red-600" />
        </div>
      </div>
      
      {/* Gender Field */}
      <div>
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
          Jenis Kelamin <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <Field
            as="select"
            id="gender"
            name="gender"
            className={`appearance-none block w-full px-3 py-2 border ${
              errors.gender && touched.gender ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm`}
          >
            <option value="">Pilih jenis kelamin</option>
            <option value="Male">Laki-laki</option>
            <option value="Female">Perempuan</option>
            <option value="Other">Lainnya</option>
            <option value="Prefer not to say">Tidak ingin memberi tahu</option>
          </Field>
          <ErrorMessage name="gender" component="div" className="mt-1 text-sm text-red-600" />
        </div>
      </div>
      
      {/* Location Field */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
          Kota <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <Field
            as="select"
            id="location"
            name="location"
            className={`appearance-none block w-full px-3 py-2 border ${
              errors.location && touched.location ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm`}
          >
            <option value="">Pilih kota</option>
            {loading ? (
              <option value="" disabled>Loading...</option>
            ) : (
              cities.map(city => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))
            )}
          </Field>
          <ErrorMessage name="location" component="div" className="mt-1 text-sm text-red-600" />
        </div>
      </div>
      
      {/* Bio Field - Required only for Freelancers */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Tentang Saya {values.role === USER_ROLES.FREELANCER && <span className="text-red-500">*</span>}
        </label>
        <div className="mt-1">
          <Field
            as="textarea"
            id="bio"
            name="bio"
            rows={4}
            placeholder={values.role === USER_ROLES.FREELANCER ? 
              "Deskripsikan diri Anda, keahlian, dan pengalaman Anda (minimal 50 karakter)" : 
              "Deskripsikan diri Anda (opsional)"}
            className={`appearance-none block w-full px-3 py-2 border ${
              errors.bio && touched.bio ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm`}
          />
          <div className="mt-1 flex justify-between">
            <ErrorMessage name="bio" component="div" className="text-sm text-red-600" />
            <div className="text-xs text-gray-500">
              {values.bio ? values.bio.length : 0}/500 karakter
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-2">
        <p className="text-xs text-gray-500">
          <span className="text-red-500">*</span> Wajib diisi
        </p>
      </div>
    </div>
  );
} 