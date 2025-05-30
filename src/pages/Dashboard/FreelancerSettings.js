import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  addDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { updatePassword, updateEmail } from 'firebase/auth';
import {
  UserCircleIcon,
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  GlobeAltIcon,
  PhotoIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

export default function FreelancerSettings() {
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [freelancerProfile, setFreelancerProfile] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    profilePhoto: '',
    skills: [],
    experienceLevel: '',
    hourlyRate: '',
    languages: [],
    certifications: [],
    portfolioLinks: []
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    newEmail: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    orderUpdates: true,
    messageNotifications: true,
    marketingEmails: false,
    weeklyReport: true
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const tabs = [
    { id: 'profile', name: 'Profil', icon: UserCircleIcon },
    { id: 'security', name: 'Keamanan', icon: ShieldCheckIcon },
    { id: 'notifications', name: 'Notifikasi', icon: BellIcon },
    { id: 'preferences', name: 'Preferensi', icon: CogIcon }
  ];

  const skillsOptions = [
    'Desain Grafis', 'Web Development', 'Mobile Development', 'UI/UX Design',
    'Digital Marketing', 'Content Writing', 'Video Editing', 'Photography',
    'Data Analysis', 'SEO', 'Social Media Management', 'Translation',
    'Logo Design', 'WordPress', 'React', 'Node.js', 'Python', 'PHP'
  ];

  const experienceLevels = [
    { value: 'entry', label: 'Pemula (0-1 tahun)' },
    { value: 'intermediate', label: 'Menengah (1-3 tahun)' },
    { value: 'expert', label: 'Ahli (3+ tahun)' }
  ];

  const languages = [
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'en', name: 'English' },
    { code: 'ms', name: 'Bahasa Malaysia' },
    { code: 'zh', name: '中文 (Chinese)' },
    { code: 'ar', name: 'العربية (Arabic)' },
    { code: 'ja', name: '日本語 (Japanese)' },
    { code: 'ko', name: '한국어 (Korean)' }
  ];

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
        displayName: userProfile?.displayName || '',
        bio: freelancerData.bio || '',
        location: freelancerData.location || '',
        website: freelancerData.website || '',
        profilePhoto: userProfile?.profilePhoto || '',
        skills: freelancerData.skills || [],
        experienceLevel: freelancerData.experienceLevel || '',
        hourlyRate: freelancerData.hourlyRate || '',
        languages: freelancerData.languages || ['id'],
        certifications: freelancerData.certifications || [],
        portfolioLinks: freelancerData.portfolioLinks || []
      });

      // Load notification settings
      setNotificationSettings(prev => ({
        ...prev,
        ...freelancerData.notificationSettings
      }));

    } catch (error) {
      console.error('Error fetching freelancer profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      // Update user profile
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: profileForm.displayName,
        profilePhoto: profileForm.profilePhoto,
        updatedAt: serverTimestamp()
      });

      // Update freelancer profile
      await updateDoc(doc(db, 'freelancerProfiles', currentUser.uid), {
        bio: profileForm.bio,
        location: profileForm.location,
        website: profileForm.website,
        skills: profileForm.skills,
        experienceLevel: profileForm.experienceLevel,
        hourlyRate: parseFloat(profileForm.hourlyRate) || 0,
        languages: profileForm.languages,
        certifications: profileForm.certifications,
        portfolioLinks: profileForm.portfolioLinks,
        updatedAt: serverTimestamp()
      });

      alert('Profil berhasil diperbarui');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  const handleSecuritySave = async () => {
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      alert('Password baru tidak cocok');
      return;
    }

    setSaving(true);
    try {
      if (securityForm.newPassword) {
        await updatePassword(currentUser, securityForm.newPassword);
      }

      if (securityForm.newEmail && securityForm.newEmail !== currentUser.email) {
        await updateEmail(currentUser, securityForm.newEmail);
      }

      setSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        newEmail: ''
      });

      alert('Pengaturan keamanan berhasil diperbarui');
    } catch (error) {
      console.error('Error updating security:', error);
      alert('Gagal memperbarui pengaturan keamanan');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'freelancerProfiles', currentUser.uid), {
        notificationSettings: notificationSettings,
        updatedAt: serverTimestamp()
      });

      alert('Pengaturan notifikasi berhasil diperbarui');
    } catch (error) {
      console.error('Error updating notifications:', error);
      alert('Gagal memperbarui pengaturan notifikasi');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = (skill) => {
    if (!profileForm.skills.includes(skill)) {
      setProfileForm(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const removeSkill = (skill) => {
    setProfileForm(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const addCertification = () => {
    setProfileForm(prev => ({
      ...prev,
      certifications: [...prev.certifications, { name: '', issuer: '', year: '' }]
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

  const addPortfolioLink = () => {
    setProfileForm(prev => ({
      ...prev,
      portfolioLinks: [...prev.portfolioLinks, '']
    }));
  };

  const updatePortfolioLink = (index, value) => {
    const updated = [...profileForm.portfolioLinks];
    updated[index] = value;
    setProfileForm(prev => ({ ...prev, portfolioLinks: updated }));
  };

  const removePortfolioLink = (index) => {
    setProfileForm(prev => ({
      ...prev,
      portfolioLinks: prev.portfolioLinks.filter((_, i) => i !== index)
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pengaturan Akun
        </h1>
        <p className="text-gray-600">
          Kelola profil, keamanan, dan preferensi akun Anda
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#010042] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-3" />
                {tab.name}
              </button>
            ))}
          </nav>
        </motion.div>

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Profil Freelancer
              </h2>
              
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={profileForm.displayName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lokasi
                    </label>
                    <input
                      type="text"
                      value={profileForm.location}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Jakarta, Indonesia"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                    />
                  </div>
                </div>

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website/Portfolio
                    </label>
                    <input
                      type="url"
                      value={profileForm.website}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tarif per Jam (IDR)
                    </label>
                    <input
                      type="number"
                      value={profileForm.hourlyRate}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, hourlyRate: e.target.value }))}
                      placeholder="100000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level Pengalaman
                  </label>
                  <select
                    value={profileForm.experienceLevel}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, experienceLevel: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                  >
                    <option value="">Pilih level pengalaman</option>
                    {experienceLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keahlian
                  </label>
                  <div className="mb-4">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addSkill(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                    >
                      <option value="">Tambah keahlian</option>
                      {skillsOptions.filter(skill => !profileForm.skills.includes(skill)).map(skill => (
                        <option key={skill} value={skill}>{skill}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileForm.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#010042] text-white"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="ml-2 text-white hover:text-gray-300"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bahasa yang Dikuasai
                  </label>
                  <div className="space-y-2">
                    {languages.map(lang => (
                      <label key={lang.code} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={profileForm.languages.includes(lang.code)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setProfileForm(prev => ({
                                ...prev,
                                languages: [...prev.languages, lang.code]
                              }));
                            } else {
                              setProfileForm(prev => ({
                                ...prev,
                                languages: prev.languages.filter(l => l !== lang.code)
                              }));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{lang.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Sertifikasi
                    </label>
                    <button
                      onClick={addCertification}
                      className="flex items-center gap-2 text-sm text-[#010042] hover:text-blue-700"
                    >
                      <PencilIcon className="h-4 w-4" />
                      Tambah Sertifikasi
                    </button>
                  </div>
                  <div className="space-y-4">
                    {profileForm.certifications.map((cert, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                        <input
                          type="text"
                          placeholder="Nama sertifikasi"
                          value={cert.name}
                          onChange={(e) => updateCertification(index, 'name', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                        />
                        <input
                          type="text"
                          placeholder="Penerbit"
                          value={cert.issuer}
                          onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Tahun"
                            value={cert.year}
                            onChange={(e) => updateCertification(index, 'year', e.target.value)}
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
                    ))}
                  </div>
                </div>

                {/* Portfolio Links */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Link Portfolio
                    </label>
                    <button
                      onClick={addPortfolioLink}
                      className="flex items-center gap-2 text-sm text-[#010042] hover:text-blue-700"
                    >
                      <PencilIcon className="h-4 w-4" />
                      Tambah Link
                    </button>
                  </div>
                  <div className="space-y-2">
                    {profileForm.portfolioLinks.map((link, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://example.com"
                          value={link}
                          onChange={(e) => updatePortfolioLink(index, e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                        />
                        <button
                          onClick={() => removePortfolioLink(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={handleProfileSave}
                    disabled={saving}
                    className="bg-[#010042] text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Pengaturan Keamanan
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Saat Ini
                  </label>
                  <input
                    type="email"
                    value={currentUser?.email || ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Baru (Opsional)
                  </label>
                  <input
                    type="email"
                    value={securityForm.newEmail}
                    onChange={(e) => setSecurityForm(prev => ({ ...prev, newEmail: e.target.value }))}
                    placeholder="email-baru@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                  />
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Ubah Password
                    </h3>
                    <button
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                      className="text-[#010042] hover:text-blue-700"
                    >
                      {showPasswordForm ? 'Batal' : 'Ubah Password'}
                    </button>
                  </div>

                  {showPasswordForm && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password Saat Ini
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? 'text' : 'password'}
                            value={securityForm.currentPassword}
                            onChange={(e) => setSecurityForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords.current ? (
                              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password Baru
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            value={securityForm.newPassword}
                            onChange={(e) => setSecurityForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords.new ? (
                              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Konfirmasi Password Baru
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={securityForm.confirmPassword}
                            onChange={(e) => setSecurityForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords.confirm ? (
                              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSecuritySave}
                    disabled={saving}
                    className="bg-[#010042] text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Pengaturan Notifikasi
              </h2>
              
              <div className="space-y-6">
                {Object.entries({
                  emailNotifications: 'Notifikasi Email',
                  orderUpdates: 'Update Pesanan',
                  messageNotifications: 'Notifikasi Pesan',
                  marketingEmails: 'Email Marketing',
                  weeklyReport: 'Laporan Mingguan'
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      <p className="text-sm text-gray-500">
                        {key === 'emailNotifications' && 'Terima notifikasi melalui email'}
                        {key === 'orderUpdates' && 'Notifikasi untuk update status pesanan'}
                        {key === 'messageNotifications' && 'Notifikasi untuk pesan baru'}
                        {key === 'marketingEmails' && 'Email promosi dan penawaran khusus'}
                        {key === 'weeklyReport' && 'Laporan mingguan performa Anda'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings[key]}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          [key]: e.target.checked
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#010042]"></div>
                    </label>
                  </div>
                ))}

                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={handleNotificationSave}
                    disabled={saving}
                    className="bg-[#010042] text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Preferensi
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bahasa Interface
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]">
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zona Waktu
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]">
                    <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                    <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                    <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Format Mata Uang
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]">
                    <option value="IDR">IDR (Rupiah)</option>
                    <option value="USD">USD (Dollar)</option>
                  </select>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={() => alert('Pengaturan preferensi berhasil disimpan')}
                    className="bg-[#010042] text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 