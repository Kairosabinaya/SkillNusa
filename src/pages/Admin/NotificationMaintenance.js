import React, { useState } from 'react';
import { checkNotificationIds, fixNotificationIds } from '../../utils/fixNotifications';

export default function NotificationMaintenance() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const checkResults = await checkNotificationIds();
      setResults({ type: 'check', data: checkResults });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFix = async () => {
    setLoading(true);
    setError(null);
    try {
      const fixResults = await fixNotificationIds();
      setResults({ type: 'fix', data: fixResults });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          🔧 Notification Maintenance
        </h1>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Use these tools to check and fix notification ID issues. This addresses notifications
            that have null ID fields which can prevent them from displaying properly.
          </p>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={handleCheck}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Checking...' : '🔍 Check Notifications'}
          </button>
          
          <button
            onClick={handleFix}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Fixing...' : '🔧 Fix Notifications'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-red-800 font-medium mb-2">❌ Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {results && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-gray-800 font-medium mb-4">
              {results.type === 'check' ? '🔍 Check Results' : '✅ Fix Results'}
            </h3>
            
            {results.type === 'check' && (
              <div className="space-y-2">
                <p><strong>Total Notifications:</strong> {results.data.totalNotifications}</p>
                <p><strong>Notifications with ID field:</strong> {results.data.notificationsWithIdField}</p>
                <p><strong>Clean Notifications:</strong> {results.data.cleanNotifications}</p>
                
                {results.data.problematicNotifications.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Problematic Notifications:</h4>
                    <div className="max-h-40 overflow-y-auto">
                      {results.data.problematicNotifications.map((notif, index) => (
                        <div key={index} className="text-sm bg-white p-2 rounded border mb-1">
                          <p><strong>Doc ID:</strong> {notif.docId}</p>
                          <p><strong>ID Field Value:</strong> {String(notif.idFieldValue)}</p>
                          <p><strong>Title:</strong> {notif.title}</p>
                          <p><strong>User ID:</strong> {notif.userId}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {results.type === 'fix' && (
              <div className="space-y-2">
                <p><strong>Total Checked:</strong> {results.data.totalChecked}</p>
                <p><strong>Fixed:</strong> {results.data.fixed}</p>
                <p><strong>Errors:</strong> {results.data.errors}</p>
                <p><strong>Already Clean:</strong> {results.data.alreadyClean}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-yellow-800 font-medium mb-2">⚠️ Important Notes</h3>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• Always check notifications first before running the fix</li>
            <li>• The fix removes unnecessary 'id' fields from notification documents</li>
            <li>• Firestore document IDs are used instead of stored ID fields</li>
            <li>• This operation cannot be undone, but it's safe to run</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 