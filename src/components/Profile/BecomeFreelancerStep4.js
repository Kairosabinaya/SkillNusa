import React from 'react';
import { Field, ErrorMessage } from 'formik';

const BecomeFreelancerStep4 = ({ formikProps }) => {
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
          <li>Setelah mendaftar, Anda langsung dapat bekerja sebagai freelancer</li>
          <li>Anda dapat beralih antara peran Client dan Freelancer kapan saja</li>
          <li>Lengkapi profil Anda untuk meningkatkan peluang mendapatkan project</li>
        </ul>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <h4 className="text-sm font-medium text-gray-800 mb-2">Ringkasan Profil Freelancer</h4>
        
        <div className="space-y-3 text-sm text-gray-600">
          {/* Pendidikan */}
          <div>
            <div className="font-medium mb-1">Pendidikan:</div>
            {values.education && values.education.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {values.education.map((edu, index) => (
                  <li key={index}>
                    <span className="font-medium">{edu.university}</span> - {edu.degree} in {edu.fieldOfStudy}, {edu.graduationYear}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-400">Tidak ada</span>
            )}
          </div>
          
          {/* Sertifikasi */}
          <div>
            <div className="font-medium mb-1">Sertifikasi:</div>
            {values.certifications && values.certifications.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {values.certifications.map((cert, index) => (
                  <li key={index}>
                    <span className="font-medium">{cert.name}</span> - {cert.issuedBy}, {cert.year}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-400">Tidak ada</span>
            )}
          </div>
          
          {/* Ketersediaan */}
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Ketersediaan:</div>
            <div>{values.availability}</div>
          </div>
          
          {/* Jam Kerja */}
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Jam Kerja:</div>
            <div>{values.workingHours || <span className="text-gray-400">Tidak ada</span>}</div>
          </div>
          
          {/* Portfolio */}
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Portfolio:</div>
            <div>
              {values.portfolioLink ? (
                <a href={values.portfolioLink} target="_blank" rel="noopener noreferrer" className="text-[#010042] hover:underline truncate block">
                  {values.portfolioLink}
                </a>
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
};

export default BecomeFreelancerStep4;
