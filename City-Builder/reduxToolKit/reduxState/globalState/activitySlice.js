// reduxToolKit/reduxState/globalState/activitySlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isInactive: false,
  lastActiveAt: Date.now(),
  timeoutMs: 30 * 60 * 1000,
};

const activitySlice = createSlice({
  name: "activity",
  initialState,
  reducers: {
    setInactive: (state, action) => {
      state.isInactive = Boolean(action.payload);
    },

    markActive: (state) => {
      state.isInactive = false;
      state.lastActiveAt = Date.now();
    },

    setTimeoutMs: (state, action) => {
      const nextTimeoutMs = Number(action.payload);
      if (!Number.isNaN(nextTimeoutMs) && nextTimeoutMs > 0) {
        state.timeoutMs = nextTimeoutMs;
      }
    },

    resetActivity: (state) => {
      state.isInactive = false;
      state.lastActiveAt = Date.now();
    },
  },
});

export const { setInactive, markActive, setTimeoutMs, resetActivity } =
  activitySlice.actions;

export default activitySlice.reducer;