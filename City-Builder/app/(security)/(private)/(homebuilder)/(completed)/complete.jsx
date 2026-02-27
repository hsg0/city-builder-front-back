// app/(security)/(private)/(homebuilder)/(completed)/complete.jsx
//
// ✅ Completed builds screen — 2-column grid (mirrors inprogress.jsx)
//
// ────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../../../wrappers/providers/ThemeContext";
import callBackend from "../../../../../services/callBackend";

// ── Layout constants ──────────────────────────────────────────
const CAROUSEL_MS = 2000;
const COLUMNS = 2;
const EDGE = 16;
const SPACING = 12;
const ROW_GAP = 14;
const RADIUS = 14;

// ── Helpers ───────────────────────────────────────────────────
const safe = (v) => String(v || "").trim();

function detailRoute(id) {
  return {
    pathname:
      "/(security)/(private)/(homebuilder)/(completed)/[completedBuildDetail]/completedDetail",
    params: { completedBuildDetail: id },
  };
}

function photosFromBuild(build) {
  return (Array.isArray(build?.lotPhotos) ? build.lotPhotos : [])
    .map((p) => safe(p?.url))
    .filter(Boolean);
}

function chunkArray(arr, size) {
  const rows = [];
  for (let i = 0; i < arr.length; i += size) {
    rows.push(arr.slice(i, i + size));
  }
  return rows;
}

