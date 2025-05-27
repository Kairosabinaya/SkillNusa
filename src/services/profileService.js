import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import firebaseService from './firebaseService';
import { COLLECTIONS } from '../utils/constants';
import { uploadProfilePhoto as uploadToCloudinary } from './cloudinaryService';

/**
 * Create a complete user profile after registration
 * 
 * @param {string} userId - The user ID
 * @param {Object} profileData - The profile data
 * @returns {Promise<void>}
 */
export const createUserProfile = async (userId, profileData) => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    // Update user document with basic info and multi-role fields
    await firebaseService.updateDocument(COLLECTIONS.USERS, userId, {
      // Basic info
      displayName: profileData.displayName,
      username: profileData.username,
      // Multi-role architecture fields
      roles: profileData.roles || ['client'],
      activeRole: profileData.activeRole || (profileData.roles && profileData.roles[0]) || 'client',
      isFreelancer: profileData.isFreelancer || false,
      // Profile data
      profilePhoto: profileData.profilePhoto,
      phoneNumber: profileData.phoneNumber,
      dateOfBirth: profileData.dateOfBirth,
      gender: profileData.gender,
      location: profileData.location,
      bio: profileData.bio,
      updatedAt: serverTimestamp()
    });
    
    // Create client profile for the new multi-role architecture
    await firebaseService.setDocument(COLLECTIONS.CLIENT_PROFILES, userId, {
      // Common fields
      userId,
      phoneNumber: profileData.phoneNumber,
      dateOfBirth: profileData.dateOfBirth,
      gender: profileData.gender,
      location: profileData.location,
      bio: profileData.bio,
      
      // Preferences
      marketingEmails: profileData.marketingEmails || false,
      
      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Create freelancer profile if user is registering directly as freelancer (admin flow)
    if (profileData.isFreelancer) {
      await firebaseService.setDocument(COLLECTIONS.FREELANCER_PROFILES, userId, {
        userId,
        skills: profileData.skills || [],
        experienceLevel: profileData.experienceLevel || '',
        portfolioLinks: profileData.portfolioLinks || [],
        hourlyRate: profileData.hourlyRate || 0,
        availability: profileData.availability || '',
        bio: profileData.bio || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
  } catch (error) {
    throw error;
  }
};

/**
 * Upload profile photo using Cloudinary and return download URL
 * 
 * @param {string} userId - The user ID
 * @param {File} photoFile - The photo file
 * @returns {Promise<string>} - The download URL
 */
export const uploadProfilePhoto = async (userId, photoFile) => {
  if (!userId || !photoFile) {
    throw new Error('User ID and photo file are required');
  }
  
  try {
    // Upload to Cloudinary with optimizations
    const uploadResult = await uploadToCloudinary(photoFile, userId);
    
    // Update user profile with photo URL (use profileUrl for optimized display)
    const photoUrl = uploadResult.profileUrl || uploadResult.url;
    const userDocRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userDocRef, {
      profilePhoto: photoUrl,
      profilePhotoPublicId: uploadResult.publicId, // Store public ID for future management
      updatedAt: serverTimestamp()
    });
    
    return photoUrl;
  } catch (error) {
    throw error;
  }
};

/**
 * Get Indonesian cities for location dropdown
 * 
 * @returns {Promise<Array>} - List of cities
 */
export const getIndonesianCities = async () => {
  try {
    // A comprehensive list of Indonesian cities sorted alphabetically
    const cities = [
      { id: 'ambon', name: 'Ambon' },
      { id: 'balikpapan', name: 'Balikpapan' },
      { id: 'banda-aceh', name: 'Banda Aceh' },
      { id: 'bandar-lampung', name: 'Bandar Lampung' },
      { id: 'bandung', name: 'Bandung' },
      { id: 'banjarbaru', name: 'Banjarbaru' },
      { id: 'banjarmasin', name: 'Banjarmasin' },
      { id: 'batam', name: 'Batam' },
      { id: 'batu', name: 'Batu' },
      { id: 'baubau', name: 'Baubau' },
      { id: 'bekasi', name: 'Bekasi' },
      { id: 'bengkulu', name: 'Bengkulu' },
      { id: 'bima', name: 'Bima' },
      { id: 'binjai', name: 'Binjai' },
      { id: 'bitung', name: 'Bitung' },
      { id: 'blitar', name: 'Blitar' },
      { id: 'bogor', name: 'Bogor' },
      { id: 'bontang', name: 'Bontang' },
      { id: 'bukittinggi', name: 'Bukittinggi' },
      { id: 'cikarang', name: 'Cikarang' },
      { id: 'cilegon', name: 'Cilegon' },
      { id: 'cimahi', name: 'Cimahi' },
      { id: 'cirebon', name: 'Cirebon' },
      { id: 'denpasar', name: 'Denpasar' },
      { id: 'depok', name: 'Depok' },
      { id: 'dumai', name: 'Dumai' },
      { id: 'ende', name: 'Ende' },
      { id: 'gorontalo', name: 'Gorontalo' },
      { id: 'jakarta', name: 'Jakarta' },
      { id: 'jambi', name: 'Jambi' },
      { id: 'jayapura', name: 'Jayapura' },
      { id: 'jember', name: 'Jember' },
      { id: 'karawang', name: 'Karawang' },
      { id: 'kediri', name: 'Kediri' },
      { id: 'kendari', name: 'Kendari' },
      { id: 'kupang', name: 'Kupang' },
      { id: 'labuan-bajo', name: 'Labuan Bajo' },
      { id: 'langsa', name: 'Langsa' },
      { id: 'lhokseumawe', name: 'Lhokseumawe' },
      { id: 'lubuklinggau', name: 'Lubuklinggau' },
      { id: 'madiun', name: 'Madiun' },
      { id: 'magelang', name: 'Magelang' },
      { id: 'makassar', name: 'Makassar' },
      { id: 'malang', name: 'Malang' },
      { id: 'manado', name: 'Manado' },
      { id: 'manokwari', name: 'Manokwari' },
      { id: 'mataram', name: 'Mataram' },
      { id: 'medan', name: 'Medan' },
      { id: 'merauke', name: 'Merauke' },
      { id: 'metro', name: 'Metro' },
      { id: 'mojokerto', name: 'Mojokerto' },
      { id: 'nabire', name: 'Nabire' },
      { id: 'padang', name: 'Padang' },
      { id: 'padang-panjang', name: 'Padang Panjang' },
      { id: 'padang-sidempuan', name: 'Padang Sidempuan' },
      { id: 'pagar-alam', name: 'Pagar Alam' },
      { id: 'palangkaraya', name: 'Palangkaraya' },
      { id: 'palembang', name: 'Palembang' },
      { id: 'palu', name: 'Palu' },
      { id: 'palopo', name: 'Palopo' },
      { id: 'pangkal-pinang', name: 'Pangkal Pinang' },
      { id: 'pare-pare', name: 'Pare-Pare' },
      { id: 'pasuruan', name: 'Pasuruan' },
      { id: 'payakumbuh', name: 'Payakumbuh' },
      { id: 'pekalongan', name: 'Pekalongan' },
      { id: 'pekanbaru', name: 'Pekanbaru' },
      { id: 'pematangsiantar', name: 'Pematangsiantar' },
      { id: 'pontianak', name: 'Pontianak' },
      { id: 'prabumulih', name: 'Prabumulih' },
      { id: 'probolinggo', name: 'Probolinggo' },
      { id: 'purwokerto', name: 'Purwokerto' },
      { id: 'sabang', name: 'Sabang' },
      { id: 'samarinda', name: 'Samarinda' },
      { id: 'sampit', name: 'Sampit' },
      { id: 'sawahlunto', name: 'Sawahlunto' },
      { id: 'semarang', name: 'Semarang' },
      { id: 'serang', name: 'Serang' },
      { id: 'singkawang', name: 'Singkawang' },
      { id: 'solo', name: 'Solo' },
      { id: 'solok', name: 'Solok' },
      { id: 'sorong', name: 'Sorong' },
      { id: 'subulussalam', name: 'Subulussalam' },
      { id: 'sukabumi', name: 'Sukabumi' },
      { id: 'sumbawa', name: 'Sumbawa' },
      { id: 'surabaya', name: 'Surabaya' },
      { id: 'tangerang', name: 'Tangerang' },
      { id: 'tanjung-balai', name: 'Tanjung Balai' },
      { id: 'tanjung-pandan', name: 'Tanjung Pandan' },
      { id: 'tanjung-pinang', name: 'Tanjung Pinang' },
      { id: 'tarakan', name: 'Tarakan' },
      { id: 'tasikmalaya', name: 'Tasikmalaya' },
      { id: 'tebing-tinggi', name: 'Tebing Tinggi' },
      { id: 'tegal', name: 'Tegal' },
      { id: 'ternate', name: 'Ternate' },
      { id: 'tidore', name: 'Tidore' },
      { id: 'timika', name: 'Timika' },
      { id: 'yogyakarta', name: 'Yogyakarta' }
    ];
    
    return cities;
  } catch (error) {
    return [];
  }
};

/**
 * Get skill suggestions for freelancers
 * 
 * @returns {Promise<Array>} - List of skills
 */
export const getSkillSuggestions = async () => {
  try {
    // This would normally fetch from an API or database, but for simplicity
    // we'll return a static list of common skills
    return [
      { id: 'web-design', name: 'Web Design' },
      { id: 'web-development', name: 'Web Development' },
      { id: 'mobile-app-development', name: 'Mobile App Development' },
      { id: 'ui-ux-design', name: 'UI/UX Design' },
      { id: 'graphic-design', name: 'Graphic Design' },
      { id: 'content-writing', name: 'Content Writing' },
      { id: 'copywriting', name: 'Copywriting' },
      { id: 'translation', name: 'Translation' },
      { id: 'digital-marketing', name: 'Digital Marketing' },
      { id: 'seo', name: 'SEO' },
      { id: 'social-media-management', name: 'Social Media Management' },
      { id: 'video-editing', name: 'Video Editing' },
      { id: 'animation', name: 'Animation' },
      { id: 'photography', name: 'Photography' },
      { id: 'voice-over', name: 'Voice Over' },
      { id: 'data-entry', name: 'Data Entry' },
      { id: 'virtual-assistant', name: 'Virtual Assistant' },
      { id: 'accounting', name: 'Accounting' },
      { id: 'legal-services', name: 'Legal Services' },
      { id: 'customer-service', name: 'Customer Service' },
      { id: 'project-management', name: 'Project Management' },
      { id: 'react', name: 'React' },
      { id: 'angular', name: 'Angular' },
      { id: 'vue', name: 'Vue.js' },
      { id: 'node', name: 'Node.js' },
      { id: 'python', name: 'Python' },
      { id: 'java', name: 'Java' },
      { id: 'php', name: 'PHP' },
      { id: 'wordpress', name: 'WordPress' },
      { id: 'shopify', name: 'Shopify' }
    ];
  } catch (error) {
    return [];
  }
};

/**
 * Get industry options for clients
 * 
 * @returns {Promise<Array>} - List of industries
 */
export const getIndustryOptions = async () => {
  try {
    // This would normally fetch from an API or database, but for simplicity
    // we'll return a static list of common industries
    return [
      { id: 'technology', name: 'Teknologi' },
      { id: 'finance', name: 'Keuangan & Perbankan' },
      { id: 'healthcare', name: 'Kesehatan' },
      { id: 'education', name: 'Pendidikan' },
      { id: 'retail', name: 'Retail & E-commerce' },
      { id: 'manufacturing', name: 'Manufaktur' },
      { id: 'food-beverage', name: 'Makanan & Minuman' },
      { id: 'travel-hospitality', name: 'Travel & Perhotelan' },
      { id: 'media-entertainment', name: 'Media & Hiburan' },
      { id: 'real-estate', name: 'Properti & Real Estate' },
      { id: 'consulting', name: 'Konsultan' },
      { id: 'agriculture', name: 'Pertanian' },
      { id: 'energy-utilities', name: 'Energi & Utilitas' },
      { id: 'transportation-logistics', name: 'Transportasi & Logistik' },
      { id: 'non-profit', name: 'Non-Profit & NGO' },
      { id: 'government', name: 'Pemerintahan' },
      { id: 'creative-agency', name: 'Agensi Kreatif' },
      { id: 'construction', name: 'Konstruksi' },
      { id: 'legal', name: 'Jasa Hukum' },
      { id: 'other', name: 'Lainnya' }
    ];
  } catch (error) {
    return [];
  }
};

/**
 * Get budget range options for clients
 * 
 * @returns {Promise<Array>} - List of budget ranges
 */
export const getBudgetRangeOptions = async () => {
  try {
    return [
      { id: 'under-1m', name: 'Di bawah Rp1.000.000' },
      { id: '1m-5m', name: 'Rp1.000.000 - Rp5.000.000' },
      { id: '5m-10m', name: 'Rp5.000.000 - Rp10.000.000' },
      { id: '10m-25m', name: 'Rp10.000.000 - Rp25.000.000' },
      { id: '25m-50m', name: 'Rp25.000.000 - Rp50.000.000' },
      { id: '50m-100m', name: 'Rp50.000.000 - Rp100.000.000' },
      { id: 'above-100m', name: 'Di atas Rp100.000.000' },
      { id: 'negotiable', name: 'Fleksibel / Dapat dinegosiasi' }
    ];
  } catch (error) {
    return [];
  }
};

/**
 * Get primary needs options for clients
 * 
 * @returns {Promise<Array>} - List of primary needs
 */
export const getPrimaryNeedsOptions = async () => {
  try {
    return [
      { id: 'web-design', name: 'Web Design' },
      { id: 'web-development', name: 'Web Development' },
      { id: 'mobile-app', name: 'Mobile App' },
      { id: 'ui-ux-design', name: 'UI/UX Design' },
      { id: 'graphic-design', name: 'Graphic Design' },
      { id: 'content-writing', name: 'Content Writing' },
      { id: 'digital-marketing', name: 'Digital Marketing' },
      { id: 'seo', name: 'SEO' },
      { id: 'social-media', name: 'Social Media Management' },
      { id: 'video-production', name: 'Video Production' },
      { id: 'animation', name: 'Animation' },
      { id: 'translation', name: 'Translation' },
      { id: 'data-analysis', name: 'Data Analysis' },
      { id: 'virtual-assistant', name: 'Virtual Assistant' },
      { id: 'accounting', name: 'Accounting' },
      { id: 'legal-services', name: 'Legal Services' },
      { id: 'other', name: 'Lainnya' }
    ];
  } catch (error) {
    return [];
  }
}; 