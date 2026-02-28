// app/(security)/(private)/(homebuilder)/(cost)/costing.jsx
//
// ✅ Cost Overview — lists each completed build with:
//    - Address + lot dimensions
//    - Build start → completion dates
//    - Last step photos carousel
//    - Total build cost (right side)
//
// ────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../../../wrappers/providers/ThemeContext";
import callBackend from "../../../../../services/callBackend";

// ── Neon accent palette ───────────────────────────────────────
const NEON = {
  yellow: "#fde047",
  yellowMuted: "#facc15",
  green: "#a3e635",
  greenBg15: "rgba(163,230,53,0.15)",
  greenBg25: "rgba(163,230,53,0.25)",
  yellowBg15: "rgba(250,204,21,0.15)",
  yellowBg25: "rgba(250,204,21,0.25)",
};

const CAROUSEL_MS = 2500;

// ── Helpers ───────────────────────────────────────────────────
const safe = (v) => String(v || "").trim();

function formatCurrency(amount) {
  if (typeof amount !== "number" || isNaN(amount)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

// ══════════════════════════════════════════════════════════════
// ██  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function CostingScreen() {
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  // ── State ──────────────────────────────────────────────────
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ── Carousel tick for photo cycling ────────────────────────
  const [tick, setTick] = useState(0);
  const timerRef = useRef(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setTick((t) => t + 1), CAROUSEL_MS);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchCostOverview = useCallback(
    async ({ pull = false } = {}) => {
      try {
        setError("");
        pull ? setRefreshing(true) : setLoading(true);

        const res = await callBackend.get("/api/costs/overview");
        const list = res?.data?.builds ?? [];
        setBuilds(list);
        if (list.length) startTimer();
      } catch (e) {
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Could not load cost overview."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [startTimer]
  );

  useFocusEffect(
    useCallback(() => {
      fetchCostOverview();
    }, [fetchCostOverview])
  );

  // ── Grand total ────────────────────────────────────────────
  const grandTotal = builds.reduce((sum, b) => sum + (b.totalCost || 0), 0);

  // ─────────────── Loading ───────────────────────────────────
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
          Loading cost overview…
        </Text>
      </View>
    );
  }

  // ─────────────── Error ─────────────────────────────────────
  if (error && builds.length === 0) {
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
          name="cloud-offline-outline"
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
          Something went wrong
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontSize: 14,
            fontWeight: "600",
            textAlign: "center",
            color: theme.colors.textSecondary,
          }}
        >
          {error}
        </Text>
        <Pressable
          onPress={() => fetchCostOverview()}
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

  // ─────────────── Empty ─────────────────────────────────────
  if (builds.length === 0) {
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
          name="wallet-outline"
          size={56}
          color={theme.colors.textSecondary}
        />
        <Text
          style={{
            marginTop: 16,
            fontSize: 20,
            fontWeight: "900",
            color: theme.colors.text,
          }}
        >
          No Completed Builds
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontSize: 14,
            fontWeight: "600",
            textAlign: "center",
            color: theme.colors.textSecondary,
          }}
        >
          Complete a build to see its cost breakdown here.
        </Text>
      </View>
    );
  }

  // ── Shared text-shadow for visibility on images ───────────
  const BRIGHT_SHADOW = {
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  };

  const CARD_HEIGHT = 210;

  // ─────────────── Build Row ─────────────────────────────────
  function BuildCostRow({ item, index }) {
    const address = safe(item.address) || "No address";
    const dimensions = safe(item.lotDimensions);
    const startDate = formatDate(item.startDate);
    const completedDate = formatDate(item.completedDate);
    const totalCost = item.totalCost || 0;
    const stepCount = item.stepCount || 0;

    // Pick photos: prefer lastStepPhotos, fallback to lotPhotos
    const photos =
      (item.lastStepPhotos || []).length > 0
        ? item.lastStepPhotos
        : item.lotPhotos || [];

    const photoUrls = photos.map((p) => safe(p.url)).filter(Boolean);
    const heroUrl =
      photoUrls.length > 0
        ? photoUrls[(tick + index) % photoUrls.length]
        : "";

    /* ── Inner content (overlaid on top of image / dark bg) ── */
    const overlayContent = (
      <>
        {/* Dark scrim so text pops on every image */}
        <View
          style={{
            ...{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
            backgroundColor: "rgba(0,0,0,0.52)",
          }}
        />

        {/* All text content — sits on top of scrim */}
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            padding: 14,
            zIndex: 2,
          }}
        >
          {/* Left — address, dates, step count */}
          <View style={{ flex: 1, paddingRight: 12, justifyContent: "space-between" }}>
            {/* Address */}
            <Text
              numberOfLines={2}
              style={{
                fontSize: 17,
                fontWeight: "900",
                color: "#fff",
                lineHeight: 23,
                ...BRIGHT_SHADOW,
              }}
            >
              {address}
            </Text>

            {/* Lot dimensions */}
            {dimensions ? (
              <Text
                style={{
                  marginTop: 3,
                  fontSize: 12,
                  fontWeight: "700",
                  color: "rgba(255,255,255,0.85)",
                  ...BRIGHT_SHADOW,
                }}
              >
                {dimensions}
              </Text>
            ) : null}

            {/* Dates row */}
            <View style={{ marginTop: 10, gap: 5 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={13}
                  color={NEON.yellow}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: "rgba(255,255,255,0.9)",
                    ...BRIGHT_SHADOW,
                  }}
                >
                  Started{" "}
                  <Text style={{ fontWeight: "900", color: NEON.yellow }}>
                    {startDate}
                  </Text>
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Ionicons
                  name="checkmark-done-outline"
                  size={13}
                  color={NEON.green}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: "rgba(255,255,255,0.9)",
                    ...BRIGHT_SHADOW,
                  }}
                >
                  Completed{" "}
                  <Text style={{ fontWeight: "900", color: NEON.green }}>
                    {completedDate}
                  </Text>
                </Text>
              </View>
            </View>

            {/* Step count pill */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                marginTop: 10,
                alignSelf: "flex-start",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: "rgba(163,230,53,0.25)",
              }}
            >
              <Ionicons name="layers-outline" size={12} color={NEON.green} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "900",
                  color: NEON.green,
                  ...BRIGHT_SHADOW,
                }}
              >
                {stepCount} step{stepCount !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          {/* Right — total cost */}
          <View
            style={{
              alignItems: "flex-end",
              justifyContent: "center",
              minWidth: 100,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "800",
                color: "rgba(255,255,255,0.75)",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 4,
                ...BRIGHT_SHADOW,
              }}
            >
              Total Cost
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "900",
                color: totalCost > 0 ? NEON.green : "rgba(255,255,255,0.6)",
                ...BRIGHT_SHADOW,
              }}
            >
              {totalCost > 0 ? formatCurrency(totalCost) : "$0"}
            </Text>

            {/* Completed badge */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginTop: 10,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: "rgba(163,230,53,0.25)",
              }}
            >
              <Ionicons
                name="checkmark-circle"
                size={12}
                color={NEON.green}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "900",
                  color: NEON.green,
                  ...BRIGHT_SHADOW,
                }}
              >
                Completed
              </Text>
            </View>
          </View>
        </View>

        {/* Photo count badge — bottom-right */}
        {photoUrls.length > 1 && (
          <View
            style={{
              position: "absolute",
              right: 10,
              bottom: 10,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: "rgba(0,0,0,0.6)",
              zIndex: 3,
            }}
          >
            <Ionicons name="images-outline" size={12} color="#fff" />
            <Text
              style={{
                marginLeft: 4,
                fontSize: 10,
                fontWeight: "900",
                color: "#fff",
              }}
            >
              {photoUrls.length}
            </Text>
          </View>
        )}
      </>
    );

    /* ── Card wrapper ───────────────────────────────────────── */
    return (
      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 14,
          borderRadius: 16,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        {heroUrl ? (
          <ImageBackground
            source={{ uri: heroUrl }}
            style={{ width: "100%", height: CARD_HEIGHT }}
            imageStyle={{ opacity: 0.55 }}
            resizeMode="cover"
          >
            {overlayContent}
          </ImageBackground>
        ) : (
          /* No photo — solid dark bg with subtle icon */
          <View
            style={{
              width: "100%",
              height: CARD_HEIGHT,
              backgroundColor: "#1a1a2e",
            }}
          >
            {/* Faint image icon in center */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.08,
              }}
            >
              <Ionicons name="image-outline" size={80} color="#fff" />
            </View>
            {overlayContent}
          </View>
        )}
      </View>
    );
  }

  // ─────────────── Main Render ───────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchCostOverview({ pull: true })}
            tintColor={NEON.green}
          />
        }
      >
        {/* ── Header ─────────────────────────────────────── */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 14,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "900",
              letterSpacing: 2,
              color: NEON.green,
              marginBottom: 6,
            }}
          >
            CITY-BUILDER • COST OVERVIEW
          </Text>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "900",
              color: theme.colors.text,
            }}
          >
            Build Costs
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontSize: 14,
              fontWeight: "600",
              color: theme.colors.textSecondary,
            }}
          >
            {builds.length} completed build{builds.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* ── Grand total banner ─────────────────────────── */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 18,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderRadius: 16,
            backgroundColor: NEON.greenBg15,
            borderWidth: 1,
            borderColor: NEON.greenBg25,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: NEON.greenBg25,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="wallet-outline" size={20} color={NEON.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: NEON.green,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Grand Total — All Builds
            </Text>
            <Text
              style={{
                marginTop: 2,
                fontSize: 24,
                fontWeight: "900",
                color: NEON.green,
              }}
            >
              {formatCurrency(grandTotal)}
            </Text>
          </View>
        </View>

        {/* ── Build rows ─────────────────────────────────── */}
        {builds.map((build, index) => (
          <BuildCostRow key={String(build._id)} item={build} index={index} />
        ))}
      </ScrollView>
    </View>
  );
}
