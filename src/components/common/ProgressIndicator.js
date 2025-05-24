import React from 'react';
import classNames from 'classnames';

export const ProgressIndicator = ({ currentStep, totalSteps, className }) => {
  return (
    <div className={classNames('flex items-center justify-between w-full', className)}>
      {[...Array(totalSteps)].map((_, index) => (
        <div key={index} className="flex items-center">
          <div
            className={classNames(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              {
                'bg-primary text-white': index + 1 <= currentStep,
                'bg-gray-200 text-gray-500': index + 1 > currentStep
              }
            )}
          >
            {index + 1}
          </div>
          {index < totalSteps - 1 && (
            <div
              className={classNames('h-1 w-16 mx-2', {
                'bg-primary': index + 1 < currentStep,
                'bg-gray-200': index + 1 >= currentStep
              })}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default ProgressIndicator; 