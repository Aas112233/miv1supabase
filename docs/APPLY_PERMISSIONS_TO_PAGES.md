# Quick Guide: Apply Permissions to All Pages

## Step-by-Step Implementation

### 1. Import Permission Checker
At the top of your page component:
```javascript
import { hasWritePermission } from '../components/PermissionChecker';
```

### 2. Wrap Add/Create Buttons
```javascript
// Before
<button onClick={() => setShowForm(true)}>
  Add New Item
</button>

// After
{hasWritePermission(currentUser, 'screenName') && (
  <button onClick={() => setShowForm(true)}>
    Add New Item
  </button>
)}
```

### 3. Wrap Edit/Update/Delete Buttons
```javascript
// Before
<button onClick={() => handleEdit(item)}>Edit</button>
<button onClick={() => handleDelete(item)}>Delete</button>

// After
{hasWritePermission(currentUser, 'screenName') && (
  <>
    <button onClick={() => handleEdit(item)}>Edit</button>
    <button onClick={() => handleDelete(item)}>Delete</button>
  </>
)}
```

### 4. Keep View/Read Buttons Visible
```javascript
// These should always be visible (only read permission needed)
<button onClick={() => handleView(item)}>View Details</button>
```

## Screen Name Reference

Use these exact screen names for permission checks:

| Page/Component | Screen Name |
|----------------|-------------|
| Dashboard | `'dashboard'` |
| Members | `'members'` |
| Payments | `'payments'` |
| Expenses | `'expenses'` |
| Projects | `'projects'` |
| Transactions | `'transactions'` |
| Transaction Requests | `'requests'` |
| Reports | `'reports'` |
| Analytics | `'analytics'` |
| Dividends | `'dividends'` |
| Funds | `'funds'` |
| Goals | `'goals'` |
| Master Data | `'master_data'` |
| Settings | `'settings'` |
| User Management | `'profile'` |

## Example: Complete Page Implementation

```javascript
import React, { useState } from 'react';
import { hasWritePermission } from '../components/PermissionChecker';

const Payments = ({ currentUser }) => {
  const [showForm, setShowForm] = useState(false);
  
  return (
    <div className="payments">
      <div className="page-header">
        <h1>Payments</h1>
        {/* Add button - requires write permission */}
        {hasWritePermission(currentUser, 'payments') && (
          <button onClick={() => setShowForm(true)}>
            Add Payment
          </button>
        )}
      </div>
      
      <table>
        <tbody>
          {payments.map(payment => (
            <tr key={payment.id}>
              <td>{payment.description}</td>
              <td>{payment.amount}</td>
              <td>
                {/* View button - always visible */}
                <button onClick={() => handleView(payment)}>
                  View
                </button>
                
                {/* Edit/Delete - requires write permission */}
                {hasWritePermission(currentUser, 'payments') && (
                  <>
                    <button onClick={() => handleEdit(payment)}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(payment)}>
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

## Pages to Update

Apply permission checks to these pages:

- [ ] Payments.jsx
- [ ] Expenses.jsx
- [ ] Projects.jsx
- [ ] Transactions.jsx
- [ ] TransactionRequests.jsx
- [ ] Dividends.jsx
- [ ] Funds.jsx
- [ ] Goals.jsx
- [ ] MasterData.jsx
- [ ] Settings.jsx
- [ ] Analytics.jsx
- [ ] Reports.jsx

## Testing Checklist

For each page, test with different user roles:

1. **Admin User**
   - [ ] Can see all buttons
   - [ ] Can perform all actions

2. **User with Write Permission**
   - [ ] Can see edit/delete buttons
   - [ ] Can create new items
   - [ ] Can modify existing items

3. **User with Read-Only Permission**
   - [ ] Cannot see edit/delete buttons
   - [ ] Cannot see add/create buttons
   - [ ] Can only view data

4. **User without Permission**
   - [ ] Should be redirected or see "No Access" message
   - [ ] Cannot access the page at all

## Common Patterns

### Pattern 1: Action Buttons in Table
```javascript
<td>
  <button onClick={() => handleView(item)}>View</button>
  {hasWritePermission(currentUser, 'screenName') && (
    <>
      <button onClick={() => handleEdit(item)}>Edit</button>
      <button onClick={() => handleDelete(item)}>Delete</button>
    </>
  )}
</td>
```

### Pattern 2: Header Actions
```javascript
<div className="page-header">
  <h1>Page Title</h1>
  {hasWritePermission(currentUser, 'screenName') && (
    <button onClick={() => setShowForm(true)}>Add New</button>
  )}
</div>
```

### Pattern 3: Bulk Actions
```javascript
{hasWritePermission(currentUser, 'screenName') && selectedItems.length > 0 && (
  <div className="bulk-actions">
    <button onClick={handleBulkDelete}>Delete Selected</button>
    <button onClick={handleBulkUpdate}>Update Selected</button>
  </div>
)}
```

### Pattern 4: Form Submission
```javascript
// Still show the form, but disable submit button
<form onSubmit={handleSubmit}>
  {/* form fields */}
  <button 
    type="submit" 
    disabled={!hasWritePermission(currentUser, 'screenName')}
  >
    Save
  </button>
</form>
```

## Notes

- Always pass the correct `currentUser` prop to components
- Use exact screen names as defined in UserManagement.jsx
- Test thoroughly with different user roles
- Consider adding tooltips explaining why buttons are hidden
- Backend validation is still required for security
