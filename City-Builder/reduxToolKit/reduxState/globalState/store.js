// reduxToolKit/reduxState/globalState/store.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import activityReducer from "./activitySlice";
import screenReducer from "./screenSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    activity: activityReducer,
    screen: screenReducer,
    
  },
});

console.log("🧠 Redux store initialized:", store.getState());