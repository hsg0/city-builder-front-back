// /app/(security)/_layout.jsx

import { Stack } from "expo-router";

export default function SecurityLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="lock" options={{ headerShown: false }} />
      {/* overlay is no longer a route — PrivacyOverlayWatcher renders it
          as a component View, avoiding cross-navigator replace crashes. */}
    </Stack>
  );
}