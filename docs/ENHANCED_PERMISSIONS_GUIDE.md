# Enhanced User Management & Permissions System

## Overview
The enhanced user management system now supports multiple user roles with granular permission controls. Users can be assigned specific access levels (read, write, manage) for each screen/module in the application.

## User Roles

### 1. **Member** (Basic User)
- Default role for regular club members
- Limited access based on assigned permissions
- Can view data they have permission to see

### 2. **Manager** (Operational Manager)
- Manages day-to-day operations
- Typically has write access to operational modules
- Can manage members, payments, and projects

### 3. **Accountant** (Financial Manager)
- Focuses on financial operations
- Typically has write access to financial modules
- Can manage payments, expenses, transactions, and reports

### 4. **Admin** (System Administrator)
- Full access to all features
- Can manage users and permissions
- Bypasses all permission checks

## Permission Levels

### Read Permission
- View data in the module
- Access reports and analytics
- No modification capabilities

### Write Permission
- All read permissions
- Create new records
- Edit existing records
- Delete records
- **Controls visibility of Edit, Update, and Delete buttons**

### Manage Permission
- All write permissions
- Advanced configuration options
- Bulk operations
- System-level settings

## Available Screens/Modules

1. **Dashboard** - Overview and statistics
2. **Members** - Member management
3. **Payments** - Payment tracking
4. **Expenses** - Expense management
5. **Projects** - Project management
6. **Transactions** - Transaction history
7. **Requests** - Transaction requests
8. **Reports** - Financial reports
9. **Analytics** - Data analytics
10. **Dividends** - Dividend distribution
11. **Funds** - Fund management
12. **Goals** - Goal tracking
13. **Master Data** - System configuration
14. **Settings** - Application settings
15. **User Management** - User and permission management

## How Permissions Work

### Permission Hierarchy
```
Admin > Manage > Write > Read
```

### Button Visibility Rules
- **Add/Create buttons**: Require `write` permission
- **Edit buttons**: Require `write` permission
- **Update buttons**: Require `write` permission
- **Delete buttons**: Require `write` permission
- **View/Details buttons**: Require `read` permission
- **Manage Access buttons**: Require `manage` permission

### Implementation Example

```javascript
import { hasWritePermission } from '../components/PermissionChecker';

// In your component
{hasWritePermission(currentUser, 'members') && (
  <>
    <button onClick={handleEdit}>Edit</button>
    <button onClick={handleDelete}>Delete</button>
  </>
)}
```

## Setting Up Permissions

### 1. Database Migration
Run the SQL migration to add new roles:
```bash
psql -d your_database -f sql/add_new_user_roles.sql
```

### 2. Create Users with Roles
In the User Management screen:
1. Click "Create User"
2. Fill in user details
3. Select role: Member, Manager, Accountant, or Admin
4. Click "Create User"

### 3. Configure Permissions
For non-admin users:
1. Go to User Management
2. Click "Manage Access" for a user
3. Select the user's role
4. Check/uncheck permissions for each screen
5. Click "Save Permissions"

## Permission Checking in Code

### Using PermissionChecker Helper
```javascript
import { hasPermission, hasWritePermission, hasManagePermission } from '../components/PermissionChecker';

// Check any permission level
const canRead = hasPermission(currentUser, 'members', 'read');

// Check write permission (for edit/delete)
const canWrite = hasWritePermission(currentUser, 'members');

// Check manage permission
const canManage = hasManagePermission(currentUser, 'members');
```

### Using usePermissions Hook
```javascript
import usePermissions from '../hooks/usePermissions';

const MyComponent = ({ currentUser }) => {
  const { canRead, canWrite, canManage } = usePermissions(currentUser, 'members');
  
  return (
    <div>
      {canRead && <ViewData />}
      {canWrite && <EditButton />}
      {canManage && <AdvancedSettings />}
    </div>
  );
};
```

## Best Practices

### 1. Always Check Permissions
- Check permissions before rendering action buttons
- Validate permissions on the backend as well
- Never rely solely on frontend permission checks

### 2. Consistent Permission Naming
- Use the same screen names across the application
- Match screen IDs with route names when possible

### 3. Role-Based Defaults
When creating users, consider these default permission sets:

**Manager Role:**
- Dashboard: read, write
- Members: read, write, manage
- Payments: read, write
- Expenses: read, write
- Projects: read, write, manage
- Transactions: read
- Reports: read

**Accountant Role:**
- Dashboard: read
- Members: read
- Payments: read, write, manage
- Expenses: read, write, manage
- Transactions: read, write, manage
- Reports: read, write
- Dividends: read, write, manage
- Funds: read, write, manage

### 4. Security Considerations
- Admin users bypass all checks - assign carefully
- Regularly audit user permissions
- Remove access for inactive users
- Use manage permission for sensitive operations

## Troubleshooting

### Buttons Not Appearing
1. Check if user has `write` permission for the screen
2. Verify currentUser object has permissions loaded
3. Check console for permission-related errors

### Permission Changes Not Taking Effect
1. User may need to log out and log back in
2. Clear browser cache
3. Verify permissions were saved in database

### Admin Can't Access Everything
1. Verify user role is exactly 'admin' (lowercase)
2. Check if role-based bypass is implemented correctly

## API Reference

### Permission Service Methods
```javascript
// Get user permissions
const permissions = await permissionsService.getUserPermissions(userId);

// Save user permissions
await permissionsService.saveUserPermissions(userId, permissions);

// Update user role
await userService.updateUserRole(userId, role);
```

## Migration Checklist

- [ ] Run SQL migration for new roles
- [ ] Update UserManagement.jsx with new roles
- [ ] Update all pages to check write permissions for edit/delete buttons
- [ ] Test permission enforcement for each role
- [ ] Document role-specific workflows
- [ ] Train users on new permission system
