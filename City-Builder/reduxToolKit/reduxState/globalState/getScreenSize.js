// reduxToolKit/reduxState/globalState/screenSlice.js
import { createSlice } from "@reduxjs/toolkit";

// Optional helper so we can classify screens consistently
const getBreakpoint = (width) => {
  if (width < 360) return "xs";
  if (width < 414) return "sm";
  if (width < 768) return "md";
  return "lg"; // tablets / large screens
};

const initialState = {
  width: 0,
  height: 0,
  scale: 1,
  fontScale: 1,
  orientation: "unknown", // "portrait" | "landscape" | "unknown"
  breakpoint: "md", // "xs" | "sm" | "md" | "lg"
};

const screenSlice = createSlice({
  name: "screen",
  initialState,
  reducers: {
    setScreenSize: (state, action) => {
      const payload = action.payload || {};
      const width = Number(payload.width || 0);
      const height = Number(payload.height || 0);

      const orientation =
        width && height ? (height >= width ? "portrait" : "landscape") : "unknown";

      const breakpoint = getBreakpoint(width);

      console.log("📏 setScreenSize()", {
        width,
        height,
        orientation,
        breakpoint,
        scale: payload.scale,
        fontScale: payload.fontScale,
      });

      state.width = width;
      state.height = height;
      state.scale = Number(payload.scale || 1);
      state.fontScale = Number(payload.fontScale || 1);
      state.orientation = orientation;
      state.breakpoint = breakpoint;
    },
  },
});

export const { setScreenSize } = screenSlice.actions;
export default screenSlice.reducer;