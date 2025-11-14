# Route to Permission Mapping

## ✅ Fixed Routes

| Route Path | Screen Name | Status |
|------------|-------------|--------|
| `/dashboard` | `dashboard` | ✅ Correct |
| `/members` | `members` | ✅ Correct |
| `/payments` | `payments` | ✅ Correct |
| `/expenses` | `expenses` | ✅ Correct |
| `/projects` | `projects` | ✅ Correct |
| `/transactions` | `transactions` | ✅ Correct |
| `/analytics` | `analytics` | ✅ Correct |
| `/requests` | `requests` | ✅ Correct |
| `/profile` | `profile` | ✅ Correct |
| `/master-data` | `master_data` | ✅ **FIXED** (was `settings`) |
| `/settings` | `settings` | ✅ Correct |
| `/reports` | `reports` | ✅ Correct |
| `/dividends` | `dividends` | ✅ Correct |
| `/budget` | `goals` | ✅ **FIXED** (was `budget`) |
| `/funds` | `funds` | ✅ Correct |

## 🔍 How to Verify

### Test Master Data Access
1. Create a test user without `master_data` read permission
2. Log in as that user
3. Try to access `/master-data` route
4. Should see "Not Authorized" page

### Test Goals/Budget Access
1. Create a test user without `goals` read permission
2. Log in as that user
3. Try to access `/budget` route
4. Should see "Not Authorized" page

## 🛡️ Permission Check Flow

```
User navigates to /master-data
    ↓
ProtectedRoute checks currentUser
    ↓
Is user logged in? → No → Redirect to /login
    ↓
Is user admin? → Yes → Allow access
    ↓
Check permissions.master_data.read → No → Show NotAuthorized
    ↓
Has permission → Yes → Show MasterData page
```

## 📝 Screen Names Reference

These are the exact screen names used in UserManagement.jsx:

```javascript
'dashboard'      // Dashboard page
'members'        // Members management
'payments'       // Payment tracking
'expenses'       // Expense management
'projects'       // Project management
'transactions'   // Transaction history
'requests'       // Transaction requests
'reports'        // Financial reports
'analytics'      // Analytics dashboard
'dividends'      // Dividend distribution
'funds'          // Fund management
'goals'          // Goals/Budget (route: /budget)
'master_data'    // Master data (route: /master-data)
'settings'       // Application settings
'profile'        // User management
```

## ⚠️ Important Notes

1. **Route path ≠ Screen name**: The URL path can be different from the permission screen name
   - Example: `/master-data` uses `master_data` permission
   - Example: `/budget` uses `goals` permission

2. **Admin bypass**: Admin users bypass all permission checks in ProtectedRoute

3. **Default permission**: ProtectedRoute checks for `read` permission by default

4. **No permission**: Users without read permission see NotAuthorized page

## 🧪 Testing Script

```javascript
// Test in browser console after logging in
const testPermissions = () => {
  console.log('Current User:', currentUser);
  console.log('Role:', currentUser.role);
  console.log('Permissions:', currentUser.permissions);
  
  // Test specific screens
  const screens = ['dashboard', 'members', 'master_data', 'goals', 'settings'];
  screens.forEach(screen => {
    const hasAccess = currentUser.role === 'admin' || 
                     currentUser.permissions?.[screen]?.read;
    console.log(`${screen}: ${hasAccess ? '✅ Access' : '❌ No Access'}`);
  });
};

testPermissions();
```

## 🔧 Quick Fix for Other Routes

If you find more routes with incorrect screen names:

```javascript
// Wrong
<ProtectedRoute currentUser={currentUser} screenName="wrong_name">

// Correct - use exact name from UserManagement.jsx screens array
<ProtectedRoute currentUser={currentUser} screenName="correct_name">
```

## ✅ Verification Checklist

- [x] Master Data route fixed (`master_data`)
- [x] Budget/Goals route fixed (`goals`)
- [x] Sidebar menu items hidden based on permissions
- [ ] Test with user without master_data permission
- [ ] Test with user without goals permission
- [ ] Verify NotAuthorized page appears
- [ ] Verify admin can access all routes
- [ ] Verify sidebar only shows accessible menu items
