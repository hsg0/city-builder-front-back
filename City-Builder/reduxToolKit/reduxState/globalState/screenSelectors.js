// reduxToolKit/reduxState/globalState/screenSelectors.js
export const selectWidth = (state) => state.screen?.width || 0;
export const selectHeight = (state) => state.screen?.height || 0;
export const selectScale = (state) => state.screen?.scale || 1;
export const selectFontScale = (state) => state.screen?.fontScale || 1;
export const selectOrientation = (state) => state.screen?.orientation || "unknown";
export const selectBreakpoint = (state) => state.screen?.breakpoint || "md";

export const selectIsTablet = (state) => {
  const breakpoint = state.screen?.breakpoint || "md";
  return breakpoint === "lg" || breakpoint === "xl";
};

export const selectIsMobile = (state) => {
  const breakpoint = state.screen?.breakpoint || "md";
  return breakpoint === "xs" || breakpoint === "sm";
};

export const selectIsPortrait = (state) => {
  return state.screen?.orientation === "portrait";
};

export const selectIsLandscape = (state) => {
  return state.screen?.orientation === "landscape";
};
