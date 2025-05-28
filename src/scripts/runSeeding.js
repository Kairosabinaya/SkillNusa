#!/usr/bin/env node

/**
 * CLI Script untuk menjalankan seeding database
 * 
 * Usage:
 * npm run db:seed
 * atau
 * node src/scripts/runSeeding.js [command]
 * 
 * Commands:
 * - all (default): Seed semua data
 * - users: Seed users only
 * - gigs: Seed gigs only  
 * - reviews: Seed reviews only
 * - orders: Seed orders only
 */

// Load environment variables for Node.js execution
import dotenv from 'dotenv';
import { existsSync } from 'fs';

// Load environment variables from .env.local or .env FIRST
if (existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else if (existsSync('.env')) {
  dotenv.config({ path: '.env' });
}

const command = process.argv[2] || 'all';

async function main() {
  console.log('🚀 SkillNusa Database Seeding Script - Enhanced Version');
  console.log('========================================================');
  
  // Validate Firebase configuration
  const requiredEnvVars = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN', 
    'REACT_APP_FIREBASE_PROJECT_ID'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required Firebase environment variables:');
    missingVars.forEach(varName => console.error(`   ${varName}`));
    console.error('\n💡 Make sure you have a .env.local or .env file with Firebase configuration.');
    console.error('   Check the README.md for setup instructions.');
    process.exit(1);
  }
  
  console.log('✅ Environment variables loaded successfully');
  console.log(`🔥 Firebase Project: ${process.env.REACT_APP_FIREBASE_PROJECT_ID}`);
  
  try {
    // Dynamic import of seeding functions after environment is loaded
    const { seedAllData, seedUsers, seedGigs, seedReviews, seedOrders } = await import('./seedData.js');
    
    switch (command) {
      case 'users':
        console.log('📦 Seeding users (10 freelancers + 5 clients)...');
        await seedUsers();
        break;
      case 'gigs':
        console.log('📦 Seeding 20 gigs across multiple categories...');
        await seedGigs();
        break;
      case 'reviews':
        console.log('📦 Seeding 30 reviews for all gigs...');
        await seedReviews();
        break;
      case 'orders':
        console.log('📦 Seeding sample orders...');
        await seedOrders();
        break;
      case 'all':
      default:
        console.log('📦 Seeding all data...');
        await seedAllData();
        break;
    }
    
    console.log('\n🎉 Seeding completed successfully!');
    console.log('💡 You can now visit /seeding to run the web interface');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error('💭 Please check your Firebase configuration and try again');
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

main(); 