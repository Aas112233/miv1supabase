# Device Blocking - Testing Guide

## How to Test Device Blocking

### Step 1: Login with a User
1. Login to the app with any user account
2. Open browser console (F12)
3. Note the logged information:
   - User ID
   - IP Address
   - User Agent

### Step 2: Block the Device
1. Login as admin
2. Go to User Management
3. Click "Devices" button for the user
4. Find the active session
5. Click "Block Device" button
6. Confirm the action

### Step 3: Verify Blocking
1. Logout the user
2. Try to login again with same user
3. Should see popup: "This device has been blocked. Please contact administrator."
4. Login should be prevented

### Step 4: Check Console Logs
Open browser console and look for:
```
Checking device block for: {userId: "...", ipAddress: "...", userAgent: "..."}
Device check result: {blocked: true, reason: "..."}
```

### Step 5: Unblock Device
1. As admin, go to User Management → Devices
2. Find the blocked device (shows "Terminated" status)
3. Click "Unblock Device"
4. User should now be able to login again

## Troubleshooting

### Issue: Blocked device can still login

**Check 1: Verify database columns exist**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_sessions' 
AND column_name IN ('device_blocked', 'block_reason');
```

**Check 2: Verify device is actually blocked**
```sql
SELECT id, user_id, ip_address, device_blocked, block_reason
FROM user_sessions
WHERE device_blocked = true;
```

**Check 3: Check console logs**
- Open browser console (F12)
- Look for "Checking device block for:" message
- Verify IP and User Agent match blocked session

**Check 4: Verify IP address is captured**
```sql
SELECT id, user_id, ip_address, user_agent, device_blocked
FROM user_sessions
ORDER BY created_at DESC
LIMIT 5;
```

If IP shows "Unknown", the blocking won't work properly.

### Issue: IP address shows "Unknown"

The ipify.org API might be blocked or slow. Try:
1. Check network tab in browser console
2. Look for request to `https://api.ipify.org`
3. If blocked, consider using alternative IP detection

### Issue: User Agent doesn't match

User Agent can change between sessions (browser updates, etc.)
- This is expected behavior
- Device blocking is based on IP + User Agent combination
- If User Agent changes, it's considered a different device

## Expected Behavior

### When Device is Blocked:
✅ User cannot login from that device
✅ Shows "This device has been blocked" message
✅ Other devices can still login (unless user is blocked)
✅ Session shows "Terminated" status in Device Management

### When Device is Unblocked:
✅ User can login from that device again
✅ New session is created
✅ No blocking message shown

## Database Verification

Check if device is properly blocked:
```sql
SELECT 
  us.id,
  up.email,
  us.ip_address,
  us.device_name,
  us.device_blocked,
  us.block_reason,
  us.is_active
FROM user_sessions us
JOIN user_profiles up ON us.user_id = up.id
WHERE us.device_blocked = true;
```
