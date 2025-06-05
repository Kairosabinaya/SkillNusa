import { Field, ErrorMessage } from 'formik';
import { Link } from 'react-router-dom';

export default function RegisterStep3({ formikProps }) {
  const { values, errors, touched } = formikProps;
  
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-medium text-gray-900">Syarat & Ketentuan</h3>
      
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <p className="text-sm text-gray-600 mb-4">
          Sebelum menyelesaikan pendaftaran, silakan baca dan setujui ketentuan berikut:
        </p>
        
        <div className="space-y-4">
          {/* Terms & Conditions */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <Field
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                className="h-4 w-4 text-[#010042] focus:ring-[#010042] border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="agreeToTerms" className={`font-medium ${errors.agreeToTerms && touched.agreeToTerms ? 'text-red-700' : 'text-gray-700'}`}>
                Saya setuju dengan <Link to="/terms" target="_blank" className="text-[#010042] hover:underline">Syarat & Ketentuan</Link> <span className="text-red-500">*</span>
              </label>
              <ErrorMessage name="agreeToTerms" component="div" className="mt-1 text-sm text-red-600" />
            </div>
          </div>
          
          {/* Privacy Policy */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <Field
                id="agreeToPrivacy"
                name="agreeToPrivacy"
                type="checkbox"
                className="h-4 w-4 text-[#010042] focus:ring-[#010042] border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="agreeToPrivacy" className={`font-medium ${errors.agreeToPrivacy && touched.agreeToPrivacy ? 'text-red-700' : 'text-gray-700'}`}>
                Saya setuju dengan <Link to="/privacy" target="_blank" className="text-[#010042] hover:underline">Kebijakan Privasi</Link> <span className="text-red-500">*</span>
              </label>
              <ErrorMessage name="agreeToPrivacy" component="div" className="mt-1 text-sm text-red-600" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Langkah Selanjutnya</h4>
        <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
          <li>Anda dapat mengubah detail profil Anda kapan saja setelah pendaftaran</li>
          <li>Anda dapat menjadi freelancer setelah mendaftar melalui halaman profil Anda</li>
        </ul>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <h4 className="text-sm font-medium text-gray-800 mb-2">Ringkasan Informasi</h4>
        
        <div className="space-y-3 text-sm text-gray-600">
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Email:</div>
            <div>{values.email}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Nama Lengkap:</div>
            <div>{values.fullName}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Username:</div>
            <div>{values.username}</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Nomor Telepon:</div>
            <div>{values.phoneNumber}</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Tanggal Lahir:</div>
            <div>{values.dateOfBirth}</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Jenis Kelamin:</div>
            <div>{values.gender === 'Male' ? 'Laki-laki' : 'Perempuan'}</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Kota:</div>
            <div>{values.location.charAt(0).toUpperCase() + values.location.slice(1)}</div>
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