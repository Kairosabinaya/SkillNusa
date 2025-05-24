import React from 'react';
import { useField } from 'formik';
import classNames from 'classnames';

export const RadioGroup = ({
  label,
  options,
  helperText,
  className,
  required,
  ...props
}) => {
  const [field, meta] = useField(props);
  const hasError = meta.touched && meta.error;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="mt-4 space-y-4">
        {options.map((option) => (
          <div key={option.id} className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="radio"
                id={`${props.name}-${option.id}`}
                {...field}
                value={option.id}
                checked={field.value === option.id}
                className={classNames(
                  'focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300',
                  {
                    'border-red-300': hasError
                  }
                )}
              />
            </div>
            <div className="ml-3 text-sm">
              <label
                htmlFor={`${props.name}-${option.id}`}
                className="font-medium text-gray-700"
              >
                {option.label}
              </label>
              {option.description && (
                <p className="text-gray-500">{option.description}</p>
              )}
            </div>
          </div>
        ))}
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