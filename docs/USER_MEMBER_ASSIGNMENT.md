# User-Member Assignment Feature

## Overview
This enhancement allows administrators to link user accounts with member records in the Investment Club system. This enables proper access control where a user login can be associated with a specific member's data.

## Changes Made

### 1. Database Schema
**File:** `sql/add_user_member_link.sql`

- Ensures `user_id` column exists in `members` table
- Adds unique constraint (one member per user)
- Creates index for performance
- Foreign key references `auth.users(id)`

**To Apply:**
Run this SQL in your Supabase SQL Editor:
```sql
-- See sql/add_user_member_link.sql
```

### 2. Backend Service Updates
**File:** `api/userService.js`

Added two new methods:
- `assignUserToMember(userId, memberId)` - Links a user to a member
- `getMemberByUserId(userId)` - Retrieves member assigned to a user

### 3. Frontend Updates
**File:** `pages/UserManagement.jsx`

**Changes:**
- Added `members` state to store all members
- Fetches members list on component mount
- Updated `handleEditUser` to check if user is already assigned to a member
- Updated `handleUpdateUser` to save member assignment
- Added member dropdown in Edit User modal

**New UI Element:**
- "Assign to Member" dropdown in Edit User modal
- Shows only unassigned members (or currently assigned member)
- Displays "(Currently Assigned)" label for already linked members

## How to Use

1. **Run the SQL Migration:**
   - Open Supabase Dashboard → SQL Editor
   - Copy and run the contents of `sql/add_user_member_link.sql`

2. **Assign User to Member:**
   - Go to User Management screen
   - Click "Edit" on any user
   - Select a member from "Assign to Member" dropdown
   - Click "Update User"

3. **View Assignment:**
   - The dropdown will show "(Currently Assigned)" for linked members
   - Only unassigned members appear in the dropdown (prevents conflicts)

## Benefits

- **Access Control:** Users can only access data related to their assigned member
- **Data Integrity:** One-to-one relationship ensures clean data
- **Audit Trail:** Track which user account belongs to which member
- **Flexible:** Can assign/reassign members as needed

## Database Constraints

- **Unique Constraint:** Each member can only be assigned to one user
- **Foreign Key:** Ensures referential integrity with auth.users
- **ON DELETE SET NULL:** If user is deleted, member record remains but user_id is cleared

## Future Enhancements

- Show assigned member name in user list table
- Filter members by assigned/unassigned status
- Bulk assignment feature
- Auto-suggest member based on email match
