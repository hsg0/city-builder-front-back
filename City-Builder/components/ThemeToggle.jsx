import React from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../wrappers/providers/ThemeContext";

export default function ThemeToggle() {
  const { theme, mode, setMode } = useTheme();

  const isDark = theme?.name === "dark";

  const toggleTheme = () => {
    console.log("🌗 ThemeToggle pressed. Current mode:", mode, "theme:", theme?.name);

    // simple: switch between light and dark (ignores system)
    setMode(isDark ? "light" : "dark");

    // If you want a 3-state toggle (system -> light -> dark), use this instead:
    // setMode((prev) => (prev === "system" ? "light" : prev === "light" ? "dark" : "system"));
  };

  return (
    <Pressable
      onPress={toggleTheme}
      className="active:opacity-70"
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      }}
    >
      <View>
        <Ionicons
          name={isDark ? "moon" : "sunny"}
          size={22}
          color={theme.colors.text}
        />
      </View>
    </Pressable>
  );
}