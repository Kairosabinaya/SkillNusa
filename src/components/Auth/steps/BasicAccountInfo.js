import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Input } from '../../common/Input';
import { RadioGroup } from '../../common/RadioGroup';
import { useRegistration } from '../../../context/RegistrationContext';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Email tidak valid')
    .required('Email wajib diisi'),
  password: Yup.string()
    .min(8, 'Password minimal 8 karakter')
    .matches(/[A-Z]/, 'Password harus memiliki huruf besar')
    .matches(/[a-z]/, 'Password harus memiliki huruf kecil')
    .matches(/[0-9]/, 'Password harus memiliki angka')
    .required('Password wajib diisi'),
  confirmPassword: Yup.string()
    .test('passwords-match', 'Password tidak sama', function(value) {
      return this.parent.password === value;
    })
    .required('Konfirmasi password wajib diisi'),
  fullName: Yup.string()
    .required('Nama lengkap wajib diisi'),
  username: Yup.string()
    .matches(/^[a-zA-Z0-9_]{3,20}$/, 'Username hanya boleh mengandung huruf, angka, dan underscore (3-20 karakter)')
    .required('Username wajib diisi'),
  roles: Yup.array()
    .of(Yup.string().oneOf(['freelancer', 'client']))
    .min(1, 'Pilih minimal satu peran')
    .required('Pilih peran Anda')
});

const BasicAccountInfo = () => {
  const { formData, updateFormData, nextStep } = useRegistration();

  const roleOptions = [
    {
      id: 'freelancer',
      title: 'Freelancer',
      description: 'Saya ingin menawarkan jasa'
    },
    {
      id: 'client',
      title: 'Client',
      description: 'Saya ingin mencari freelancer'
    }
  ];

  const handleSubmit = (values, { setSubmitting }) => {
    updateFormData(values);
    nextStep();
    setSubmitting(false);
  };

  return (
    <Formik
      initialValues={{
        email: formData.email || '',
        password: formData.password || '',
        confirmPassword: formData.confirmPassword || '',
        fullName: formData.fullName || '',
        username: formData.username || '',
        roles: formData.roles || []
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      validateOnMount={true}
    >
      {({ isValid, dirty, isSubmitting }) => (
        <Form className="space-y-6">
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="nama@email.com"
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Minimal 8 karakter"
            required
            helperText="Password harus memiliki minimal 8 karakter, huruf besar, kecil, dan angka"
          />

          <Input
            label="Konfirmasi Password"
            name="confirmPassword"
            type="password"
            placeholder="Masukkan password kembali"
            required
          />

          <Input
            label="Nama Lengkap"
            name="fullName"
            type="text"
            placeholder="Nama lengkap Anda"
            required
          />

          <Input
            label="Username"
            name="username"
            type="text"
            placeholder="username_anda"
            required
            helperText="Hanya boleh mengandung huruf, angka, dan underscore (3-20 karakter)"
          />

          <RadioGroup
            label="Pilih Peran Anda"
            name="roles"
            options={roleOptions}
            required
            multiple={false}
          />

          <button
            type="submit"
            disabled={!isValid || !dirty || isSubmitting}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
              (!isValid || !dirty || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Selanjutnya
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default BasicAccountInfo; 