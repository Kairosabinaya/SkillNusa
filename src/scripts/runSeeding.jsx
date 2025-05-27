/**
 * React-compatible seeding script
 * Runs in development environment with full React context
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { seedAllData } from './seedData';

function SeedingApp() {
  React.useEffect(() => {
    async function runSeeding() {
      try {
        console.log('🚀 Starting database seeding...');
        await seedAllData();
        console.log('🎉 Seeding completed successfully!');
      } catch (error) {
        console.error('❌ Seeding failed:', error);
      }
    }
    
    runSeeding();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>SkillNusa Database Seeding</h1>
      <p>Check console for seeding progress...</p>
      <p>This page will show the seeding results in the browser console.</p>
    </div>
  );
}

// Create root and render
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<SeedingApp />); 