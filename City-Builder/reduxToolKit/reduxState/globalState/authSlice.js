// reduxToolKit/reduxState/globalState/authSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { saveToken, saveUser, clearAuthData } from "../../../services/secureStore";

const initialState = {
  isLoggedIn: false,
  user: null, // { _id, name, email, role } later
  token: null, // if you store JWT later
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authStart: (state) => {
      console.log("🔄 authStart()");
      state.loading = true;
      state.error = null;
    },

    authSuccess: (state, action) => {
      console.log("✅ authSuccess()", action.payload);
      const { user, token } = action.payload || {};
      state.loading = false;
      state.isLoggedIn = true;
      state.user = user || null;
      state.token = token || null;
      state.error = null;
      
      // Persist token and user to secure storage
      if (token) saveToken(token);
      if (user) saveUser(user);
    },

    authFail: (state, action) => {
      console.log("❌ authFail()", action.payload);
      state.loading = false;
      state.error = action.payload || null;   // null = no error, just not authenticated
      state.isLoggedIn = false;
      state.user = null;
      state.token = null;
    },

    logout: (state) => {
      console.log("🚪 logout()");
      state.isLoggedIn = false;
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      
      // Clear secure storage
      clearAuthData();
    },

    clearAuthError: (state) => {
      console.log("🧹 clearAuthError()");
      state.error = null;
    },

    // Optional: update user profile data without changing login
    setUser: (state, action) => {
      console.log("👤 setUser()", action.payload);
      state.user = action.payload || null;
    },
  },
});

export const {
  authStart,
  authSuccess,
  authFail,
  logout,
  clearAuthError,
  setUser,
} = authSlice.actions;

export default authSlice.reducer;