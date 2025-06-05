/**
 * Script runner for updating default profile photos
 * Run this file with: node src/scripts/runDefaultProfilePhotoUpdate.js
 */

import { runDefaultProfilePhotoUpdate } from './updateDefaultProfilePhotos.js';

console.log('🚀 Starting Default Profile Photo Update Script...');
console.log('This script will update all users with NULL profilePhoto to use the default image.\n');

// Run the update
runDefaultProfilePhotoUpdate()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    console.log('All users with NULL profilePhoto now have the default profile image.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }); 