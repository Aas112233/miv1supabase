# Quick Reference - Enhanced User Management

## 🎯 User Roles

| Role | Color | Use Case |
|------|-------|----------|
| **Admin** | Red | Full system access, manages users |
| **Manager** | Orange | Operational management, team oversight |
| **Accountant** | Green | Financial operations, reporting |
| **Member** | Blue | Basic access, view-only by default |

## 🔐 Permission Levels

| Level | Can Do |
|-------|--------|
| **Read** | View data, access reports |
| **Write** | Read + Create, Edit, Delete |
| **Manage** | Write + Advanced settings, bulk operations |

## 📱 Screen Names

```javascript
'dashboard'      // Dashboard
'members'        // Members
'payments'       // Payments
'expenses'       // Expenses
'projects'       // Projects
'transactions'   // Transactions
'requests'       // Transaction Requests
'reports'        // Reports
'analytics'      // Analytics
'dividends'      // Dividends
'funds'          // Funds
'goals'          // Goals
'master_data'    // Master Data
'settings'       // Settings
'profile'        // User Management
```

## 💻 Code Snippets

### Hide Sidebar Menu Items
```javascript
import { hasPermission } from './PermissionChecker';

const canAccess = (screenName) => {
  return hasPermission(currentUser, screenName, 'read');
};

{canAccess('master_data') && (
  <li><Link to="/master-data">Master Data</Link></li>
)}
```

### Check Write Permission
```javascript
import { hasWritePermission } from '../components/PermissionChecker';

{hasWritePermission(currentUser, 'members') && (
  <button onClick={handleEdit}>Edit</button>
)}
```

### Check Any Permission
```javascript
import { hasPermission } from '../components/PermissionChecker';

const canRead = hasPermission(currentUser, 'members', 'read');
const canWrite = hasPermission(currentUser, 'members', 'write');
const canManage = hasPermission(currentUser, 'members', 'manage');
```

### Use Permissions Hook
```javascript
import usePermissions from '../hooks/usePermissions';

const { canRead, canWrite, canManage } = usePermissions(currentUser, 'members');
```

## 🗄️ SQL Commands

### Run Migration
```sql
\i sql/add_new_user_roles.sql
```

### Check Roles
```sql
SELECT id, email, name, role FROM user_profiles;
```

### Update User Role
```sql
UPDATE user_profiles SET role = 'manager' WHERE email = 'user@example.com';
```

### Check Permissions
```sql
SELECT * FROM user_permissions WHERE user_id = 'user-uuid';
```

## 🎨 CSS Classes

### Role Badges
```css
.role-badge--admin      /* Red */
.role-badge--manager    /* Orange */
.role-badge--accountant /* Green */
.role-badge--member     /* Blue */
```

### Button Styles
```css
.btn--primary    /* Blue */
.btn--secondary  /* Gray */
.btn--danger     /* Red */
.btn--info       /* Cyan */
.btn--success    /* Green */
```

## 📂 File Locations

### Core Files
- `pages/UserManagement.jsx` - Main user management page
- `components/PermissionChecker.jsx` - Permission helper functions
- `hooks/usePermissions.js` - Permission checking hook
- `sql/add_new_user_roles.sql` - Database migration

### Documentation
- `docs/ENHANCED_PERMISSIONS_GUIDE.md` - Complete guide
- `docs/APPLY_PERMISSIONS_TO_PAGES.md` - Implementation guide
- `USER_MANAGEMENT_ENHANCEMENTS_SUMMARY.md` - Summary
- `IMPLEMENTATION_CHECKLIST.md` - Task checklist

## 🔧 Common Tasks

### Create User with Role
1. Go to User Management
2. Click "Create User"
3. Fill in details
4. Select role from dropdown
5. Click "Create User"

### Assign Permissions
1. Go to User Management
2. Click "Manage Access" for user
3. Select role
4. Check/uncheck permissions
5. Click "Save Permissions"

### Apply to Page
1. Import `hasWritePermission`
2. Wrap edit/delete buttons
3. Test with different roles

## 🧪 Quick Test

```javascript
// Test in browser console
console.log('Current User:', currentUser);
console.log('Role:', currentUser.role);
console.log('Permissions:', currentUser.permissions);
console.log('Can Write Members:', 
  currentUser.permissions?.members?.write || currentUser.role === 'admin'
);
```

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| Buttons not showing | Check write permission |
| Changes not applying | Log out and log back in |
| Admin can't access | Verify role is 'admin' |
| Database error | Run migration script |

## 📞 Quick Links

- [Full Documentation](docs/ENHANCED_PERMISSIONS_GUIDE.md)
- [Implementation Guide](docs/APPLY_PERMISSIONS_TO_PAGES.md)
- [Checklist](IMPLEMENTATION_CHECKLIST.md)
- [Summary](USER_MANAGEMENT_ENHANCEMENTS_SUMMARY.md)

## 💡 Best Practices

1. ✅ Always check permissions before rendering buttons
2. ✅ Use exact screen names from reference
3. ✅ Test with multiple user roles
4. ✅ Validate on backend as well
5. ✅ Document custom permission logic
6. ✅ Keep permissions consistent
7. ✅ Audit permission changes regularly

## 🎯 Default Permission Sets

### Manager
```
Dashboard: read, write
Members: read, write, manage
Payments: read, write
Expenses: read, write
Projects: read, write, manage
```

### Accountant
```
Dashboard: read
Payments: read, write, manage
Expenses: read, write, manage
Transactions: read, write, manage
Reports: read, write
Dividends: read, write, manage
Funds: read, write, manage
```

### Member
```
Dashboard: read
All others: read (or no access)
```

---

**Remember:** Admin users bypass all permission checks!
