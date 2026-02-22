// City-Builder/app/(security)/(public)/_layout.jsx
import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../wrappers/providers/ThemeContext";

export default function PublicSecurityLayout() {
  const { theme } = useTheme();
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <Tabs
      initialRouteName="login"
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,

        tabBarHideOnKeyboard: true,

        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,

          height: 56 + safeAreaInsets.bottom,
          paddingBottom: safeAreaInsets.bottom,
          paddingTop: 6,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
          marginTop: -2,
        },

        tabBarItemStyle: {
          flex: 1, // forces 3 equal-width tabs (prevents “missing” look)
        },
      }}
    >
      <Tabs.Screen
        name="register"
        options={{
          title: "Register",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-add-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="login"
        options={{
          title: "Login",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="log-in-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="resetpassword"
        options={{
          title: "Reset",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="key-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}