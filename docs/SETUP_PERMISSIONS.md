# Quick Setup Guide - Permissions System

## Step 1: Run Database Migration

Open Supabase SQL Editor and execute:
```sql
-- File: create_user_permissions_table.sql
```

This creates the `user_permissions` table and sets up default permissions.

## Step 2: Clear Browser Cache

```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
```

## Step 3: Login Again

All users need to login again to load permissions from database.

## Step 4: Test Permissions

### As Admin:
1. Login as admin
2. Go to User Management
3. Click "Manage Role" on a user
4. Toggle permissions for different screens
5. Click "Save Permissions"
6. Logout

### As Regular User:
1. Login as the user you modified
2. Try accessing different screens
3. Verify permissions are enforced

## Expected Behavior

### With Read Permission:
- ✅ Can view screen
- ❌ Cannot see edit/create buttons
- ❌ Cannot modify data

### With Write Permission:
- ✅ Can view screen
- ✅ Can see edit/create buttons
- ✅ Can modify data

### With Manage Permission:
- ✅ Full access (like admin)

### Without Permission:
- ❌ Redirected to "Not Authorized" page

## Default Permissions

All existing users automatically get:
- ✅ Read access to all screens
- ❌ No write access
- ❌ No manage access

Admins always have full access regardless of database settings.

## Troubleshooting

### Issue: User can't access any screens
- Check if permissions exist in database
- Run the migration again
- Verify user_id matches auth.users

### Issue: Changes not taking effect
- Clear browser cache
- Logout and login again
- Check browser console for errors

### Issue: Admin can't save permissions
- Verify admin role in user_profiles table
- Check RLS policies are enabled
- Check browser console for errors

## Quick Test

```sql
-- Check user permissions
SELECT * FROM user_permissions WHERE user_id = 'USER_UUID';

-- Check user role
SELECT * FROM user_profiles WHERE id = 'USER_UUID';
```

## Done! ✅

Your permissions system is now database-driven and fully functional.
