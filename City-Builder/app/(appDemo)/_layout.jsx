// app/(appDemo)/_layout.jsx

import { Stack } from "expo-router";

export default function DemoLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="demo" />
        </Stack>
    );
}