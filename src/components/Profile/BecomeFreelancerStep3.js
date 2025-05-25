import { Field, ErrorMessage } from 'formik';

export default function BecomeFreelancerStep3({ formikProps }) {
  const { values, errors, touched } = formikProps;
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Verifikasi & Persetujuan</h2>
      
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <p className="text-sm text-gray-600 mb-4">
          Sebelum menyelesaikan pendaftaran sebagai freelancer, silakan baca dan setujui ketentuan berikut:
        </p>
        
        <div className="space-y-4">
          {/* Freelancer Terms */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <Field
                id="agreeToFreelancerTerms"
                name="agreeToFreelancerTerms"
                type="checkbox"
                className="h-4 w-4 text-[#010042] focus:ring-[#010042] border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="agreeToFreelancerTerms" className={`font-medium ${errors.agreeToFreelancerTerms && touched.agreeToFreelancerTerms ? 'text-red-700' : 'text-gray-700'}`}>
                Saya setuju dengan <a href="/freelancer-terms" target="_blank" className="text-[#010042] hover:underline">Ketentuan Freelancer</a> <span className="text-red-500">*</span>
              </label>
              <ErrorMessage name="agreeToFreelancerTerms" component="div" className="mt-1 text-sm text-red-600" />
            </div>
          </div>
          
          {/* Quality Standards */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <Field
                id="agreeToQualityStandards"
                name="agreeToQualityStandards"
                type="checkbox"
                className="h-4 w-4 text-[#010042] focus:ring-[#010042] border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="agreeToQualityStandards" className={`font-medium ${errors.agreeToQualityStandards && touched.agreeToQualityStandards ? 'text-red-700' : 'text-gray-700'}`}>
                Saya berkomitmen untuk mematuhi <a href="/quality-standards" target="_blank" className="text-[#010042] hover:underline">Standar Kualitas</a> SkillNusa <span className="text-red-500">*</span>
              </label>
              <ErrorMessage name="agreeToQualityStandards" component="div" className="mt-1 text-sm text-red-600" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Proses Selanjutnya</h4>
        <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
          <li>Permohonan Anda akan ditinjau oleh tim kami dalam 1-3 hari kerja</li>
          <li>Setelah disetujui, Anda dapat beralih antara peran Client dan Freelancer</li>
          <li>Anda tetap dapat menggunakan akun Client Anda selama proses peninjauan</li>
        </ul>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <h4 className="text-sm font-medium text-gray-800 mb-2">Ringkasan Profil Freelancer</h4>
        
        <div className="space-y-3 text-sm text-gray-600">
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Level Pengalaman:</div>
            <div>
              {values.experienceLevel === 'Beginner' && 'Pemula (< 1 tahun)'}
              {values.experienceLevel === 'Intermediate' && 'Menengah (1-3 tahun)'}
              {values.experienceLevel === 'Expert' && 'Ahli (3+ tahun)'}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Tarif per Jam:</div>
            <div>Rp {parseInt(values.hourlyRate || 0).toLocaleString('id-ID')}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Ketersediaan:</div>
            <div>{values.availability}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Portfolio:</div>
            <div>
              {values.portfolioLinks.filter(link => link).length > 0 ? (
                <ul className="list-disc pl-5">
                  {values.portfolioLinks.filter(link => link).map((link, index) => (
                    <li key={index}>
                      <a href={link} target="_blank" rel="noopener noreferrer" className="text-[#010042] hover:underline truncate block">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-gray-400">Tidak ada</span>
              )}
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
