import React, { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import {
  selectAuthLoading,
  selectIsLoggedIn,
} from "../../../reduxToolKit/reduxState/globalState/authSelectors";
import { useTheme } from "../../../wrappers/providers/ThemeContext";

export default function PrivateSecurityLayout() {
  const router = useRouter();
  const { theme } = useTheme();
  const safeAreaInsets = useSafeAreaInsets();

  const isLoggedIn = useSelector(selectIsLoggedIn);
  const authLoading = useSelector(selectAuthLoading);

  useEffect(() => {
    console.log("PrivateSecurityLayout => authLoading:", authLoading, "isLoggedIn:", isLoggedIn);

    if (!authLoading && !isLoggedIn) {
      console.log("PrivateSecurityLayout => redirecting to login");
      router.replace("/(security)/(public)/login");
    }
  }, [authLoading, isLoggedIn, router]);

  if (!isLoggedIn) return null;

  return (
    <Tabs
      initialRouteName="dashboard"
      backBehavior="none"
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,

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

        tabBarItemStyle: { flex: 1 },
      }}
    >
      {/* ✅ Only visible tab */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="speedometer-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ✅ Hidden routes (no tabs) */}
      <Tabs.Screen
        name="(homebuyer)"
        options={{
          href: null, // hides from tab bar
        }}
      />
      <Tabs.Screen
        name="(homebuilder)"
        options={{
          href: null, // hides from tab bar
        }}
      />
    </Tabs>
  );
}