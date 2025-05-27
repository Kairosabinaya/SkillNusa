const { cleanDatabase, quickClean, fullClean, fixNaming } = require('./cleanDatabase.js');

/**
 * Database Cleanup Runner
 * 
 * Usage examples:
 * - node src/scripts/runCleanup.js quick     // Clear all data except users
 * - node src/scripts/runCleanup.js full      // Clear ALL data including users  
 * - node src/scripts/runCleanup.js fix       // Fix naming inconsistencies only
 * - node src/scripts/runCleanup.js           // Default: fix naming and clear duplicates
 */

async function main() {
  const mode = process.argv[2] || 'default';
  
  console.log('🔧 Database Cleanup Tool');
  console.log('========================\n');
  
  try {
    switch (mode.toLowerCase()) {
      case 'quick':
        console.log('Running QUICK cleanup (preserves users)...\n');
        await quickClean();
        break;
        
      case 'full':
        console.log('Running FULL cleanup (removes everything)...\n');
        console.log('⚠️  WARNING: This will delete ALL data including user accounts!\n');
        await fullClean();
        break;
        
      case 'fix':
        console.log('Running naming consistency fix...\n');
        await fixNaming();
        break;
        
      default:
        console.log('Running default cleanup (fix naming + clear duplicates)...\n');
        await cleanDatabase();
        break;
    }
    
    console.log('\n🎉 Cleanup completed successfully!');
    console.log('\nYour database is now ready for fresh testing.');
    
  } catch (error) {
    console.error('\n💥 Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = main; 