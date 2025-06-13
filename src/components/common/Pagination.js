import React from 'react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  className = '',
  showInfo = false,
  totalItems = 0,
  itemsPerPage = 10
}) => {
  if (totalPages <= 1) return null;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const getVisiblePages = () => {
    const maxVisible = window.innerWidth < 640 ? 3 : 5;
    const pages = [];
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const half = Math.floor(maxVisible / 2);
      let start = Math.max(1, currentPage - half);
      let end = Math.min(totalPages, start + maxVisible - 1);
      
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {showInfo && (
        <div className="text-sm text-gray-600">
          Menampilkan {startItem}-{endItem} dari {totalItems} item
        </div>
      )}
      
      <div className="flex items-center space-x-1 sm:space-x-2">
        <button 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-2 sm:px-3 py-2 border border-gray-300 rounded text-sm transition-colors ${
            currentPage === 1 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">‹</span>
        </button>
        
        {getVisiblePages().map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => handlePageChange(pageNum)}
            className={`px-2 sm:px-3 py-2 rounded text-sm transition-colors ${
              currentPage === pageNum
                ? 'bg-[#010042] text-white'
                : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
            }`}
          >
            {pageNum}
          </button>
        ))}
        
        <button 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-2 sm:px-3 py-2 border border-gray-300 rounded text-sm transition-colors ${
            currentPage === totalPages 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">›</span>
        </button>
      </div>
    </div>
  );
};

export default Pagination; 