// app/(security)/(private)/(homebuilder)/(active)/[selectABuild]/[buildSteps]/edit.jsx
//
// ✅ Edit Build Step — editable version of the step detail page
// - Pre-populates fields from existing step data
// - Allows editing: title, dates, cost, notes, photos
// - Saves via PATCH /api/builds/steps/update

import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
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

import { useTheme } from "../../../../../../../wrappers/providers/ThemeContext";
import callBackend from "../../../../../../../services/callBackend";
import { uploadImagesToImageKit } from "../../../../../../../services/imageKitUpload";
import { compressImageUriListForUpload } from "../../../../../../../services/compressImages";

// ── Neon accent palette ───────────────────────────────────────
const NEON = {
  yellow: "#fde047",
  yellowMuted: "#facc15",
  green: "#a3e635",
  greenBg15: "rgba(163,230,53,0.15)",
  yellowBg15: "rgba(250,204,21,0.15)",
  danger: "#fda4af",
  dangerBg: "rgba(244,63,94,0.15)",
};

const MAXIMUM_STEP_PHOTOS = 8;

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

const STATUS_STYLES = {
  planned: { label: "Planned", bg: "rgba(250,204,21,0.18)", color: "#facc15" },
  in_progress: { label: "In Progress", bg: "rgba(96,165,250,0.18)", color: "#60a5fa" },
  completed: { label: "Completed", bg: "rgba(163,230,53,0.18)", color: "#a3e635" },
};

const PHOTO_GAP = 6;
const PHOTO_COLS = 3;

