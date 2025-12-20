# Step 6: Check Auth Status on App Launch - Manual Testing Guide

## Overview
This guide helps you manually test Step 6 implementation, which checks if a user is authenticated when the app launches and restores their session if valid tokens are found.

## What Was Implemented
- `checkAuthStatus` thunk now uses SecureStore instead of localStorage
- Validates tokens with backend by calling `getCurrentUser` API
- Automatically refreshes expired access tokens using refresh token
- Clears invalid tokens and requires user to log in again
- Called automatically on app launch in `_layout.tsx`

## Test Scenarios

### Test 1: App Launch with Valid Tokens (Happy Path)
**Goal**: Verify that authenticated users stay logged in after closing and reopening the app.

**Steps**:
1. **Setup**: Register a new user and log in successfully
   - Go through registration flow
   - Complete login
   - Verify you're on the main app (tabs screen)

2. **Test**:
   - Close the app completely (swipe away from app switcher or force close)
   - Reopen the app
   - **Expected**: App should skip login/onboarding and go directly to the main app
   - **Expected**: User should remain logged in
   - **Expected**: Check Redux DevTools (if available) - `auth.isAuthenticated` should be `true`
   - **Expected**: User data should be loaded in Redux state

**How to Verify**:
- Look at console logs - you should see:
  - "API Request: GET /accounts/users/profile/ - 200"
  - No errors about tokens or authentication

### Test 2: App Launch with Expired Access Token (Token Refresh)
**Goal**: Verify that expired access tokens are automatically refreshed.

**Steps**:
1. **Setup**: 
   - Log in successfully
   - Wait for access token to expire (15 minutes) OR manually expire it:
     - Go to Settings page
     - Use dev tools to manually set token expiry to past time (requires debugging)

2. **Test**:
   - Close and reopen the app
   - **Expected**: App should still load and user should remain logged in
   - **Expected**: Console should show token refresh attempt:
     - "API Request: POST /accounts/auth/refresh/ - 200"
     - "API Request: GET /accounts/users/profile/ - 200"
   - **Expected**: New tokens should be stored in SecureStore

**How to Verify**:
- Check console logs for refresh token API call
- User should not be logged out despite expired access token

### Test 3: App Launch with No Tokens (New User)
**Goal**: Verify that users without tokens go through onboarding/login flow.

**Steps**:
1. **Setup**: 
   - Log out from the app (use logout button in Settings)
   - OR clear app data/reinstall app

2. **Test**:
   - Open the app
   - **Expected**: App should show onboarding/welcome screen
   - **Expected**: User should NOT be authenticated
   - **Expected**: No API calls should be made to check auth status

**How to Verify**:
- Console should NOT show any authentication-related API calls
- Redux state: `auth.isAuthenticated` should be `false`
- User should see welcome/onboarding screen

### Test 4: App Launch with Invalid Tokens
**Goal**: Verify that invalid/corrupted tokens are cleared and user is logged out.

**Steps**:
1. **Setup**: 
   - Log in successfully
   - Manually corrupt tokens in SecureStore (requires debugging/development tools)
   - OR wait for refresh token to expire (7 days)

2. **Test**:
   - Close and reopen the app
   - **Expected**: App should detect invalid tokens
   - **Expected**: Tokens should be cleared from SecureStore
   - **Expected**: User should be logged out
   - **Expected**: App should show login/onboarding screen
   - **Expected**: Console may show 401 errors or refresh failures

**How to Verify**:
- Console logs should show token validation/refresh attempts failing
- Redux state: `auth.isAuthenticated` should be `false`
- SecureStore should have no tokens stored

### Test 5: Network Error During Auth Check
**Goal**: Verify graceful handling when network is unavailable during auth check.

**Steps**:
1. **Setup**: 
   - Log in successfully
   - Turn off device WiFi/mobile data OR stop Django server

2. **Test**:
   - Close and reopen the app (with network off)
   - **Expected**: App should handle network error gracefully
   - **Expected**: Should NOT crash or show error screen
   - **Expected**: May log out user or show login screen (safe default)
   - Turn network back on
   - **Expected**: App should still function normally

**How to Verify**:
- Console should show network error logs
- App should not crash
- User experience should degrade gracefully

### Test 6: App Launch After Logout
**Goal**: Verify that after logging out, app doesn't try to restore session.

**Steps**:
1. **Setup**: 
   - Log in successfully
   - Go to Settings page
   - Tap "Log Out" button
   - Confirm logout

2. **Test**:
   - Close and reopen the app
   - **Expected**: App should NOT try to restore session
   - **Expected**: Should show welcome/onboarding screen
   - **Expected**: User should NOT be authenticated

**How to Verify**:
- Console should NOT show `getCurrentUser` API call
- Redux state: `auth.isAuthenticated` should be `false`
- Should see welcome/onboarding screen

## Debugging Tips

### Check SecureStore Tokens
To verify tokens are stored correctly, you can use the Settings page dev tools:
- Tap "Check Logged In User" button
- This will show current authentication state

### Monitor Console Logs
Watch for these log messages:
- `"Login response:"` - Shows login API response
- `"API Request: GET /accounts/users/profile/ - 200"` - Successful auth check
- `"API Request: POST /accounts/auth/refresh/ - 200"` - Token refresh
- `"Failed to check auth status:"` - Auth check errors

### Check Redux State
If using Redux DevTools:
- Check `auth.isAuthenticated` - should be `true` if logged in
- Check `auth.user` - should contain user data if authenticated
- Check `auth.isLoading` - should be `true` during auth check, then `false`

### Force Token Expiry (Advanced)
To test token refresh without waiting 15 minutes:
1. Add temporary code to manually set expiry to past time
2. Or use debugging tools to modify SecureStore directly

## Common Issues and Solutions

### Issue: User stays logged in after logout
**Solution**: Check that `clearAllTokens()` is being called in logoutUser thunk

### Issue: User gets logged out immediately after login
**Solution**: Check that tokens are being stored correctly in SecureStore. Verify SecureStore keys don't contain invalid characters.

### Issue: Infinite loop of auth checks
**Solution**: Check that `hasNavigatedRef` is working correctly in `_layout.tsx` to prevent multiple checks

### Issue: App crashes on launch
**Solution**: Check error handling in `checkAuthStatus` thunk - all errors should be caught and handled gracefully

## Success Criteria
✅ App launches without errors  
✅ Authenticated users stay logged in after app restart  
✅ Expired access tokens are automatically refreshed  
✅ Users without tokens see onboarding/login screen  
✅ Invalid tokens are cleared and user is logged out  
✅ Network errors are handled gracefully  
✅ After logout, session is not restored on next launch  
