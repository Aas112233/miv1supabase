# User Management & Device Control - Complete Implementation Guide

## Overview
Complete user management system with member linking, device tracking, and access control for the Investment Club application.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [File Structure](#file-structure)
4. [Features](#features)
5. [Implementation Details](#implementation-details)
6. [Usage Guide](#usage-guide)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    User Management System                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   User       │  │   Member     │  │   Device     │      │
│  │ Accounts     │◄─┤   Linking    │  │  Management  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         ▼                  ▼                  ▼              │
│  ┌──────────────────────────────────────────────────┐      │
│  │            Supabase Database                      │      │
│  │  • user_profiles                                  │      │
│  │  • members (with user_id)                         │      │
│  │  • user_sessions                                  │      │
│  │  • user_permissions                               │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Tables Created/Modified

#### 1. **user_profiles**
```sql
- id (UUID, PK) → References auth.users
- email (TEXT, UNIQUE)
- name (TEXT)
- role (TEXT) → 'admin' or 'member'
- access_blocked (BOOLEAN) → User-level blocking
- blocked_at (TIMESTAMPTZ)
- blocked_by (UUID)
- block_reason (TEXT)
- created_at, updated_at, last_login
```

#### 2. **members**
```sql
- id (BIGINT, PK)
- name, email, phone, address
- user_id (UUID) → Links to auth.users (UNIQUE)
- share_amount, join_date, status
- created_at, updated_at
```

#### 3. **user_sessions**
```sql
- id (UUID, PK)
- user_id (UUID) → References auth.users
- device_name, device_type, browser, os
- ip_address, user_agent
- is_active (BOOLEAN)
- device_blocked (BOOLEAN) → Device-level blocking
- block_reason (TEXT)
- last_activity, created_at
- terminated_at, terminated_by
```

#### 4. **user_permissions**
```sql
- id (BIGINT, PK)
- user_id (UUID)
- screen_name (TEXT)
- can_read, can_write, can_manage (BOOLEAN)
- created_at, updated_at
```

---

## File Structure

### SQL Schema Files

| File | Purpose | When to Run |
|------|---------|-------------|
| `sql/add_user_member_link.sql` | Adds user_id to members table | Once, at setup |
| `sql/user_access_control.sql` | User-level blocking (access_blocked) | Once, at setup |
| `sql/device_blocking.sql` | Device-level blocking | Once, at setup |
| `sql/device_management_schema.sql` | Session tracking tables | Once, at setup |

### Backend Services

| File | Purpose | Key Methods |
|------|---------|-------------|
| `api/userService.js` | User CRUD operations | `getAllUsers()`, `updateUserProfile()`, `assignUserToMember()`, `getMemberByUserId()` |
| `api/sessionService.js` | Device/session management | `createSession()`, `terminateSession()`, `blockUserAccess()`, `checkDeviceBlocked()` |
| `api/authService.js` | Authentication & blocking checks | `login()`, `logout()` |
| `api/membersService.js` | Member operations | `getAllMembers()`, `updateMember()` |
| `api/permissionsService.js` | Permission management | `getUserPermissions()`, `saveUserPermissions()` |

### Frontend Components

| File | Purpose | Key Features |
|------|---------|--------------|
| `pages/UserManagement.jsx` | Main user management UI | User list, Edit user, Manage access, Device management |
| `pages/Members.jsx` | Member management | Shows assigned user, Create user for member |
| `pages/Login.jsx` | Login with blocking checks | Device blocking detection, Enhanced error messages |
| `App.jsx` | Session monitoring | Auto-logout on termination |

---

## Features

### 1. User-Member Linking

**Purpose:** Link user accounts to member records for proper access control.

**Files Involved:**
- `sql/add_user_member_link.sql` - Database schema
- `api/userService.js` - `assignUserToMember()`, `getMemberByUserId()`
- `pages/UserManagement.jsx` - Edit user modal with member dropdown
- `pages/Members.jsx` - Shows assigned user email

**How It Works:**
1. Admin edits user in User Management
2. Selects member from dropdown
3. `user_id` stored in members table
4. Member screen shows assigned user email

**Database:**
```sql
members.user_id → auth.users.id (UNIQUE constraint)
```

---

### 2. Device Management & Tracking

**Purpose:** Track all user login sessions and devices for security.

**Files Involved:**
- `sql/device_management_schema.sql` - Session tracking
- `api/sessionService.js` - Session CRUD operations
- `api/authService.js` - Auto-create session on login
- `pages/UserManagement.jsx` - Device management modal

**How It Works:**
1. User logs in → Session created automatically
2. Captures: IP, Browser, OS, Device Type, User Agent
3. Admin clicks "Devices" button → See all sessions
4. Admin can terminate or block devices

**Session Data Captured:**
- IP Address (via ipify.org API)
- Browser (Chrome, Firefox, Safari, etc.)
- Operating System (Windows, macOS, Linux, Android, iOS)
- Device Type (Desktop, Mobile, Tablet)
- Last Activity timestamp

---

### 3. User-Level Access Control

**Purpose:** Block entire user account from all devices.

**Files Involved:**
- `sql/user_access_control.sql` - User blocking schema
- `api/sessionService.js` - `blockUserAccess()`, `unblockUserAccess()`
- `api/authService.js` - Check on login
- `pages/UserManagement.jsx` - Block/Unblock buttons
- `pages/Login.jsx` - Blocked user message

**How It Works:**
1. Admin clicks "Block User Access" in Device Management
2. Enters reason
3. All sessions terminated + `access_blocked = true`
4. User cannot login from ANY device
5. Shows: "Your access has been terminated. Please contact administrator."

**Database:**
```sql
user_profiles.access_blocked = true
→ Prevents ALL logins
```

---

### 4. Device-Level Access Control

**Purpose:** Block specific device/IP from logging in.

**Files Involved:**
- `sql/device_blocking.sql` - Device blocking schema
- `api/sessionService.js` - `checkDeviceBlocked()`, `unblockDevice()`
- `api/authService.js` - Check before session creation
- `pages/UserManagement.jsx` - Block/Unblock device buttons
- `pages/Login.jsx` - Blocked device message

**How It Works:**
1. Admin clicks "Block Device" on active session
2. Session terminated + `device_blocked = true`
3. User cannot login from THAT device
4. User CAN login from other devices
5. Shows: "This device has been blocked. Please contact administrator."

**Database:**
```sql
user_sessions.device_blocked = true
WHERE user_id = X AND ip_address = Y AND user_agent = Z
→ Prevents login from specific device
```

---

### 5. Session Monitoring & Auto-Logout

**Purpose:** Automatically logout users when admin terminates their session.

**Files Involved:**
- `api/sessionService.js` - `startSessionMonitoring()`, `checkSessionStatus()`
- `App.jsx` - Session monitoring loop

**How It Works:**
1. User logs in → Session ID stored in localStorage
2. App checks session status every 10 seconds
3. If session terminated → Show popup
4. User clicks OK → Auto-logout

**Flow:**
```
Admin terminates session
    ↓
Database: is_active = false
    ↓
User's browser detects (within 10s)
    ↓
Popup: "Session Terminated"
    ↓
Auto-logout
```

---

## Implementation Details

### User Management Screen (`pages/UserManagement.jsx`)

**Actions Available:**

| Button | Function | Permission Required |
|--------|----------|---------------------|
| Manage Access | Set permissions per screen | Admin only |
| Edit | Edit name, role, assign member | Admin/Manager |
| Devices | View/manage user sessions | Admin/Manager |
| Change Password | Send reset email | Admin/Manager |
| Delete | Remove user account | Admin/Manager |

**Device Management Modal:**
- Shows all sessions (active + terminated)
- Status badges: Active (green) / Terminated (red)
- Actions:
  - **Terminate** - Logout only
  - **Block Device** - Logout + Block device
  - **Unblock Device** - Restore device access
  - **Block User Access** - Block all devices
  - **Restore Access** - Unblock user

---

### Members Screen (`pages/Members.jsx`)

**User Assignment Display:**

**If member has assigned user:**
```
┌─────────────────────────────────┐
│ Assigned User Account           │
│ ┌─────────────────────────────┐ │
│ │ 👤 user@example.com         │ │
│ └─────────────────────────────┘ │
│ Manage from User Management     │
└─────────────────────────────────┘
```

**If member has no user:**
```
☐ Create access user for this member
```

**Features:**
- Shows assigned user email in blue info box
- Prevents duplicate user creation
- Directs to User Management for modifications
- Disabled buttons when no changes made

---

### Login Screen (`pages/Login.jsx`)

**Blocking Checks:**

1. **User-Level Block:**
   - Message: "Your access has been terminated. Please contact administrator."
   - Button shows: "Device Blocked" (disabled)

2. **Device-Level Block:**
   - Message: "This device has been blocked. Please contact administrator."
   - Button shows: "Device Blocked" (disabled)

**Enhanced UI:**
- Large red X icon (80px)
- "Access Denied" heading
- Clear instructions to contact admin
- Professional error modal

---

## Usage Guide

### For Administrators

#### Setup (One-Time)
1. Run SQL schemas in Supabase SQL Editor:
   ```sql
   -- Run in order:
   1. sql/add_user_member_link.sql
   2. sql/user_access_control.sql
   3. sql/device_blocking.sql
   4. sql/device_management_schema.sql
   ```

#### Create User with Member Link
1. Go to User Management
2. Click "Create User"
3. Fill in details
4. After creation, click "Edit"
5. Select member from "Assign to Member" dropdown
6. Click "Update User"

#### Manage User Devices
1. Go to User Management
2. Click "Devices" button next to user
3. View all sessions (active + terminated)
4. Actions:
   - **Terminate** - Just logout
   - **Block Device** - Prevent device from logging in
   - **Unblock Device** - Restore device access
   - **Block User Access** - Block all devices
   - **Restore Access** - Unblock user

#### Block User Completely
1. Go to User Management → Devices
2. Click "Block User Access"
3. Enter reason
4. User cannot login from any device

#### Unblock User
1. Go to User Management → Devices
2. Click "Restore Access"
3. User can login again

---

### For Members

#### If Access is Blocked
- Contact administrator
- Provide your email address
- Wait for admin to restore access

#### If Device is Blocked
- Try logging in from different device
- Or contact admin to unblock device

---

## Security Features

### Three Levels of Control

1. **Session Termination**
   - Logs out specific device
   - User can login again
   - Use for: Normal logout, suspicious activity

2. **Device Blocking**
   - Blocks specific device/IP
   - User can use other devices
   - Use for: Compromised device, unauthorized access

3. **User Blocking**
   - Blocks all devices
   - Complete access denial
   - Use for: Terminated members, security breach

### Audit Trail
All actions logged in `audit_logs` table:
- Who blocked/unblocked
- When action occurred
- Reason provided
- IP address and user agent

---

## Troubleshooting

### Device Blocking Not Working

**Check 1:** Verify columns exist
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'user_sessions' 
AND column_name IN ('device_blocked', 'block_reason');
```

**Check 2:** Verify device is blocked
```sql
SELECT id, user_id, ip_address, device_blocked, block_reason
FROM user_sessions WHERE device_blocked = true;
```

**Check 3:** Check browser console
- Look for: "Checking device block for:"
- Verify IP and User Agent match

### IP Shows "Unknown"

- ipify.org API might be blocked
- Check network tab in browser console
- Verify request to `https://api.ipify.org`

### User Can Still Login After Blocking

- Clear browser cache and cookies
- Check if correct user is blocked
- Verify `access_blocked = true` in database
- Check console logs for errors

---

## API Reference

### userService

```javascript
// Get all users
await userService.getAllUsers();

// Update user profile
await userService.updateUserProfile(userId, { name, role });

// Assign user to member
await userService.assignUserToMember(userId, memberId);

// Get member by user ID
await userService.getMemberByUserId(userId);
```

### sessionService

```javascript
// Create session on login
await sessionService.createSession(userId, ipAddress, userAgent);

// Get user sessions
await sessionService.getUserSessions(userId);
await sessionService.getAllSessions(userId); // Including terminated

// Terminate session
await sessionService.terminateSession(sessionId, adminId, blockDevice);

// Block/unblock user
await sessionService.blockUserAccess(userId, adminId, reason);
await sessionService.unblockUserAccess(userId);

// Check device blocked
await sessionService.checkDeviceBlocked(userId, ipAddress, userAgent);

// Unblock device
await sessionService.unblockDevice(userId, ipAddress, userAgent);
```

---

## Database Queries

### View All Blocked Users
```sql
SELECT id, email, name, access_blocked, block_reason, blocked_at
FROM user_profiles
WHERE access_blocked = true;
```

### View All Blocked Devices
```sql
SELECT us.id, up.email, us.ip_address, us.device_name, 
       us.device_blocked, us.block_reason
FROM user_sessions us
JOIN user_profiles up ON us.user_id = up.id
WHERE us.device_blocked = true;
```

### View Active Sessions
```sql
SELECT * FROM v_active_sessions;
```

### View User-Member Links
```sql
SELECT m.id, m.name as member_name, 
       up.email as user_email, up.name as user_name
FROM members m
LEFT JOIN user_profiles up ON m.user_id = up.id
WHERE m.user_id IS NOT NULL;
```

---

## Best Practices

1. **Always provide reason** when blocking users/devices
2. **Review blocked devices** regularly
3. **Unblock devices** when member gets new device
4. **Monitor active sessions** for suspicious activity
5. **Keep audit logs** for compliance
6. **Test blocking** in development first
7. **Document** all blocking decisions

---

## Flutter/Android App Implementation Guide

### Overview
Implement the same session monitoring and member filtering in Flutter mobile app.

### 1. Session Monitoring & Auto-Logout

**Purpose:** Monitor session status and auto-logout when admin terminates session.

#### Implementation Steps:

**Step 1: Create Session Service (`lib/services/session_service.dart`)**
```dart
import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:async';

class SessionService {
  final SupabaseClient _supabase = Supabase.instance.client;
  Timer? _sessionMonitor;
  String? _currentSessionId;

  // Store session ID after login
  void setSessionId(String sessionId) {
    _currentSessionId = sessionId;
  }

  // Check if session is still active
  Future<bool> checkSessionStatus() async {
    if (_currentSessionId == null) return false;
    
    try {
      final response = await _supabase
          .from('user_sessions')
          .select('is_active')
          .eq('id', _currentSessionId)
          .single();
      
      return response['is_active'] ?? false;
    } catch (e) {
      print('Error checking session: $e');
      return false;
    }
  }

  // Start monitoring session every 10 seconds
  void startMonitoring(Function onTerminated) {
    _sessionMonitor = Timer.periodic(Duration(seconds: 10), (timer) async {
      final isActive = await checkSessionStatus();
      if (!isActive) {
        timer.cancel();
        onTerminated();
      }
    });
  }

  // Stop monitoring
  void stopMonitoring() {
    _sessionMonitor?.cancel();
    _currentSessionId = null;
  }
}
```

**Step 2: Integrate in Main App (`lib/main.dart` or root widget)**
```dart
import 'package:flutter/material.dart';
import 'services/session_service.dart';

class MyApp extends StatefulWidget {
  @override
  _MyAppState createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  final SessionService _sessionService = SessionService();
  bool _isLoggedIn = false;

  @override
  void initState() {
    super.initState();
    // Start monitoring if user is logged in
    if (_isLoggedIn) {
      _startSessionMonitoring();
    }
  }

  void _startSessionMonitoring() {
    _sessionService.startMonitoring(() {
      // Show dialog and logout
      _showSessionTerminatedDialog();
    });
  }

  void _showSessionTerminatedDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Text('Session Terminated'),
        content: Text(
          'Your session has been terminated by an administrator. You will be logged out.'
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              _handleLogout();
            },
            child: Text('OK'),
          ),
        ],
      ),
    );
  }

  void _handleLogout() async {
    _sessionService.stopMonitoring();
    await Supabase.instance.client.auth.signOut();
    setState(() {
      _isLoggedIn = false;
    });
    // Navigate to login screen
  }

  @override
  void dispose() {
    _sessionService.stopMonitoring();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Your app UI
    return MaterialApp(...);
  }
}
```

**Step 3: Update Login to Store Session ID**
```dart
// In your login function
Future<void> login(String email, String password) async {
  try {
    // Authenticate
    final response = await Supabase.instance.client.auth.signInWithPassword(
      email: email,
      password: password,
    );
    
    // Create session in database
    final sessionId = await _createSession(response.user!.id);
    
    // Store session ID
    _sessionService.setSessionId(sessionId);
    
    // Start monitoring
    _startSessionMonitoring();
    
  } catch (e) {
    // Handle error
  }
}

Future<String> _createSession(String userId) async {
  // Get device info
  final deviceInfo = await _getDeviceInfo();
  final ipAddress = await _getIPAddress();
  
  final response = await Supabase.instance.client.rpc(
    'create_user_session',
    params: {
      'p_user_id': userId,
      'p_ip_address': ipAddress,
      'p_user_agent': deviceInfo,
    },
  );
  
  return response as String;
}
```

---

### 2. Transaction Request - Show Only Assigned Member

**Purpose:** In Android app, show ONLY the member assigned to the logged-in user. Even admins can only select their assigned member.

**Rule:** `members.user_id = current_user.id` (No exceptions)

#### Implementation Steps:

**Step 1: Get Assigned Member for Current User**
```dart
// In your member service or repository
Future<Member?> getAssignedMember(String userId) async {
  try {
    final response = await Supabase.instance.client
        .from('members')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
    
    if (response == null) return null;
    return Member.fromJson(response);
  } catch (e) {
    print('Error getting assigned member: $e');
    return null;
  }
}
```

**Step 2: Transaction Request Screen - Only Assigned Member**
```dart
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class TransactionRequestScreen extends StatefulWidget {
  @override
  _TransactionRequestScreenState createState() => _TransactionRequestScreenState();
}

class _TransactionRequestScreenState extends State<TransactionRequestScreen> {
  Member? _assignedMember;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadAssignedMember();
  }

  Future<void> _loadAssignedMember() async {
    setState(() => _isLoading = true);
    
    try {
      // Get current user
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) {
        setState(() {
          _errorMessage = 'User not logged in';
          _isLoading = false;
        });
        return;
      }
      
      // Get ONLY assigned member (no role check)
      final response = await Supabase.instance.client
          .from('members')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
      
      if (response == null) {
        setState(() {
          _errorMessage = 'No member assigned to your account. Please contact administrator.';
          _assignedMember = null;
          _isLoading = false;
        });
        return;
      }
      
      setState(() {
        _assignedMember = Member.fromJson(response);
        _errorMessage = null;
        _isLoading = false;
      });
      
    } catch (e) {
      print('Error loading assigned member: $e');
      setState(() {
        _errorMessage = 'Error loading member: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Transaction Request')),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.error_outline, size: 64, color: Colors.red),
                        SizedBox(height: 16),
                        Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.red, fontSize: 16),
                        ),
                        SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: _loadAssignedMember,
                          child: Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
              : Padding(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Display assigned member (read-only)
                      Text(
                        'Member',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      SizedBox(height: 8),
                      Container(
                        width: double.infinity,
                        padding: EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.blue[50],
                          border: Border.all(color: Colors.blue[200]!),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.person, color: Colors.blue[700]),
                            SizedBox(width: 12),
                            Text(
                              _assignedMember!.name,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Colors.blue[900],
                              ),
                            ),
                          ],
                        ),
                      ),
                      SizedBox(height: 8),
                      Text(
                        'This is your assigned member',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                      
                      SizedBox(height: 24),
                      
                      // Rest of your form fields (amount, description, etc.)
                      TextField(
                        decoration: InputDecoration(
                          labelText: 'Amount',
                          border: OutlineInputBorder(),
                        ),
                        keyboardType: TextInputType.number,
                      ),
                      
                      SizedBox(height: 16),
                      
                      TextField(
                        decoration: InputDecoration(
                          labelText: 'Description',
                          border: OutlineInputBorder(),
                        ),
                        maxLines: 3,
                      ),
                      
                      SizedBox(height: 24),
                      
                      // Submit button
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            // Submit transaction request
                            // Use _assignedMember!.id as member_id
                          },
                          child: Padding(
                            padding: EdgeInsets.all(16),
                            child: Text('Submit Request'),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }
}

// Member model
class Member {
  final int id;
  final String name;
  final String? userId;
  
  Member({required this.id, required this.name, this.userId});
  
  factory Member.fromJson(Map<String, dynamic> json) {
    return Member(
      id: json['id'],
      name: json['name'],
      userId: json['user_id'],
    );
  }
}
```

**Step 3: Alternative - Using Provider Pattern**
```dart
// If using Provider for state management
class MemberProvider extends ChangeNotifier {
  Member? _assignedMember;
  bool _isLoading = false;
  String? _errorMessage;
  
  Member? get assignedMember => _assignedMember;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  
  Future<void> loadAssignedMember(String userId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    
    try {
      final response = await Supabase.instance.client
          .from('members')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
      
      if (response == null) {
        _errorMessage = 'No member assigned to your account';
        _assignedMember = null;
      } else {
        _assignedMember = Member.fromJson(response);
      }
    } catch (e) {
      _errorMessage = 'Error: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}

// Usage in widget
class TransactionRequestScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<MemberProvider>(
      builder: (context, memberProvider, child) {
        if (memberProvider.isLoading) {
          return Center(child: CircularProgressIndicator());
        }
        
        if (memberProvider.errorMessage != null) {
          return Center(child: Text(memberProvider.errorMessage!));
        }
        
        final member = memberProvider.assignedMember;
        if (member == null) {
          return Center(child: Text('No member assigned'));
        }
        
        // Show form with assigned member
        return _buildForm(member);
      },
    );
  }
}
```

---

### Key Points for Flutter Implementation

#### Session Monitoring:
1. **Store session ID** in memory (not SharedPreferences for security)
2. **Check every 10 seconds** using Timer.periodic
3. **Show dialog** when session terminated
4. **Auto-logout** after user acknowledges
5. **Stop monitoring** on logout or app dispose

#### Member Selection (Android App ONLY):
1. **NO role checking** - Everyone sees only their assigned member
2. **Query:** `SELECT * FROM members WHERE user_id = current_user_id`
3. **Display as read-only** - No dropdown needed
4. **Show error** if no member assigned
5. **Auto-use** assigned member ID in transaction

**Important Difference from Web App:**
```
Web App:
  Admin → See all members
  Member → See assigned member

Android App:
  Admin → See ONLY assigned member
  Member → See ONLY assigned member
  (No exceptions - everyone restricted to their assignment)
```

#### Database Query:
```dart
// ONLY this query - no role-based logic
final member = await supabase
    .from('members')
    .select('*')
    .eq('user_id', currentUserId)
    .maybeSingle();
```

#### UI Display:
```
┌─────────────────────────────────┐
│ Member                          │
│ ┌─────────────────────────────┐ │
│ │ 👤 John Doe                 │ │
│ └─────────────────────────────┘ │
│ This is your assigned member    │
└─────────────────────────────────┘
```

#### Required Packages:
```yaml
dependencies:
  supabase_flutter: ^latest
  device_info_plus: ^latest  # For device info
  http: ^latest              # For IP detection
  provider: ^latest          # Optional - for state management
```

#### Error Handling:
```dart
if (assignedMember == null) {
  // Show error: "No member assigned to your account. Please contact administrator."
  // Disable form submission
  // Show retry button
}
```

---

## Support

For issues or questions:
1. Check browser console for errors
2. Verify SQL schemas are applied
3. Check database for blocked status
4. Review audit logs for actions
5. Contact system administrator

---

**Last Updated:** 2024
**Version:** 1.1
**Author:** Investment Club Development Teamser**
```dart
// In your member service or repository
Future<Member?> getAssignedMember(String userId) async {
  try {
    final response = await Supabase.instance.client
        .from('members')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
    
    if (response == null) return null;
    return Member.fromJson(response);
  } catch (e) {
    print('Error getting assigned member: $e');
    return null;
  }
}
```

**Step 2: Filter Members in Transaction Request Screen**
```dart
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class TransactionRequestScreen extends StatefulWidget {
  @override
  _TransactionRequestScreenState createState() => _TransactionRequestScreenState();
}

class _TransactionRequestScreenState extends State<TransactionRequestScreen> {
  List<Member> _selectableMembers = [];
  Member? _selectedMember;
  bool _isLoading = true;
  String? _currentUserId;
  String? _currentUserRole;

  @override
  void initState() {
    super.initState();
    _loadSelectableMembers();
  }

  Future<void> _loadSelectableMembers() async {
    setState(() => _isLoading = true);
    
    try {
      // Get current user
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return;
      
      _currentUserId = user.id;
      
      // Get user profile to check role
      final profile = await Supabase.instance.client
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single();
      
      _currentUserRole = profile['role'];
      
      List<Member> members = [];
      
      if (_currentUserRole == 'admin') {
        // Admin can see all members
        final response = await Supabase.instance.client
            .from('members')
            .select('*')
            .order('name');
        
        members = (response as List)
            .map((json) => Member.fromJson(json))
            .toList();
      } else {
        // Regular user can only see their assigned member
        final response = await Supabase.instance.client
            .from('members')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
        
        if (response != null) {
          members = [Member.fromJson(response)];
        }
      }
      
      setState(() {
        _selectableMembers = members;
        // Auto-select if only one member
        if (members.length == 1) {
          _selectedMember = members[0];
        }
        _isLoading = false;
      });
      
    } catch (e) {
      print('Error loading members: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Transaction Request')),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                children: [
                  // Member Dropdown
                  DropdownButtonFormField<Member>(
                    value: _selectedMember,
                    decoration: InputDecoration(
                      labelText: 'Select Member',
                      border: OutlineInputBorder(),
                    ),
                    items: _selectableMembers.map((member) {
                      return DropdownMenuItem(
                        value: member,
                        child: Text(member.name),
                      );
                    }).toList(),
                    onChanged: _selectableMembers.length > 1
                        ? (Member? value) {
                            setState(() => _selectedMember = value);
                          }
                        : null, // Disable if only one option
                    hint: Text('Choose member'),
                  ),
                  
                  // Show info if user has no assigned member
                  if (_selectableMembers.isEmpty)
                    Padding(
                      padding: EdgeInsets.only(top: 16),
                      child: Text(
                        'No member assigned to your account. Please contact administrator.',
                        style: TextStyle(color: Colors.red),
                      ),
                    ),
                  
                  // Rest of your form fields...
                ],
              ),
            ),
    );
  }
}

// Member model
class Member {
  final int id;
  final String name;
  final String? userId;
  
  Member({required this.id, required this.name, this.userId});
  
  factory Member.fromJson(Map<String, dynamic> json) {
    return Member(
      id: json['id'],
      name: json['name'],
      userId: json['user_id'],
    );
  }
}
```

**Step 3: Alternative - Using Provider/Bloc Pattern**
```dart
// If using Provider for state management
class MemberProvider extends ChangeNotifier {
  Member? _assignedMember;
  List<Member> _selectableMembers = [];
  
  Member? get assignedMember => _assignedMember;
  List<Member> get selectableMembers => _selectableMembers;
  
  Future<void> loadSelectableMembers(String userId, String role) async {
    if (role == 'admin') {
      // Load all members
      _selectableMembers = await _getAllMembers();
    } else {
      // Load only assigned member
      final member = await _getAssignedMember(userId);
      _selectableMembers = member != null ? [member] : [];
      _assignedMember = member;
    }
    notifyListeners();
  }
  
  Future<List<Member>> _getAllMembers() async {
    final response = await Supabase.instance.client
        .from('members')
        .select('*');
    return (response as List).map((e) => Member.fromJson(e)).toList();
  }
  
  Future<Member?> _getAssignedMember(String userId) async {
    final response = await Supabase.instance.client
        .from('members')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
    return response != null ? Member.fromJson(response) : null;
  }
}
```

---

### Key Points for Flutter Implementation

#### Session Monitoring:
1. **Store session ID** in memory (not SharedPreferences for security)
2. **Check every 10 seconds** using Timer.periodic
3. **Show dialog** when session terminated
4. **Auto-logout** after user acknowledges
5. **Stop monitoring** on logout or app dispose

#### Member Filtering:
1. **Check user role** from user_profiles table
2. **If admin:** Show all members
3. **If member:** Show only assigned member (where user_id = current_user.id)
4. **Auto-select** if only one member available
5. **Disable dropdown** if only one option
6. **Show message** if no member assigned

#### Database Queries:
```dart
// Get assigned member
SELECT * FROM members WHERE user_id = 'current_user_id'

// Check session status
SELECT is_active FROM user_sessions WHERE id = 'session_id'

// Get user role
SELECT role FROM user_profiles WHERE id = 'user_id'
```

#### Required Packages:
```yaml
dependencies:
  supabase_flutter: ^latest
  device_info_plus: ^latest  # For device info
  http: ^latest              # For IP detection
```

---

## Support

For issues or questions:
1. Check browser console for errors
2. Verify SQL schemas are applied
3. Check database for blocked status
4. Review audit logs for actions
5. Contact system administrator

---

**Last Updated:** 2024
**Version:** 1.1
**Author:** Investment Club Development Team
