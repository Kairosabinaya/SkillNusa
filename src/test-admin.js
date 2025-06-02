// Test script for admin service
import adminService from './services/adminService';

// Test function to verify admin service
async function testAdminService() {
  try {
    console.log('Testing admin service...');
    
    // Test getting dashboard stats
    console.log('Getting dashboard stats...');
    const stats = await adminService.getDashboardStats();
    console.log('Dashboard stats:', stats);
    
    // Test getting all users
    console.log('Getting all users...');
    const users = await adminService.getAllUsers({ limit: 5 });
    console.log('Users:', users.length, 'found');
    
    // Test getting all gigs
    console.log('Getting all gigs...');
    const gigs = await adminService.getAllGigs({ limit: 5 });
    console.log('Gigs:', gigs.length, 'found');
    
    console.log('Admin service test completed successfully!');
  } catch (error) {
    console.error('Admin service test failed:', error);
  }
}

// Export for use in console
window.testAdminService = testAdminService;

export default testAdminService; 