// ══════════════════════════════════════════════════════════════
// ██  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function EditBuildStepScreen() {
  const { selectABuild: buildId, buildSteps: stepId } = useLocalSearchParams();
  const { theme } = useTheme();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const photoSize = (screenWidth - 40 - PHOTO_GAP * (PHOTO_COLS - 1)) / PHOTO_COLS;

  // ── Data state ─────────────────────────────────────────────
  const [step, setStep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Editable fields ────────────────────────────────────────
  const [editTitle, setEditTitle] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editNotes, setEditNotes] = useState("");
  // existingPhotos = already-saved ImageKit photo objects
  // newPhotoUris = local URIs not yet uploaded
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newPhotoUris, setNewPhotoUris] = useState([]);

  const totalPhotos = existingPhotos.length + newPhotoUris.length;

  // ── Fetch step data & populate fields ──────────────────────
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

        // Populate editable fields from existing data
        setEditTitle(safe(found.title));
        setEditStartDate(safe(found.dateStart));
        setEditEndDate(safe(found.dateEnd));
        setEditCost(
          found.costAmount > 0 ? String(found.costAmount) : ""
        );
        setEditNotes(safe(found.notes));
        setExistingPhotos(Array.isArray(found.photos) ? found.photos : []);
        setNewPhotoUris([]);
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

  // ── Photo handlers ─────────────────────────────────────────
  async function pickPhotosFromLibrary() {
    if (totalPhotos >= MAXIMUM_STEP_PHOTOS) {
      Alert.alert("Limit reached", `Max ${MAXIMUM_STEP_PHOTOS} photos.`);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm?.granted) {
      Alert.alert("Permission needed", "Please allow photo library access.");
      return;
    }
    const remaining = MAXIMUM_STEP_PHOTOS - totalPhotos;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });
    if (result.canceled) return;
    const uris = (result.assets || []).map((a) => a?.uri).filter(Boolean);
    setNewPhotoUris((prev) => {
      const merged = [...prev, ...uris];
      return Array.from(new Set(merged)).slice(
        0,
        MAXIMUM_STEP_PHOTOS - existingPhotos.length
      );
    });
  }

  async function takePhotoWithCamera() {
    if (totalPhotos >= MAXIMUM_STEP_PHOTOS) {
      Alert.alert("Limit reached", `Max ${MAXIMUM_STEP_PHOTOS} photos.`);
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
    if (uri) {
      setNewPhotoUris((prev) => {
        const merged = [...prev, uri];
        return Array.from(new Set(merged)).slice(
          0,
          MAXIMUM_STEP_PHOTOS - existingPhotos.length
        );
      });
    }
  }

  function removeExistingPhoto(photoId) {
    setExistingPhotos((prev) =>
      prev.filter((p) => p.imageKitFileId !== photoId)
    );
  }

  function removeNewPhoto(uri) {
    setNewPhotoUris((prev) => prev.filter((u) => u !== uri));
  }

  // ── Save changes ───────────────────────────────────────────
  async function handleSave() {
    const title = editTitle.trim();
    if (!title) {
      Alert.alert("Missing info", "Step title is required.");
      return;
    }

    try {
      setSaving(true);

      // 1. Compress & upload any new photos
      let uploadedNewPhotos = [];
      if (newPhotoUris.length > 0) {
        console.log("[EditStep] Compressing", newPhotoUris.length, "new photo(s)…");
        const compressed = await compressImageUriListForUpload({
          imageUriStringList: newPhotoUris,
        });
        console.log("[EditStep] Uploading", compressed.length, "photo(s) to ImageKit…");
        uploadedNewPhotos = await uploadImagesToImageKit(compressed, {
          folder: "/build-step-photos",
        });
        console.log("[EditStep] Uploaded", uploadedNewPhotos.length, "photo(s)");
      }

      // 2. Merge existing (kept) + newly uploaded
      const allPhotos = [...existingPhotos, ...uploadedNewPhotos];

      // 3. PATCH to backend
      const res = await callBackend.patch("/api/builds/steps/update", {
        stepId,
        projectId: buildId,
        title,
        dateStart: editStartDate,
        dateEnd: editEndDate,
        cost: editCost,
        notes: editNotes,
        photos: allPhotos,
      });

      console.log("[EditStep] Saved:", res?.data?.step?._id);

      // Navigate back to the parent build detail page so the
      // updated step list is shown (useFocusEffect re-fetches).
      Alert.alert("Saved", "Step updated successfully.", [
        {
          text: "OK",
          onPress: () =>
            router.navigate({
              pathname: `/(homebuilder)/(active)/${buildId}`,
            }),
        },
      ]);
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to save changes.";
      console.warn("[EditStep] Save error:", msg);
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  }

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
        <ActivityIndicator size="large" color={NEON.yellow} />
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

  // ── Derive values ──────────────────────────────────────────
  const statusInfo = STATUS_STYLES[step.status] || STATUS_STYLES.planned;

  // ── Input style helper ─────────────────────────────────────
  const inputStyle = {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: `${theme.colors.border}88`,
    backgroundColor: `${theme.colors.background}AA`,
    paddingVertical: 14,
    paddingHorizontal: 14,
    color: theme.colors.text,
    fontSize: 14,
  };

  const labelStyle = {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginBottom: 6,
    marginTop: 18,
  };

  // ── MAIN RENDER ────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchStep({ pull: true })}
              tintColor={NEON.yellow}
            />
          }
        >
          {/* ── Header ───────────────────────────────────── */}
          <View
            style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 }}
          >
            {/* Back + title row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <Pressable
                className="flex-row"
                onPress={() => router.back()}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 8,
                  paddingRight: 16,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Ionicons
                  name="chevron-back"
                  size={30}
                  color={NEON.yellowMuted}
                />
                <Text
                  className="text-sm mt-1.5"
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: NEON.yellowMuted,
                    marginLeft: 4,
                  }}
                >
                  Cancel
                </Text>
              </Pressable>

              {/* Edit mode badge */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 14,
                  backgroundColor: "rgba(96,165,250,0.15)",
                  borderWidth: 1,
                  borderColor: "rgba(96,165,250,0.25)",
                }}
              >
                <Ionicons name="create-outline" size={16} color="#60a5fa" />
                <Text
                  style={{ fontSize: 13, fontWeight: "800", color: "#60a5fa" }}
                >
                  Editing
                </Text>
              </View>
            </View>

            {/* Step badge + editable title label */}
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
                  backgroundColor: NEON.yellowBg15,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "900",
                    color: NEON.yellow,
                  }}
                >
                  {step.stepNumber ?? "—"}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "900",
                    color: theme.colors.text,
                  }}
                >
                  Edit Step {step.stepNumber ?? ""}
                </Text>

                {/* Status pill (read-only) */}
                <View
                  style={{
                    alignSelf: "flex-start",
                    marginTop: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 20,
                    backgroundColor: statusInfo.bg,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "800",
                      color: statusInfo.color,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {statusInfo.label}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Form fields ──────────────────────────────── */}
          <View style={{ paddingHorizontal: 20 }}>
            {/* STEP TITLE */}
            <Text style={labelStyle}>STEP TITLE</Text>
            <TextInput
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Step title"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="sentences"
              autoCorrect={false}
              returnKeyType="done"
              style={inputStyle}
            />

            {/* DATES */}
            <Text style={labelStyle}>ESTIMATED DATES</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={NEON.yellowMuted}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: theme.colors.textSecondary,
                    }}
                  >
                    START
                  </Text>
                </View>
                <TextInput
                  value={editStartDate}
                  onChangeText={setEditStartDate}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor={theme.colors.textSecondary}
                  returnKeyType="done"
                  style={{ ...inputStyle, fontSize: 13 }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={NEON.green}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: theme.colors.textSecondary,
                    }}
                  >
                    END
                  </Text>
                </View>
                <TextInput
                  value={editEndDate}
                  onChangeText={setEditEndDate}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor={theme.colors.textSecondary}
                  returnKeyType="done"
                  style={{ ...inputStyle, fontSize: 13 }}
                />
              </View>
            </View>

            {/* COST */}
            <Text style={labelStyle}>ESTIMATED COST</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                ...inputStyle,
                paddingVertical: 0,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: NEON.greenBg15,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                <Ionicons name="cash-outline" size={16} color={NEON.green} />
              </View>
              <TextInput
                value={editCost}
                onChangeText={(text) => {
                  const sanitized = text.replace(/[^0-9.]/g, "");
                  setEditCost(sanitized);
                }}
                placeholder="e.g. 15000"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType={
                  Platform.OS === "ios" ? "decimal-pad" : "numeric"
                }
                returnKeyType="done"
                style={{
                  flex: 1,
                  color: theme.colors.text,
                  fontSize: 16,
                  fontWeight: "700",
                  paddingVertical: 14,
                }}
              />
              {editCost.length > 0 && (
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: NEON.green,
                    marginLeft: 8,
                  }}
                >
                  {formatCurrency(parseFloat(editCost) || 0)}
                </Text>
              )}
            </View>

            {/* NOTES */}
            <Text style={labelStyle}>NOTES</Text>
            <TextInput
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="Any extra details about this step..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              returnKeyType="default"
              style={{ ...inputStyle, minHeight: 100 }}
            />

            {/* PHOTOS */}
            <Text style={labelStyle}>
              STEP PHOTOS ({totalPhotos} / {MAXIMUM_STEP_PHOTOS})
            </Text>

            {/* Pick / Take buttons */}
            <View style={{ flexDirection: "row", marginBottom: 10, gap: 10 }}>
              <TouchableOpacity
                onPress={pickPhotosFromLibrary}
                activeOpacity={0.8}
                disabled={totalPhotos >= MAXIMUM_STEP_PHOTOS}
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
                  opacity: totalPhotos >= MAXIMUM_STEP_PHOTOS ? 0.4 : 1,
                }}
              >
                <Ionicons
                  name="images-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text
                  style={{
                    color: theme.colors.primary,
                    fontWeight: "900",
                    fontSize: 13,
                    marginLeft: 8,
                  }}
                >
                  Camera Roll
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={takePhotoWithCamera}
                activeOpacity={0.8}
                disabled={totalPhotos >= MAXIMUM_STEP_PHOTOS}
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
                  opacity: totalPhotos >= MAXIMUM_STEP_PHOTOS ? 0.4 : 1,
                }}
              >
                <Ionicons
                  name="camera-outline"
                  size={20}
                  color={NEON.green}
                />
                <Text
                  style={{
                    color: NEON.green,
                    fontWeight: "900",
                    fontSize: 13,
                    marginLeft: 8,
                  }}
                >
                  Take Photo
                </Text>
              </TouchableOpacity>
            </View>

            {/* Photo grid — existing + new */}
            {totalPhotos > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: PHOTO_GAP,
                  marginTop: 4,
                }}
              >
                {/* Existing (already uploaded) photos */}
                {existingPhotos.map((photo, idx) => (
                  <Pressable
                    key={photo.imageKitFileId || `ex-${idx}`}
                    onPress={() => removeExistingPhoto(photo.imageKitFileId)}
                    style={({ pressed }) => ({
                      width: photoSize,
                      height: photoSize,
                      borderRadius: 12,
                      overflow: "hidden",
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Image
                      source={{ uri: photo.thumbnailUrl || photo.url }}
                      style={{
                        width: photoSize,
                        height: photoSize,
                        borderRadius: 12,
                        backgroundColor: theme.colors.surface,
                      }}
                      resizeMode="cover"
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

                {/* New (local, not yet uploaded) photos */}
                {newPhotoUris.map((uri) => (
                  <Pressable
                    key={uri}
                    onPress={() => removeNewPhoto(uri)}
                    style={({ pressed }) => ({
                      width: photoSize,
                      height: photoSize,
                      borderRadius: 12,
                      overflow: "hidden",
                      borderWidth: 2,
                      borderColor: NEON.green,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Image
                      source={{ uri }}
                      style={{
                        width: photoSize,
                        height: photoSize,
                        borderRadius: 12,
                        backgroundColor: theme.colors.surface,
                      }}
                      resizeMode="cover"
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
                    {/* "New" badge */}
                    <View
                      style={{
                        position: "absolute",
                        bottom: 4,
                        left: 4,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                        backgroundColor: NEON.green,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: "900",
                          color: "#000",
                        }}
                      >
                        NEW
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {totalPhotos === 0 && (
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
                  No photos — add some above
                </Text>
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
              Tap a photo to remove it.{" "}
              {newPhotoUris.length > 0
                ? "Green-bordered photos are new and will be uploaded on save."
                : ""}
            </Text>

            {/* ── Details table (read-only info) ─────────── */}
            <View
              style={{
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
                {
                  label: "Step Type",
                  value: safe(step.stepType) || "—",
                },
                { label: "Status", value: statusInfo.label },
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

            {/* ── Save / Cancel buttons ──────────────────── */}
            <View style={{ marginTop: 24 }}>
              <TouchableOpacity
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={saving}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 18,
                  borderRadius: 22,
                  backgroundColor: NEON.green,
                  marginBottom: 12,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? (
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
                  {saving ? "Saving…" : "Save Changes"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.back()}
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
                <Ionicons
                  name="close-circle"
                  size={22}
                  color={NEON.danger}
                />
                <Text
                  style={{
                    color: NEON.danger,
                    fontWeight: "900",
                    fontSize: 16,
                    letterSpacing: 0.3,
                    marginLeft: 10,
                  }}
                >
                  Discard Changes
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
                New photos will be compressed and uploaded to ImageKit. Changes
                save immediately.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
