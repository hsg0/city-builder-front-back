// app/(security)/(private)/(homebuilder)/(build)/startbuild.jsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../../../../wrappers/providers/ThemeContext";

export default function StartBuildScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Build</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Start a new build project
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
  },
});
