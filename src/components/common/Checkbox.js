import React from 'react';
import { useField } from 'formik';
import classNames from 'classnames';

export const Checkbox = ({
  label,
  helperText,
  className,
  required,
  ...props
}) => {
  const [field, meta] = useField({ ...props, type: 'checkbox' });
  const hasError = meta.touched && meta.error;

  return (
    <div className={className}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            type="checkbox"
            {...field}
            {...props}
            className={classNames(
              'focus:ring-primary-500 h-4 w-4 text-primary-600 rounded',
              {
                'border-red-300': hasError,
                'border-gray-300': !hasError
              }
            )}
          />
        </div>
        <div className="ml-3 text-sm">
          <label
            htmlFor={props.id || props.name}
            className={classNames('font-medium', {
              'text-gray-700': !hasError,
              'text-red-600': hasError
            })}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {(helperText || hasError) && (
            <p
              className={classNames('mt-1', {
                'text-red-600': hasError,
                'text-gray-500': !hasError
              })}
            >
              {hasError ? meta.error : helperText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}; 