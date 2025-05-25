import React, { useState, useEffect } from 'react';
import { Field, ErrorMessage } from 'formik';

const BecomeFreelancerStep3 = ({ formikProps }) => {
  const { values, errors, touched, setFieldValue } = formikProps;
  
  // Parse existing working hours if present
  const parseExistingHours = () => {
    if (values.workingHours && values.workingHours.includes(' - ')) {
      const parts = values.workingHours.split(' - ');
      return {
        start: parts[0],
        end: parts[1].replace(' WIB', '')
      };
    }
    return { start: '08:00', end: '17:00' };
  };
  
  // State for working hours selection
  const [startHour, setStartHour] = useState(parseExistingHours().start);
  const [endHour, setEndHour] = useState(parseExistingHours().end);
  
  // Available time options
  const availabilityOptions = [
    { value: 'Full-time', label: 'Full-time' },
    { value: 'Part-time', label: 'Part-time' },
    { value: 'Weekends', label: 'Akhir Pekan' }
  ];
  
  // Generate time options (24-hour format)
  const timeOptions = [];
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0');
    timeOptions.push(`${hour}:00`);
    timeOptions.push(`${hour}:30`);
  }
  
  // Update working hours when start or end time changes
  useEffect(() => {
    if (startHour && endHour) {
      setFieldValue('workingHours', `${startHour} - ${endHour} WIB`);
    }
  }, [startHour, endHour, setFieldValue]);
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Portfolio & Ketersediaan</h2>
      
      {/* Portfolio Link */}
      <div>
        <label htmlFor="portfolioLink" className="block text-sm font-medium text-gray-700">
          Link Portfolio/Website
        </label>
        <div className="mt-1">
          <Field
            type="url"
            name="portfolioLink"
            id="portfolioLink"
            placeholder="https://portfolio-saya.com"
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm"
          />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Tambahkan link ke portfolio atau website pribadi Anda (opsional)
        </p>
        <ErrorMessage name="portfolioLink" component="div" className="mt-1 text-sm text-red-600" />
      </div>
      
      {/* Availability */}
      <div>
        <label htmlFor="availability" className="block text-sm font-medium text-gray-700">
          Ketersediaan <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <Field
            as="select"
            name="availability"
            id="availability"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm"
          >
            <option value="">Pilih ketersediaan</option>
            {availabilityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Field>
        </div>
        <ErrorMessage name="availability" component="div" className="mt-1 text-sm text-red-600" />
      </div>
      
      {/* Working Hours */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Jam Kerja <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          <div className="md:col-span-2">
            <label htmlFor="startHour" className="block text-sm font-medium text-gray-500 mb-1">Jam Mulai</label>
            <select
              id="startHour"
              value={startHour}
              onChange={(e) => setStartHour(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm"
            >
              {timeOptions.map((time) => (
                <option key={`start-${time}`} value={time}>{time}</option>
              ))}
            </select>
          </div>
          
          <div className="hidden md:flex justify-center items-center">
            <span className="text-gray-500">sampai</span>
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="endHour" className="block text-sm font-medium text-gray-500 mb-1">Jam Selesai</label>
            <select
              id="endHour"
              value={endHour}
              onChange={(e) => setEndHour(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm"
            >
              {timeOptions.map((time) => (
                <option key={`end-${time}`} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-2">
          <Field
            type="hidden"
            name="workingHours"
            id="workingHours"
          />
          <p className="text-sm text-gray-500">
            Zona waktu: WIB (Waktu Indonesia Barat)
          </p>
        </div>
        <ErrorMessage name="workingHours" component="div" className="mt-1 text-sm text-red-600" />
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">Tips</h4>
        <ul className="list-disc pl-5 text-sm text-yellow-700 space-y-1">
          <li>Tambahkan portfolio untuk meningkatkan peluang mendapatkan project</li>
          <li>Pastikan Anda dapat memenuhi ketersediaan yang Anda pilih</li>
          <li>Tentukan jam kerja yang realistis sesuai dengan zona waktu Anda</li>
        </ul>
      </div>
    </div>
  );
};

export default BecomeFreelancerStep3;
