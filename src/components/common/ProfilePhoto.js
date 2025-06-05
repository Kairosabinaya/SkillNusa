/**
 * ProfilePhoto Component
 * A reusable component that handles profile photo display with automatic fallbacks
 */

import React, { useState } from 'react';
import { getProfilePhotoDisplay, DEFAULT_PROFILE_PHOTO } from '../../utils/profilePhotoUtils';

const ProfilePhoto = ({ 
  user, 
  size = 'md', 
  className = '', 
  useInitials = true,
  onClick = null,
  editable = false,
  onPhotoChange = null,
  children
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Size classes mapping
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-24 w-24 text-xl',
    '2xl': 'h-32 w-32 text-2xl',
    '3xl': 'h-40 w-40 text-3xl'
  };
  
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  
  // Get profile photo display info
  const photoDisplay = getProfilePhotoDisplay(user, { 
    useInitials: useInitials && !imageError, 
    className: className 
  });
  
  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };
  
  // Handle file input change for editable mode
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onPhotoChange) {
      onPhotoChange(file);
    }
  };
  
  // Base classes for the container
  const baseClasses = `
    relative inline-flex items-center justify-center rounded-full overflow-hidden
    ${sizeClass} ${className}
    ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
    ${editable ? 'group' : ''}
  `;
  
  // Render image or initials
  const renderContent = () => {
    // If image failed to load or user wants initials
    if (imageError || (photoDisplay.type === 'initials' && useInitials)) {
      return (
        <div className={`
          ${sizeClass} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
          flex items-center justify-center text-white font-semibold
        `}>
          {photoDisplay.initials}
        </div>
      );
    }
    
    // Render image (custom or default)
    if (photoDisplay.src) {
      return (
        <img
          src={photoDisplay.src}
          alt={photoDisplay.alt}
          className={`${sizeClass} rounded-full object-cover`}
          onError={handleImageError}
          onLoad={() => setImageError(false)}
        />
      );
    }
    
    // Fallback to initials if no image
    return (
      <div className={`
        ${sizeClass} rounded-full bg-gradient-to-br from-gray-400 to-gray-600 
        flex items-center justify-center text-white font-semibold
      `}>
        {photoDisplay.initials}
      </div>
    );
  };
  
  return (
    <div className={baseClasses} onClick={onClick}>
      {renderContent()}
      
      {/* Editable overlay */}
      {editable && (
        <>
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-full flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
          />
        </>
      )}
      
      {/* Additional children (badges, status indicators, etc.) */}
      {children}
    </div>
  );
};

export default ProfilePhoto; 