import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import "../global.css";

import { Provider } from "react-redux";
import { store } from "../reduxToolKit/reduxState/globalState/store.js";

import { ThemeProvider } from "../wrappers/providers/ThemeContext.js";
import GlobalInactivityWatcher from "../components/security/GlobalInactivityWatcher";
import ScreenSizeProvider from "../components/getScreenSize/screenSizeProvider.jsx";
import PrivacyOverlayWatcher from "../components/security/PrivacyOverlayWatcher";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <ThemeProvider>
            <PrivacyOverlayWatcher>
              <GlobalInactivityWatcher>
                <ScreenSizeProvider>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(security)/overlay" options={{ presentation: "fullScreenModal" }} />
                  </Stack>

                  <Toast />
                </ScreenSizeProvider>
              </GlobalInactivityWatcher>
            </PrivacyOverlayWatcher>
          </ThemeProvider>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}