import { useEffect, useState } from 'react';
import { Field, ErrorMessage, FieldArray } from 'formik';
import { USER_ROLES } from '../../utils/constants';
import { 
  getSkillSuggestions, 
  getIndustryOptions, 
  getBudgetRangeOptions,
  getPrimaryNeedsOptions
} from '../../services/profileService';

export default function RegisterStep3({ formikProps }) {
  const { values, errors, touched, setFieldValue } = formikProps;
  const [skillOptions, setSkillOptions] = useState([]);
  const [industryOptions, setIndustryOptions] = useState([]);
  const [budgetRangeOptions, setBudgetRangeOptions] = useState([]);
  const [primaryNeedsOptions, setPrimaryNeedsOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [skillSearchTerm, setSkillSearchTerm] = useState('');
  const [filteredSkills, setFilteredSkills] = useState([]);
  
  // Fetch options based on role
  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        if (values.role === USER_ROLES.FREELANCER) {
          const skills = await getSkillSuggestions();
          setSkillOptions(skills);
          setFilteredSkills(skills);
        } else if (values.role === USER_ROLES.CLIENT) {
          const [industries, budgetRanges, primaryNeeds] = await Promise.all([
            getIndustryOptions(),
            getBudgetRangeOptions(),
            getPrimaryNeedsOptions()
          ]);
          setIndustryOptions(industries);
          setBudgetRangeOptions(budgetRanges);
          setPrimaryNeedsOptions(primaryNeeds);
        }
      } catch (error) {
        console.error('Error fetching options:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOptions();
  }, [values.role]);
  
  // Filter skills based on search term
  useEffect(() => {
    if (skillSearchTerm.trim() === '') {
      setFilteredSkills(skillOptions);
    } else {
      const filtered = skillOptions.filter(skill => 
        skill.name.toLowerCase().includes(skillSearchTerm.toLowerCase())
      );
      setFilteredSkills(filtered);
    }
  }, [skillSearchTerm, skillOptions]);
  
  // Handle skill selection
  const handleSkillSelect = (skill) => {
    // Check if skill is already selected
    if (values.skills.includes(skill.id)) {
      // Remove skill
      setFieldValue('skills', values.skills.filter(id => id !== skill.id));
    } else {
      // Add skill
      setFieldValue('skills', [...values.skills, skill.id]);
    }
  };
  
  // Handle portfolio link change
  const handlePortfolioLinkChange = (index, value) => {
    const newLinks = [...values.portfolioLinks];
    newLinks[index] = value;
    setFieldValue('portfolioLinks', newLinks);
  };
  
  // Get skill name by ID
  const getSkillName = (skillId) => {
    const skill = skillOptions.find(s => s.id === skillId);
    return skill ? skill.name : skillId;
  };
  
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-medium text-gray-900">
        {values.role === USER_ROLES.FREELANCER ? 'Informasi Freelancer' : 'Informasi Client'}
      </h3>
      
      {/* Freelancer Specific Fields */}
      {values.role === USER_ROLES.FREELANCER && (
        <>
          {/* Skills Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Keahlian <span className="text-red-500">*</span>
              <span className="ml-1 text-xs text-gray-500">(pilih minimal 3)</span>
            </label>
            <div className="mt-1">
              <div className="mb-2">
                <input
                  type="text"
                  placeholder="Cari keahlian..."
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm"
                  value={skillSearchTerm}
                  onChange={(e) => setSkillSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Selected Skills */}
              {values.skills.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {values.skills.map(skillId => (
                    <div 
                      key={skillId}
                      className="bg-[#010042] text-white px-3 py-1 rounded-full text-sm flex items-center"
                    >
                      {getSkillName(skillId)}
                      <button
                        type="button"
                        className="ml-2 text-white hover:text-red-200"
                        onClick={() => {
                          setFieldValue('skills', values.skills.filter(id => id !== skillId));
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Skill Options */}
              {loading ? (
                <div className="text-center py-3">
                  <svg className="animate-spin h-5 w-5 text-[#010042] mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                  {filteredSkills.length === 0 ? (
                    <div className="text-center p-3 text-gray-500">Tidak ada keahlian yang cocok</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1 p-2">
                      {filteredSkills.map(skill => (
                        <div 
                          key={skill.id} 
                          className={`cursor-pointer p-2 text-sm rounded ${
                            values.skills.includes(skill.id) 
                              ? 'bg-[#010042]/10 text-[#010042] font-medium' 
                              : 'hover:bg-gray-100'
                          }`}
                          onClick={() => handleSkillSelect(skill)}
                        >
                          {skill.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <ErrorMessage name="skills" component="div" className="mt-1 text-sm text-red-600" />
            </div>
          </div>
          
          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Level Pengalaman <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['Beginner', 'Intermediate', 'Expert'].map((level) => (
                <div key={level}>
                  <label className={`relative flex flex-col items-center justify-center px-4 py-3 rounded-lg border ${
                    values.experienceLevel === level ? 'bg-[#010042]/5 border-[#010042]' : 'border-gray-300'
                  } cursor-pointer hover:border-[#010042] transition-all`}>
                    <Field
                      type="radio"
                      name="experienceLevel"
                      value={level}
                      className="sr-only"
                    />
                    <span className={`text-sm font-medium ${
                      values.experienceLevel === level ? 'text-[#010042]' : 'text-gray-700'
                    }`}>
                      {level === 'Beginner' && 'Pemula'}
                      {level === 'Intermediate' && 'Menengah'}
                      {level === 'Expert' && 'Ahli'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      {level === 'Beginner' && '< 1 tahun'}
                      {level === 'Intermediate' && '1-3 tahun'}
                      {level === 'Expert' && '3+ tahun'}
                    </span>
                    {values.experienceLevel === level && (
                      <svg className="h-5 w-5 text-[#010042] absolute top-2 right-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                </div>
              ))}
            </div>
            <ErrorMessage name="experienceLevel" component="div" className="mt-1 text-sm text-red-600" />
          </div>
          
          {/* Portfolio Links */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Link Portfolio <span className="text-xs text-gray-500">(opsional, maksimal 3)</span>
            </label>
            <div className="mt-1 space-y-2">
              <FieldArray name="portfolioLinks">
                {() => (
                  <>
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="flex items-center">
                        <input
                          type="url"
                          placeholder={`Link Portfolio #${index + 1}`}
                          value={values.portfolioLinks[index] || ''}
                          onChange={(e) => handlePortfolioLinkChange(index, e.target.value)}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm"
                        />
                        {values.portfolioLinks[index] && (
                          <button
                            type="button"
                            className="ml-2 text-gray-400 hover:text-red-500"
                            onClick={() => handlePortfolioLinkChange(index, '')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </FieldArray>
              <ErrorMessage name="portfolioLinks" component="div" className="mt-1 text-sm text-red-600" />
            </div>
          </div>
          
          {/* Hourly Rate */}
          <div>
            <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
              Tarif per Jam <span className="text-xs text-gray-500">(opsional)</span>
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">Rp</span>
              </div>
              <Field
                id="hourlyRate"
                name="hourlyRate"
                type="number"
                min="0"
                placeholder="0"
                className="appearance-none block w-full pl-12 pr-12 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">/jam</span>
              </div>
            </div>
          </div>
          
          {/* Availability */}
          <div>
            <label htmlFor="availability" className="block text-sm font-medium text-gray-700">
              Ketersediaan <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <Field
                as="select"
                id="availability"
                name="availability"
                className={`appearance-none block w-full px-3 py-2 border ${
                  errors.availability && touched.availability ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm`}
              >
                <option value="">Pilih ketersediaan</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Project-based">Project-based</option>
              </Field>
              <ErrorMessage name="availability" component="div" className="mt-1 text-sm text-red-600" />
            </div>
          </div>
        </>
      )}
      
      {/* Client Specific Fields */}
      {values.role === USER_ROLES.CLIENT && (
        <>
          {/* Company/Organization Name */}
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
              Nama Perusahaan/Organisasi <span className="text-xs text-gray-500">(opsional)</span>
            </label>
            <div className="mt-1">
              <Field
                id="companyName"
                name="companyName"
                type="text"
                placeholder="Masukkan nama perusahaan/organisasi Anda"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm"
              />
            </div>
          </div>
          
          {/* Industry */}
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
              Industri <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <Field
                as="select"
                id="industry"
                name="industry"
                className={`appearance-none block w-full px-3 py-2 border ${
                  errors.industry && touched.industry ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm`}
              >
                <option value="">Pilih industri</option>
                {loading ? (
                  <option value="" disabled>Loading...</option>
                ) : (
                  industryOptions.map(industry => (
                    <option key={industry.id} value={industry.id}>{industry.name}</option>
                  ))
                )}
              </Field>
              <ErrorMessage name="industry" component="div" className="mt-1 text-sm text-red-600" />
            </div>
          </div>
          
          {/* Company Size */}
          <div>
            <label htmlFor="companySize" className="block text-sm font-medium text-gray-700">
              Ukuran Perusahaan <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <Field
                as="select"
                id="companySize"
                name="companySize"
                className={`appearance-none block w-full px-3 py-2 border ${
                  errors.companySize && touched.companySize ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm`}
              >
                <option value="">Pilih ukuran</option>
                <option value="Individual">Individual</option>
                <option value="1-10">1-10 karyawan</option>
                <option value="11-50">11-50 karyawan</option>
                <option value="51-200">51-200 karyawan</option>
                <option value="200+">200+ karyawan</option>
              </Field>
              <ErrorMessage name="companySize" component="div" className="mt-1 text-sm text-red-600" />
            </div>
          </div>
          
          {/* Budget Range */}
          <div>
            <label htmlFor="budgetRange" className="block text-sm font-medium text-gray-700">
              Rentang Budget <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <Field
                as="select"
                id="budgetRange"
                name="budgetRange"
                className={`appearance-none block w-full px-3 py-2 border ${
                  errors.budgetRange && touched.budgetRange ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm`}
              >
                <option value="">Pilih rentang budget</option>
                {loading ? (
                  <option value="" disabled>Loading...</option>
                ) : (
                  budgetRangeOptions.map(budget => (
                    <option key={budget.id} value={budget.id}>{budget.name}</option>
                  ))
                )}
              </Field>
              <ErrorMessage name="budgetRange" component="div" className="mt-1 text-sm text-red-600" />
            </div>
          </div>
          
          {/* Primary Needs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kebutuhan Utama <span className="text-red-500">*</span>
            </label>
            <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3">
              {loading ? (
                <div className="text-center py-3">
                  <svg className="animate-spin h-5 w-5 text-[#010042] mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {primaryNeedsOptions.map(need => (
                    <label key={need.id} className="flex items-start p-2 cursor-pointer">
                      <Field
                        type="checkbox"
                        name="primaryNeeds"
                        value={need.id}
                        className="h-4 w-4 text-[#010042] focus:ring-[#010042] border-gray-300 rounded mt-0.5"
                      />
                      <span className="ml-2 text-sm text-gray-700">{need.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <ErrorMessage name="primaryNeeds" component="div" className="mt-1 text-sm text-red-600" />
          </div>
        </>
      )}
      
      <div className="pt-2">
        <p className="text-xs text-gray-500">
          <span className="text-red-500">*</span> Wajib diisi
        </p>
      </div>
    </div>
  );
} 