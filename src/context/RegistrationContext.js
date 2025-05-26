import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { uploadProfilePhoto as uploadToCloudinary } from '../services/cloudinaryService';
import { ROUTES } from '../routes';

const RegistrationContext = createContext();

export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
};

export const RegistrationProvider = ({ children }) => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  
  // Form data state
  const [formData, setFormData] = useState({
    // Step 1 - Basic Account Info
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    username: '',
    role: '',

    // Step 2 - Profile Details
    profilePhoto: null,
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    city: '',
    bio: '',

    // Step 3 - Role-Specific Info (Freelancer)
    skills: [],
    experienceLevel: '',
    portfolioLinks: [],
    hourlyRate: '',
    availability: '',

    // Step 3 - Role-Specific Info (Client)
    companyName: '',
    industry: '',
    companySize: '',
    budgetRange: '',
    primaryNeeds: [],

    // Step 4 - Terms & Verification
    termsAccepted: false,
    privacyAccepted: false,
    marketingEmails: false
  });

  // Current step state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  // Progress saving
  const saveProgress = useCallback(() => {
    localStorage.setItem('registrationProgress', JSON.stringify({
      formData,
      currentStep
    }));
  }, [formData, currentStep]);

  const loadProgress = useCallback(() => {
    const savedProgress = localStorage.getItem('registrationProgress');
    if (savedProgress) {
      const { formData: savedData, currentStep: savedStep } = JSON.parse(savedProgress);
      setFormData(savedData);
      setCurrentStep(savedStep);
      return true;
    }
    return false;
  }, []);

  const clearProgress = useCallback(() => {
    localStorage.removeItem('registrationProgress');
  }, []);

  // Update form data
  const updateFormData = useCallback((newData) => {
    setFormData(prev => {
      const updated = { ...prev, ...newData };
      return updated;
    });
  }, []);

  // Handle profile photo upload using Cloudinary
  const uploadProfilePhoto = async (file, userId) => {
    if (!file) return null;

    try {
      const uploadResult = await uploadToCloudinary(file, userId || `temp_${Date.now()}`);
      return {
        url: uploadResult.url,
        publicId: uploadResult.publicId
      };
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw error;
    }
  };

  // Submit registration
  const submitRegistration = async () => {
    setLoading(true);
    setError(null);

    try {
      // Upload profile photo if exists
      let profilePhotoUrl = null;
      let profilePhotoPublicId = null;
      if (formData.profilePhoto) {
        const uploadResult = await uploadProfilePhoto(formData.profilePhoto);
        profilePhotoUrl = uploadResult.url;
        profilePhotoPublicId = uploadResult.publicId;
      }

      // Register user
      const userData = {
        email: formData.email,
        password: formData.password,
        username: formData.username,
        role: formData.role,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        gender: formData.gender,
        birthDate: formData.dateOfBirth,
        bio: formData.bio || '',
        city: formData.city,
        profilePhoto: profilePhotoUrl,
        profilePhotoPublicId: profilePhotoPublicId,
        // Role-specific data
        ...(formData.role === 'freelancer' ? {
          skills: formData.skills,
          experienceLevel: formData.experienceLevel,
          portfolioLinks: formData.portfolioLinks.filter(Boolean),
          hourlyRate: formData.hourlyRate,
          availability: formData.availability
        } : {
          companyName: formData.companyName,
          industry: formData.industry,
          companySize: formData.companySize,
          budgetRange: formData.budgetRange,
          primaryNeeds: formData.primaryNeeds
        })
      };

      await signup(
        userData.email,
        userData.password,
        userData.username,
        userData.role,
        userData.bio,
        '', // headline
        userData.skills,
        userData.fullName,
        userData.phoneNumber,
        userData.gender,
        userData.birthDate
      );

      // Clear registration progress
      clearProgress();

      // Redirect to email verification page
      navigate('/verify-email');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Navigation between steps
  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = prev + 1;
      saveProgress();
      return next;
    });
  }, [saveProgress]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = prev - 1;
      saveProgress();
      return next;
    });
  }, [saveProgress]);

  const value = {
    formData,
    updateFormData,
    currentStep,
    nextStep,
    prevStep,
    loading,
    error,
    success,
    submitRegistration,
    loadProgress,
    clearProgress
  };

  return (
    <RegistrationContext.Provider value={value}>
      {children}
    </RegistrationContext.Provider>
  );
};

export default RegistrationContext; 