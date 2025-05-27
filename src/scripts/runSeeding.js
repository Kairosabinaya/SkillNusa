#!/usr/bin/env node

/**
 * CLI Script untuk menjalankan seeding database
 * 
 * Usage:
 * npm run db:seed
 * atau
 * node src/scripts/runSeeding.js
 */

import { seedAllData, seedUsers, seedGigs, seedReviews } from './seedData.js';

const command = process.argv[2] || 'all';

async function main() {
  console.log('🚀 SkillNusa Database Seeding Script');
  console.log('=====================================');
  
  try {
    switch (command) {
      case 'users':
        await seedUsers();
        break;
      case 'gigs':
        await seedGigs();
        break;
      case 'reviews':
        await seedReviews();
        break;
      case 'all':
      default:
        await seedAllData();
        break;
    }
    
    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main(); 