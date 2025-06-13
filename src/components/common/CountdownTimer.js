import { useState, useEffect } from 'react';

export default function CountdownTimer({ 
  targetDate, 
  onExpire, 
  label = "Waktu tersisa", 
  className = "",
  showLabel = true,
  type = "warning" // warning, danger, info
}) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!targetDate) return;

    const updateTimer = () => {
      const now = new Date();
      const target = new Date(targetDate);
      const diffInSeconds = Math.max(0, Math.floor((target - now) / 1000));
      
      setTimeLeft(diffInSeconds);

      if (diffInSeconds === 0 && !expired) {
        setExpired(true);
        if (onExpire) {
          onExpire();
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onExpire, expired]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getColorClasses = () => {
    const baseClasses = "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium";
    
    if (expired) {
      return `${baseClasses} bg-red-100 text-red-800`;
    }

    if (timeLeft <= 300) { // Last 5 minutes - urgent
      return `${baseClasses} bg-red-100 text-red-800`;
    } else if (timeLeft <= 1800) { // Last 30 minutes - warning
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    } else {
      // Normal state
      switch (type) {
        case 'danger':
          return `${baseClasses} bg-red-50 text-red-700`;
        case 'info':
          return `${baseClasses} bg-blue-50 text-blue-700`;
        default:
          return `${baseClasses} bg-yellow-50 text-yellow-700`;
      }
    }
  };

  const getIcon = () => {
    if (expired) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/>
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
      </svg>
    );
  };

  if (!targetDate) return null;

  return (
    <div className={`${getColorClasses()} ${className}`}>
      {getIcon()}
      <div>
        {showLabel && (
          <div className="text-xs opacity-75 mb-1">{label}</div>
        )}
        <div className="font-mono font-semibold">
          {expired ? 'Waktu Habis' : formatTime(timeLeft)}
        </div>
      </div>
    </div>
  );
} 