// app/(security)/(private)/(homebuilder)/(active)/[selectABuild]/index.jsx
//
// ✅ Build Detail — "Active Build" view
// - Real data via GET /api/builds/:projectId → { build, steps }
// - City-Builder neon yellow + neon green accent palette
// - Header: address, lot intake badge, "Add Step" CTA
// - "Mark Build Complete" banner
// - Steps list (step #, title, cost, photos, edit / delete)
// - Pure RN style objects + useTheme() for base dark/light

import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../../../../wrappers/providers/ThemeContext";
import callBackend from "../../../../../../services/callBackend";

// ── Neon accent palette (City-Builder brand) ──────────────────
const NEON = {
  yellow: "#fde047",
  yellowMuted: "#facc15",
  green: "#a3e635",
  greenBg15: "rgba(163,230,53,0.15)",
  greenBg25: "rgba(163,230,53,0.25)",
  yellowBg15: "rgba(250,204,21,0.15)",
  yellowBg20: "rgba(250,204,21,0.20)",
  yellowBg25: "rgba(250,204,21,0.25)",
  danger: "#fda4af",
  dangerBg: "rgba(244,63,94,0.15)",
};

// ── Helpers ────────────────────────────────────────────────────
const safe = (v) => String(v || "").trim();

function formatCurrency(amount) {
  if (typeof amount !== "number" || isNaN(amount)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

// ══════════════════════════════════════════════════════════════
// ██  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function BuildDetailScreen() {
  const { selectABuild: buildId } = useLocalSearchParams();
  const { theme } = useTheme();
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────
  const [build, setBuild] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ── Fetch build + steps ────────────────────────────────────
  const fetchBuild = useCallback(
    async ({ pull = false } = {}) => {
      if (!buildId) return;
      try {
        setError("");
        pull ? setRefreshing(true) : setLoading(true);
        console.log("[BuildDetail] Fetching build:", buildId);
        const res = await callBackend.get(`/api/builds/${buildId}`);
        setBuild(res?.data?.build ?? null);
        setSteps(res?.data?.steps ?? []);
        console.log(
          "[BuildDetail] Got build +",
          (res?.data?.steps ?? []).length,
          "step(s)"
        );
      } catch (e) {
        const msg =
          e?.response?.data?.message || e?.message || "Failed to load build.";
        console.warn("[BuildDetail] Error:", msg);
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [buildId]
  );

  useFocusEffect(
    useCallback(() => {
      fetchBuild();
    }, [fetchBuild])
  );

  // ── Actions ────────────────────────────────────────────────
  function handlePressAddNextStep() {
    // TODO: navigate to add-step screen
    console.log("[BuildDetail] Add next step for build:", buildId);
  }

  function handlePressMarkBuildComplete() {
    Alert.alert(
      "Mark build as complete?",
      "This build will move from Active to Completed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark Complete",
          style: "default",
          onPress: async () => {
            // TODO: call API to mark complete
            console.log("[BuildDetail] Mark complete:", buildId);
          },
        },
      ]
    );
  }

  function handlePressEditStep(step) {
    // TODO: navigate to edit-step screen
    console.log("[BuildDetail] Edit step:", step._id);
  }

  function handlePressDeleteStep(step) {
    const title = safe(step.title) || safe(step.stepType);
    Alert.alert(
      "Delete this step?",
      `"${title}" will be removed from this build.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // TODO: call API to delete step
            console.log("[BuildDetail] Delete step:", step._id);
          },
        },
      ]
    );
  }

  // ── Derived ────────────────────────────────────────────────
  const address = build
    ? safe(build.summary?.lotAddress) || "No address"
    : "";
  const lotIntakeComplete =
    (build?.currentStepIndex ?? 0) > 0 || steps.length > 0;

  // ─────────────── LOADING ───────────────────────────────────
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={NEON.green} />
        <Text
          style={{
            marginTop: 12,
            fontSize: 15,
            fontWeight: "600",
            color: theme.colors.textSecondary,
          }}
        >
          Loading build…
        </Text>
      </View>
    );
  }

  // ─────────────── ERROR ─────────────────────────────────────
  if (error || !build) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
          backgroundColor: theme.colors.background,
        }}
      >
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={theme.colors.textSecondary}
        />
        <Text
          style={{
            marginTop: 16,
            fontSize: 18,
            fontWeight: "900",
            color: theme.colors.text,
          }}
        >
          {error || "Build not found"}
        </Text>
        <Pressable
          onPress={() => fetchBuild()}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            marginTop: 20,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 16,
            backgroundColor: NEON.green,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Ionicons name="refresh" size={18} color="#000" />
          <Text
            style={{
              marginLeft: 8,
              fontSize: 15,
              fontWeight: "900",
              color: "#000",
            }}
          >
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  // ── Step Row ───────────────────────────────────────────────
  function StepRow({ item, index }) {
    const title =
      safe(item.title) || safe(item.stepType).replace(/_/g, " ");
    const photoCount = Array.isArray(item.photos) ? item.photos.length : 0;

    return (
      <View
        style={{
          marginBottom: 12,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          padding: 14,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {/* Left — info */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: theme.colors.text,
              }}
            >
              Step {index + 1}: {title}
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginTop: 8,
              }}
            >
              <Ionicons
                name="cash-outline"
                size={16}
                color={theme.colors.textSecondary}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  color: theme.colors.textSecondary,
                }}
              >
                {item.costAmount
                  ? formatCurrency(item.costAmount)
                  : "Cost not added"}
              </Text>
            </View>

            {photoCount > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 6,
                }}
              >
                <Ionicons
                  name="images-outline"
                  size={14}
                  color={theme.colors.textSecondary}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: theme.colors.textSecondary,
                  }}
                >
                  {photoCount} photo{photoCount !== 1 ? "s" : ""}
                </Text>
              </View>
            )}

            {safe(item.notes) ? (
              <Text
                numberOfLines={2}
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  fontWeight: "500",
                  color: theme.colors.textSecondary,
                }}
              >
                {item.notes}
              </Text>
            ) : null}
          </View>

          {/* Right — actions (stacked) */}
          <View className="items-end gap-2">
            <Pressable
              onPress={() => handlePressEditStep(item)}
              accessibilityRole="button"
              accessibilityLabel={`Edit step ${index + 1}`}
              className="flex-row items-center gap-1.5 rounded-xl px-3 py-2 active:opacity-80"
              style={{ backgroundColor: `${theme.colors.border}44` }}
            >
              <Ionicons
                name="create-outline"
                size={16}
                color={theme.colors.textSecondary}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: theme.colors.textSecondary,
                }}
              >
                Edit
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handlePressDeleteStep(item)}
              accessibilityRole="button"
              accessibilityLabel={`Delete step ${index + 1}`}
              className="flex-row items-center gap-1.5 rounded-xl px-3 py-2 active:opacity-80"
              style={{ backgroundColor: NEON.dangerBg }}
            >
              <Ionicons name="trash-outline" size={16} color={NEON.danger} />
              <Text
                style={{ fontSize: 13, fontWeight: "700", color: NEON.danger }}
              >
                Delete
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // ─────────────── MAIN RENDER ───────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* ── Header ────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16 }}>
        {/* Back */}
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center self-start py-2 pr-4 mb-2 active:opacity-60"
        >
          <Ionicons name="chevron-back" size={30} color={NEON.yellow} />
          <Text className="ml-1 text-sm font-bold" style={{ color: NEON.yellow }}>
            Active Builds
          </Text>
        </Pressable>

        <Text
          style={{
            marginTop: 6,
            fontSize: 10,
            fontWeight: "900",
            letterSpacing: 2,
            color: NEON.green,
            marginBottom: 12,
          }}
        >
          CITY-BUILDER • ACTIVE BUILD
        </Text>

        {/* Title row — info left, Add Step right */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {/* Left column */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "900",
                color: theme.colors.text,
              }}
            >
              {address}
            </Text>

            {build.summary?.lotSizeDimensions ? (
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 14,
                  fontWeight: "600",
                  lineHeight: 20,
                  color: theme.colors.textSecondary,
                }}
              >
                {build.summary.lotSizeDimensions}
              </Text>
            ) : null}

            {/* Lot intake status badge */}
            {/* <View
              style={{
                marginTop: 10,
                alignSelf: "flex-start",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: `${theme.colors.border}44`,
              }}
            >
              <Ionicons
                name={
                  lotIntakeComplete ? "checkmark-circle" : "time-outline"
                }
                size={18}
                color={lotIntakeComplete ? NEON.green : NEON.yellowMuted}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: theme.colors.textSecondary,
                }}
              >
                Lot Intake:{" "}
                <Text
                  style={{
                    fontWeight: "800",
                    color: lotIntakeComplete ? NEON.green : NEON.yellow,
                  }}
                >
                  {lotIntakeComplete ? "Complete" : "Pending"}
                </Text>
              </Text>
            </View> */}
          </View>

          {/* Right column — Add Step card */}
          <Pressable
            onPress={handlePressAddNextStep}
            accessibilityRole="button"
            accessibilityLabel="Add the next step"
            style={({ pressed }) => ({
              borderRadius: 20,
              borderWidth: 2,
              border: 3,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              padding: 10,
              alignItems: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: NEON.greenBg25,
                backgroundColor: NEON.greenBg15,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="add" size={34} color={NEON.green} />
            </View>
            <Text
              style={{
                marginTop: 8,
                fontSize: 13,
                fontWeight: "800",
                color: theme.colors.text,
              }}
            >
              Add Step
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: theme.colors.textSecondary,
              }}
            >
              Photos + title
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ── Body ──────────────────────────────────────────── */}
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Mark Build Complete banner */}
        <Pressable
          onPress={handlePressMarkBuildComplete}
          accessibilityRole="button"
          accessibilityLabel="Mark this build as completed"
          style={({ pressed }) => ({
            marginBottom: 18,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: NEON.yellowBg25,
            backgroundColor: NEON.yellowBg15,
            padding: 18,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: NEON.yellowBg25,
                  backgroundColor: NEON.yellowBg20,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="checkmark-done"
                  size={26}
                  color={NEON.yellowMuted}
                />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "900",
                    color: theme.colors.text,
                  }}
                >
                  Mark Build Completed
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    marginTop: 2,
                    color: theme.colors.textSecondary,
                  }}
                >
                  Moves this build to Completed
                </Text>
              </View>
            </View>

            <Ionicons
              name="chevron-forward"
              size={30}
              color={NEON.yellowMuted}
            />
          </View>
        </Pressable>

        {/* Section title */}
        <Text
          style={{
            marginTop: 8,
            fontSize: 17,
            fontWeight: "900",
            color: theme.colors.text,
            marginBottom: 4,
          }}
        >
          Steps Taken So Far
        </Text>

        {/* Build start date */}
        {build.homeBuildIntakeStartedAt ? (
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="calendar-outline" size={14} color={NEON.yellowMuted} />
            <Text
              style={{ fontSize: 13, fontWeight: "600", color: theme.colors.textSecondary }}
            >
              Build started{" "}
              <Text style={{ fontWeight: "800", color: NEON.yellow }}>
                {formatDate(build.homeBuildIntakeStartedAt)}
              </Text>
            </Text>
          </View>
        ) : null}

        {/* Steps list */}
        <FlatList
          data={steps}
          keyExtractor={(item) => item._id || String(Math.random())}
          renderItem={({ item, index }) => (
            <StepRow item={item} index={index} />
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchBuild({ pull: true })}
              tintColor={NEON.green}
            />
          }
          ListEmptyComponent={
            <View
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                padding: 18,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: theme.colors.text,
                }}
              >
                No steps yet
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  fontWeight: "500",
                  color: theme.colors.textSecondary,
                }}
              >
                Tap "Add Step" to record the first step and upload photos.
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}
