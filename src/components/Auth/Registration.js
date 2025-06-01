import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRegistration } from '../../context/RegistrationContext';
import BasicAccountInfo from './steps/BasicAccountInfo';
import ProfileDetails from './steps/ProfileDetails';
import RoleSpecificInfo from './steps/RoleSpecificInfo';
import TermsVerification from './steps/TermsVerification';
import ProgressIndicator from '../common/ProgressIndicator';
import ErrorPopup from '../common/ErrorPopup';
import SuccessPopup from '../common/SuccessPopup';
import { ROUTES } from '../../routes';

const Registration = () => {
  const {
    currentStep,
    loading,
    error,
    success,
    setError,
    setSuccess
  } = useRegistration();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicAccountInfo />;
      case 2:
        return <ProfileDetails />;
      case 3:
        return <RoleSpecificInfo />;
      case 4:
        return <TermsVerification />;
      default:
        return <BasicAccountInfo />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-12 sm:px-6 lg:px-8">
      <ErrorPopup 
        message={error} 
        onClose={() => setError('')} 
        duration={3000}
      />
      
      <SuccessPopup 
        message={success} 
        onClose={() => setSuccess('')} 
        duration={3000}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to={ROUTES.HOME} className="flex justify-center mb-6">
          <span className="text-2xl font-bold cursor-pointer bg-gradient-to-r from-[#010042] to-[#0100a3] bg-clip-text text-transparent" style={{letterSpacing: "0.5px"}}>
            SkillNusa
          </span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Daftar Akun
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Atau{' '}
          <Link to={ROUTES.LOGIN} className="font-medium text-primary hover:text-primary-dark">
            masuk ke akun yang sudah ada
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <ProgressIndicator 
            currentStep={currentStep} 
            totalSteps={4}
            className="mb-8"
          />

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div>
              {renderStep()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Registration; 