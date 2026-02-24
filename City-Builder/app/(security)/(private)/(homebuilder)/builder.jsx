import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../../../wrappers/providers/ThemeContext";

// ─── Permission step config ─────────────────────────────────────────
const STEPS = [
  {
    key: "camera",
    icon: "camera-outline",
    title: "Camera Access",
    description:
      "City-Builder needs access to your camera so you can take photos of your lot, progress, and completed builds.",
  },
  {
    key: "photoLibrary",
    icon: "images-outline",
    title: "Photo Library Access",
    description:
      "City-Builder needs access to your photo library so you can select existing photos for your projects.",
  },
  {
    key: "savePhotos",
    icon: "download-outline",
    title: "Save Photos",
    description:
      "City-Builder needs permission to save project photos and receipts to your photo library.",
  },
];

// ─── Main Component ─────────────────────────────────────────────────
export default function BuilderOnboarding() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Track which permissions are granted
  const [permissions, setPermissions] = useState({
    camera: null, // null = not asked, true = granted, false = denied
    photoLibrary: null,
    savePhotos: null,
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [checking, setChecking] = useState(true);

  // ── Check existing permissions on mount ──────────────────────────
  const checkAllPermissions = useCallback(async () => {
    setChecking(true);

    const [cameraStatus, pickerStatus, mediaStatus] = await Promise.all([
      Camera.getCameraPermissionsAsync(),
      ImagePicker.getMediaLibraryPermissionsAsync(),
      MediaLibrary.getPermissionsAsync(),
    ]);

    const result = {
      camera: cameraStatus.granted,
      photoLibrary: pickerStatus.granted,
      savePhotos: mediaStatus.granted,
    };

    setPermissions(result);

    // If all granted, go straight to startbuild
    if (result.camera && result.photoLibrary && result.savePhotos) {
      router.replace(
        "/(security)/(private)/(homebuilder)/(build)/startbuild"
      );
      return;
    }

    // Find the first permission that isn't granted yet
    const firstNeeded = STEPS.findIndex((s) => !result[s.key]);
    setCurrentStep(firstNeeded >= 0 ? firstNeeded : 0);
    setChecking(false);
  }, [router]);

  useEffect(() => {
    checkAllPermissions();
  }, [checkAllPermissions]);

  // ── Request the current step's permission ────────────────────────
  const requestCurrentPermission = async () => {
    const step = STEPS[currentStep];
    let granted = false;

    if (step.key === "camera") {
      const { status } = await Camera.requestCameraPermissionsAsync();
      granted = status === "granted";
    } else if (step.key === "photoLibrary") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      granted = status === "granted";
    } else if (step.key === "savePhotos") {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      granted = status === "granted";
    }

    if (!granted) {
      Alert.alert(
        "Permission Required",
        `City-Builder needs "${step.title}" to work properly. You can enable it in Settings.`,
        [
          { text: "Open Settings", onPress: () => Linking.openSettings() },
          { text: "Skip", style: "cancel" },
        ]
      );
    }

    // Update state
    const updated = { ...permissions, [step.key]: granted };
    setPermissions(updated);

    // Move to next un-granted step or finish
    const nextNeeded = STEPS.findIndex(
      (s, i) => i > currentStep && !updated[s.key]
    );

    if (nextNeeded >= 0) {
      setCurrentStep(nextNeeded);
    } else if (updated.camera && updated.photoLibrary && updated.savePhotos) {
      // All done → forward to startbuild
      router.replace(
        "/(security)/(private)/(homebuilder)/(build)/startbuild"
      );
    }
  };

  // ── UI ───────────────────────────────────────────────────────────
  if (checking) return null;

  const step = STEPS[currentStep];
  const allGranted =
    permissions.camera && permissions.photoLibrary && permissions.savePhotos;

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="grow justify-center px-6 py-10"
        style={{ paddingTop: insets.top }}
      >
        {/* App intro */}
        <View className="items-center mb-10">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-5"
            style={{ backgroundColor: theme.colors.surface }}
          >
            <Ionicons
              name="construct"
              size={40}
              color={theme.colors.primary}
            />
          </View>
          <Text
            className="text-2xl font-black text-center mb-2"
            style={{ color: theme.colors.text }}
          >
            Welcome to City-Builder
          </Text>
          <Text
            className="text-sm text-center leading-5 px-4"
            style={{ color: theme.colors.textSecondary }}
          >
            Plan, track, and manage your home builds from start to finish.
            Take photos, track costs, and keep everything organized in one
            place.
          </Text>
        </View>

        {/* Permission steps */}
        <View className="mb-8">
          <Text
            className="text-base font-bold mb-4 px-1"
            style={{ color: theme.colors.text }}
          >
            We need a few permissions to get started:
          </Text>

          {STEPS.map((s, i) => {
            const granted = permissions[s.key];
            const isCurrent = i === currentStep;
            const isPast = granted === true;

            return (
              <View
                key={s.key}
                className="flex-row items-start rounded-2xl border p-4 mb-3"
                style={{
                  backgroundColor: isCurrent
                    ? theme.colors.surface
                    : theme.colors.background,
                  borderColor: isCurrent
                    ? theme.colors.primary
                    : theme.colors.border,
                  borderWidth: isCurrent ? 2 : 1,
                  opacity: isPast ? 0.5 : 1,
                }}
              >
                {/* Icon */}
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{
                    backgroundColor: isPast
                      ? theme.colors.success
                      : theme.colors.surface,
                  }}
                >
                  <Ionicons
                    name={isPast ? "checkmark" : s.icon}
                    size={22}
                    color={isPast ? "#FFFFFF" : theme.colors.primary}
                  />
                </View>

                {/* Text */}
                <View className="flex-1">
                  <Text
                    className="text-sm font-bold mb-0.5"
                    style={{ color: theme.colors.text }}
                  >
                    {s.title}
                    {isPast ? "  ✓" : ""}
                  </Text>
                  <Text
                    className="text-xs leading-4"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {s.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom button */}
      <View
        className="px-6 pt-2"
        style={{
          paddingBottom: insets.bottom + 10,
          backgroundColor: theme.colors.background,
        }}
      >
        {allGranted ? (
          <TouchableOpacity
            className="rounded-2xl py-4 items-center"
            style={{ backgroundColor: theme.colors.success }}
            onPress={() =>
              router.replace(
                "/(security)/(private)/(homebuilder)/(build)/startbuild"
              )
            }
          >
            <Text className="text-base font-black text-white">
              Get Started
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="rounded-2xl py-4 items-center"
            style={{ backgroundColor: theme.colors.primary }}
            onPress={requestCurrentPermission}
          >
            <Text className="text-base font-black text-white">
              Allow {step.title}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}