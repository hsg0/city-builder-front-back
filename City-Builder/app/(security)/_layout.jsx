// /app/(security)/_layout.jsx

import { Stack } from "expo-router";

export default function SecurityLayout({ children }) {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="lock" options={{ headerShown: false }} />
      <Stack.Screen name="overlay" options={{ headerShown: false }} />
      {/* <Stack.Screen name="index" options={{ headerShown: false }} /> */}
    </Stack>
  );
}