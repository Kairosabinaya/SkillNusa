import { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

export default function RatingModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  freelancerName, 
  gigTitle,
  isSubmitting = false 
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Silakan berikan rating terlebih dahulu');
      return;
    }
    
    await onSubmit({
      rating,
      comment: comment.trim()
    });
    
    // Reset form
    setRating(0);
    setHoverRating(0);
    setComment('');
  };

  const handleClose = () => {
    setRating(0);
    setHoverRating(0);
    setComment('');
    onClose();
  };

  if (!isOpen) return null;

  const ratingLabels = {
    1: 'Sangat Tidak Puas',
    2: 'Tidak Puas', 
    3: 'Cukup',
    4: 'Puas',
    5: 'Sangat Puas'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full mx-auto shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Pesanan Selesai!
            </h2>
            <p className="text-gray-600">
              Bagaimana pengalaman Anda bekerja dengan <span className="font-medium">{freelancerName}</span>?
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Gig Title */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Layanan:</h3>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{gigTitle}</p>
            </div>

            {/* Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Berikan Rating Anda *
              </label>
              <div className="flex items-center justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      className="transition-all duration-150 hover:scale-110"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    >
                      {isFilled ? (
                        <StarSolid className="w-8 h-8 text-yellow-400" />
                      ) : (
                        <StarIcon className="w-8 h-8 text-gray-300 hover:text-yellow-400" />
                      )}
                    </button>
                  );
                })}
              </div>
              {(hoverRating || rating) > 0 && (
                <p className="text-center text-sm text-gray-600">
                  {ratingLabels[hoverRating || rating]}
                </p>
              )}
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tinggalkan Ulasan (Opsional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent resize-none"
                placeholder="Ceritakan pengalaman Anda bekerja dengan freelancer ini..."
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {comment.length}/500 karakter
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Lewati
              </button>
              <button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                className="flex-1 px-4 py-2 bg-[#010042] text-white rounded-lg hover:bg-[#0100a3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Mengirim...
                  </>
                ) : (
                  'Kirim Rating'
                )}
              </button>
            </div>
          </form>

          {/* Skip notice */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Dengan memberikan rating, Anda membantu freelancer lain dan meningkatkan kualitas layanan platform
          </p>
        </div>
      </div>
    </div>
  );
} 