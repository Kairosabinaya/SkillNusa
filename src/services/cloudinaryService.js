/**
 * Cloudinary Service for image upload and management
 */

const CLOUDINARY_CONFIG = {
  cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
  uploadPreset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET,
};

/**
 * Validate Cloudinary configuration
 */
const validateConfig = () => {
  if (!CLOUDINARY_CONFIG.cloudName || !CLOUDINARY_CONFIG.uploadPreset) {
    throw new Error('Cloudinary configuration is missing. Please check your environment variables.');
  }
};

/**
 * Upload image to Cloudinary
 * @param {File} file - Image file to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result with URL and public_id
 */
export const uploadImage = async (file, options = {}) => {
  validateConfig();
  
  if (!file) {
    throw new Error('No file provided for upload');
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    throw new Error('File size too large. Maximum size is 5MB.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  
  // Add optional parameters
  if (options.folder) {
    formData.append('folder', options.folder);
  }
  
  if (options.transformation) {
    formData.append('transformation', JSON.stringify(options.transformation));
  }

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const result = await response.json();
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Upload profile photo with specific transformations
 * @param {File} file - Image file to upload
 * @param {string} userId - User ID for folder organization
 * @returns {Promise<Object>} Upload result
 */
export const uploadProfilePhoto = async (file, userId) => {
  return uploadImage(file, {
    folder: `skillnusa/profile-photos/${userId}`,
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });
};

/**
 * Upload portfolio image with specific transformations
 * @param {File} file - Image file to upload
 * @param {string} userId - User ID for folder organization
 * @returns {Promise<Object>} Upload result
 */
export const uploadPortfolioImage = async (file, userId) => {
  return uploadImage(file, {
    folder: `skillnusa/portfolio/${userId}`,
    transformation: [
      { width: 800, height: 600, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });
};

/**
 * Upload project image with specific transformations
 * @param {File} file - Image file to upload
 * @param {string} projectId - Project ID for folder organization
 * @returns {Promise<Object>} Upload result
 */
export const uploadProjectImage = async (file, projectId) => {
  return uploadImage(file, {
    folder: `skillnusa/projects/${projectId}`,
    transformation: [
      { width: 1200, height: 800, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image to delete
 * @returns {Promise<Object>} Deletion result
 */
export const deleteImage = async (publicId) => {
  validateConfig();
  
  if (!publicId) {
    throw new Error('Public ID is required for deletion');
  }

  // Note: For security reasons, deletion from the frontend should be limited
  // In production, consider moving this to your backend with proper authentication
  console.warn('Image deletion from frontend. Consider moving to backend for security.');
  
  try {
    // This requires a signed request or backend implementation
    // For now, we'll just return a success message
    // In production, implement this in your backend
    return { message: 'Deletion should be handled by backend for security' };
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * Generate optimized image URL with transformations
 * @param {string} publicId - Public ID of the image
 * @param {Object} transformations - Transformation options
 * @returns {string} Optimized image URL
 */
export const getOptimizedImageUrl = (publicId, transformations = {}) => {
  validateConfig();
  
  if (!publicId) {
    return null;
  }

  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
  
  // Build transformation string
  const transformParams = [];
  
  if (transformations.width) transformParams.push(`w_${transformations.width}`);
  if (transformations.height) transformParams.push(`h_${transformations.height}`);
  if (transformations.crop) transformParams.push(`c_${transformations.crop}`);
  if (transformations.quality) transformParams.push(`q_${transformations.quality}`);
  if (transformations.format) transformParams.push(`f_${transformations.format}`);
  
  const transformString = transformParams.length > 0 ? transformParams.join(',') + '/' : '';
  
  return `${baseUrl}/${transformString}${publicId}`;
};

export default {
  uploadImage,
  uploadProfilePhoto,
  uploadPortfolioImage,
  uploadProjectImage,
  deleteImage,
  getOptimizedImageUrl,
}; 