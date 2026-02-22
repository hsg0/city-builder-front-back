// reduxToolKit/reduxState/globalState/activitySelectors.js
export const selectIsInactive = (state) => state.activity.isInactive;
export const selectTimeoutMs = (state) => state.activity.timeoutMs;
export const selectLastActiveAt = (state) => state.activity.lastActiveAt;