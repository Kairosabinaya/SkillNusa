import { Field, ErrorMessage } from 'formik';

export default function BecomeFreelancerStep2({ formikProps }) {
  const { values, errors, touched, setFieldValue } = formikProps;
  
  // Handle portfolio link change
  const handlePortfolioLinkChange = (index, value) => {
    const newLinks = [...values.portfolioLinks];
    newLinks[index] = value;
    setFieldValue('portfolioLinks', newLinks);
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Portfolio & Tarif</h2>
      
      {/* Portfolio Links */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Link Portfolio <span className="text-xs text-gray-500">(opsional, maksimal 3)</span>
        </label>
        <div className="space-y-2">
          {[0, 1, 2].map((index) => (
            <div key={index}>
              <input
                type="url"
                placeholder={`Link portfolio #${index + 1}`}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm"
                value={values.portfolioLinks[index]}
                onChange={(e) => handlePortfolioLinkChange(index, e.target.value)}
              />
            </div>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">Tambahkan link ke project, website, atau media sosial Anda</p>
      </div>
      
      {/* Hourly Rate */}
      <div>
        <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
          Tarif per Jam (Rp) <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">Rp</span>
          </div>
          <Field
            id="hourlyRate"
            name="hourlyRate"
            type="number"
            placeholder="0"
            className="appearance-none block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">/jam</span>
          </div>
        </div>
        <ErrorMessage name="hourlyRate" component="div" className="mt-1 text-sm text-red-600" />
      </div>
      
      {/* Availability */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ketersediaan <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {['Full-time', 'Part-time', 'Project-based'].map((availability) => (
            <div key={availability}>
              <label className={`relative flex items-center justify-center px-4 py-3 rounded-lg border ${
                values.availability === availability ? 'bg-[#010042]/5 border-[#010042]' : 'border-gray-300'
              } cursor-pointer hover:border-[#010042] transition-all`}>
                <Field
                  type="radio"
                  name="availability"
                  value={availability}
                  className="sr-only"
                />
                <span className={`text-sm font-medium ${
                  values.availability === availability ? 'text-[#010042]' : 'text-gray-700'
                }`}>
                  {availability === 'Full-time' && 'Full-time'}
                  {availability === 'Part-time' && 'Part-time'}
                  {availability === 'Project-based' && 'Project'}
                </span>
              </label>
            </div>
          ))}
        </div>
        <ErrorMessage name="availability" component="div" className="mt-1 text-sm text-red-600" />
      </div>
      
      <div className="mt-4 bg-yellow-50 p-4 rounded-md border border-yellow-200">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">Tips</h4>
        <ul className="list-disc pl-5 text-sm text-yellow-700 space-y-1">
          <li>Tentukan tarif yang sesuai dengan level pengalaman dan keahlian Anda</li>
          <li>Tambahkan portfolio untuk meningkatkan peluang mendapatkan project</li>
          <li>Pastikan Anda dapat memenuhi ketersediaan yang Anda pilih</li>
        </ul>
      </div>
    </div>
  );
}
