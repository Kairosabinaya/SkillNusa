import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc,
  writeBatch 
} from 'firebase/firestore';

export default function AdminCleanup() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const collections = [
    'orders',
    'reviews', 
    'gigs',
    'clientProfiles',
    'freelancerProfiles',
    'chats',
    'conversations',
    'notifications',
    'favorites'
  ];

  const clearCollection = async (collectionName) => {
    try {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      
      if (snapshot.empty) {
        return { collection: collectionName, deleted: 0, status: 'empty' };
      }

      const batch = writeBatch(db);
      let deleteCount = 0;

      snapshot.docs.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
        deleteCount++;
      });

      await batch.commit();
      return { collection: collectionName, deleted: deleteCount, status: 'success' };
      
    } catch (error) {
      return { collection: collectionName, deleted: 0, status: 'error', error: error.message };
    }
  };

  const handleCleanup = async () => {
    if (!currentUser) {
      alert('You must be logged in to perform cleanup');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete ALL data from the database? This action cannot be undone!'
    );

    if (!confirmed) return;

    setLoading(true);
    setResults([]);

    const cleanupResults = [];

    for (const collectionName of collections) {
      console.log(`Cleaning ${collectionName}...`);
      const result = await clearCollection(collectionName);
      cleanupResults.push(result);
      setResults([...cleanupResults]);
    }

    setLoading(false);
    console.log('Cleanup completed!', cleanupResults);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You must be logged in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Database Cleanup</h1>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 font-medium">Warning: This will permanently delete all data!</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Collections to be cleaned:</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              {collections.map(collection => (
                <li key={collection}>{collection}</li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleCleanup}
            disabled={loading}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Cleaning...' : 'Clean All Data'}
          </button>

          {results.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Cleanup Results:</h3>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div key={index} className={`p-3 rounded-lg ${
                    result.status === 'success' ? 'bg-green-50 text-green-800' :
                    result.status === 'empty' ? 'bg-yellow-50 text-yellow-800' :
                    'bg-red-50 text-red-800'
                  }`}>
                    <span className="font-medium">{result.collection}:</span>
                    {result.status === 'success' && ` ${result.deleted} documents deleted`}
                    {result.status === 'empty' && ` already empty`}
                    {result.status === 'error' && ` error - ${result.error}`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 