// app/(security)/(private)/(homebuilder)/(completed)/[completedBuildDetail]/completedDetail.jsx
//
// ✅ Completed Build Detail — read-only step list
// - "< Completed Builds" back button
// - "CITY-BUILDER • COMPLETED BUILD" header
// - "Share Build" CTA instead of "Add Step"
// - "All Steps Completed" section title
// - Build started date + build completed date
// - Step rows: read-only (View Details + cost, no Edit)

import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
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
  yellowBg25: "rgba(250,204,21,0.25)",
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
export default function CompletedBuildDetailScreen() {
  const { completedBuildDetail: buildId } = useLocalSearchParams();
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
        const res = await callBackend.get(`/api/builds/${buildId}`);
        setBuild(res?.data?.build ?? null);
        setSteps(res?.data?.steps ?? []);
      } catch (e) {
        const msg =
          e?.response?.data?.message || e?.message || "Failed to load build.";
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

  // ── Share handler ──────────────────────────────────────────
  async function handleShareBuild() {
    const address = safe(build?.summary?.lotAddress) || "Build";
    const stepCount = steps.length;
    const totalCost = steps.reduce((sum, s) => {
      const cost = s.costAmount > 0 ? s.costAmount : 0;
      return sum + cost;
    }, build?.summary?.lotPrice ?? 0);

    const message = [
      `🏗️ City Builder — Completed Build`,
      ``,
      `📍 ${address}`,
      build?.summary?.lotSizeDimensions
        ? `📐 ${build.summary.lotSizeDimensions}`
        : null,
      ``,
      `✅ ${stepCount} step${stepCount !== 1 ? "s" : ""} completed`,
      totalCost > 0 ? `💰 Total: ${formatCurrency(totalCost)}` : null,
      ``,
      build?.homeBuildIntakeStartedAt
        ? `🗓️ Started: ${formatDate(build.homeBuildIntakeStartedAt)}`
        : null,
      build?.updatedAt
        ? `🏁 Completed: ${formatDate(build.updatedAt)}`
        : null,
      ``,
      `— Shared from City Builder`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await Share.share({ message });
    } catch (e) {
      Alert.alert("Error", "Could not share build.");
    }
  }

  // ── Derived ────────────────────────────────────────────────
  const address = build ? safe(build.summary?.lotAddress) || "No address" : "";

  // ── Total cost across all steps ────────────────────────────
  const totalCost = steps.reduce((sum, s) => {
    return sum + (s.costAmount > 0 ? s.costAmount : 0);
  }, build?.summary?.lotPrice ?? 0);

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

  // ── Step Row (read-only) ───────────────────────────────────
  function StepRow({ item, index }) {
    const title = safe(item.title) || safe(item.stepType).replace(/_/g, " ");
    const photoCount = Array.isArray(item.photos) ? item.photos.length : 0;
    const stepCost = item.costAmount;

    return (
      <View>
        {/* Horizontal separator line */}
        <View
          style={{
            height: StyleSheet.hairlineWidth,
            backgroundColor: theme.colors.border,
            marginBottom: 14,
          }}
        />

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

              {/* View Details hint */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: NEON.yellowMuted,
                    marginRight: 4,
                  }}
                >
                  View Details
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={NEON.yellowMuted}
                />
              </View>
            </View>

            {/* Right — completed check + cost */}
            <View style={{ alignItems: "flex-end", gap: 8 }}>
              {/* Completed badge */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: NEON.greenBg15,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 12,
                }}
              >
                <Ionicons name="checkmark-circle" size={14} color={NEON.green} />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: NEON.green,
                  }}
                >
                  Done
                </Text>
              </View>

              {/* Cost — right-aligned */}
              <View
                style={{
                  marginTop: 6,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 6,
                  paddingHorizontal: 4,
                }}
              >
                <Ionicons
                  name="cash-outline"
                  size={14}
                  color={stepCost > 0 ? NEON.green : theme.colors.textSecondary}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: stepCost > 0 ? NEON.green : theme.colors.textSecondary,
                  }}
                >
                  {stepCost > 0 ? formatCurrency(stepCost) : "No cost"}
                </Text>
              </View>
            </View>
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
          <Ionicons name="chevron-back" size={30} color={NEON.green} />
          <Text
            className="ml-1 text-sm font-bold"
            style={{ color: NEON.green }}
          >
            Completed Builds
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
          CITY-BUILDER • COMPLETED BUILD
        </Text>

        {/* Title row — info left, Share Build right */}
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
          </View>

          {/* Right column — Share Build card */}
          <Pressable
            onPress={handleShareBuild}
            accessibilityRole="button"
            accessibilityLabel="Share this completed build"
            style={({ pressed }) => ({
              borderRadius: 20,
              borderWidth: 2,
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
              <Ionicons name="share-outline" size={28} color={NEON.green} />
            </View>
            <Text
              style={{
                marginTop: 8,
                fontSize: 13,
                fontWeight: "800",
                color: theme.colors.text,
              }}
            >
              Share Build
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: theme.colors.textSecondary,
              }}
            >
              Send summary
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ── Body ──────────────────────────────────────────── */}
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
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
          All Steps Completed
        </Text>

        {/* Build started + completed dates */}
        <View style={{ gap: 4, marginBottom: 12 }}>
          {build.homeBuildIntakeStartedAt ? (
            <View className="flex-row items-center gap-2">
              <Ionicons
                name="calendar-outline"
                size={14}
                color={NEON.yellowMuted}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: theme.colors.textSecondary,
                }}
              >
                Build started{" "}
                <Text style={{ fontWeight: "800", color: NEON.yellow }}>
                  {formatDate(build.homeBuildIntakeStartedAt)}
                </Text>
              </Text>
            </View>
          ) : null}

          {build.updatedAt ? (
            <View className="flex-row items-center gap-2">
              <Ionicons
                name="checkmark-done-outline"
                size={14}
                color={NEON.green}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: theme.colors.textSecondary,
                }}
              >
                Build completed{" "}
                <Text style={{ fontWeight: "800", color: NEON.green }}>
                  {formatDate(build.updatedAt)}
                </Text>
              </Text>
            </View>
          ) : null}
        </View>

        {/* Total cost summary */}
        {totalCost > 0 ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 14,
              backgroundColor: NEON.greenBg15,
              borderWidth: 1,
              borderColor: NEON.greenBg25,
            }}
          >
            <Ionicons name="wallet-outline" size={18} color={NEON.green} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "800",
                color: NEON.green,
              }}
            >
              Total Build Cost: {formatCurrency(totalCost)}
            </Text>
          </View>
        ) : null}

        {/* Steps list */}
        <FlatList
          className="mt-2"
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
                No steps recorded
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  fontWeight: "500",
                  color: theme.colors.textSecondary,
                }}
              >
                This completed build has no step records.
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}
