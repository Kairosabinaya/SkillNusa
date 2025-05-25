import React, { useState, useRef } from 'react';
import { Field, ErrorMessage } from 'formik';

const BecomeFreelancerStep1 = ({ formikProps }) => {
  const { values, errors, touched, setFieldValue } = formikProps;
  const [newSkill, setNewSkill] = useState('');
  const [skillExperienceLevel, setSkillExperienceLevel] = useState('Menengah');
  const [skillError, setSkillError] = useState('');
  const skillInputRef = useRef(null);
  
  // Memastikan bio diformat dengan benar untuk tampilan
  React.useEffect(() => {
    if (values.bio) {
      // Jika bio terlalu panjang tanpa spasi, tambahkan break opportunity
      if (values.bio.length > 50 && !values.bio.includes(' ')) {
        const formatted = values.bio.replace(/(.{40})/g, '$1 ');
        setFieldValue('bio', formatted);
      }
    }
  }, []);
  
  // Handle adding a new skill with experience level
  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    
    // Check if skill already exists
    const skillExists = values.skills.some(
      item => item.skill.toLowerCase() === newSkill.toLowerCase()
    );
    
    if (!skillExists) {
      const updatedSkills = [
        ...values.skills,
        {
          skill: newSkill.trim().toLowerCase(),
          experienceLevel: skillExperienceLevel
        }
      ];
      
      setFieldValue('skills', updatedSkills);
      setNewSkill('');
      setSkillError('');
    } else {
      setSkillError('Keahlian ini sudah ditambahkan');
      setNewSkill(''); // Clear the input field even when skill already exists
      // Focus back on the input field after error
      setTimeout(() => {
        if (skillInputRef.current) {
          skillInputRef.current.focus();
        }
      }, 0);
    }
  };
  
  // Handle removing a skill
  const handleRemoveSkill = (index) => {
    const updatedSkills = values.skills.filter((_, i) => i !== index);
    setFieldValue('skills', updatedSkills);
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Keahlian & Pengalaman</h2>
      
      {/* Skills Input with Experience Level */}
      <div>
        <div className="block text-sm font-medium text-gray-700 mb-2">
          Keahlian & Level Pengalaman <span className="text-red-500">*</span>
        </div>
        
        <div className="flex flex-col gap-4">
          {/* Existing Skills List */}
          {values.skills.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Keahlian yang ditambahkan:</h3>
              <div className="space-y-2">
                {values.skills.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200">
                    <div className="flex-1">
                      <span className="font-medium">{skill.skill}</span>
                      <span className="ml-2 text-sm text-gray-500">({skill.experienceLevel})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Add New Skill */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
            <div className="md:col-span-3">
              <label htmlFor="newSkill" className="block text-sm font-medium text-gray-700 mb-1">
                Keahlian
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="newSkill"
                  value={newSkill}
                  onChange={(e) => {
                    setNewSkill(e.target.value.toLowerCase());
                    if (skillError) setSkillError('');
                  }}
                  placeholder="mulai ketik keahlian..."
                  className={`appearance-none block w-full px-3 py-2 border ${skillError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm`}
                  style={{textTransform: 'lowercase'}}
                  ref={skillInputRef}
                />
                {skillError && (
                  <p className="absolute text-xs text-red-600 mt-0.5">{skillError}</p>
                )}
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="skillExperienceLevel" className="block text-sm font-medium text-gray-700 mb-1">
                Level Pengalaman
              </label>
              <select
                id="skillExperienceLevel"
                value={skillExperienceLevel}
                onChange={(e) => {
                  setSkillExperienceLevel(e.target.value);
                  if (skillError) setSkillError('');
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm"
              >
                <option value="Pemula">Pemula</option>
                <option value="Menengah">Menengah</option>
                <option value="Ahli">Ahli</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={handleAddSkill}
                disabled={!newSkill.trim()}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tambah Keahlian
              </button>
            </div>
          </div>
        </div>
        
        {errors.skills && touched.skills && (
          <p className="mt-2 text-sm text-red-600">{errors.skills}</p>
        )}
      </div>
      
      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Bio Profesional <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 relative">
          <Field name="bio">
            {({ field, form }) => (
              <div>
                <textarea
                  {...field}
                  id="bio"
                  rows={3}
                  maxLength={500}
                  placeholder="Tuliskan deskripsi singkat tentang diri Anda, pengalaman, dan keahlian utama yang Anda tawarkan sebagai freelancer..."
                  className={`appearance-none block w-full px-3 py-2 border ${form.errors.bio && form.touched.bio ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#010042] focus:border-[#010042] sm:text-sm`}
                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  onChange={(e) => {
                    field.onChange(e);
                  }}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500 break-words">
                    <span className="font-semibold">Format:</span> Singkat dan jelas tentang pengalaman dan keahlian Anda
                  </p>
                  <p className={`text-xs ${field.value.length < 50 ? 'text-red-500' : field.value.length > 400 ? 'text-orange-500' : 'text-green-600'} font-medium`}>
                    {field.value.length}/500 karakter {field.value.length < 50 ? `(min. 50)` : ''}
                  </p>
                </div>
              </div>
            )}
          </Field>
        </div>
        <div className="mt-2 bg-blue-50 p-2 rounded-md border border-blue-100">
          <p className="text-xs text-blue-800">Tips: Jelaskan pengalaman profesional, keahlian utama, dan area spesialisasi Anda secara singkat. Bio yang baik akan meningkatkan peluang Anda mendapatkan project.</p>
        </div>
        <ErrorMessage name="bio" component="div" className="mt-1 text-sm text-red-600" />
      </div>
    </div>
  );
};

export default BecomeFreelancerStep1;
