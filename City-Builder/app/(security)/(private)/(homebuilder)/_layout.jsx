// app/(security)/(private)/(homebuilder)/_layout.jsx
import React, { useCallback, useMemo, useState } from "react";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Drawer } from "react-native-drawer-layout";
import { useDispatch, useSelector } from "react-redux";

import { useTheme } from "../../../../wrappers/providers/ThemeContext";
import { logout } from "../../../../reduxToolKit/reduxState/globalState/authSlice";
import { clearAuthData } from "../../../../services/secureStore";
import { apiLogout } from "../../../../services/authApi";
import HomeDrawerContext from "../../../../context/homebuilder/drawerContext";
import {
  selectWidth,
  selectBreakpoint,
  selectIsTablet,
  selectIsMobile,
} from "../../../../reduxToolKit/reduxState/globalState/screenSelectors";
import { selectUser } from "../../../../reduxToolKit/reduxState/globalState/authSelectors";

const LOGO = require("../../../../assets/images/City-Builder-assets/image.png");

// ─── Responsive helpers (reads from Redux ScreenSizeProvider) ────────
function useResponsive() {
  const screenWidth = useSelector(selectWidth);
  const breakpoint = useSelector(selectBreakpoint);
  const isTablet = useSelector(selectIsTablet);
  const isMobile = useSelector(selectIsMobile);

  // breakpoint: xs (<360), sm (<414), md (<768), lg (>=768)
  const isXs = breakpoint === "xs";
  const isSm = breakpoint === "sm";
  const isMd = breakpoint === "md";
  const isLg = breakpoint === "lg";

  const iconSize = isTablet ? 30 : isMd ? 26 : isSm ? 22 : 20;
  const menuIconSize = isTablet ? 34 : isMd ? 30 : 28;
  const logoWidth = isTablet ? 180 : isMd ? 150 : isSm ? 130 : 110;
  const logoHeight = isTablet ? 50 : isMd ? 42 : isSm ? 36 : 30;
  const tabBarHeight = isTablet ? 72 : isMd ? 62 : 56;
  const tabFontSize = isTablet ? 13 : isMd ? 12 : 11;

  // Logo negative margin scales with screen width so it sits flush-left
  // on every device (the image has built-in transparent padding on the left)
  const logoMarginLeft = isTablet ? -60 : isMd ? -50 : isSm ? -45 : -40;

  return {
    screenWidth,
    breakpoint,
    isTablet,
    isMobile,
    isXs,
    isSm,
    isMd,
    isLg,
    iconSize,
    menuIconSize,
    logoWidth,
    logoHeight,
    logoMarginLeft,
    tabBarHeight,
    tabFontSize,
  };
}

// ─── Drawer Row Button ──────────────────────────────────────────────
function DrawerRow({ theme, icon, label, onPress, responsive }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-row items-center justify-between rounded-2xl border mx-3 mb-3 py-3.5 px-3.5"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
      onPress={onPress}
    >
      <View className="flex-row items-center gap-2.5 flex-1">
        <Ionicons name={icon} size={responsive.iconSize} color={theme.colors.text} />
        <Text
          className="text-sm font-bold"
          style={{ color: theme.colors.text }}
        >
          {label}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={responsive.iconSize - 2} color={theme.colors.primary} />
    </TouchableOpacity>
  );
}

