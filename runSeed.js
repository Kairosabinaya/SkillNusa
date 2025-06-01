import { seedDatabase, seedAllData } from './src/scripts/seedData.js';

async function runSeeding() {
  try {
    console.log('🌱 Starting database seeding from command line...');
    await seedAllData();
    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
runSeeding(); 