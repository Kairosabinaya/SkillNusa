/**
 * Temporary Seeding Page - For development use only
 * Visit /seeding to run the database seeding
 */

import React, { useState } from 'react';
import { seedAllData, seedUsers, seedGigs, seedReviews, seedOrders } from '../scripts/seedData';
import gigService from '../services/gigService';

export default function SeedingPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingStatus, setSeedingStatus] = useState('');
  const [logs, setLogs] = useState([]);
  const [testResults, setTestResults] = useState(null);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runSeeding = async (type = 'all') => {
    setIsSeeding(true);
    setSeedingStatus('running');
    setLogs([]);
    
    try {
      addLog('Starting comprehensive database seeding...');
      
      switch (type) {
        case 'users':
          addLog('Seeding users (10 freelancers + 5 clients)...');
          await seedUsers();
          addLog('✅ Users seeded successfully!');
          break;
        case 'gigs':
          addLog('Seeding 20 gigs across multiple categories...');
          await seedGigs();
          addLog('✅ Gigs seeded successfully!');
          break;
        case 'reviews':
          addLog('Seeding 30 reviews for all gigs...');
          await seedReviews();
          addLog('✅ Reviews seeded successfully!');
          break;
        case 'orders':
          addLog('Seeding sample orders...');
          await seedOrders();
          addLog('✅ Orders seeded successfully!');
          break;
        case 'all':
        default:
          addLog('Seeding 10 freelancers + 5 clients...');
          await seedUsers();
          addLog('✅ Users seeded!');
          
          addLog('Seeding 20 gigs across categories...');
          await seedGigs();
          addLog('✅ Gigs seeded!');
          
          addLog('Seeding 30 reviews...');
          await seedReviews();
          addLog('✅ Reviews seeded!');
          
          addLog('Seeding sample orders...');
          await seedOrders();
          addLog('✅ Orders seeded!');
          break;
      }
      
      addLog('🎉 All seeding completed successfully!');
      setSeedingStatus('success');
    } catch (error) {
      console.error('Seeding failed:', error);
      addLog(`❌ Seeding failed: ${error.message}`);
      setSeedingStatus('error');
    } finally {
      setIsSeeding(false);
    }
  };

  const testGigService = async () => {
    setTestResults(null);
    addLog('🧪 Testing gigService...');
    
    try {
      const gigs = await gigService.getGigs({}, { limit: 20 });
      const featuredGigs = await gigService.getFeaturedGigs(10);
      
      // Test by categories
      const designGigs = await gigService.getGigs({ category: 'Design & Creative' }, { limit: 10 });
      const techGigs = await gigService.getGigs({ category: 'Programming & Tech' }, { limit: 10 });
      
      setTestResults({
        totalGigs: gigs.length,
        featuredGigs: featuredGigs.length,
        designGigs: designGigs.length,
        techGigs: techGigs.length,
        gigTitles: gigs.slice(0, 10).map(gig => gig.title),
        categories: [...new Set(gigs.map(gig => gig.category))],
        success: true
      });
      
      addLog(`✅ gigService test successful! Found ${gigs.length} gigs across ${[...new Set(gigs.map(gig => gig.category))].length} categories`);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults({
        error: error.message,
        success: false
      });
      addLog(`❌ gigService test failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Database Seeding - Enhanced Version</h1>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Development Only</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  This enhanced seeding will populate your database with comprehensive, realistic data for testing and development.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => runSeeding('all')}
              disabled={isSeeding}
              className="bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSeeding ? 'Seeding...' : 'Seed All Data'}
            </button>
            
            <button
              onClick={testGigService}
              disabled={isSeeding}
              className="bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test Gig Service
            </button>
            
            <button
              onClick={() => runSeeding('users')}
              disabled={isSeeding}
              className="bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Seed Users Only
            </button>
            
            <button
              onClick={() => runSeeding('gigs')}
              disabled={isSeeding}
              className="bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Seed Gigs Only
            </button>
            
            <button
              onClick={() => runSeeding('reviews')}
              disabled={isSeeding}
              className="bg-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Seed Reviews Only
            </button>
            
            <button
              onClick={() => runSeeding('orders')}
              disabled={isSeeding}
              className="bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Seed Orders Only
            </button>
          </div>

          {/* Test Results */}
          {testResults && (
            <div className={`p-4 rounded-lg mb-6 ${
              testResults.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <h3 className="font-medium mb-2">Gig Service Test Results:</h3>
              {testResults.success ? (
                <div>
                  <p>✅ Total gigs found: {testResults.totalGigs}</p>
                  <p>✅ Featured gigs found: {testResults.featuredGigs}</p>
                  <p>✅ Design & Creative gigs: {testResults.designGigs}</p>
                  <p>✅ Programming & Tech gigs: {testResults.techGigs}</p>
                  <p>✅ Categories available: {testResults.categories.join(', ')}</p>
                  <details className="mt-2">
                    <summary>Sample gig titles (first 10):</summary>
                    <ul className="list-disc list-inside mt-1">
                      {testResults.gigTitles.map((title, index) => (
                        <li key={index} className="text-sm">{title}</li>
                      ))}
                    </ul>
                  </details>
                </div>
              ) : (
                <p>❌ Error: {testResults.error}</p>
              )}
            </div>
          )}

          {/* Status */}
          {seedingStatus && (
            <div className={`p-4 rounded-lg mb-6 ${
              seedingStatus === 'running' ? 'bg-blue-50 text-blue-800' :
              seedingStatus === 'success' ? 'bg-green-50 text-green-800' :
              'bg-red-50 text-red-800'
            }`}>
              <div className="flex items-center">
                {seedingStatus === 'running' && (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {seedingStatus === 'success' && (
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {seedingStatus === 'error' && (
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="font-medium">
                  {seedingStatus === 'running' ? 'Seeding in progress...' :
                   seedingStatus === 'success' ? 'Seeding completed successfully!' :
                   'Seeding failed!'}
                </span>
              </div>
            </div>
          )}

          {/* Logs */}
          {logs.length > 0 && (
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
              <h3 className="text-white mb-2">Seeding Logs:</h3>
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 text-sm text-gray-600">
            <h3 className="font-medium mb-2">Enhanced Seeding Will Create:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Users:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>10 freelancer accounts with diverse skills</li>
                  <li>5 client accounts from different industries</li>
                  <li>Complete profiles with portfolio links</li>
                  <li>Professional profile photos</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Gigs & Services:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>20 professional gigs across 8+ categories</li>
                  <li>Design & Creative (UI/UX, Logo, Graphics)</li>
                  <li>Programming & Tech (Web, Mobile, Data Science, API)</li>
                  <li>Digital Marketing (SEO, Social Media)</li>
                  <li>Writing & Translation</li>
                  <li>Video & Animation</li>
                  <li>Music & Audio</li>
                  <li>Business Consulting</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Reviews & Orders:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>30+ authentic reviews with realistic ratings</li>
                  <li>Sample completed orders</li>
                  <li>Realistic pricing (Rp 150K - Rp 15M)</li>
                  <li>Professional descriptions & packages</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Categories Covered:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>UI/UX Design & Logo Design</li>
                  <li>Web Development & E-commerce</li>
                  <li>Mobile App Development</li>
                  <li>Data Science & Analytics</li>
                  <li>Digital Marketing & SEO</li>
                  <li>Content Writing & Translation</li>
                  <li>Video Editing & Animation</li>
                  <li>Voice Over & Podcast Production</li>
                  <li>Business Consulting & Virtual Assistant</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 