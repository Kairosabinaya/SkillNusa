import { useEffect, useState } from 'react';
import { populateGigsData } from '../scripts/populateGigs';

export default function TestPopulate() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const runPopulate = async () => {
    setLoading(true);
    setStatus('Starting data population...');
    
    try {
      await populateGigsData();
      setStatus('Data populated successfully! You can now navigate to /gig/1 to see the sample gig.');
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Database Population Tool</h1>
        
        <p className="text-gray-600 mb-6">
          Click the button below to populate the database with sample gig data.
        </p>
        
        <button
          onClick={runPopulate}
          disabled={loading}
          className="w-full bg-[#010042] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#000030] transition duration-200 disabled:opacity-50"
        >
          {loading ? 'Populating...' : 'Populate Database'}
        </button>
        
        {status && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
            {status}
          </div>
        )}
        
        <div className="mt-6 text-sm text-gray-500">
          <p>This will create:</p>
          <ul className="list-disc list-inside mt-2">
            <li>Sample freelancer profiles</li>
            <li>Sample gigs with packages and pricing</li>
            <li>Sample reviews</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 