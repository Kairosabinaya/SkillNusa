import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  UserCircleIcon,
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

export default function FreelancerSettings() {
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [freelancerProfile, setFreelancerProfile] = useState(null);
  
  const [profileForm, setProfileForm] = useState({
    availability: '',
    bio: '',
    certifications: [],
    education: [],
    portfolioLink: '',
    skills: [],
    workingHours: ''
  });

  const skillsOptions = [
    'Desain Grafis', 'Web Development', 'Mobile Development', 'UI/UX Design',
    'Digital Marketing', 'Content Writing', 'Video Editing', 'Photography',
    'Data Analysis', 'SEO', 'Social Media Management', 'Translation',
    'Logo Design', 'WordPress', 'React', 'Node.js', 'Python', 'PHP',
    'website development ui', 'website', 'write'
  ];

  const experienceLevels = ['Pemula', 'Menengah', 'Ahli'];
  const availabilityOptions = ['Full-time', 'Part-time', 'Freelance', 'Contract'];
  const degreeOptions = ['Diploma', 'Bachelor', 'Master', 'PhD', 'Lainnya'];

  useEffect(() => {
    fetchFreelancerProfile();
  }, [currentUser]);

  const fetchFreelancerProfile = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const profileDoc = await getDoc(doc(db, 'freelancerProfiles', currentUser.uid));
      const freelancerData = profileDoc.exists() ? profileDoc.data() : {};
      
      setFreelancerProfile(freelancerData);
      setProfileForm({
        availability: freelancerData.availability || '',
        bio: freelancerData.bio || '',
        certifications: freelancerData.certifications || [],
        education: freelancerData.education || [],
        portfolioLink: freelancerData.portfolioLink || '',
        skills: freelancerData.skills || [],
        workingHours: freelancerData.workingHours || ''
      });

    } catch (error) {
      console.error('Error fetching freelancer profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'freelancerProfiles', currentUser.uid), {
        availability: profileForm.availability,
        bio: profileForm.bio,
        certifications: profileForm.certifications,
        education: profileForm.education,
        portfolioLink: profileForm.portfolioLink,
        skills: profileForm.skills,
        workingHours: profileForm.workingHours,
        updatedAt: serverTimestamp()
      });

      alert('Profil freelancer berhasil diperbarui');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  // Skills management
  const addSkill = () => {
    setProfileForm(prev => ({
      ...prev,
      skills: [...prev.skills, { skill: '', experienceLevel: 'Pemula' }]
    }));
  };

  const updateSkill = (index, field, value) => {
    const updated = [...profileForm.skills];
    updated[index][field] = value;
    setProfileForm(prev => ({ ...prev, skills: updated }));
  };

  const removeSkill = (index) => {
    setProfileForm(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  // Education management
  const addEducation = () => {
    setProfileForm(prev => ({
      ...prev,
      education: [...prev.education, {
        university: '',
        degree: '',
        fieldOfStudy: '',
        graduationYear: '',
        country: 'Indonesia'
      }]
    }));
  };

  const updateEducation = (index, field, value) => {
    const updated = [...profileForm.education];
    updated[index][field] = value;
    setProfileForm(prev => ({ ...prev, education: updated }));
  };

  const removeEducation = (index) => {
    setProfileForm(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  // Certifications management
  const addCertification = () => {
    setProfileForm(prev => ({
      ...prev,
      certifications: [...prev.certifications, {
        name: '',
        issuedBy: '',
        year: ''
      }]
    }));
  };

  const updateCertification = (index, field, value) => {
    const updated = [...profileForm.certifications];
    updated[index][field] = value;
    setProfileForm(prev => ({ ...prev, certifications: updated }));
  };

  const removeCertification = (index) => {
    setProfileForm(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#010042]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center mb-4">
          <Link 
            to="/dashboard/freelancer"
            className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Edit Profil Freelancer
            </h1>
            <p className="text-gray-600">
              Kelola informasi profil freelancer Anda
            </p>
          </div>
        </div>
      </motion.div>

      {/* Profile Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-8"
      >
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <UserCircleIcon className="h-6 w-6 text-[#010042] mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Informasi Dasar
            </h2>
          </div>
          
          <div className="space-y-6">
            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio/Deskripsi Singkat
              </label>
              <textarea
                value={profileForm.bio}
                onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
                placeholder="Ceritakan tentang keahlian dan pengalaman Anda..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
              />
            </div>

            {/* Availability and Working Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ketersediaan
                </label>
                <select
                  value={profileForm.availability}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, availability: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                >
                  <option value="">Pilih ketersediaan</option>
                  {availabilityOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jam Kerja
                </label>
                <input
                  type="text"
                  value={profileForm.workingHours}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, workingHours: e.target.value }))}
                  placeholder="08:00 - 17:00 WIB"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                />
              </div>
            </div>

            {/* Portfolio Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link Portfolio
              </label>
              <input
                type="url"
                value={profileForm.portfolioLink}
                onChange={(e) => setProfileForm(prev => ({ ...prev, portfolioLink: e.target.value }))}
                placeholder="https://portfolio.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
              />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Keahlian</h2>
            <button
              onClick={addSkill}
              className="flex items-center gap-2 text-sm text-[#010042] hover:text-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
              Tambah Keahlian
            </button>
          </div>
          
          <div className="space-y-4">
            {profileForm.skills.map((skillItem, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Keahlian
                  </label>
                  <input
                    type="text"
                    value={skillItem.skill || ''}
                    onChange={(e) => updateSkill(index, 'skill', e.target.value)}
                    placeholder="Masukkan keahlian"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Level
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={skillItem.experienceLevel || 'Pemula'}
                      onChange={(e) => updateSkill(index, 'experienceLevel', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                    >
                      {experienceLevels.map(level => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeSkill(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Pendidikan</h2>
            <button
              onClick={addEducation}
              className="flex items-center gap-2 text-sm text-[#010042] hover:text-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
              Tambah Pendidikan
            </button>
          </div>
          
          <div className="space-y-6">
            {profileForm.education.map((edu, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Universitas/Institusi
                    </label>
                    <input
                      type="text"
                      value={edu.university || ''}
                      onChange={(e) => updateEducation(index, 'university', e.target.value)}
                      placeholder="Nama universitas"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gelar
                    </label>
                    <select
                      value={edu.degree || ''}
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                    >
                      <option value="">Pilih gelar</option>
                      {degreeOptions.map(degree => (
                        <option key={degree} value={degree}>
                          {degree}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bidang Studi
                    </label>
                    <input
                      type="text"
                      value={edu.fieldOfStudy || ''}
                      onChange={(e) => updateEducation(index, 'fieldOfStudy', e.target.value)}
                      placeholder="Teknik Informatika"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tahun Lulus
                    </label>
                    <input
                      type="text"
                      value={edu.graduationYear || ''}
                      onChange={(e) => updateEducation(index, 'graduationYear', e.target.value)}
                      placeholder="2024"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Negara
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={edu.country || 'Indonesia'}
                        onChange={(e) => updateEducation(index, 'country', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                      />
                      <button
                        onClick={() => removeEducation(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Sertifikasi</h2>
            <button
              onClick={addCertification}
              className="flex items-center gap-2 text-sm text-[#010042] hover:text-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
              Tambah Sertifikasi
            </button>
          </div>
          
          <div className="space-y-4">
            {profileForm.certifications.map((cert, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Sertifikasi
                  </label>
                  <input
                    type="text"
                    value={cert.name || ''}
                    onChange={(e) => updateCertification(index, 'name', e.target.value)}
                    placeholder="Nama sertifikasi"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Penerbit
                  </label>
                  <input
                    type="text"
                    value={cert.issuedBy || ''}
                    onChange={(e) => updateCertification(index, 'issuedBy', e.target.value)}
                    placeholder="Penerbit"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tahun
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cert.year || ''}
                      onChange={(e) => updateCertification(index, 'year', e.target.value)}
                      placeholder="2023"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                    />
                    <button
                      onClick={() => removeCertification(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="bg-white rounded-lg shadow p-6">
          <button
            onClick={handleProfileSave}
            disabled={saving}
            className="bg-[#010042] text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </motion.div>
    </div>
  );
} 