const { fullClean } = require('./src/scripts/cleanDatabase.js');

console.log('🚀 Starting database cleanup...');

fullClean()
  .then(() => {
    console.log('✅ Database cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database cleanup failed:', error);
    process.exit(1);
  }); 