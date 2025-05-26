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
 * Build Cloudinary transformation string from object
 * @param {Object} transformation - Transformation parameters object
 * @returns {string} Cloudinary transformation string
 */
const buildTransformationString = (transformation) => {
  if (!transformation || typeof transformation !== 'object') {
    return '';
  }

  const params = [];
  
  // Map transformation properties to Cloudinary parameters
  if (transformation.width) params.push(`w_${transformation.width}`);
  if (transformation.height) params.push(`h_${transformation.height}`);
  if (transformation.crop) params.push(`c_${transformation.crop}`);
  if (transformation.gravity) params.push(`g_${transformation.gravity}`);
  if (transformation.quality) params.push(`q_${transformation.quality}`);
  if (transformation.fetch_format) params.push(`f_${transformation.fetch_format}`);
  if (transformation.format) params.push(`f_${transformation.format}`);
  
  return params.join(',');
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
  
  // Note: transformations are not allowed in unsigned uploads
  // Transformations will be applied when generating URLs for display

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
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Upload profile photo to designated folder
 * @param {File} file - Image file to upload
 * @param {string} userId - User ID for folder organization
 * @returns {Promise<Object>} Upload result with transformed URL
 */
export const uploadProfilePhoto = async (file, userId) => {
  const result = await uploadImage(file, {
    folder: `skillnusa/profile-photos/${userId}`
  });
  
  // Add transformed URL for profile display
  result.profileUrl = getOptimizedImageUrl(result.publicId, {
    width: 400,
    height: 400,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetch_format: 'auto'
  });
  
  return result;
};

/**
 * Upload portfolio image to designated folder
 * @param {File} file - Image file to upload
 * @param {string} userId - User ID for folder organization
 * @returns {Promise<Object>} Upload result with transformed URL
 */
export const uploadPortfolioImage = async (file, userId) => {
  const result = await uploadImage(file, {
    folder: `skillnusa/portfolio/${userId}`
  });
  
  // Add transformed URL for portfolio display
  result.portfolioUrl = getOptimizedImageUrl(result.publicId, {
    width: 800,
    height: 600,
    crop: 'limit',
    quality: 'auto',
    fetch_format: 'auto'
  });
  
  return result;
};

/**
 * Upload project image to designated folder
 * @param {File} file - Image file to upload
 * @param {string} projectId - Project ID for folder organization
 * @returns {Promise<Object>} Upload result with transformed URL
 */
export const uploadProjectImage = async (file, projectId) => {
  const result = await uploadImage(file, {
    folder: `skillnusa/projects/${projectId}`
  });
  
  // Add transformed URL for project display
  result.projectUrl = getOptimizedImageUrl(result.publicId, {
    width: 1200,
    height: 800,
    crop: 'limit',
    quality: 'auto',
    fetch_format: 'auto'
  });
  
  return result;
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
  try {
    // This requires a signed request or backend implementation
    // For now, we'll just return a success message
    // In production, implement this in your backend
    return { message: 'Deletion should be handled by backend for security' };
  } catch (error) {
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
  
  // Use the same transformation string builder for consistency
  const transformString = buildTransformationString(transformations);
  const transformPath = transformString ? transformString + '/' : '';
  
  return `${baseUrl}/${transformPath}${publicId}`;
};

/**
 * Get profile photo URL with standard transformations
 * @param {string} publicId - Public ID of the uploaded image
 * @returns {string} Transformed profile photo URL
 */
export const getProfilePhotoUrl = (publicId) => {
  return getOptimizedImageUrl(publicId, {
    width: 400,
    height: 400,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetch_format: 'auto'
  });
};

/**
 * Get portfolio image URL with standard transformations
 * @param {string} publicId - Public ID of the uploaded image
 * @returns {string} Transformed portfolio image URL
 */
export const getPortfolioImageUrl = (publicId) => {
  return getOptimizedImageUrl(publicId, {
    width: 800,
    height: 600,
    crop: 'limit',
    quality: 'auto',
    fetch_format: 'auto'
  });
};

/**
 * Get project image URL with standard transformations
 * @param {string} publicId - Public ID of the uploaded image
 * @returns {string} Transformed project image URL
 */
export const getProjectImageUrl = (publicId) => {
  return getOptimizedImageUrl(publicId, {
    width: 1200,
    height: 800,
    crop: 'limit',
    quality: 'auto',
    fetch_format: 'auto'
  });
};

export default {
  uploadImage,
  uploadProfilePhoto,
  uploadPortfolioImage,
  uploadProjectImage,
  deleteImage,
  getOptimizedImageUrl,
  getProfilePhotoUrl,
  getPortfolioImageUrl,
  getProjectImageUrl,
}; 