// ══════════════════════════════════════════════════════════════
// ██  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function CompletedScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  const cardWidth = Math.floor((screenWidth - EDGE * 2 - SPACING) / COLUMNS);
  const imageHeight = Math.round(cardWidth * 0.78);

  // ── Neon accent palette ────────────────────────────────────
  const NEON_GREEN_BG15 = "rgba(163,230,53,0.15)";
  const NEON_GREEN = "#a3e635";

  // ── Mark build active handler ──────────────────────────────
  function handleMarkActive(buildId, address) {
    Alert.alert(
      "Mark build as active?",
      `"${address}" will move from Completed back to Active.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark Active",
          style: "default",
          onPress: async () => {
            try {
              await callBackend.patch(`/api/builds/${buildId}/reactivate`);
              Alert.alert("Done ✅", "Build moved back to Active.");
              fetchBuilds();
            } catch (e) {
              const msg =
                e?.response?.data?.message || e?.message || "Could not reactivate build.";
              Alert.alert("Error", msg);
            }
          },
        },
      ]
    );
  }

  // ── State ──────────────────────────────────────────────────
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ── Carousel tick ──────────────────────────────────────────
  const [tick, setTick] = useState(0);
  const timerRef = useRef(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setTick((t) => t + 1), CAROUSEL_MS);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchBuilds = useCallback(
    async ({ pull = false } = {}) => {
      try {
        setError("");
        pull ? setRefreshing(true) : setLoading(true);

        const res = await callBackend.get("/api/builds/completed");
        const list = res?.data?.builds ?? [];
        setBuilds(list);
        if (list.length) startTimer();
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || "Could not load builds.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [startTimer]
  );

  useFocusEffect(useCallback(() => { fetchBuilds(); }, [fetchBuilds]));

  const rows = useMemo(() => chunkArray(builds, COLUMNS), [builds]);

  // ─────────────── Loading ───────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 12, fontSize: 15, fontWeight: "600", color: theme.colors.textSecondary }}>
          Loading completed builds…
        </Text>
      </View>
    );
  }

  // ─────────────── Error ─────────────────────────────────────
  if (error && builds.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24, backgroundColor: theme.colors.background }}>
        <Ionicons name="cloud-offline-outline" size={48} color={theme.colors.textSecondary} />
        <Text style={{ marginTop: 16, fontSize: 18, fontWeight: "900", color: theme.colors.text }}>Something went wrong</Text>
        <Text style={{ marginTop: 8, fontSize: 14, fontWeight: "600", textAlign: "center", color: theme.colors.textSecondary }}>{error}</Text>
        <Pressable
          onPress={() => fetchBuilds()}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", marginTop: 20,
            paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16,
            backgroundColor: theme.colors.primary, opacity: pressed ? 0.8 : 1,
          })}
        >
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={{ marginLeft: 8, fontSize: 15, fontWeight: "900", color: "#fff" }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  // ─────────────── Empty ─────────────────────────────────────
  if (builds.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24, backgroundColor: theme.colors.background }}>
        <Ionicons name="checkmark-done-outline" size={56} color={theme.colors.textSecondary} />
        <Text style={{ marginTop: 16, fontSize: 20, fontWeight: "900", color: theme.colors.text }}>No Completed Builds</Text>
        <Text style={{ marginTop: 8, fontSize: 14, fontWeight: "600", textAlign: "center", color: theme.colors.textSecondary }}>
          Builds you mark as complete will appear here.
        </Text>
      </View>
    );
  }

  // ─────────────── Grid ──────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchBuilds({ pull: true })} tintColor={theme.colors.primary} />
        }
      >
        {/* ── Header ─────────────────────────────────────── */}
        <View style={{ paddingHorizontal: EDGE, paddingTop: 16, paddingBottom: 14 }}>
          <Text style={{ fontSize: 24, fontWeight: "900", color: theme.colors.text }}>Completed Builds</Text>
          <Text style={{ marginTop: 4, fontSize: 14, fontWeight: "600", color: theme.colors.textSecondary }}>
            {builds.length} {builds.length === 1 ? "project" : "projects"}
          </Text>
        </View>

        {/* ── Rows ───────────────────────────────────────── */}
        {rows.map((row, rowIdx) => (
          <View
            key={`row-${rowIdx}`}
            style={{
              flexDirection: "row",
              paddingLeft: EDGE,
              paddingRight: EDGE,
              marginBottom: ROW_GAP,
            }}
          >
            {row.map((build, colIdx) => {
              const id = safe(build?._id);
              const address = safe(build?.summary?.lotAddress) || "No address";
              const photos = photosFromBuild(build);
              const globalIdx = rowIdx * COLUMNS + colIdx;
              const heroUrl = photos.length > 0 ? photos[(tick + globalIdx) % photos.length] : "";

              return (
                <View
                  key={id}
                  style={{
                    width: cardWidth,
                    marginLeft: colIdx === 0 ? 0 : SPACING,
                  }}
                >
                  <Pressable
                    onPress={() => router.push(detailRoute(id))}
                    style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                  >
                    <View
                      style={{
                        borderRadius: RADIUS,
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: `${theme.colors.border}AA`,
                        backgroundColor: theme.colors.surface,
                      }}
                    >
                      {/* ── Image ──────────────────────────── */}
                      {heroUrl ? (
                        <Image
                          source={{ uri: heroUrl }}
                          style={{ width: cardWidth, height: imageHeight }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={{
                            width: cardWidth,
                            height: imageHeight,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: `${theme.colors.primary}12`,
                          }}
                        >
                          <Ionicons name="image-outline" size={28} color={theme.colors.primary} />
                          <Text style={{ marginTop: 6, fontSize: 11, fontWeight: "700", color: theme.colors.primary }}>
                            No photos yet
                          </Text>
                        </View>
                      )}

                      {/* ── Completed badge (top-left) ─────── */}
                      <View
                        style={{
                          position: "absolute", left: 8, top: 8,
                          flexDirection: "row", alignItems: "center",
                          paddingHorizontal: 8, paddingVertical: 3,
                          borderRadius: 999, backgroundColor: NEON_GREEN_BG15,
                        }}
                      >
                        <Ionicons name="checkmark-circle" size={10} color={NEON_GREEN} />
                        <Text style={{ marginLeft: 4, fontSize: 10, fontWeight: "900", color: NEON_GREEN }}>Completed</Text>
                      </View>

                      {/* ── Photo count badge (top-right) ──── */}
                      {photos.length > 0 && (
                        <View
                          style={{
                            position: "absolute", right: 8, top: 8,
                            flexDirection: "row", alignItems: "center",
                            paddingHorizontal: 7, paddingVertical: 3,
                            borderRadius: 999, backgroundColor: "rgba(0,0,0,0.5)",
                          }}
                        >
                          <Ionicons name="images-outline" size={12} color="#fff" />
                          <Text style={{ marginLeft: 4, fontSize: 10, fontWeight: "900", color: "#fff" }}>{photos.length}</Text>
                        </View>
                      )}

                      {/* ── Text area ──────────────────────── */}
                      <View style={{ padding: 10 }}>
                        <Text
                          numberOfLines={2}
                          style={{ fontSize: 13, fontWeight: "900", color: theme.colors.text, lineHeight: 18 }}
                        >
                          {address}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                          <Ionicons name="arrow-forward-circle" size={15} color={theme.colors.success} />
                          <Text style={{ marginLeft: 6, fontSize: 12, fontWeight: "900", color: theme.colors.success }}>
                            Open build
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>

                  {/* ── Mark Active button ──────────────── */}
                  <Pressable
                    className="flex-row mt-3 border min-h-8 h-10 border-green-400 rounded-lg px-3 py-1 items-center"
                    onPress={() => handleMarkActive(id, address)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 8,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: NEON_GREEN_BG15,
                      borderWidth: 1,
                      borderColor: "rgba(163,230,53,0.25)",
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Ionicons className="ml-2" name="arrow-undo" size={16} color={NEON_GREEN} />
                    <Text
                      style={{
                        marginLeft: 10,
                        fontSize: 11,
                        fontWeight: "900",
                        color: NEON_GREEN,
                      }}
                    >
                      Mark Active
                    </Text>
                  </Pressable>
                </View>
              );
            })}

            {row.length < COLUMNS && (
              <View style={{ width: cardWidth, marginLeft: SPACING }} />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
