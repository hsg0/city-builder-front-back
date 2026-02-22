// reduxToolKit/reduxState/globalState/activitySelectors.js
export const selectActivity = (state) => state.activity;

export const selectIsInactive = (state) => state.activity.isInactive;
export const selectLastActiveAt = (state) => state.activity.lastActiveAt;
export const selectTimeoutMs = (state) => state.activity.timeoutMs;