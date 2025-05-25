import React, { useState, useRef } from 'react';
import { Field, ErrorMessage } from 'formik';

const BecomeFreelancerStep2 = ({ formikProps }) => {
  const { values, errors, touched, setFieldValue } = formikProps;
  
  // Error states
  const [educationError, setEducationError] = useState('');
  const [certificationError, setCertificationError] = useState('');
  
  // Refs for input focus
  const universityInputRef = useRef(null);
  const certNameInputRef = useRef(null);
  
  // State for new education
  const [newEducation, setNewEducation] = useState({
    country: '',
    university: '',
    degree: 'Bachelor',
    fieldOfStudy: '',
    graduationYear: new Date().getFullYear().toString()
  });
  
  // State for new certification
  const [newCertification, setNewCertification] = useState({
    name: '',
    issuedBy: '',
    year: new Date().getFullYear().toString()
  });
  
  // Available years for dropdown (last 70 years plus 5 future years for expected graduation)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 76 }, (_, i) => currentYear + 5 - i).map(String);
  
  // Available degree options
  const degreeOptions = [
    { value: 'High School', label: 'SMA/SMK' },
    { value: 'Associate', label: 'Diploma (D1/D2/D3)' },
    { value: 'Bachelor', label: 'Sarjana (S1)' },
    { value: 'Master', label: 'Magister (S2)' },
    { value: 'Doctorate', label: 'Doktor (S3)' },
    { value: 'Professional', label: 'Pendidikan Profesi' },
  ];
  
  // List of countries (simplified for example)
  const countries = [
    'Indonesia', 'Singapore', 'Malaysia', 'United States', 'Australia', 
    'United Kingdom', 'Japan', 'South Korea', 'China', 'Germany', 'Netherlands',
    'France', 'Canada', 'India', 'Other'
  ];

  // Handle education input change
  const handleEducationChange = (field, value) => {
    setNewEducation({ ...newEducation, [field]: value });
    if (educationError) setEducationError('');
  };
  
  // Handle certification input change
  const handleCertificationChange = (field, value) => {
    setNewCertification({ ...newCertification, [field]: value });
    if (certificationError) setCertificationError('');
  };
  
  // Add new education
  const handleAddEducation = () => {
    const { country, university, degree, fieldOfStudy, graduationYear } = newEducation;
    
    if (!country || !university || !fieldOfStudy || !graduationYear) {
      setEducationError('Silakan lengkapi semua informasi pendidikan');
      // Focus back on the university input field
      setTimeout(() => {
        if (universityInputRef.current) {
          universityInputRef.current.focus();
        }
      }, 0);
      return;
    }
    
    setFieldValue('education', [...values.education, { ...newEducation }]);
    setEducationError('');
    
    // Reset form
    setNewEducation({
      country: '',
      university: '',
      degree: 'Bachelor',
      fieldOfStudy: '',
      graduationYear: new Date().getFullYear().toString()
    });
  };
  
  // Add new certification
  const handleAddCertification = () => {
    const { name, issuedBy, year } = newCertification;
    
    if (!name || !issuedBy || !year) {
      setCertificationError('Silakan lengkapi semua informasi sertifikasi');
      // Focus back on the certification name input field
      setTimeout(() => {
        if (certNameInputRef.current) {
          certNameInputRef.current.focus();
        }
      }, 0);
      return;
    }
    
    setFieldValue('certifications', [...values.certifications, { ...newCertification }]);
    setCertificationError('');
    
    // Reset form
    setNewCertification({
      name: '',
      issuedBy: '',
      year: new Date().getFullYear().toString()
    });
  };
  
  // Remove education
  const handleRemoveEducation = (index) => {
    const updatedEducation = values.education.filter((_, i) => i !== index);
    setFieldValue('education', updatedEducation);
  };
  
  // Remove certification
  const handleRemoveCertification = (index) => {
    const updatedCertifications = values.certifications.filter((_, i) => i !== index);
    setFieldValue('certifications', updatedCertifications);
  };
  
  return (
    <div className="space-y-8">
      <h2 className="text-lg font-medium text-gray-900">Pendidikan & Sertifikasi</h2>
      
      {/* Education Section */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-800">Pendidikan <span className="text-sm font-normal text-gray-500">(opsional)</span></h3>
        
        {/* Existing Education List */}
        {values.education.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Riwayat pendidikan:</h4>
            <div className="space-y-3">
              {values.education.map((edu, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-md border border-gray-200 relative pr-10">
                  <button
                    type="button"
                    onClick={() => handleRemoveEducation(index)}
                    className="absolute top-3 right-3 text-red-500 hover:text-red-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="font-medium">{edu.university}</div>
                  <div className="text-sm">
                    {degreeOptions.find(d => d.value === edu.degree)?.label || edu.degree} - {edu.fieldOfStudy}
                  </div>
                  <div className="text-sm text-gray-500">{edu.country}, {edu.graduationYear}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Add New Education Form */}
        <div className="bg-white p-4 border border-gray-200 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Tambah pendidikan baru:</h4>
          <p className="text-sm text-gray-500 mb-3">Anda dapat melewatkan bagian ini jika tidak ingin menambahkan riwayat pendidikan.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eduCountry" className="block text-sm font-medium text-gray-700 mb-1">
                Negara
              </label>
              <select
                id="eduCountry"
                value={newEducation.country}
                onChange={(e) => handleEducationChange('country', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm"
              >
                <option value="">Pilih Negara</option>
                {countries.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="eduUniversity" className="block text-sm font-medium text-gray-700 mb-1">
                Universitas/Institusi
              </label>
              <input
                type="text"
                id="eduUniversity"
                value={newEducation.university}
                onChange={(e) => handleEducationChange('university', e.target.value)}
                placeholder="Nama universitas atau institusi"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm"
                ref={universityInputRef}
              />
            </div>
            
            <div>
              <label htmlFor="eduDegree" className="block text-sm font-medium text-gray-700 mb-1">
                Gelar
              </label>
              <select
                id="eduDegree"
                value={newEducation.degree}
                onChange={(e) => handleEducationChange('degree', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm"
              >
                {degreeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="eduField" className="block text-sm font-medium text-gray-700 mb-1">
                Bidang Studi
              </label>
              <input
                type="text"
                id="eduField"
                value={newEducation.fieldOfStudy}
                onChange={(e) => handleEducationChange('fieldOfStudy', e.target.value)}
                placeholder="Contoh: Teknik Informatika"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="eduGradYear" className="block text-sm font-medium text-gray-700 mb-1">
                Tahun Kelulusan
              </label>
              <select
                id="eduGradYear"
                value={newEducation.graduationYear}
                onChange={(e) => handleEducationChange('graduationYear', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm"
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={handleAddEducation}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
                >
                  Tambah Pendidikan (Opsional)
                </button>
                {educationError && (
                  <p className="absolute text-xs text-red-600 w-full text-center mt-1">{educationError}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {errors.education && touched.education && (
          <p className="mt-2 text-sm text-red-600">{errors.education}</p>
        )}
      </div>
      
      {/* Certifications Section */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-800">Sertifikasi/Penghargaan <span className="text-sm font-normal text-gray-500">(opsional)</span></h3>
        
        {/* Existing Certifications List */}
        {values.certifications.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Sertifikasi/Penghargaan yang ditambahkan:</h4>
            <div className="space-y-3">
              {values.certifications.map((cert, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-md border border-gray-200 relative pr-10">
                  <button
                    type="button"
                    onClick={() => handleRemoveCertification(index)}
                    className="absolute top-3 right-3 text-red-500 hover:text-red-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="font-medium">{cert.name}</div>
                  <div className="text-sm text-gray-500">Dikeluarkan oleh {cert.issuedBy}, {cert.year}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Add New Certification Form */}
        <div className="bg-white p-4 border border-gray-200 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Tambah sertifikasi/penghargaan baru:</h4>
          <p className="text-sm text-gray-500 mb-3">Anda dapat melewatkan bagian ini jika tidak memiliki sertifikasi atau penghargaan.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="certName" className="block text-sm font-medium text-gray-700 mb-1">
                Nama Sertifikasi/Penghargaan
              </label>
              <input
                type="text"
                id="certName"
                value={newCertification.name}
                onChange={(e) => handleCertificationChange('name', e.target.value)}
                placeholder="Nama sertifikasi atau penghargaan"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm"
                ref={certNameInputRef}
              />
            </div>
            
            <div>
              <label htmlFor="certIssuer" className="block text-sm font-medium text-gray-700 mb-1">
                Dikeluarkan Oleh
              </label>
              <input
                type="text"
                id="certIssuer"
                value={newCertification.issuedBy}
                onChange={(e) => handleCertificationChange('issuedBy', e.target.value)}
                placeholder="Nama lembaga yang mengeluarkan"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="certYear" className="block text-sm font-medium text-gray-700 mb-1">
                Tahun
              </label>
              <select
                id="certYear"
                value={newCertification.year}
                onChange={(e) => handleCertificationChange('year', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm"
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={handleAddCertification}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
                >
                  Tambah Sertifikasi (Opsional)
                </button>
                {certificationError && (
                  <p className="absolute text-xs text-red-600 w-full text-center mt-1">{certificationError}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeFreelancerStep2;

