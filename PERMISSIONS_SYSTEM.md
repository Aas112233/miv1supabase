# Database-Driven Permissions System

## Overview
User permissions are now stored in the database and checked on every screen access.

## Database Schema

### Table: `user_permissions`
```sql
- id: bigint (primary key)
- user_id: uuid (references auth.users)
- screen_name: text (dashboard, members, payments, etc.)
- can_read: boolean
- can_write: boolean
- can_manage: boolean
- created_at: timestamp
- updated_at: timestamp
```

## Setup Instructions

### 1. Run Database Migration
Execute in Supabase SQL Editor:
```bash
create_user_permissions_table.sql
```

This will:
- Create `user_permissions` table
- Set up RLS policies
- Create indexes
- Insert default permissions for existing users

## How It Works

### Permission Flow
1. User logs in
2. System loads permissions from `user_permissions` table
3. Permissions stored in `currentUser.permissions` object
4. Each screen checks permissions before rendering
5. Admin can modify permissions in User Management

### Permission Levels
- **Read**: View screen content
- **Write**: Create/edit/delete data
- **Manage**: Full control (admin-level)

### Admin Override
Admins always have full access to all screens, regardless of database permissions.

## API Methods

### PermissionsService
```javascript
// Get user permissions
permissionsService.getUserPermissions(userId)

// Save user permissions
permissionsService.saveUserPermissions(userId, permissions)

// Check specific permission
permissionsService.checkPermission(userId, screenName, permissionType)
```

## Usage in Components

### Check Permission
```javascript
import { hasPermission, hasWritePermission } from '../components/PermissionChecker';

// Check read permission
if (hasPermission(currentUser, 'members', 'read')) {
  // Show content
}

// Check write permission
if (hasWritePermission(currentUser, 'members')) {
  // Show edit button
}
```

### Protected Routes
```javascript
<ProtectedRoute 
  currentUser={currentUser} 
  screenName="members"
  requiredPermission="read"
>
  <Members />
</ProtectedRoute>
```

## Managing Permissions

### Admin Interface
1. Go to User Management
2. Click "Manage Role" for a user
3. Toggle permissions for each screen
4. Click "Save Permissions"
5. Changes saved to database immediately

### Default Permissions
New users get read-only access to all screens by default.

## Available Screens
- dashboard
- members
- payments
- transactions
- requests
- reports
- dividends
- budget
- settings
- profile

## Security

### Row Level Security (RLS)
- Users can only view their own permissions
- Only admins can modify permissions
- All queries filtered by RLS policies

### Permission Checks
- Checked on route access (ProtectedRoute)
- Checked before showing UI elements
- Checked before API calls (recommended)

## Files Modified
1. `api/permissionsService.js` - New service
2. `create_user_permissions_table.sql` - Database schema
3. `App.jsx` - Load permissions on login
4. `pages/Login.jsx` - Load permissions after login
5. `pages/UserManagement.jsx` - Save permissions to database
6. `components/ProtectedRoute.jsx` - Check database permissions

## Testing

### Test Permission System
1. Create a test user
2. Set specific permissions (e.g., read-only for members)
3. Login as test user
4. Verify can only access allowed screens
5. Verify cannot see write/edit buttons

### Test Admin Override
1. Login as admin
2. Verify full access to all screens
3. Verify can manage all user permissions

## Benefits
✅ Granular control per user per screen
✅ Permissions stored in database
✅ Easy to audit and modify
✅ Scalable for future screens
✅ Admin override for flexibility
