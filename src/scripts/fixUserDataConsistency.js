/**
 * Fix User Data Consistency Script
 * This script migrates all existing user documents to follow the standardized schema
 */

import { db } from '../firebase/config';
import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { COLLECTIONS } from '../utils/constants';
import { validateUserData } from '../schemas/userSchema';

class UserDataConsistencyFixer {
  constructor() {
    this.results = {
      totalUsers: 0,
      migratedUsers: 0,
      errors: [],
      fixes: []
    };
  }

  /**
   * Fix all user documents to follow standardized schema
   */
  async fixAllUsers() {
    try {
      console.log('🔧 Starting user data consistency fix...');
      
      // Get all users
      const usersRef = collection(db, COLLECTIONS.USERS);
      const snapshot = await getDocs(usersRef);
      
      this.results.totalUsers = snapshot.size;
      console.log(`📊 Found ${this.results.totalUsers} users to check`);

      // Process users in batches
      const batch = writeBatch(db);
      let batchCount = 0;
      const BATCH_SIZE = 450; // Firestore limit is 500 operations per batch

      for (const userDoc of snapshot.docs) {
        try {
          const userId = userDoc.id;
          const currentData = userDoc.data();
          
          console.log(`🔍 Checking user: ${userId}`);
          
          // Check if user needs migration
          const fixes = this.analyzeUserData(currentData, userId);
          
          if (fixes.length > 0) {
            // Apply fixes
            const fixedData = this.applyFixes(currentData, userId, fixes);
            
            // Add to batch
            batch.update(doc(db, COLLECTIONS.USERS, userId), {
              ...fixedData,
              updatedAt: serverTimestamp()
            });
            
            batchCount++;
            this.results.migratedUsers++;
            this.results.fixes.push(`${userId}: ${fixes.join(', ')}`);
            
            console.log(`✅ Fixed user ${userId}: ${fixes.join(', ')}`);
            
            // Execute batch if reaching limit
            if (batchCount >= BATCH_SIZE) {
              await batch.commit();
              console.log(`📦 Committed batch of ${batchCount} users`);
              batchCount = 0;
            }
          } else {
            console.log(`✅ User ${userId} is already consistent`);
          }
          
        } catch (error) {
          console.error(`❌ Error processing user ${userDoc.id}:`, error);
          this.results.errors.push(`${userDoc.id}: ${error.message}`);
        }
      }

      // Commit remaining batch
      if (batchCount > 0) {
        await batch.commit();
        console.log(`📦 Committed final batch of ${batchCount} users`);
      }

      console.log('✅ User data consistency fix completed!');
      this.printResults();
      
      return this.results;

    } catch (error) {
      console.error('❌ Error in user data consistency fix:', error);
      throw error;
    }
  }

  /**
   * Analyze user data and identify issues
   * @param {Object} userData - Current user data
   * @param {string} userId - User ID
   * @returns {Array} List of issues found
   */
  analyzeUserData(userData, userId) {
    const issues = [];

    // Issue 1: Missing uid field or using 'id' instead of 'uid'
    if (!userData.uid) {
      if (userData.id) {
        issues.push('migrate_id_to_uid');
      } else {
        issues.push('add_missing_uid');
      }
    }

    // Issue 2: Missing or inconsistent role fields
    if (!userData.roles || !Array.isArray(userData.roles)) {
      issues.push('fix_roles_array');
    }
    if (!userData.activeRole) {
      issues.push('add_active_role');
    }
    if (userData.isFreelancer === undefined) {
      issues.push('add_is_freelancer_flag');
    }

    // Issue 3: Inconsistent field names
    if (userData.birthDate && !userData.dateOfBirth) {
      issues.push('migrate_birth_date');
    }
    if (userData.city && !userData.location) {
      issues.push('migrate_city_to_location');
    }
    if (userData.fullName && !userData.displayName) {
      issues.push('migrate_full_name_to_display_name');
    }

    // Issue 4: Missing standard fields
    if (userData.isActive === undefined) {
      issues.push('add_is_active');
    }
    if (userData.isOnline === undefined) {
      issues.push('add_is_online');
    }

    // Issue 5: Base64 profile photos (should be URLs)
    if (userData.profilePhoto && userData.profilePhoto.startsWith('data:image/')) {
      issues.push('convert_base64_photo');
    }

    return issues;
  }

