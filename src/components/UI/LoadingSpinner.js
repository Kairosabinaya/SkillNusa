export default function LoadingSpinner({ size = 'medium', text, fullScreen = false }) {
  const sizeClasses = {
    small: 'h-6 w-6 border-2',
    medium: 'h-10 w-10 border-2',
    large: 'h-16 w-16 border-4',
  };

  const spinnerClass = `animate-spin rounded-full ${sizeClasses[size]} border-t-[#010042] border-b-[#010042] border-l-transparent border-r-transparent`;

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex flex-col items-center justify-center z-50">
        <div className={spinnerClass}></div>
        {text && <p className="mt-4 text-[#010042] font-medium">{text}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={spinnerClass}></div>
      {text && <p className="mt-2 text-[#010042] font-medium text-sm">{text}</p>}
    </div>
  );
} 