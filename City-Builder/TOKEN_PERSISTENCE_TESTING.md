## Token Persistence Testing Guide

### Implementation Summary
The secure token storage has been successfully implemented with the following components:

1. **services/secureStore.js** - Secure storage service layer
   - `saveToken(token)` - Persist JWT to encrypted storage
   - `saveUser(user)` - Persist user data to encrypted storage
   - `getToken()` - Retrieve stored token
   - `getUser()` - Retrieve stored user data
   - `clearAuthData()` - Clear all auth data

2. **reduxToolKit/reduxState/globalState/authSlice.js** - Updated Redux slice
   - `authSuccess` action now saves token/user to secure store
   - `logout` action now clears secure store

3. **components/AppInitializer.jsx** - New initialization component
   - Runs on app startup
   - Restores auth state from secure store
   - Automatically logs users back in if token exists

4. **app/_layout.jsx** - Updated root layout
   - AppInitializer wrapped around app content
   - Ensures auth restoration happens before routes are evaluated

---

### How to Test Token Persistence

#### Test 1: Login Persistence
**Goal:** Verify token is saved and app auto-logs in on restart

**Steps:**
1. Start the app
2. Log in with valid credentials
3. Verify you're on the Dashboard screen
4. Close the app completely (background + force close if needed)
5. Reopen the app
6. **Expected:** App should automatically log you in and show Dashboard without login screen

**What's happening:**
- On app startup, AppInitializer calls `getToken()` and `getUser()` from secure store
- If found, it dispatches `authSuccess()` to Redux
- The private layout checks `isLoggedIn` and shows Dashboard

#### Test 2: Logout Clears Secure Store
**Goal:** Verify secure store is cleared on logout

**Steps:**
1. Make sure you're logged in (from Test 1 or fresh login)
2. Log out (if logout button exists, use it; or trigger inactivity timeout)
3. Verify you're redirected to login screen
4. Close and reopen the app
5. **Expected:** App should show login screen, not Dashboard (token was cleared)

#### Test 3: Session Timeout
**Goal:** Verify inactivity timeout clears both Redux and secure store

**Steps:**
1. Log in successfully
2. Leave app idle (default timeout is typically 15-30 minutes depending on your config)
3. App should auto-logout and show login screen
4. Close and reopen the app
5. **Expected:** Login screen appears (token was cleared)

#### Test 4: Token Used in API Calls
**Goal:** Verify token is still used for authenticated requests

**Steps:**
1. Log in successfully
2. Navigate to any screen that makes authenticated API calls
3. Open React Native Debugger or check network logs
4. **Expected:** Requests should have `Authorization: Bearer <token>` header

---

### Debugging

#### If auto-login doesn't work:
1. **Check console logs** - Look for:
   - `🔍 Attempting to restore auth state from secure storage...` (app init)
   - `✅ Auth state restored from secure storage` (success)
   - `ℹ️ No persisted auth state found` (no saved token)

2. **Check secure store** - Use native debuggers:
   - **iOS**: Xcode > Debug > View Memory Graph, search for "keychain"
   - **Android**: Android Studio > Device File Explorer > data/data/app/shared_prefs

3. **Check Redux state** - React Native Debugger > Redux tab
   - Look for `auth.token` and `auth.isLoggedIn` values

#### If logout doesn't clear token:
1. Check that `dispatch(logout())` is being called when:
   - User explicitly logs out
   - Inactivity timer expires
2. Verify `clearAuthData()` completes without errors in console

#### Common Issues:
- **"Module not found: expo-secure-store"** → Run `npm install expo-secure-store`
- **Token not restored after restart** → Check if logcat shows secure store errors
- **App crashes on startup** → Check AppInitializer.jsx is properly imported
- **Network requests fail with 401** → Token might not be persisting, check Redux state

---

### Production Considerations

1. **Token Expiration** (31 days)
   - Current: No check on app startup
   - Future: Add timestamp validation when restoring token
   - If token expired, automatically show login screen

2. **Refresh Tokens**
   - Backend returns 31-day JWT with no refresh mechanism
   - Consider implementing refresh token rotation for security

3. **Biometric Security**
   - Current: Any app can read secure storage if device is unlocked
   - Future: Use `react-native-keychain` for fingerprint-protected storage

4. **Clear on App Uninstall**
   - Secure store is automatically cleared when app uninstalls (platform default)
   - No additional logic needed

---

### Files Modified
- `/services/secureStore.js` (NEW)
- `/components/AppInitializer.jsx` (NEW)
- `/reduxToolKit/reduxState/globalState/authSlice.js` (MODIFIED)
- `/app/_layout.jsx` (MODIFIED)
- `/package.json` (MODIFIED - expo-secure-store added)
