import React from 'react';

const PageContainer = ({ 
  children, 
  className = '', 
  maxWidth = 'max-w-7xl',
  padding = 'px-3 sm:px-4',
  ...props 
}) => {
  return (
    <div 
      className={`${maxWidth} mx-auto ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default PageContainer; 