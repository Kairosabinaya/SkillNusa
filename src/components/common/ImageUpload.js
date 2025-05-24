import React, { useCallback } from 'react';
import { useField } from 'formik';
import classNames from 'classnames';
import { useDropzone } from 'react-dropzone';

export const ImageUpload = ({
  label,
  helperText,
  className,
  required,
  previewUrl,
  onChange,
  ...props
}) => {
  const [field, meta] = useField(props);
  const hasError = meta.touched && meta.error;

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles?.length) {
        onChange(acceptedFiles[0]);
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 5242880, // 5MB
    multiple: false
  });

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div
        {...getRootProps()}
        className={classNames(
          'mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer',
          {
            'border-primary-300 bg-primary-50': isDragActive,
            'border-red-300': hasError,
            'border-gray-300 hover:border-primary-400': !isDragActive && !hasError
          }
        )}
      >
        <div className="space-y-1 text-center">
          {previewUrl ? (
            <div className="flex flex-col items-center">
              <img
                src={previewUrl}
                alt="Pratinjau"
                className="h-32 w-32 object-cover rounded-full"
              />
              <p className="mt-2 text-sm text-gray-600">
                Klik atau seret untuk mengganti foto
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                  <span>Unggah file</span>
                  <input {...getInputProps()} />
                </label>
                <p className="pl-1">atau seret dan lepas</p>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF maksimal 5MB
              </p>
            </div>
          )}
        </div>
      </div>
      {(helperText || hasError) && (
        <p
          className={classNames('mt-2 text-sm', {
            'text-red-600': hasError,
            'text-gray-500': !hasError
          })}
        >
          {hasError ? meta.error : helperText}
        </p>
      )}
    </div>
  );
}; 