import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Input } from '../../common/Input';
import { Select } from '../../common/Select';
import { useRegistration } from '../../../context/RegistrationContext';
import { cities } from '../../../data/cities';

const SUPPORTED_FORMATS = ['image/jpg', 'image/jpeg', 'image/png'];
const FILE_SIZE = 2 * 1024 * 1024; // 2MB

const validationSchema = Yup.object({
  phoneNumber: Yup.string()
    .matches(/^(\+62|62|0)8[1-9][0-9]{6,9}$/, 'Nomor telepon tidak valid')
    .required('Nomor telepon wajib diisi'),
  dateOfBirth: Yup.date()
    .max(new Date(), 'Tanggal lahir tidak valid')
    .required('Tanggal lahir wajib diisi'),
  gender: Yup.string()
    .oneOf(['male', 'female'], 'Pilih jenis kelamin')
    .required('Jenis kelamin wajib diisi'),
  city: Yup.string()
    .required('Kota wajib diisi'),
  profilePicture: Yup.mixed()
    .test('fileFormat', 'Format file tidak didukung', value => 
      !value || (value && SUPPORTED_FORMATS.includes(value.type)))
    .test('fileSize', 'Ukuran file terlalu besar (max 2MB)', value => 
      !value || (value && value.size <= FILE_SIZE))
});

const ProfileDetails = () => {
  const { formData, updateFormData, nextStep, prevStep } = useRegistration();

  const genderOptions = [
    { value: 'male', label: 'Laki-laki' },
    { value: 'female', label: 'Perempuan' }
  ];

  const cityOptions = cities.map(city => ({
    value: city,
    label: city
  }));

  const handleSubmit = (values, { setSubmitting }) => {
    updateFormData(values);
    nextStep();
    setSubmitting(false);
  };

  return (
    <Formik
      initialValues={{
        phoneNumber: formData.phoneNumber || '',
        dateOfBirth: formData.dateOfBirth || '',
        gender: formData.gender || '',
        city: formData.city || '',
        profilePicture: formData.profilePicture || null
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      validateOnMount={true}
    >
      {({ isValid, dirty, isSubmitting, setFieldValue }) => (
        <Form className="space-y-6">
          <Input
            label="Nomor Telepon"
            name="phoneNumber"
            type="tel"
            placeholder="08xxxxxxxxxx"
            required
            helperText="Contoh: 081234567890"
          />

          <Input
            label="Tanggal Lahir"
            name="dateOfBirth"
            type="date"
            required
          />

          <Select
            label="Jenis Kelamin"
            name="gender"
            options={genderOptions}
            required
          />

          <Select
            label="Kota"
            name="city"
            options={cityOptions}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Foto Profil
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                setFieldValue("profilePicture", event.currentTarget.files[0]);
              }}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-primary file:text-white
                hover:file:cursor-pointer hover:file:bg-primary-dark
              "
            />
            <p className="mt-1 text-sm text-gray-500">
              Format: JPG, JPEG, PNG (max 2MB)
            </p>
          </div>

          <div className="flex justify-between space-x-4">
            <button
              type="button"
              onClick={prevStep}
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Sebelumnya
            </button>
            <button
              type="submit"
              disabled={!isValid || !dirty || isSubmitting}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                (!isValid || !dirty || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Selanjutnya
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default ProfileDetails; 