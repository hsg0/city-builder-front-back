import { Stack } from "expo-router";
import "../global.css";

import { Provider } from "react-redux";
import { store } from "../reduxToolKit/reduxState/globalState/store.js";

import { ThemeProvider } from "../wrappers/providers/ThemeContext.js";
import GlobalInactivityWatcher from "../components/security/GlobalInactivityWatcher";
import ScreenSizeProvider from "../components/getScreenSize/screenSizeProvider.jsx";
export default function RootLayout() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <GlobalInactivityWatcher>
          <ScreenSizeProvider>
          
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(security)/lock" options={{ headerShown: false }} />
            <Stack.Screen name="(security)/overlay" options={{ headerShown: false }} />
          </Stack>

          </ScreenSizeProvider>
        </GlobalInactivityWatcher>
      </ThemeProvider>
    </Provider>
  );
}