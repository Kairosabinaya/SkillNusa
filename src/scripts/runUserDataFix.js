/**
 * Runner script for User Data Consistency Fix
 * Execute this script to fix user data redundancy and consistency issues
 */

import UserDataConsistencyFixer from './fixUserDataConsistency.js';

async function runFix() {
  console.log('🚀 Starting User Data Consistency Fix...\n');
  
  try {
    const fixer = new UserDataConsistencyFixer();
    
    // First, run analysis to see what needs to be fixed
    console.log('Step 1: Analyzing current data...');
    const analysis = await fixer.analyzeOnly();
    
    if (analysis.usersNeedingFixes === 0) {
      console.log('✅ All user data is already consistent! No fixes needed.');
      return;
    }
    
    // Ask for confirmation (in a real scenario, you might want to add user input)
    console.log(`\n⚠️  Found ${analysis.usersNeedingFixes} users that need fixes.`);
    console.log('Proceeding with fixes...\n');
    
    // Step 2: Apply fixes
    console.log('Step 2: Applying fixes...');
    const results = await fixer.fixAllUsers();
    
    console.log('\n🎉 User data consistency fix completed successfully!');
    console.log(`📊 Summary: ${results.migratedUsers}/${results.totalUsers} users migrated`);
    
    if (results.errors.length > 0) {
      console.log('\n⚠️  Some errors occurred during migration:');
      results.errors.forEach(error => console.log(`  - ${error}`));
    }
    
  } catch (error) {
    console.error('❌ Error running user data fix:', error);
    process.exit(1);
  }
}

// Run the fix
runFix().catch(console.error); 