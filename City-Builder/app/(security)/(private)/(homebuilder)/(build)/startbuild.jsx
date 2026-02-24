// app/(security)/(private)/(homebuilder)/(build)/startbuild.jsx
//
// Production-grade notes (what this file does):
// - Shows a "New Build" CTA.
// - Opens a modal to intake: lot address, lot size/dimensions, lot price, terrain, demolition flag, and up to 8 lot photos.
// - Lets user add photos from Camera Roll (multi-select) OR take photos with Camera (one at a time).
// - Enforces a strict MAX of 8 photos total.
// - Uses reliable margin-based spacing (no `gap`) for consistent layout across RN versions.
// - Validates required fields with user-facing Alerts.
// - "Backend wiring": the save function is wired to send a multipart/form-data request (payload + images) to a backend endpoint.
//   ✅ It will be ready once you add the endpoint on your backend (we'll set that up next).
//
// IMPORTANT:
// - This does NOT assume your backend is already implemented.
// - Update `BUILD_CREATE_ENDPOINT_PATH` to match your server route when we create it.

import React, { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  View,
  Pressable,
  Image,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../../../../wrappers/providers/ThemeContext";

const MAXIMUM_LOT_PHOTOS_ALLOWED = 8;

// ✅ Update this once we implement the backend route
const BUILD_CREATE_ENDPOINT_PATH = "/api/builds/create";

export default function StartBuildScreen() {
  const { theme } = useTheme();
  const expoRouter = useRouter();
  const { width: deviceScreenWidth, height: deviceScreenHeight } = useWindowDimensions();

  const isSmallPhoneDevice = deviceScreenWidth < 380;
  const isLargePhoneDevice = deviceScreenWidth >= 430;

  const [isNewBuildIntakeModalVisible, setIsNewBuildIntakeModalVisible] = useState(false);

  const [lotAddressTextValue, setLotAddressTextValue] = useState("");
  const [lotSizeDimensionsTextValue, setLotSizeDimensionsTextValue] = useState("");
  const [lotPriceTextValue, setLotPriceTextValue] = useState("");

  const [lotTerrainTypeValue, setLotTerrainTypeValue] = useState("flat"); // "flat" | "sloped" | "mountain"
  const [doesLotHaveOldHouseToDemolish, setDoesLotHaveOldHouseToDemolish] = useState(false);

  const [selectedLotImageUriList, setSelectedLotImageUriList] = useState([]);
  const [isSavingBuildProjectToBackend, setIsSavingBuildProjectToBackend] = useState(false);

  const styles = useMemo(() => {
    const contentMaxWidth = 560;
    const horizontalPagePadding = isSmallPhoneDevice ? 16 : isLargePhoneDevice ? 22 : 18;

    const tileSize = isSmallPhoneDevice ? 92 : 104;

    return {
      screen: { flex: 1, backgroundColor: theme.colors.background },

      container: {
        flexGrow: 1,
        alignSelf: "center",
        width: "100%",
        maxWidth: contentMaxWidth,
        paddingHorizontal: horizontalPagePadding,
        paddingTop: 18,
        paddingBottom: 24,
      },

      card: {
        borderRadius: 24,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        padding: isSmallPhoneDevice ? 16 : 18,
      },

      titleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
      },

      titleText: {
        color: theme.colors.text,
        fontSize: isSmallPhoneDevice ? 22 : 26,
        fontWeight: "900",
      },

      badge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: `${theme.colors.success}55`,
        backgroundColor: `${theme.colors.success}12`,
      },

      badgeText: {
        color: theme.colors.success,
        fontSize: 12,
        fontWeight: "900",
      },

      paragraphText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        lineHeight: 20,
        marginTop: 8,
      },

      stepsWrap: {
        marginTop: 14,
        borderRadius: 18,
        backgroundColor: `${theme.colors.primary}0D`,
        borderWidth: 1,
        borderColor: `${theme.colors.primary}22`,
        padding: 14,
      },

      stepRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 10,
      },

      stepDot: {
        width: 26,
        height: 26,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.primary,
        marginRight: 10,
      },

      stepDotText: { color: "black", fontWeight: "900", fontSize: 12 },

      stepText: {
        flex: 1,
        color: theme.colors.text,
        fontSize: 13,
        lineHeight: 18,
      },

      helperHint: {
        marginTop: 10,
        color: theme.colors.textSecondary,
        fontSize: 12,
        lineHeight: 18,
      },

      modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.55)",
        justifyContent: "flex-end",
      },

      modalSheet: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: horizontalPagePadding,
        paddingTop: 14,
        paddingBottom: 18,
        maxHeight: deviceScreenHeight * 0.9,
      },

      modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
      },

      modalTitleText: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: "900",
      },

      modalSubText: {
        color: theme.colors.textSecondary,
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 12,
      },

      fieldLabelText: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 0.4,
        marginBottom: 6,
        marginTop: 10,
      },

      textInput: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: `${theme.colors.border}88`,
        backgroundColor: `${theme.colors.background}AA`,
        paddingVertical: 14,
        paddingHorizontal: 14,
        color: theme.colors.text,
        fontSize: 14,
      },

      segmentedRow: { flexDirection: "row", marginTop: 6 },

      segmentedButton: {
        flex: 1,
        borderRadius: 16,
        borderWidth: 1,
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
      },

      segmentedButtonText: { fontSize: 13, fontWeight: "900" },

      toggleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: `${theme.colors.border}55`,
        backgroundColor: `${theme.colors.background}55`,
        paddingVertical: 14,
        paddingHorizontal: 14,
        marginTop: 10,
      },

      toggleText: { color: theme.colors.text, fontWeight: "900", fontSize: 13 },

      photoControlRow: { flexDirection: "row", marginBottom: 10 },

      photoGridRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 8,
        marginLeft: -5,
        marginRight: -5,
      },

      photoThumbnailTile: {
        width: tileSize,
        height: tileSize,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: `${theme.colors.border}88`,
        backgroundColor: `${theme.colors.background}55`,
        overflow: "hidden",
        margin: 5,
      },

      photoRemoveBadge: {
        position: "absolute",
        top: 4,
        right: 4,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: theme.colors.error,
        alignItems: "center",
        justifyContent: "center",
      },
    };
  }, [theme, isSmallPhoneDevice, isLargePhoneDevice, deviceScreenHeight]);

  function openNewBuildIntakeModal() {
    console.log("StartBuildScreen => openNewBuildIntakeModal");
    setIsNewBuildIntakeModalVisible(true);
  }

  function closeNewBuildIntakeModal() {
    console.log("StartBuildScreen => closeNewBuildIntakeModal");
    setIsNewBuildIntakeModalVisible(false);
  }

  function updateLotTerrainType(terrainTypeStringValue) {
    console.log("StartBuildScreen => updateLotTerrainType:", terrainTypeStringValue);
    setLotTerrainTypeValue(terrainTypeStringValue);
  }

  function addImageUrisToSelectedList(nextImageUriList) {
    setSelectedLotImageUriList((previousImageUriList) => {
      const mergedImageUriList = [...previousImageUriList, ...nextImageUriList];
      const uniqueImageUriList = Array.from(new Set(mergedImageUriList));
      return uniqueImageUriList.slice(0, MAXIMUM_LOT_PHOTOS_ALLOWED);
    });
  }

  async function selectLotPhotosFromCameraRoll() {
    try {
      console.log("StartBuildScreen => selectLotPhotosFromCameraRoll pressed");

      if (selectedLotImageUriList.length >= MAXIMUM_LOT_PHOTOS_ALLOWED) {
        Alert.alert("Limit reached", `You can add up to ${MAXIMUM_LOT_PHOTOS_ALLOWED} photos.`);
        return;
      }

      const mediaLibraryPermissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!mediaLibraryPermissionResult?.granted) {
        Alert.alert("Permission needed", "Please allow photo library access.");
        return;
      }

      const remainingPhotoSlots = MAXIMUM_LOT_PHOTOS_ALLOWED - selectedLotImageUriList.length;

      const imageLibraryPickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.9,
        allowsMultipleSelection: true,
        selectionLimit: remainingPhotoSlots,
      });

      if (imageLibraryPickerResult.canceled) {
        console.log("StartBuildScreen => user canceled image library");
        return;
      }

      const newlySelectedImageUriList = (imageLibraryPickerResult.assets || [])
        .map((assetObject) => assetObject?.uri)
        .filter(Boolean);

      console.log("StartBuildScreen => images selected from library:", newlySelectedImageUriList.length);

      addImageUrisToSelectedList(newlySelectedImageUriList);
    } catch (error) {
      console.log("StartBuildScreen => selectLotPhotosFromCameraRoll error:", error);
      Alert.alert("Error", "Could not open photo library. Please try again.");
    }
  }

  async function takeSingleLotPhotoWithCamera() {
    try {
      console.log("StartBuildScreen => takeSingleLotPhotoWithCamera pressed");

      if (selectedLotImageUriList.length >= MAXIMUM_LOT_PHOTOS_ALLOWED) {
        Alert.alert("Limit reached", `You can add up to ${MAXIMUM_LOT_PHOTOS_ALLOWED} photos.`);
        return;
      }

      const cameraPermissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermissionResult?.granted) {
        Alert.alert("Permission needed", "Please allow camera access.");
        return;
      }

      const cameraCaptureResult = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.9,
        allowsEditing: false,
      });

      if (cameraCaptureResult.canceled) {
        console.log("StartBuildScreen => user canceled camera");
        return;
      }

      const capturedImageUri = cameraCaptureResult?.assets?.[0]?.uri;
      if (!capturedImageUri) {
        Alert.alert("Error", "No image was captured. Please try again.");
        return;
      }

      console.log("StartBuildScreen => captured image uri:", capturedImageUri);

      addImageUrisToSelectedList([capturedImageUri]);
    } catch (error) {
      console.log("StartBuildScreen => takeSingleLotPhotoWithCamera error:", error);
      Alert.alert("Error", "Could not open camera. Please try again.");
    }
  }

  function removeSelectedLotImageByUri(imageUriToRemove) {
    console.log("StartBuildScreen => removeSelectedLotImageByUri:", imageUriToRemove);
    setSelectedLotImageUriList((previousImageUriList) =>
      previousImageUriList.filter((imageUri) => imageUri !== imageUriToRemove)
    );
  }

  function inferMimeTypeFromUri(imageUriStringValue) {
    const lowercaseUri = String(imageUriStringValue || "").toLowerCase();
    if (lowercaseUri.endsWith(".png")) return "image/png";
    if (lowercaseUri.endsWith(".webp")) return "image/webp";
    if (lowercaseUri.endsWith(".heic")) return "image/heic";
    // default to jpeg (most common from camera)
    return "image/jpeg";
  }

  function inferFileNameFromUri(imageUriStringValue, fallbackIndexNumber) {
    const uriString = String(imageUriStringValue || "");
    const lastSlashIndex = uriString.lastIndexOf("/");
    const rawFileName = lastSlashIndex >= 0 ? uriString.slice(lastSlashIndex + 1) : "";
    if (rawFileName && rawFileName.includes(".")) return rawFileName;
    return `lot-photo-${fallbackIndexNumber + 1}.jpg`;
  }

  async function saveNewBuildProjectToBackend() {
    console.log("StartBuildScreen => saveNewBuildProjectToBackend pressed");

    const trimmedLotAddress = lotAddressTextValue.trim();
    const trimmedLotSizeDimensions = lotSizeDimensionsTextValue.trim();
    const trimmedLotPriceText = lotPriceTextValue.trim();
    const lotPriceNumberValue = Number(trimmedLotPriceText);

    if (!trimmedLotAddress) {
      Alert.alert("Missing info", "Please enter the lot address.");
      return;
    }
    if (!trimmedLotSizeDimensions) {
      Alert.alert("Missing info", "Please enter the lot size/dimensions.");
      return;
    }
    if (!trimmedLotPriceText || Number.isNaN(lotPriceNumberValue)) {
      Alert.alert("Missing info", "Please enter a valid lot price.");
      return;
    }

    setIsSavingBuildProjectToBackend(true);

    try {
      // ✅ Build the JSON payload that describes the build.
      const buildMetadataPayload = {
        lotAddress: trimmedLotAddress,
        lotSizeDimensions: trimmedLotSizeDimensions,
        lotPrice: lotPriceNumberValue,
        lotTerrainType: lotTerrainTypeValue,
        hasOldHouseToDemolish: doesLotHaveOldHouseToDemolish,
        createdAt: new Date().toISOString(),
      };

      console.log("StartBuildScreen => buildMetadataPayload:", buildMetadataPayload);
      console.log("StartBuildScreen => image count:", selectedLotImageUriList.length);

      // ✅ Prepare multipart/form-data:
      // - "metadata" => JSON string
      // - "lotPhotos" => multiple image files
      const multipartFormData = new FormData();
      multipartFormData.append("metadata", JSON.stringify(buildMetadataPayload));

      selectedLotImageUriList.forEach((imageUriStringValue, imageIndexNumber) => {
        const fileName = inferFileNameFromUri(imageUriStringValue, imageIndexNumber);
        const mimeType = inferMimeTypeFromUri(imageUriStringValue);

        multipartFormData.append("lotPhotos", {
          uri: imageUriStringValue,
          name: fileName,
          type: mimeType,
        });
      });

      // ✅ Backend call (wired, but endpoint must exist)
      // Use EXPO_PUBLIC_API_BASE_URL (recommended) like: https://your-server.com
      const apiBaseUrl =
        process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:4022";

      const fullEndpointUrl = `${apiBaseUrl}${BUILD_CREATE_ENDPOINT_PATH}`;

      console.log("StartBuildScreen => POST multipart to:", fullEndpointUrl);

      const backendResponse = await fetch(fullEndpointUrl, {
        method: "POST",
        body: multipartFormData,
        // IMPORTANT: do NOT set Content-Type manually for FormData in React Native.
        // RN will set the correct boundary automatically.
      });

      const responseText = await backendResponse.text();
      console.log("StartBuildScreen => backendResponse status:", backendResponse.status);
      console.log("StartBuildScreen => backendResponse text:", responseText);

      if (!backendResponse.ok) {
        Alert.alert(
          "Save failed",
          "We could not save your build. Please try again."
        );
        return;
      }

      // ✅ Once backend is implemented, you'll likely return JSON with buildId, image URLs, etc.
      // For now, we just proceed.
      closeNewBuildIntakeModal();

      // Navigate to Active builds (your existing route)
      expoRouter.push("/(security)/(private)/(homebuilder)/(active)/inprogress");
    } catch (error) {
      console.log("StartBuildScreen => saveNewBuildProjectToBackend error:", error);
      Alert.alert("Error", "Could not save build. Please try again.");
    } finally {
      setIsSavingBuildProjectToBackend(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>Build</Text>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>Home Builder</Text>
            </View>
          </View>

          <Text style={styles.paragraphText}>
            Start a new build project here. When you create a new build, we save it as an
            <Text style={{ color: theme.colors.success, fontWeight: "900" }}> Active Build</Text>.
          </Text>

          <View style={styles.stepsWrap}>
            <View style={styles.stepRow}>
              <View style={styles.stepDot}>
                <Text style={styles.stepDotText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Tap <Text style={{ fontWeight: "900" }}>New Build</Text> to begin onboarding.
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepDot}>
                <Text style={styles.stepDotText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Enter lot details and add up to {MAXIMUM_LOT_PHOTOS_ALLOWED} photos.
              </Text>
            </View>

            <View style={[styles.stepRow, { marginBottom: 0 }]}>
              <View style={styles.stepDot}>
                <Text style={styles.stepDotText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                We save it to your account and it appears under{" "}
                <Text style={{ fontWeight: "900" }}>Ongoing</Text>.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={openNewBuildIntakeModal}
            activeOpacity={0.8}
            className="mt-5"
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: isSmallPhoneDevice ? 18 : 22,
              borderRadius: 22,
              backgroundColor: theme.colors.success,
            }}
          >
            <Ionicons name="add-circle" size={26} color="black" />
            <Text
              style={{
                color: "black",
                fontWeight: "900",
                fontSize: isSmallPhoneDevice ? 17 : 19,
                letterSpacing: 0.3,
                marginLeft: 10,
              }}
            >
              New Build
            </Text>
          </TouchableOpacity>

          <Text style={styles.helperHint}>
            Photos are stored locally until you press Save Build.
          </Text>
        </View>
      </ScrollView>

      {/* New Build Intake Modal */}
      <Modal
        visible={isNewBuildIntakeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeNewBuildIntakeModal}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, justifyContent: "flex-end" }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
          >
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitleText}>New Build Intake</Text>

                <Pressable onPress={closeNewBuildIntakeModal} className="active:opacity-70">
                  <Ionicons name="close" size={22} color={theme.colors.text} />
                </Pressable>
              </View>

              <Text style={styles.modalSubText}>
                Enter your lot details. Photos will be uploaded when you press Save Build.
              </Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                <Text style={styles.fieldLabelText}>LOT ADDRESS</Text>
                <TextInput
                  value={lotAddressTextValue}
                  onChangeText={setLotAddressTextValue}
                  placeholder="123 Main St, City, Province"
                  placeholderTextColor={theme.colors.textSecondary}
                  style={styles.textInput}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                />

                <Text style={styles.fieldLabelText}>LOT SIZE / DIMENSIONS</Text>
                <TextInput
                  value={lotSizeDimensionsTextValue}
                  onChangeText={setLotSizeDimensionsTextValue}
                  placeholder="e.g. 50 ft × 120 ft or 5000 sq ft"
                  placeholderTextColor={theme.colors.textSecondary}
                  style={styles.textInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />

                <Text style={styles.fieldLabelText}>LOT PRICE</Text>
                <TextInput
                  value={lotPriceTextValue}
                  onChangeText={(textValue) => {
                    // ✅ keep only digits + optional decimal
                    const sanitized = textValue.replace(/[^0-9.]/g, "");
                    setLotPriceTextValue(sanitized);
                  }}
                  placeholder="e.g. 350000"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
                  style={styles.textInput}
                  returnKeyType="done"
                />

                <Text style={styles.fieldLabelText}>LOT TERRAIN</Text>
                <View style={styles.segmentedRow}>
                  <Pressable
                    onPress={() => updateLotTerrainType("flat")}
                    className="active:opacity-80"
                    style={[
                      styles.segmentedButton,
                      {
                        marginRight: 10,
                        borderColor:
                          lotTerrainTypeValue === "flat" ? theme.colors.primary : theme.colors.border,
                        backgroundColor:
                          lotTerrainTypeValue === "flat" ? `${theme.colors.primary}14` : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentedButtonText,
                        { color: lotTerrainTypeValue === "flat" ? theme.colors.primary : theme.colors.text },
                      ]}
                    >
                      Flat
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => updateLotTerrainType("sloped")}
                    className="active:opacity-80"
                    style={[
                      styles.segmentedButton,
                      {
                        marginRight: 10,
                        borderColor:
                          lotTerrainTypeValue === "sloped" ? theme.colors.primary : theme.colors.border,
                        backgroundColor:
                          lotTerrainTypeValue === "sloped" ? `${theme.colors.primary}14` : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentedButtonText,
                        { color: lotTerrainTypeValue === "sloped" ? theme.colors.primary : theme.colors.text },
                      ]}
                    >
                      Sloped
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => updateLotTerrainType("mountain")}
                    className="active:opacity-80"
                    style={[
                      styles.segmentedButton,
                      {
                        borderColor:
                          lotTerrainTypeValue === "mountain" ? theme.colors.primary : theme.colors.border,
                        backgroundColor:
                          lotTerrainTypeValue === "mountain" ? `${theme.colors.primary}14` : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentedButtonText,
                        { color: lotTerrainTypeValue === "mountain" ? theme.colors.primary : theme.colors.text },
                      ]}
                    >
                      Mountain
                    </Text>
                  </Pressable>
                </View>

                <Text style={styles.fieldLabelText}>OLD HOUSE ON LOT?</Text>
                <Pressable
                  onPress={() => {
                    const nextValue = !doesLotHaveOldHouseToDemolish;
                    console.log("StartBuildScreen => toggle demolition:", nextValue);
                    setDoesLotHaveOldHouseToDemolish(nextValue);
                  }}
                  className="active:opacity-80"
                  style={styles.toggleRow}
                >
                  <Text style={styles.toggleText}>
                    {doesLotHaveOldHouseToDemolish ? "Yes — needs demolition" : "No — empty lot"}
                  </Text>

                  <Ionicons
                    name={doesLotHaveOldHouseToDemolish ? "checkbox" : "square-outline"}
                    size={22}
                    color={doesLotHaveOldHouseToDemolish ? theme.colors.success : theme.colors.textSecondary}
                  />
                </Pressable>

                <Text style={styles.fieldLabelText}>
                  LOT PHOTOS ({selectedLotImageUriList.length} / {MAXIMUM_LOT_PHOTOS_ALLOWED})
                </Text>

                <View style={styles.photoControlRow}>
                  <TouchableOpacity
                    onPress={selectLotPhotosFromCameraRoll}
                    activeOpacity={0.8}
                    disabled={selectedLotImageUriList.length >= MAXIMUM_LOT_PHOTOS_ALLOWED}
                    className="active:opacity-80"
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
                      opacity: selectedLotImageUriList.length >= MAXIMUM_LOT_PHOTOS_ALLOWED ? 0.4 : 1,
                      marginRight: 10,
                    }}
                  >
                    <Ionicons name="images-outline" size={20} color={theme.colors.primary} />
                    <Text style={{ color: theme.colors.primary, fontWeight: "900", fontSize: 13, marginLeft: 8 }}>
                      Camera Roll
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={takeSingleLotPhotoWithCamera}
                    activeOpacity={0.8}
                    disabled={selectedLotImageUriList.length >= MAXIMUM_LOT_PHOTOS_ALLOWED}
                    className="active:opacity-80"
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 14,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: theme.colors.success,
                      backgroundColor: `${theme.colors.success}0F`,
                      opacity: selectedLotImageUriList.length >= MAXIMUM_LOT_PHOTOS_ALLOWED ? 0.4 : 1,
                    }}
                  >
                    <Ionicons name="camera-outline" size={20} color={theme.colors.success} />
                    <Text style={{ color: theme.colors.success, fontWeight: "900", fontSize: 13, marginLeft: 8 }}>
                      Take Photo
                    </Text>
                  </TouchableOpacity>
                </View>

                {selectedLotImageUriList.length > 0 && (
                  <View style={styles.photoGridRow}>
                    {selectedLotImageUriList.map((imageUriStringValue) => (
                      <Pressable
                        key={imageUriStringValue}
                        onPress={() => removeSelectedLotImageByUri(imageUriStringValue)}
                        className="active:opacity-80"
                        style={styles.photoThumbnailTile}
                      >
                        <Image
                          source={{ uri: imageUriStringValue }}
                          style={{ width: "100%", height: "100%" }}
                        />
                        <View style={styles.photoRemoveBadge}>
                          <Ionicons name="close" size={14} color="white" />
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}

                <Text style={styles.helperHint}>
                  {selectedLotImageUriList.length >= MAXIMUM_LOT_PHOTOS_ALLOWED
                    ? `Maximum ${MAXIMUM_LOT_PHOTOS_ALLOWED} photos reached. Tap a photo to remove it.`
                    : `Tap a photo to remove it. You can add up to ${MAXIMUM_LOT_PHOTOS_ALLOWED} photos.`}
                </Text>

                <View style={{ marginTop: 14 }}>
                  <TouchableOpacity
                    onPress={saveNewBuildProjectToBackend}
                    activeOpacity={0.8}
                    disabled={isSavingBuildProjectToBackend}
                    className="active:opacity-80"
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 18,
                      borderRadius: 22,
                      backgroundColor: theme.colors.success,
                      opacity: isSavingBuildProjectToBackend ? 0.55 : 1,
                      marginBottom: 12,
                    }}
                  >
                    {isSavingBuildProjectToBackend ? (
                      <>
                        <ActivityIndicator color="black" />
                        <Text style={{ color: "black", fontWeight: "900", fontSize: 16, marginLeft: 10 }}>
                          Saving...
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="save" size={22} color="black" />
                        <Text
                          style={{
                            color: "black",
                            fontWeight: "900",
                            fontSize: 16,
                            letterSpacing: 0.3,
                            marginLeft: 10,
                          }}
                        >
                          Save Build
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={closeNewBuildIntakeModal}
                    activeOpacity={0.8}
                    className="active:opacity-80"
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 18,
                      borderRadius: 22,
                      borderWidth: 2,
                      borderColor: theme.colors.error,
                      backgroundColor: "transparent",
                    }}
                  >
                    <Ionicons name="close-circle" size={22} color={theme.colors.error} />
                    <Text
                      style={{
                        color: theme.colors.error,
                        fontWeight: "900",
                        fontSize: 16,
                        letterSpacing: 0.3,
                        marginLeft: 10,
                      }}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.helperHint}>
                    Backend route expected: <Text style={{ fontWeight: "900" }}>{BUILD_CREATE_ENDPOINT_PATH}</Text>
                  </Text>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
