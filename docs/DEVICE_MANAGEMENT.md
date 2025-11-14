# Device Management Feature

## Overview
Track and manage user login sessions and devices. Admins can view all active devices for each user and terminate suspicious sessions remotely.

## Features

### 1. **Session Tracking**
- Automatically creates session record on login
- Captures device information:
  - Browser (Chrome, Firefox, Safari, etc.)
  - Operating System (Windows, macOS, Linux, Android, iOS)
  - Device Type (Desktop, Mobile, Tablet)
  - IP Address
  - User Agent
  - Last Activity timestamp

### 2. **Device Management UI**
- "Devices" button in User Management screen
- Shows all active sessions for selected user
- Display information:
  - Device name/type
  - Browser and OS
  - IP address
  - Last activity time
- Admin can terminate any session

### 3. **Security Benefits**
- Detect unauthorized access
- Remote logout capability
- Track login patterns
- Audit trail for compliance

## Database Schema

### Table: `user_sessions`
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- device_name (TEXT)
- device_type (TEXT) - Desktop/Mobile/Tablet
- browser (TEXT) - Chrome/Firefox/Safari/etc
- os (TEXT) - Windows/macOS/Linux/Android/iOS
- ip_address (TEXT)
- user_agent (TEXT)
- location_city (TEXT)
- location_country (TEXT)
- is_active (BOOLEAN)
- last_activity (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- terminated_at (TIMESTAMPTZ)
- terminated_by (UUID)
```

### Functions:
- `parse_user_agent()` - Extracts browser/OS from user agent string
- `create_user_session()` - Creates new session record
- `terminate_user_session()` - Marks session as terminated

### View:
- `v_active_sessions` - Shows all active sessions with user details

## Setup Instructions

### 1. Run SQL Schema
```bash
# In Supabase SQL Editor, run:
sql/device_management_schema.sql
```

### 2. Files Created
- `sql/device_management_schema.sql` - Database schema
- `api/sessionService.js` - Session management service
- Updated `api/authService.js` - Auto-create session on login
- Updated `pages/UserManagement.jsx` - Device management UI

## Usage

### For Admins:
1. Go to User Management screen
2. Click "Devices" button next to any user
3. View all active sessions
4. Click "Terminate" to end a session

### Automatic Tracking:
- Session created automatically on login
- Last activity updated periodically
- Inactive sessions can be auto-expired (future enhancement)

## Privacy & Security

### What's Tracked:
✅ Browser and OS information
✅ IP address (for security)
✅ Login timestamps
✅ Device type

### What's NOT Tracked:
❌ Exact GPS location
❌ Personal files or data
❌ Browsing history
❌ Device serial numbers

### RLS Policies:
- Users can view their own sessions
- Admins can view all sessions
- Only admins can terminate sessions
- Audit trail maintained

## Future Enhancements

### Phase 2:
- Email alerts on new device login
- Trusted device management
- Auto-expire inactive sessions (30 days)
- Session activity timeline

### Phase 3:
- IP geolocation (city/country)
- Device fingerprinting
- Suspicious login detection
- 2FA for new devices

## API Reference

### sessionService Methods:

```javascript
// Create session on login
await sessionService.createSession(userId, ipAddress, userAgent);

// Get user's active sessions
const sessions = await sessionService.getUserSessions(userId);

// Terminate session
await sessionService.terminateSession(sessionId, adminUserId);

// Update last activity
await sessionService.updateSessionActivity(sessionId);

// Get client info
const info = sessionService.getClientInfo();
```

## Testing

1. Login with a user account
2. Check `user_sessions` table - should have new record
3. Login from different browser/device
4. Admin views devices - should see multiple sessions
5. Terminate one session - should mark as inactive

## Notes

- Sessions are created automatically on login
- IP address capture requires server-side implementation (Edge Function)
- Current implementation uses 'Unknown' for IP (can be enhanced)
- Sessions remain in database for audit purposes even after termination
