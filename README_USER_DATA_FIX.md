# User Data Consistency Fix

This document explains how to fix the user data redundancy and consistency issues in your Firestore database.

## Problem Summary

Your Firestore database has inconsistent user document structures due to multiple registration flows creating users with different field formats:

1. **Inconsistent identifiers**: Some users have `uid`, others have `id`
2. **Missing role fields**: Inconsistent `roles`, `activeRole`, `isFreelancer` fields
3. **Inconsistent field names**: `birthDate` vs `dateOfBirth`, `city` vs `location`
4. **Base64 profile photos**: Should be URLs instead
5. **Missing standard fields**: `isActive`, `isOnline`, etc.

## Solution Implemented

### 1. Standardized Schema (`src/schemas/userSchema.js`)
- Defines consistent user document structure
- Validates and sanitizes user data
- Ensures all users follow the same format

### 2. Centralized Registration Service (`src/services/registrationService.js`)
- Single point for all user registrations
- Prevents future inconsistencies
- Handles both legacy and modern registration flows

### 3. Migration Script (`src/scripts/fixUserDataConsistency.js`)
- Analyzes existing users for inconsistencies
- Automatically fixes data structure issues
- Provides detailed logging and results

## How to Run the Fix

### Step 1: Backup Your Database (IMPORTANT!)
Before running any fixes, make sure you have a recent backup of your Firestore database.

### Step 2: Analyze Current Data (Dry Run)
First, check what issues exist without making changes:

```bash
cd src/scripts
node -e "
import('./fixUserDataConsistency.js').then(module => {
  const fixer = new module.default();
  fixer.analyzeOnly().catch(console.error);
});
"
```

### Step 3: Run the Complete Fix
If you're satisfied with the analysis, run the full fix:

```bash
cd src/scripts
node runUserDataFix.js
```

Or manually:

```bash
cd src/scripts
node -e "
import('./fixUserDataConsistency.js').then(module => {
  const fixer = new module.default();
  fixer.fixAllUsers().catch(console.error);
});
"
```

### Step 4: Verify Results
After running the fix, check a few user documents in your Firestore console to verify they now have consistent structure:

**Expected structure for all users:**
```json
{
  "uid": "Firebase_Auth_UID",
  "email": "user@example.com",
  "username": "username",
  "displayName": "User Full Name",
  "roles": ["client"],
  "activeRole": "client",
  "isFreelancer": false,
  "profilePhoto": "https://... or null",
  "phoneNumber": "+62...",
  "dateOfBirth": "YYYY-MM-DD",
  "gender": "Male/Female",
  "location": "City",
  "bio": "User bio",
  "isActive": true,
  "emailVerified": true,
  "isOnline": false,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## What Gets Fixed

The migration script will automatically:

1. **✅ Migrate `id` to `uid`**: Ensures all users use Firebase Auth UID
2. **✅ Fix role structure**: Adds proper `roles` array and `activeRole`
3. **✅ Standardize field names**: `birthDate` → `dateOfBirth`, `city` → `location`
4. **✅ Add missing fields**: `isActive`, `isOnline`, proper timestamps
5. **✅ Convert base64 photos**: Sets to null (users will need to re-upload)
6. **✅ Ensure data types**: Proper boolean/string/array types

## After Running the Fix

### 1. Test Registration
Try registering a new user to ensure the new standardized registration process works correctly.

### 2. Test Login
Verify that existing users can still log in normally.

### 3. Profile Photos
Users with base64 profile photos (like your example user) will need to re-upload their photos as they'll be set to null.

### 4. Monitor for Issues
Check application logs for any issues with the new standardized structure.

## Prevention

The following changes ensure future consistency:

1. **All registration flows** now use `registrationService.js`
2. **Schema validation** prevents inconsistent data
3. **Centralized user creation** eliminates duplicate code paths

## Troubleshooting

### If the fix fails:
1. Check console logs for specific error messages
2. Ensure proper Firebase permissions
3. Run analysis mode first to identify issues
4. Contact developer for complex issues

### If users can't log in after fix:
1. Check if their email/username still exists
2. Verify `uid` field is correctly set
3. Check `isActive` field is true

### If profile data is missing:
The fix preserves existing data and only adds missing fields. Check the migration logs to see what was changed for specific users.

## Example Results

```
📊 Migration Results:
📈 Total users checked: 15
✅ Users migrated: 12
❌ Errors: 0

🔧 Applied fixes:
  - S3pHfkzOsRhTfL5jPN960ExW6a03: convert_base64_photo, add_is_online
  - user_client_1: migrate_id_to_uid, add_is_online
  - user_freelancer_007: fix_roles_array, add_active_role
```

This fix will resolve your data redundancy issues and ensure all future user registrations follow a consistent structure. 