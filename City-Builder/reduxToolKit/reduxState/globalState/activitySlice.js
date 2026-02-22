// reduxToolKit/reduxState/globalState/activitySlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isInactive: false,
  lastActiveAt: Date.now(), // optional but useful
  timeoutMs: 5 * 60 * 1000, // optional default: 5 minutes
};

const activitySlice = createSlice({
  name: "activity",
  initialState,
  reducers: {
    setInactive: (state, action) => {
      console.log("⏸️ setInactive()", action.payload);
      state.isInactive = Boolean(action.payload);
    },

    markActive: (state) => {
      console.log("✅ markActive()");
      state.isInactive = false;
      state.lastActiveAt = Date.now();
    },

    setTimeoutMs: (state, action) => {
      console.log("⏱️ setTimeoutMs()", action.payload);
      state.timeoutMs = Number(action.payload) || state.timeoutMs;
    },

    resetActivity: (state) => {
      console.log("🔄 resetActivity()");
      state.isInactive = false;
      state.lastActiveAt = Date.now();
    },
  },
});

export const { setInactive, markActive, setTimeoutMs, resetActivity } =
  activitySlice.actions;

export default activitySlice.reducer;