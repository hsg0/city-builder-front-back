// app/(security)/(private)/(homebuilder)/(active)/[selectABuild]/_layout.jsx
import { Stack } from "expo-router";

export default function SelectABuildLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}   