  /**
   * Apply fixes to user data
   * @param {Object} currentData - Current user data
   * @param {string} userId - User ID
   * @param {Array} fixes - List of fixes to apply
   * @returns {Object} Fixed user data
   */
  applyFixes(currentData, userId, fixes) {
    let fixedData = { ...currentData };

    fixes.forEach(fix => {
      switch (fix) {
        case 'migrate_id_to_uid':
          fixedData.uid = currentData.id;
          delete fixedData.id;
          break;

        case 'add_missing_uid':
          fixedData.uid = userId;
          break;

        case 'fix_roles_array':
          // Determine role based on existing data
          if (currentData.isFreelancer === true) {
            fixedData.roles = ['freelancer'];
          } else {
            fixedData.roles = ['client'];
          }
          break;

        case 'add_active_role':
          if (currentData.isFreelancer === true) {
            fixedData.activeRole = 'freelancer';
          } else {
            fixedData.activeRole = 'client';
          }
          break;

        case 'add_is_freelancer_flag':
          // Check if user has freelancer role
          if (currentData.roles && currentData.roles.includes('freelancer')) {
            fixedData.isFreelancer = true;
          } else {
            fixedData.isFreelancer = false;
          }
          break;

        case 'migrate_birth_date':
          fixedData.dateOfBirth = currentData.birthDate;
          delete fixedData.birthDate;
          break;

        case 'migrate_city_to_location':
          fixedData.location = currentData.city;
          delete fixedData.city;
          break;

        case 'migrate_full_name_to_display_name':
          if (!fixedData.displayName) {
            fixedData.displayName = currentData.fullName;
          }
          break;

        case 'add_is_active':
          fixedData.isActive = true;
          break;

        case 'add_is_online':
          fixedData.isOnline = false;
          break;

        case 'convert_base64_photo':
          // For base64 photos, we'll set to null since we can't convert them
          // Users will need to re-upload their photos
          fixedData.profilePhoto = null;
          console.warn(`⚠️  Base64 photo converted to null for user ${userId} - user will need to re-upload`);
          break;
      }
    });

    // Ensure all required fields exist
    const requiredDefaults = {
      email: fixedData.email || '',
      username: fixedData.username || '',
      displayName: fixedData.displayName || fixedData.username || '',
      roles: fixedData.roles || ['client'],
      activeRole: fixedData.activeRole || 'client',
      isFreelancer: Boolean(fixedData.isFreelancer),
      profilePhoto: fixedData.profilePhoto || null,
      phoneNumber: fixedData.phoneNumber || '',
      dateOfBirth: fixedData.dateOfBirth || '',
      gender: fixedData.gender || '',
      location: fixedData.location || '',
      bio: fixedData.bio || '',
      isActive: fixedData.isActive !== undefined ? Boolean(fixedData.isActive) : true,
      emailVerified: Boolean(fixedData.emailVerified),
      isOnline: Boolean(fixedData.isOnline)
    };

    return { ...fixedData, ...requiredDefaults };
  }

  /**
   * Print migration results
   */
  printResults() {
    console.log('\n📊 Migration Results:');
    console.log(`📈 Total users checked: ${this.results.totalUsers}`);
    console.log(`✅ Users migrated: ${this.results.migratedUsers}`);
    console.log(`❌ Errors: ${this.results.errors.length}`);
    
    if (this.results.fixes.length > 0) {
      console.log('\n🔧 Applied fixes:');
      this.results.fixes.forEach(fix => console.log(`  - ${fix}`));
    }
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.results.errors.forEach(error => console.log(`  - ${error}`));
    }
  }

  /**
   * Test mode - just analyze without making changes
   */
  async analyzeOnly() {
    try {
      console.log('🔍 Analyzing user data consistency (dry run)...');
      
      const usersRef = collection(db, COLLECTIONS.USERS);
      const snapshot = await getDocs(usersRef);
      
      const analysis = {
        totalUsers: snapshot.size,
        usersNeedingFixes: 0,
        issueTypes: {},
        userIssues: []
      };

      for (const userDoc of snapshot.docs) {
        const userId = userDoc.id;
        const currentData = userDoc.data();
        const issues = this.analyzeUserData(currentData, userId);
        
        if (issues.length > 0) {
          analysis.usersNeedingFixes++;
          analysis.userIssues.push(`${userId}: ${issues.join(', ')}`);
          
          // Count issue types
          issues.forEach(issue => {
            analysis.issueTypes[issue] = (analysis.issueTypes[issue] || 0) + 1;
          });
        }
      }

      console.log('\n📊 Analysis Results:');
      console.log(`📈 Total users: ${analysis.totalUsers}`);
      console.log(`🔧 Users needing fixes: ${analysis.usersNeedingFixes}`);
      
      console.log('\n📋 Issue types found:');
      Object.entries(analysis.issueTypes).forEach(([issue, count]) => {
        console.log(`  - ${issue}: ${count} users`);
      });

      if (analysis.userIssues.length > 0) {
        console.log('\n📝 Detailed issues:');
        analysis.userIssues.forEach(issue => console.log(`  - ${issue}`));
      }

      return analysis;

    } catch (error) {
      console.error('❌ Error in analysis:', error);
      throw error;
    }
  }
}

// Export the class for use in other scripts
export default UserDataConsistencyFixer;

// If running directly
if (typeof require !== 'undefined' && require.main === module) {
  const fixer = new UserDataConsistencyFixer();
  
  // Check command line arguments
  const args = process.argv.slice(2);
  const isAnalyzeOnly = args.includes('--analyze') || args.includes('--dry-run');
  
  if (isAnalyzeOnly) {
    fixer.analyzeOnly().catch(console.error);
  } else {
    fixer.fixAllUsers().catch(console.error);
  }
} 