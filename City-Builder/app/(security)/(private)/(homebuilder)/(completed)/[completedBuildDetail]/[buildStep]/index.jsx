// app/(security)/(private)/(homebuilder)/(completed)/[completedBuildDetail]/[buildStep]/index.jsx
//
// ✅ Completed Build Step Detail — read-only step view
// - Fetches the build, finds the matching step by ID
// - Displays: step number, title, "Completed" badge, dates, cost, notes, photos
// - Pull-to-refresh, loading & error states
// - No Edit button (build is completed)

import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../../../../../wrappers/providers/ThemeContext";
import callBackend from "../../../../../../../services/callBackend";

// ── Neon accent palette (City-Builder brand) ──────────────────
const NEON = {
  yellow: "#fde047",
  yellowMuted: "#facc15",
  green: "#a3e635",
  greenBg15: "rgba(163,230,53,0.15)",
  greenBg25: "rgba(163,230,53,0.25)",
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

const PHOTO_GAP = 6;
const PHOTO_COLS = 3;
const screenWidth = Dimensions.get("window").width;
const photoSize = (screenWidth - 40 - PHOTO_GAP * (PHOTO_COLS - 1)) / PHOTO_COLS;

// ══════════════════════════════════════════════════════════════
// ██  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function CompletedBuildStepDetailScreen() {
  const { completedBuildDetail: buildId, buildStep: stepId } =
    useLocalSearchParams();
  const { theme } = useTheme();
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────
  const [step, setStep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ── Fetch ──────────────────────────────────────────────────
  const fetchStep = useCallback(
    async ({ pull = false } = {}) => {
      if (!buildId || !stepId) return;
      try {
        setError("");
        pull ? setRefreshing(true) : setLoading(true);
        const res = await callBackend.get(`/api/builds/${buildId}`);
        const allSteps = res?.data?.steps ?? [];
        const found = allSteps.find((s) => s._id === stepId);
        if (!found) throw new Error("Step not found");
        setStep(found);
      } catch (e) {
        const msg =
          e?.response?.data?.message || e.message || "Failed to load step";
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [buildId, stepId]
  );

  useFocusEffect(
    useCallback(() => {
      fetchStep();
    }, [fetchStep])
  );

  // ── Loading ────────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={NEON.green} />
        <Text
          style={{
            marginTop: 14,
            fontSize: 14,
            fontWeight: "600",
            color: theme.colors.textSecondary,
          }}
        >
          Loading step…
        </Text>
      </View>
    );
  }

  // ── Error / Not found ──────────────────────────────────────
  if (error || !step) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
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
          {error || "Step not found"}
        </Text>

        <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 16,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Ionicons name="arrow-back" size={18} color={theme.colors.text} />
            <Text
              style={{
                marginLeft: 8,
                fontSize: 15,
                fontWeight: "900",
                color: theme.colors.text,
              }}
            >
              Go Back
            </Text>
          </Pressable>

          <Pressable
            onPress={() => fetchStep()}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
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
      </View>
    );
  }

  // ── Derive display values ──────────────────────────────────
  const title = safe(step.title) || safe(step.stepType).replace(/_/g, " ");
  const photos = Array.isArray(step.photos) ? step.photos : [];
  const hasNotes = !!safe(step.notes);
  const hasCost = step.costAmount > 0;
  const hasStart = !!safe(step.dateStart);
  const hasEnd = !!safe(step.dateEnd);

  // ── MAIN RENDER ────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchStep({ pull: true })}
            tintColor={NEON.green}
          />
        }
      >
        {/* ── Header ─────────────────────────────────────── */}
        <View
          style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 }}
        >
          {/* Back button */}
          <Pressable
            className="flex-row mb-4"
            onPress={() => router.back()}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              alignSelf: "flex-start",
              paddingVertical: 8,
              paddingRight: 16,
              marginBottom: 10,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="chevron-back" size={30} color={NEON.green} />
            <Text
              className="mt-1.5"
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: NEON.green,
                marginLeft: 4,
              }}
            >
              Back
            </Text>
          </Pressable>

          {/* Step number badge + title */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: NEON.greenBg15,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "900",
                  color: NEON.green,
                }}
              >
                {step.stepNumber ?? "—"}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "900",
                  color: theme.colors.text,
                }}
              >
                {title}
              </Text>

              {/* Completed badge */}
              <View
                style={{
                  alignSelf: "flex-start",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  marginTop: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 20,
                  backgroundColor: NEON.greenBg15,
                }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={NEON.green}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "800",
                    color: NEON.green,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Completed
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Dates row ──────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            marginHorizontal: 20,
            marginTop: 14,
            gap: 10,
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              padding: 12,
              borderRadius: 14,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={hasStart ? NEON.yellowMuted : theme.colors.textSecondary}
            />
            <View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: theme.colors.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Start Date
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: hasStart
                    ? theme.colors.text
                    : theme.colors.textSecondary,
                  marginTop: 2,
                }}
              >
                {hasStart ? step.dateStart : "Not set"}
              </Text>
            </View>
          </View>

          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              padding: 12,
              borderRadius: 14,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={hasEnd ? NEON.green : theme.colors.textSecondary}
            />
            <View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: theme.colors.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                End Date
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: hasEnd
                    ? theme.colors.text
                    : theme.colors.textSecondary,
                  marginTop: 2,
                }}
              >
                {hasEnd ? step.dateEnd : "Not set"}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Cost card ──────────────────────────────────── */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 14,
            padding: 16,
            borderRadius: 16,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: NEON.greenBg15,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="cash-outline" size={18} color={NEON.green} />
            </View>
            <View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: theme.colors.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Cost
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "900",
                  color: hasCost
                    ? theme.colors.text
                    : theme.colors.textSecondary,
                  marginTop: 2,
                }}
              >
                {hasCost ? formatCurrency(step.costAmount) : "No cost added"}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Notes card ─────────────────────────────────── */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 14,
            padding: 16,
            borderRadius: 16,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <Ionicons
              name="document-text-outline"
              size={18}
              color={NEON.yellowMuted}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "800",
                color: theme.colors.text,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Notes
            </Text>
          </View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: theme.colors.textSecondary,
              lineHeight: 22,
              fontStyle: hasNotes ? "normal" : "italic",
            }}
          >
            {hasNotes ? step.notes : "No notes added"}
          </Text>
        </View>

        {/* ── Photos grid ────────────────────────────────── */}
        <View style={{ marginHorizontal: 20, marginTop: 18 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Ionicons
              name="images-outline"
              size={18}
              color={NEON.yellowMuted}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "800",
                color: theme.colors.text,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Photos ({photos.length})
            </Text>
          </View>

          {photos.length > 0 ? (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: PHOTO_GAP,
              }}
            >
              {photos.map((photo, idx) => (
                <Image
                  key={photo.imageKitFileId || idx}
                  source={{ uri: photo.thumbnailUrl || photo.url }}
                  style={{
                    width: photoSize,
                    height: photoSize,
                    borderRadius: 12,
                    backgroundColor: theme.colors.surface,
                  }}
                  resizeMode="cover"
                />
              ))}
            </View>
          ) : (
            <View
              style={{
                padding: 20,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderStyle: "dashed",
                alignItems: "center",
              }}
            >
              <Ionicons
                name="camera-outline"
                size={28}
                color={theme.colors.textSecondary}
              />
              <Text
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  fontWeight: "600",
                  color: theme.colors.textSecondary,
                  fontStyle: "italic",
                }}
              >
                No photos added
              </Text>
            </View>
          )}
        </View>

        {/* ── Step metadata table ────────────────────────── */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 20,
            padding: 16,
            borderRadius: 16,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "800",
              color: theme.colors.text,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 12,
            }}
          >
            Details
          </Text>

          {[
            { label: "Step Type", value: safe(step.stepType) || "—" },
            { label: "Status", value: "Completed" },
            {
              label: "Created",
              value: step.createdAt
                ? new Date(step.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—",
            },
            {
              label: "Last Updated",
              value: step.updatedAt
                ? new Date(step.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—",
            },
          ].map((row, i, arr) => (
            <View
              key={row.label}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 10,
                borderBottomWidth:
                  i < arr.length - 1 ? StyleSheet.hairlineWidth : 0,
                borderBottomColor: theme.colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: theme.colors.textSecondary,
                }}
              >
                {row.label}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: theme.colors.text,
                }}
              >
                {row.value}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