// ─── Custom Drawer Content ──────────────────────────────────────────
function CustomDrawerContent({ onClose }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();

  const navigateAndClose = (path) => {
    onClose();
    setTimeout(() => router.push(path), 300);
  };

  const handleBackToDashboard = () => {
    onClose();
    setTimeout(() => router.replace("/(security)/(private)/dashboard"), 300);
  };

  const handleSignOut = async () => {
    try {
      await apiLogout();
    } catch (_) {
      /* ignore */
    }
    await clearAuthData();
    dispatch(logout());
    onClose();
    router.replace("/(security)/(public)/login");
  };

  return (
    <View
      className="flex-1"
      style={{ paddingTop: insets.top, backgroundColor: theme.colors.background }}
    >
      {/* Header */}
      <View className="px-4 pt-10 pb-2.5">
        <Text
          className="text-xl font-black mb-1"
          style={{ color: theme.colors.text }}
        >
          Builder Menu
        </Text>
        <Text
          className="text-[13px]"
          style={{ color: theme.colors.primary }}
        >
          Manage your projects
        </Text>
      </View>

      {/* Body */}
      <ScrollView className="flex-1" contentContainerClassName="pt-2.5">
        <DrawerRow
          theme={theme}
          responsive={responsive}
          icon="speedometer-outline"
          label="Dashboard"
          onPress={handleBackToDashboard}
        />
        <DrawerRow
          theme={theme}
          responsive={responsive}
          icon="person-outline"
          label="Profile"
          onPress={() => navigateAndClose("/(security)/(private)/dashboard")}
        />
        <DrawerRow
          theme={theme}
          responsive={responsive}
          icon="notifications-outline"
          label="Notifications"
          onPress={() => navigateAndClose("/(security)/(private)/dashboard")}
        />
      </ScrollView>

      {/* Footer */}
      <View
        className="px-3.5 pt-1.5"
        style={{
          paddingBottom: insets.bottom + 10,
          backgroundColor: theme.colors.background,
        }}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back to Dashboard"
          className="flex-row items-center justify-center gap-2 border rounded-2xl py-3.5 px-4 mb-2.5"
          style={{ borderColor: theme.colors.primary }}
          onPress={handleBackToDashboard}
        >
          <Ionicons name="arrow-back" size={responsive.iconSize - 2} color={theme.colors.primary} />
          <Text
            className="text-[15px] font-bold text-center"
            style={{ color: theme.colors.primary }}
          >
            Back to Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          className="rounded-2xl py-4 px-4"
          style={{ backgroundColor: theme.colors.error }}
          onPress={handleSignOut}
        >
          <Text className="text-base font-black text-white text-center">
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Layout (Drawer + Bottom Tabs) ─────────────────────────────
export default function HomeBuilderLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();

  // ── Auth info exposed as searchParams to ALL downstream pages ──
  // Usage:  const { searchParams } = useHomeDrawer();
  //         const { userId, name, email } = searchParams;
  const authenticatedUser = useSelector(selectUser);
  const searchParams = useMemo(
    () => ({
      userId: authenticatedUser?._id ?? null,
      name: authenticatedUser?.name ?? null,
      email: authenticatedUser?.email ?? null,
    }),
    [authenticatedUser?._id, authenticatedUser?.name, authenticatedUser?.email]
  );

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <HomeDrawerContext.Provider value={{ openDrawer, closeDrawer, drawerOpen, searchParams }}>
      <Drawer
        open={drawerOpen}
        onOpen={() => setDrawerOpen(true)}
        onClose={() => setDrawerOpen(false)}
        drawerPosition="right"
        drawerType="front"
        drawerStyle={{
          width: responsive.isTablet ? "60%" : "85%",
          backgroundColor: theme.colors.background,
        }}
        swipeEdgeWidth={80}
        renderDrawerContent={() => (
          <CustomDrawerContent onClose={closeDrawer} />
        )}
      >
        <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
          {/* ─── Custom Top Bar: Logo left, Drawer right ─── */}
          <View
            className="flex-row items-center justify-between pl-0 pr-4 pb-2.5 border-b"
            style={{
              paddingTop: insets.top + 6,
              backgroundColor: theme.colors.background,
              borderBottomColor: theme.colors.border,
            }}
          >
            <Image
              source={LOGO}
              resizeMode="contain"
              style={{
                width: responsive.logoWidth,
                height: responsive.logoHeight,
                marginLeft: responsive.logoMarginLeft,
              }}
            />
            <Pressable onPress={openDrawer} hitSlop={10}>
              <Ionicons name="menu" size={responsive.menuIconSize} color={theme.colors.text} />
            </Pressable>
          </View>

          <Tabs
            initialRouteName="(build)"
            backBehavior="none"
            screenOptions={{
              headerShown: false,
              gestureEnabled: false,

              // Tab bar styling
              tabBarActiveTintColor: theme.colors.primary,
              tabBarInactiveTintColor: theme.colors.textSecondary,
              tabBarHideOnKeyboard: true,
              tabBarStyle: {
                backgroundColor: theme.colors.background,
                borderTopColor: theme.colors.border,
                borderTopWidth: 1,
                height: responsive.tabBarHeight + insets.bottom,
                paddingBottom: insets.bottom,
                paddingTop: 6,
              },
              tabBarLabelStyle: {
                fontSize: responsive.tabFontSize,
                fontWeight: "700",
                marginTop: -2,
              },
              tabBarItemStyle: { flex: 1 },
            }}
          >
          <Tabs.Screen
            name="(consider)"
            options={{
              title: "Consider",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="eye-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="(active)"
            options={{
              title: "Active",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="flash-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="(build)"
            options={{
              title: "Build",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="construct-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="(completed)"
            options={{
              title: "Completed",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="checkmark-circle-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="(cost)"
            options={{
              title: "Cost",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="cash-outline" size={size} color={color} />
              ),
            }}
          />

          {/* Hidden – keep route accessible but off the tab bar */}
          <Tabs.Screen name="builder" options={{ href: null }} />
          </Tabs>
        </View>
      </Drawer>
    </HomeDrawerContext.Provider>
  );
}

