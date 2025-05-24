import React, { useState, useRef, useEffect } from 'react';
import { useField } from 'formik';
import classNames from 'classnames';

export const TagInput = ({
  label,
  suggestions,
  helperText,
  className,
  required,
  ...props
}) => {
  const [field, meta, helpers] = useField(props);
  const { setValue } = helpers;
  const hasError = meta.touched && meta.error;

  const [inputValue, setInputValue] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.trim()) {
      const filtered = suggestions.filter(
        (suggestion) =>
          suggestion.toLowerCase().includes(value.toLowerCase()) &&
          !(field.value || []).includes(suggestion)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const addTag = (tag) => {
    const currentTags = field.value || [];
    if (!currentTags.includes(tag)) {
      setValue([...currentTags, tag]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove) => {
    const currentTags = field.value || [];
    setValue(currentTags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        addTag(filteredSuggestions[0]);
      } else if (!suggestions.includes(inputValue)) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue) {
      const currentTags = field.value || [];
      if (currentTags.length > 0) {
        removeTag(currentTags[currentTags.length - 1]);
      }
    }
  };

  return (
    <div className={className} ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div
        className={classNames(
          'mt-1 flex flex-wrap gap-2 p-2 border rounded-md shadow-sm focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500',
          {
            'border-red-300': hasError,
            'border-gray-300': !hasError
          }
        )}
      >
        {(field.value || []).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 inline-flex items-center p-0.5 rounded-full text-primary-400 hover:bg-primary-200 hover:text-primary-500 focus:outline-none"
            >
              <svg
                className="h-3 w-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-1 outline-none border-0 p-0.5 min-w-[120px] bg-transparent"
          placeholder={props.placeholder}
        />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {filteredSuggestions.map((suggestion) => (
            <li
              key={suggestion}
              onClick={() => addTag(suggestion)}
              className="relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-primary-50"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
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