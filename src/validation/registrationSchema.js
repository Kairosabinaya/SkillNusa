import * as Yup from 'yup';

// Phone number regex for Indonesian format
const phoneRegExp = /^(\+62|62)?[\s-]?0?8[1-9]{1}\d{1}[\s-]?\d{4}[\s-]?\d{2,5}$/;

// URL regex for portfolio links
const urlRegExp = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

// Username regex (alphanumeric + underscore, 3-20 chars)
const usernameRegExp = /^[a-zA-Z0-9_]{3,20}$/;

export const basicInfoSchema = Yup.object().shape({
  email: Yup.string()
    .email('Format email tidak valid')
    .required('Email wajib diisi'),
  password: Yup.string()
    .min(8, 'Password minimal 8 karakter')
    .matches(/[A-Z]/, 'Password harus memiliki minimal 1 huruf besar')
    .matches(/[a-z]/, 'Password harus memiliki minimal 1 huruf kecil')
    .matches(/[0-9]/, 'Password harus memiliki minimal 1 angka')
    .required('Password wajib diisi'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Password tidak sama')
    .required('Konfirmasi password wajib diisi'),
  fullName: Yup.string()
    .required('Nama lengkap wajib diisi'),
  username: Yup.string()
    .matches(usernameRegExp, 'Username hanya boleh mengandung huruf, angka, dan underscore (3-20 karakter)')
    .required('Username wajib diisi'),
  role: Yup.string()
    .oneOf(['freelancer', 'client'], 'Pilih peran Anda')
    .required('Peran wajib dipilih')
});

export const profileDetailsSchema = Yup.object().shape({
  profilePhoto: Yup.mixed(),
  phoneNumber: Yup.string()
    .matches(phoneRegExp, 'Format nomor telepon tidak valid (contoh: +6281234567890)')
    .required('Nomor telepon wajib diisi'),
  dateOfBirth: Yup.date()
    .max(new Date(), 'Tanggal lahir tidak valid')
    .required('Tanggal lahir wajib diisi'),
  gender: Yup.string()
    .oneOf(['male', 'female', 'other', 'prefer_not_to_say'], 'Pilih jenis kelamin')
    .required('Jenis kelamin wajib dipilih'),
  city: Yup.string()
    .required('Kota wajib diisi'),
  bio: Yup.string()
    .when('role', {
      is: 'freelancer',
      then: Yup.string()
        .min(50, 'Bio minimal 50 karakter')
        .max(500, 'Bio maksimal 500 karakter')
        .required('Bio wajib diisi untuk freelancer'),
      otherwise: Yup.string()
    })
});

export const freelancerInfoSchema = Yup.object().shape({
  skills: Yup.array()
    .min(3, 'Pilih minimal 3 keahlian')
    .required('Keahlian wajib diisi'),
  experienceLevel: Yup.string()
    .oneOf(['beginner', 'intermediate', 'expert'], 'Pilih level pengalaman')
    .required('Level pengalaman wajib diisi'),
  portfolioLinks: Yup.array()
    .of(
      Yup.string()
        .matches(urlRegExp, 'URL tidak valid')
    )
    .max(3, 'Maksimal 3 portfolio link'),
  hourlyRate: Yup.number()
    .min(0, 'Rate per jam tidak boleh negatif'),
  availability: Yup.string()
    .oneOf(['full-time', 'part-time', 'project-based'], 'Pilih ketersediaan')
    .required('Ketersediaan wajib diisi')
});

export const clientInfoSchema = Yup.object().shape({
  companyName: Yup.string(),
  industry: Yup.string()
    .required('Industri wajib diisi'),
  companySize: Yup.string()
    .oneOf(['1-10', '11-50', '51-200', '200+', 'individual'], 'Pilih ukuran perusahaan')
    .required('Ukuran perusahaan wajib diisi'),
  budgetRange: Yup.string()
    .required('Kisaran budget wajib diisi'),
  primaryNeeds: Yup.array()
    .min(1, 'Pilih minimal 1 kebutuhan')
    .required('Kebutuhan wajib diisi')
});

export const termsSchema = Yup.object().shape({
  termsAccepted: Yup.boolean()
    .oneOf([true], 'Anda harus menyetujui Syarat & Ketentuan')
    .required('Anda harus menyetujui Syarat & Ketentuan'),
  privacyAccepted: Yup.boolean()
    .oneOf([true], 'Anda harus menyetujui Kebijakan Privasi')
    .required('Anda harus menyetujui Kebijakan Privasi'),
  marketingEmails: Yup.boolean()
}); 