// app/(security)/(private)/(homebuilder)/(active)/[selectABuild]/index.jsx
//
// ✅ Build Detail — "Active Build" view
// - Real data via GET /api/builds/:projectId → { build, steps }
// - City-Builder neon yellow + neon green accent palette
// - Header: address, lot intake badge, "Add Step" CTA
// - "Mark Build Complete" banner
// - Steps list (step #, title, cost, photos, edit / delete)
// - Pure RN style objects + useTheme() for base dark/light

import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { useTheme } from "../../../../../../wrappers/providers/ThemeContext";
import callBackend from "../../../../../../services/callBackend";
import { uploadImagesToImageKit } from "../../../../../../services/imageKitUpload";
import { compressImageUriListForUpload } from "../../../../../../services/compressImages";
import homeBuildStepsData from "../../../../../../components/buildSteps/home_build_steps.json";

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

const MAXIMUM_STEP_PHOTOS = 8;

// ── Pre-extract the step suggestion titles from the JSON ──────
const ALL_STEP_SUGGESTIONS = (homeBuildStepsData?.steps || []).map((s) => ({
  id: s.id,
  title: s.title,
  category: s.category,
}));

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

  // ── Add Step modal state ──────────────────────────────────
  const [isAddStepModalVisible, setIsAddStepModalVisible] = useState(false);
  const [stepTitleText, setStepTitleText] = useState("");
  const [stepCostText, setStepCostText] = useState("");
  const [stepStartDate, setStepStartDate] = useState("");
  const [stepEndDate, setStepEndDate] = useState("");
  const [stepNotesText, setStepNotesText] = useState("");
  const [stepPhotos, setStepPhotos] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savingStep, setSavingStep] = useState(false);

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isSmallPhone = screenWidth < 380;
  const tileSize = isSmallPhone ? 80 : 92;

  // ── Filter suggestions: show after 2+ chars, case-insensitive ──
  const filteredSuggestions = useMemo(() => {
    const q = stepTitleText.trim().toLowerCase();
    if (q.length < 2) return [];
    return ALL_STEP_SUGGESTIONS.filter((s) =>
      s.title.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [stepTitleText]);

  // ── Next step number: existing steps + 1 ──
  const nextStepNumber = steps.length + 1;

  // ── Add Step photo handlers ──────────────────────────────
  function addStepPhotoUris(newUris) {
    setStepPhotos((prev) => {
      const merged = [...prev, ...newUris];
      const unique = Array.from(new Set(merged));
      return unique.slice(0, MAXIMUM_STEP_PHOTOS);
    });
  }

  async function pickStepPhotosFromLibrary() {
    if (stepPhotos.length >= MAXIMUM_STEP_PHOTOS) {
      Alert.alert("Limit reached", `You can add up to ${MAXIMUM_STEP_PHOTOS} photos.`);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm?.granted) {
      Alert.alert("Permission needed", "Please allow photo library access.");
      return;
    }
    const remaining = MAXIMUM_STEP_PHOTOS - stepPhotos.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });
    if (result.canceled) return;
    const uris = (result.assets || []).map((a) => a?.uri).filter(Boolean);
    addStepPhotoUris(uris);
  }

  async function takeStepPhotoWithCamera() {
    if (stepPhotos.length >= MAXIMUM_STEP_PHOTOS) {
      Alert.alert("Limit reached", `You can add up to ${MAXIMUM_STEP_PHOTOS} photos.`);
      return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm?.granted) {
      Alert.alert("Permission needed", "Please allow camera access.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: false,
    });
    if (result.canceled) return;
    const uri = result?.assets?.[0]?.uri;
    if (uri) addStepPhotoUris([uri]);
  }

  function removeStepPhoto(uri) {
    setStepPhotos((prev) => prev.filter((p) => p !== uri));
  }

  // ── Reset + open/close modal ──────────────────────────────
  function openAddStepModal() {
    setStepTitleText("");
    setStepCostText("");
    setStepStartDate("");
    setStepEndDate("");
    setStepNotesText("");
    setStepPhotos([]);
    setShowSuggestions(false);
    setIsAddStepModalVisible(true);
  }

  function closeAddStepModal() {
    setIsAddStepModalVisible(false);
  }

  async function handleSaveStep() {
    const title = stepTitleText.trim();
    if (!title) {
      Alert.alert("Missing info", "Please enter a step title.");
      return;
    }

    try {
      setSavingStep(true);
      console.log("[BuildDetail] Saving step:", {
        buildId,
        stepNumber: nextStepNumber,
        title,
        cost: stepCostText,
        startDate: stepStartDate,
        endDate: stepEndDate,
        notes: stepNotesText,
        photoCount: stepPhotos.length,
      });

      // ── 1. Compress photos to ≤ 1.6 MB each (HEIC/PNG/WebP → JPEG) ──
      let uploadedPhotos = [];
      if (stepPhotos.length > 0) {
        console.log("[BuildDetail] Compressing", stepPhotos.length, "photo(s)…");
        const compressedUris = await compressImageUriListForUpload({
          imageUriStringList: stepPhotos,
        });

        // ── 2. Upload compressed photos to ImageKit ──
        console.log("[BuildDetail] Uploading", compressedUris.length, "photo(s) to ImageKit…");
        uploadedPhotos = await uploadImagesToImageKit(compressedUris, {
          folder: "/build-step-photos",
        });
        console.log("[BuildDetail] Uploaded", uploadedPhotos.length, "photo(s)");
      }

      // ── 3. POST step metadata + photo metadata to backend ──
      const res = await callBackend.post("/api/builds/steps/add", {
        projectId: buildId,
        title,
        stepNumber: nextStepNumber,
        startDate: stepStartDate,
        endDate: stepEndDate,
        cost: stepCostText,
        notes: stepNotesText,
        photos: uploadedPhotos,
      });

      console.log("[BuildDetail] Step saved:", res?.data?.step?._id);
      closeAddStepModal();
      fetchBuild(); // refresh the step list
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to save step.";
      console.warn("[BuildDetail] Save step error:", msg);
      Alert.alert("Error", msg);
    } finally {
      setSavingStep(false);
    }
  }

  // ── Actions ────────────────────────────────────────────────
  function handlePressAddNextStep() {
    openAddStepModal();
  }

  function handlePressEditStep(step) {
    router.push({
      pathname: `/(homebuilder)/(active)/${buildId}/${step._id}/edit`,
    });
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

        <Pressable
          onPress={() =>
            router.push({
              pathname: `/(homebuilder)/(active)/${buildId}/${item._id}`,
            })
          }
          style={({ pressed }) => ({
            marginBottom: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            padding: 14,
            opacity: pressed ? 0.85 : 1,
          })}
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
              <Ionicons name="chevron-forward" size={14} color={NEON.yellowMuted} />
            </View>
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

            {/* Cost — right-aligned under Edit */}
            <View
              style={{
                marginTop: 10,
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

            {/* Delete button — hidden for now
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
            */}
          </View>
        </View>

      </Pressable>
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
          <View className="flex-row items-center gap-2 mb-5">
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
          className="mt-4"
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

      {/* ══════════════════════════════════════════════════════ */}
      {/* ██  ADD STEP MODAL                                    */}
      {/* ══════════════════════════════════════════════════════ */}
      <Modal
        visible={isAddStepModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeAddStepModal}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, justifyContent: "flex-end" }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
          >
            <View
              style={{
                backgroundColor: theme.colors.surface,
                borderTopLeftRadius: 26,
                borderTopRightRadius: 26,
                borderWidth: 1,
                borderColor: theme.colors.border,
                paddingHorizontal: 20,
                paddingTop: 14,
                paddingBottom: 18,
                maxHeight: screenHeight * 0.9,
              }}
            >
              {/* Modal header */}
              <View className="flex-row items-center justify-between mb-2">
                <Text
                  style={{ fontSize: 18, fontWeight: "900", color: theme.colors.text }}
                >
                  Add Step {nextStepNumber}
                </Text>
                <Pressable onPress={closeAddStepModal} className="active:opacity-70">
                  <Ionicons name="close" size={22} color={theme.colors.text} />
                </Pressable>
              </View>

              <Text
                style={{ fontSize: 13, lineHeight: 18, color: theme.colors.textSecondary, marginBottom: 12 }}
              >
                Enter step details. Start typing for suggestions or enter a custom title.
              </Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                {/* ── STEP TITLE with autocomplete ─────────── */}
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: 12,
                    fontWeight: "800",
                    letterSpacing: 0.4,
                    marginBottom: 6,
                  }}
                >
                  STEP TITLE
                </Text>
                <TextInput
                  value={stepTitleText}
                  onChangeText={(text) => {
                    setStepTitleText(text);
                    setShowSuggestions(text.trim().length >= 5);
                  }}
                  onBlur={() => setShowSuggestions(false)}
                  placeholder="e.g. Install framing, Pour foundation..."
                  placeholderTextColor={theme.colors.textSecondary}
                  autoCapitalize="sentences"
                  autoCorrect={false}
                  returnKeyType="done"
                  style={{
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: `${theme.colors.border}88`,
                    backgroundColor: `${theme.colors.background}AA`,
                    paddingVertical: 14,
                    paddingHorizontal: 14,
                    color: theme.colors.text,
                    fontSize: 14,
                  }}
                />

                {/* Suggestion dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <View
                    style={{
                      marginTop: 4,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                      maxHeight: 200,
                      overflow: "hidden",
                    }}
                  >
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {filteredSuggestions.map((suggestion) => (
                        <Pressable
                          key={suggestion.id}
                          onPress={() => {
                            setStepTitleText(suggestion.title);
                            setShowSuggestions(false);
                          }}
                          className="active:opacity-70"
                          style={{
                            paddingVertical: 12,
                            paddingHorizontal: 14,
                            borderBottomWidth: 1,
                            borderBottomColor: `${theme.colors.border}44`,
                          }}
                        >
                          <Text
                            style={{ fontSize: 14, fontWeight: "600", color: theme.colors.text }}
                            numberOfLines={1}
                          >
                            {suggestion.title}
                          </Text>
                          <Text
                            style={{ fontSize: 11, fontWeight: "500", color: theme.colors.textSecondary, marginTop: 2 }}
                          >
                            {suggestion.category}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* ── ESTIMATED DATES (row) ──────────────── */}
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: 12,
                    fontWeight: "800",
                    letterSpacing: 0.4,
                    marginBottom: 6,
                    marginTop: 14,
                  }}
                >
                  ESTIMATED DATES
                </Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {/* Start date */}
                  <TextInput
                    value={stepStartDate}
                    onChangeText={setStepStartDate}
                    onFocus={() => setShowSuggestions(false)}
                    placeholder="Start  MM/DD/YYYY"
                    placeholderTextColor={theme.colors.textSecondary}
                    returnKeyType="done"
                    style={{
                      flex: 1,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: `${theme.colors.border}88`,
                      backgroundColor: `${theme.colors.background}AA`,
                      paddingVertical: 14,
                      paddingHorizontal: 14,
                      color: theme.colors.text,
                      fontSize: 13,
                    }}
                  />

                  {/* End date */}
                  <TextInput
                    value={stepEndDate}
                    onChangeText={setStepEndDate}
                    onFocus={() => setShowSuggestions(false)}
                    placeholder="End  MM/DD/YYYY"
                    placeholderTextColor={theme.colors.textSecondary}
                    returnKeyType="done"
                    style={{
                      flex: 1,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: `${theme.colors.border}88`,
                      backgroundColor: `${theme.colors.background}AA`,
                      paddingVertical: 14,
                      paddingHorizontal: 14,
                      color: theme.colors.text,
                      fontSize: 13,
                    }}
                  />
                </View>

                {/* ── ESTIMATED COST ───────────────────────── */}
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: 12,
                    fontWeight: "800",
                    letterSpacing: 0.4,
                    marginBottom: 6,
                    marginTop: 14,
                  }}
                >
                  ESTIMATED COST
                </Text>
                <TextInput
                  value={stepCostText}
                  onFocus={() => setShowSuggestions(false)}
                  onChangeText={(text) => {
                    const sanitized = text.replace(/[^0-9.]/g, "");
                    setStepCostText(sanitized);
                  }}
                  placeholder="e.g. 15000"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
                  returnKeyType="done"
                  style={{
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: `${theme.colors.border}88`,
                    backgroundColor: `${theme.colors.background}AA`,
                    paddingVertical: 14,
                    paddingHorizontal: 14,
                    color: theme.colors.text,
                    fontSize: 14,
                  }}
                />

                {/* ── NOTES (optional) ─────────────────────── */}
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: 12,
                    fontWeight: "800",
                    letterSpacing: 0.4,
                    marginBottom: 6,
                    marginTop: 14,
                  }}
                >
                  NOTES (OPTIONAL)
                </Text>
                <TextInput
                  value={stepNotesText}
                  onChangeText={setStepNotesText}
                  onFocus={() => setShowSuggestions(false)}
                  placeholder="Any extra details about this step..."
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  returnKeyType="default"
                  style={{
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: `${theme.colors.border}88`,
                    backgroundColor: `${theme.colors.background}AA`,
                    paddingVertical: 14,
                    paddingHorizontal: 14,
                    color: theme.colors.text,
                    fontSize: 14,
                    minHeight: 80,
                  }}
                />

                {/* ── STEP PHOTOS ──────────────────────────── */}
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: 12,
                    fontWeight: "800",
                    letterSpacing: 0.4,
                    marginBottom: 6,
                    marginTop: 14,
                  }}
                >
                  STEP PHOTOS ({stepPhotos.length} / {MAXIMUM_STEP_PHOTOS})
                </Text>

                <View style={{ flexDirection: "row", marginBottom: 10 }}>
                  <TouchableOpacity
                    onPress={pickStepPhotosFromLibrary}
                    activeOpacity={0.8}
                    disabled={stepPhotos.length >= MAXIMUM_STEP_PHOTOS}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 14,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: theme.colors.primary,
                      backgroundColor: `${theme.colors.primary}0F`,
                      opacity: stepPhotos.length >= MAXIMUM_STEP_PHOTOS ? 0.4 : 1,
                      marginRight: 10,
                    }}
                  >
                    <Ionicons name="images-outline" size={20} color={theme.colors.primary} />
                    <Text style={{ color: theme.colors.primary, fontWeight: "900", fontSize: 13, marginLeft: 8 }}>
                      Camera Roll
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={takeStepPhotoWithCamera}
                    activeOpacity={0.8}
                    disabled={stepPhotos.length >= MAXIMUM_STEP_PHOTOS}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 14,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: NEON.green,
                      backgroundColor: NEON.greenBg15,
                      opacity: stepPhotos.length >= MAXIMUM_STEP_PHOTOS ? 0.4 : 1,
                    }}
                  >
                    <Ionicons name="camera-outline" size={20} color={NEON.green} />
                    <Text style={{ color: NEON.green, fontWeight: "900", fontSize: 13, marginLeft: 8 }}>
                      Take Photo
                    </Text>
                  </TouchableOpacity>
                </View>

                {stepPhotos.length > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      marginTop: 4,
                      marginLeft: -5,
                      marginRight: -5,
                    }}
                  >
                    {stepPhotos.map((uri) => (
                      <Pressable
                        key={uri}
                        onPress={() => removeStepPhoto(uri)}
                        className="active:opacity-80"
                        style={{
                          width: tileSize,
                          height: tileSize,
                          borderRadius: 18,
                          borderWidth: 1,
                          borderColor: `${theme.colors.border}88`,
                          backgroundColor: `${theme.colors.background}55`,
                          overflow: "hidden",
                          margin: 5,
                        }}
                      >
                        <Image
                          source={{ uri }}
                          style={{ width: "100%", height: "100%" }}
                        />
                        <View
                          style={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            backgroundColor: NEON.danger,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons name="close" size={14} color="white" />
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}

                <Text
                  style={{
                    marginTop: 6,
                    color: theme.colors.textSecondary,
                    fontSize: 12,
                    lineHeight: 18,
                  }}
                >
                  {stepPhotos.length >= MAXIMUM_STEP_PHOTOS
                    ? `Maximum ${MAXIMUM_STEP_PHOTOS} photos reached. Tap a photo to remove it.`
                    : `Tap a photo to remove it. You can add up to ${MAXIMUM_STEP_PHOTOS} photos.`}
                </Text>

                {/* ── SAVE / CANCEL ────────────────────────── */}
                <View style={{ marginTop: 18 }}>
                  <TouchableOpacity
                    onPress={handleSaveStep}
                    activeOpacity={0.8}
                    disabled={savingStep}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 18,
                      borderRadius: 22,
                      backgroundColor: NEON.green,
                      marginBottom: 12,
                      opacity: savingStep ? 0.6 : 1,
                    }}
                  >
                    {savingStep ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Ionicons name="save" size={22} color="#000" />
                    )}
                    <Text
                      style={{
                        color: "#000",
                        fontWeight: "900",
                        fontSize: 16,
                        letterSpacing: 0.3,
                        marginLeft: 10,
                      }}
                    >
                      {savingStep ? "Saving…" : `Save Step ${nextStepNumber}`}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={closeAddStepModal}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 18,
                      borderRadius: 22,
                      borderWidth: 2,
                      borderColor: NEON.danger,
                      backgroundColor: "transparent",
                    }}
                  >
                    <Ionicons name="close-circle" size={22} color={NEON.danger} />
                    <Text
                      style={{
                        color: NEON.danger,
                        fontWeight: "900",
                        fontSize: 16,
                        letterSpacing: 0.3,
                        marginLeft: 10,
                      }}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <Text
                    style={{
                      marginTop: 10,
                      color: theme.colors.textSecondary,
                      fontSize: 12,
                      lineHeight: 18,
                    }}
                  >
                    Photos will upload to ImageKit, then step metadata saves to your account.
                  </Text>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
