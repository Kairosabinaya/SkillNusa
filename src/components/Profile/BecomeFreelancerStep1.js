import { useState, useEffect } from 'react';
import { Field, ErrorMessage } from 'formik';
import { getSkillSuggestions } from '../../services/profileService';

export default function BecomeFreelancerStep1({ formikProps }) {
  const { values, errors, touched, setFieldValue } = formikProps;
  const [skillOptions, setSkillOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [skillSearchTerm, setSkillSearchTerm] = useState('');
  const [filteredSkills, setFilteredSkills] = useState([]);
  
  // Fetch skill options on component mount
  useEffect(() => {
    const fetchSkills = async () => {
      setLoading(true);
      try {
        const skills = await getSkillSuggestions();
        setSkillOptions(skills);
        setFilteredSkills(skills);
      } catch (error) {
        console.error('Error fetching skills:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSkills();
  }, []);
  
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
  
  // Get skill name by ID
  const getSkillName = (skillId) => {
    const skill = skillOptions.find(s => s.id === skillId);
    return skill ? skill.name : skillId;
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Keahlian & Pengalaman</h2>
      
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
              </label>
            </div>
          ))}
        </div>
        <ErrorMessage name="experienceLevel" component="div" className="mt-1 text-sm text-red-600" />
      </div>
      
      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Bio Freelancer <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <Field
            as="textarea"
            id="bio"
            name="bio"
            rows={4}
            placeholder="Ceritakan tentang diri Anda, pengalaman, dan layanan yang Anda tawarkan (minimal 50 karakter)"
            className={`appearance-none block w-full px-3 py-2 border ${
              errors.bio && touched.bio ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm`}
          />
          <div className="mt-1 text-xs text-gray-500 flex justify-between">
            <span>Minimal 50 karakter, maksimal 500 karakter</span>
            <span>{values.bio.length} / 500</span>
          </div>
          <ErrorMessage name="bio" component="div" className="mt-1 text-sm text-red-600" />
        </div>
      </div>
    </div>
  );
}
