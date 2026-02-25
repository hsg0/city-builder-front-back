// app/(security)/(private)/(homebuilder)/(build)/startbuild.jsx
//
// Production-grade notes (what this file does):
// - Shows a "New Build" CTA.
// - Opens a modal to intake: lot address, lot size/dimensions, lot price, terrain, demolition flag, and up to 8 lot photos.
// - Lets user add photos from Camera Roll (multi-select) OR take photos with Camera (one at a time).
// - Enforces a strict MAX of 8 photos total.
// - Uses reliable margin-based spacing (no `gap`) for consistent layout across RN versions.
// - Validates required fields with user-facing Alerts.
//
// Backend wiring (current flow):
//   1. Photos upload directly to ImageKit from the app (via uploadImagesToImageKit).
//      Auth params (token, signature, expire) are fetched from GET /api/imagekit/auth.
//   2. Build metadata + ImageKit photo URLs are sent as JSON to POST /api/builds/create.
//      Bearer token is auto-attached by callBackend (axios interceptor).
//   3. On success the form resets and the user is navigated to the Active builds tab.

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
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { useTheme } from "../../../../../wrappers/providers/ThemeContext";
import callBackend from "../../../../../services/callBackend";
import { uploadImagesToImageKit } from "../../../../../services/imageKitUpload";

const MAXIMUM_LOT_PHOTOS_ALLOWED = 8;
const MAXIMUM_BYTES_PER_IMAGE = 1.6 * 1024 * 1024; // 1.6 MB

/**
 * Reads the file at the given URI and returns its size in bytes.
 * Uses expo-file-system to query the file system for metadata.
 * Returns 0 if the file does not exist or the size cannot be determined.
 */
async function getFileSizeInBytes(fileUriStringValue) {
  const fileSystemInfoResult = await FileSystem.getInfoAsync(fileUriStringValue, { size: true });
  return Number(fileSystemInfoResult?.size || 0);
}

/**
 * Compress + resize image until it is <= maxBytes.
 * Output is always JPEG (best for consistent uploads).
 *
 * Strategy:
 * 1) Start with width ~1600px (good quality, much smaller)
 * 2) Reduce JPEG quality gradually
 * 3) If still too large, reduce width step-by-step
 */
async function compressImageToMaxBytes({
  originalImageUriStringValue,
  maximumBytesAllowed,
}) {
  // ── Early exit: check if the original image is already under the size limit ──
  // If so, skip all compression work and return the original URI unchanged.
  const originalSizeBytes = await getFileSizeInBytes(originalImageUriStringValue);
  if (originalSizeBytes > 0 && originalSizeBytes <= maximumBytesAllowed) {
    console.log("compressImageToMaxBytes => already under limit:", originalSizeBytes, "bytes");
    return originalImageUriStringValue;
  }

  // ── Track the URI we are currently working with (may change each attempt) ──
  let currentUriStringValue = originalImageUriStringValue;

  // ── Initial compression settings ──
  // Start with a generous width (1600px) and high JPEG quality (0.82).
  // These produce good-looking images that are already much smaller than raw camera output.
  let currentTargetWidth = 1600;
  let currentJpegQuality = 0.82;

  // ── Hard safety floors so we never over-compress ──
  // We will never go below 900px width or 0.45 JPEG quality.
  const minimumTargetWidth = 900;
  const minimumJpegQuality = 0.45;

  // ── Iterative compression loop (up to 8 attempts) ──
  // Each pass resizes + re-encodes as JPEG, then checks the resulting file size.
  // If still over the limit, we progressively reduce quality first, then width.
  for (let attemptIndex = 0; attemptIndex < 8; attemptIndex += 1) {

    // Build the resize action for ImageManipulator (only resizes width; height scales proportionally)
    const manipulationActions = [{ resize: { width: currentTargetWidth } }];

    // Run the manipulation: resize + compress + convert to JPEG (handles HEIC/PNG/etc automatically)
    const manipulationResult = await ImageManipulator.manipulateAsync(
      currentUriStringValue,
      manipulationActions,
      {
        compress: currentJpegQuality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    // If the manipulator returned no URI, something went wrong — return the last known good URI
    const nextUriStringValue = manipulationResult?.uri;
    if (!nextUriStringValue) return currentUriStringValue;

    // Measure the new file size after this compression pass
    const nextSizeBytes = await getFileSizeInBytes(nextUriStringValue);

    console.log(
      "compressImageToMaxBytes => attempt:",
      attemptIndex + 1,
      "width:",
      currentTargetWidth,
      "quality:",
      currentJpegQuality.toFixed(2),
      "size(bytes):",
      nextSizeBytes
    );

    // ── Success check: if the file is now under the limit, return it immediately ──
    if (nextSizeBytes > 0 && nextSizeBytes <= maximumBytesAllowed) {
      return nextUriStringValue;
    }

    // ── Still too large — adjust settings for the next attempt ──
    // Priority 1: reduce JPEG quality in steps of 0.12 (visual impact is minimal)
    // Priority 2: once quality is at minimum, reduce width by 15% and reset quality slightly
    // Priority 3: if both are at their floors, return what we have (best effort)
    if (currentJpegQuality > minimumJpegQuality) {
      currentJpegQuality = Math.max(minimumJpegQuality, currentJpegQuality - 0.12);
    } else if (currentTargetWidth > minimumTargetWidth) {
      currentTargetWidth = Math.max(minimumTargetWidth, Math.floor(currentTargetWidth * 0.85));
      currentJpegQuality = 0.78; // bump quality back up slightly after reducing width
    } else {
      // Both width and quality are at their minimums — return best effort result
      return nextUriStringValue;
    }

    // Use the output of this pass as the input for the next pass
    currentUriStringValue = nextUriStringValue;
  }

  // ── Fallback: if all 8 attempts ran without meeting the target, return the last result ──
  return currentUriStringValue;
}

/**
 * Compress a list of image URIs to <= MAXIMUM_BYTES_PER_IMAGE each.
 * Uses small concurrency (2 at a time) to avoid freezing on phones.
 */
async function compressImageUriListForUpload({
  imageUriStringList,
  maximumBytesAllowedPerImage,
}) {
  // ── Results array: each slot will hold the compressed URI for that index ──
  const compressedImageUriResultList = [];

  // ── Concurrency limit: process 2 images at a time to balance speed vs phone memory ──
  const maximumConcurrentWorkers = 2;

  // ── Shared index counter: workers pull the next unprocessed image from this index ──
  let currentImageIndex = 0;

  /**
   * Each worker runs in a loop, grabbing the next available image index,
   * compressing it, and storing the result. Multiple workers run in parallel
   * so we process 2 images at a time instead of one-by-one.
   */
  async function compressionWorkerTask() {
    while (currentImageIndex < imageUriStringList.length) {
      // Claim the next image index before incrementing (prevents two workers from processing the same image)
      const imageIndexToProcess = currentImageIndex;
      currentImageIndex += 1;

      // Get the original uncompressed image URI from the list
      const originalImageUriStringValue = imageUriStringList[imageIndexToProcess];

      // Compress this single image down to the maximum allowed bytes
      const compressedImageUriStringValue = await compressImageToMaxBytes({
        originalImageUriStringValue: originalImageUriStringValue,
        maximumBytesAllowed: maximumBytesAllowedPerImage,
      });

      // Store the compressed URI at the same index so the output order matches the input order
      compressedImageUriResultList[imageIndexToProcess] = compressedImageUriStringValue;
    }
  }

  // ── Spawn the worker tasks (up to maximumConcurrentWorkers, but never more than the image count) ──
  const compressionWorkerTaskList = Array.from(
    { length: Math.min(maximumConcurrentWorkers, imageUriStringList.length) },
    () => compressionWorkerTask()
  );

  // ── Wait for all workers to finish processing every image in the list ──
  await Promise.all(compressionWorkerTaskList);

  // ── Return only the valid (non-null/undefined) compressed URIs ──
  return compressedImageUriResultList.filter(Boolean);
}

export default function StartBuildScreen() {
  // ── Theme and navigation hooks ──
  const { theme } = useTheme();
  const expoRouter = useRouter();

  // ── Device dimensions for responsive layout ──
  const { width: deviceScreenWidth, height: deviceScreenHeight } = useWindowDimensions();

  // ── Screen size breakpoints for adaptive styling ──
  const isSmallPhoneDevice = deviceScreenWidth < 380;   // e.g. iPhone SE, older small phones
  const isLargePhoneDevice = deviceScreenWidth >= 430;  // e.g. iPhone Pro Max, large Android phones

  // ── Modal visibility: controls whether the New Build Intake form is shown ──
  const [isNewBuildIntakeModalVisible, setIsNewBuildIntakeModalVisible] = useState(false);

  // ── Form field state: text inputs for lot details ──
  const [lotAddressTextValue, setLotAddressTextValue] = useState("");
  const [lotSizeDimensionsTextValue, setLotSizeDimensionsTextValue] = useState("");
  const [lotPriceTextValue, setLotPriceTextValue] = useState("");

  // ── Form field state: terrain type segmented control and demolition toggle ──
  const [lotTerrainTypeValue, setLotTerrainTypeValue] = useState("flat"); // "flat" | "sloped" | "mountain"
  const [doesLotHaveOldHouseToDemolish, setDoesLotHaveOldHouseToDemolish] = useState(false);

  // ── Photo state: list of local image URIs the user has selected or captured ──
  const [selectedLotImageUriList, setSelectedLotImageUriList] = useState([]);

  // ── Save-in-progress flag: disables the Save button and shows a spinner while saving ──
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

  // ── Opens the bottom-sheet modal so the user can fill in new build details ──
  function openNewBuildIntakeModal() {
    console.log("StartBuildScreen => openNewBuildIntakeModal");
    setIsNewBuildIntakeModalVisible(true);
  }

  // ── Closes the bottom-sheet modal (called by the X button, Cancel button, or after a successful save) ──
  function closeNewBuildIntakeModal() {
    console.log("StartBuildScreen => closeNewBuildIntakeModal");
    setIsNewBuildIntakeModalVisible(false);
  }

  // ── Updates the terrain type when the user taps one of the segmented buttons (Flat / Sloped / Mountain) ──
  function updateLotTerrainType(terrainTypeStringValue) {
    console.log("StartBuildScreen => updateLotTerrainType:", terrainTypeStringValue);
    setLotTerrainTypeValue(terrainTypeStringValue);
  }

  /**
   * Merges newly selected image URIs into the existing selected list.
   * - Combines the previous list with the new URIs.
   * - Removes duplicate URIs (in case the user picks the same photo twice).
   * - Enforces the maximum photo limit by slicing to MAXIMUM_LOT_PHOTOS_ALLOWED.
   */
  function addImageUrisToSelectedList(nextImageUriList) {
    setSelectedLotImageUriList((previousImageUriList) => {
      const mergedImageUriList = [...previousImageUriList, ...nextImageUriList];
      const uniqueImageUriList = Array.from(new Set(mergedImageUriList));
      return uniqueImageUriList.slice(0, MAXIMUM_LOT_PHOTOS_ALLOWED);
    });
  }

  /**
   * Opens the device's photo library so the user can pick one or more lot photos.
   *
   * Flow:
   * 1. Check if we have already reached the maximum photo limit — show alert if so.
   * 2. Request media library permission from the OS.
   * 3. Launch the image picker with multi-select enabled and a selection cap
   *    equal to the remaining available slots.
   * 4. Extract the URIs from the selected assets and merge them into state.
   */
  async function selectLotPhotosFromCameraRoll() {
    try {
      console.log("StartBuildScreen => selectLotPhotosFromCameraRoll pressed");

      // Guard: prevent opening the picker if the user already has the max number of photos
      if (selectedLotImageUriList.length >= MAXIMUM_LOT_PHOTOS_ALLOWED) {
        Alert.alert("Limit reached", `You can add up to ${MAXIMUM_LOT_PHOTOS_ALLOWED} photos.`);
        return;
      }

      // Request permission to access the device's photo library
      const mediaLibraryPermissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!mediaLibraryPermissionResult?.granted) {
        Alert.alert("Permission needed", "Please allow photo library access.");
        return;
      }

      // Calculate how many more photos the user is allowed to pick
      const remainingPhotoSlots = MAXIMUM_LOT_PHOTOS_ALLOWED - selectedLotImageUriList.length;

      // Launch the image library picker (multi-select, images only, capped at remaining slots)
      const imageLibraryPickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.9,
        allowsMultipleSelection: true,
        selectionLimit: remainingPhotoSlots,
      });

      // If the user pressed Cancel, do nothing
      if (imageLibraryPickerResult.canceled) {
        console.log("StartBuildScreen => user canceled image library");
        return;
      }

      // Extract the file URIs from the returned asset objects
      const newlySelectedImageUriList = (imageLibraryPickerResult.assets || [])
        .map((assetObject) => assetObject?.uri)
        .filter(Boolean);

      console.log("StartBuildScreen => images selected from library:", newlySelectedImageUriList.length);

      // Merge the newly selected URIs into the existing list (deduped + capped)
      addImageUrisToSelectedList(newlySelectedImageUriList);
    } catch (error) {
      console.log("StartBuildScreen => selectLotPhotosFromCameraRoll error:", error);
      Alert.alert("Error", "Could not open photo library. Please try again.");
    }
  }

  /**
   * Opens the device camera so the user can take a single lot photo.
   *
   * Flow:
   * 1. Check if we have already reached the maximum photo limit — show alert if so.
   * 2. Request camera permission from the OS.
   * 3. Launch the camera (single capture, no editing).
   * 4. Extract the captured image URI and add it to the selected list.
   */
  async function takeSingleLotPhotoWithCamera() {
    try {
      console.log("StartBuildScreen => takeSingleLotPhotoWithCamera pressed");

      // Guard: prevent opening the camera if the user already has the max number of photos
      if (selectedLotImageUriList.length >= MAXIMUM_LOT_PHOTOS_ALLOWED) {
        Alert.alert("Limit reached", `You can add up to ${MAXIMUM_LOT_PHOTOS_ALLOWED} photos.`);
        return;
      }

      // Request permission to use the device camera
      const cameraPermissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermissionResult?.granted) {
        Alert.alert("Permission needed", "Please allow camera access.");
        return;
      }

      // Launch the camera to capture a single image (no cropping/editing)
      const cameraCaptureResult = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.9,
        allowsEditing: false,
      });

      // If the user pressed Cancel in the camera UI, do nothing
      if (cameraCaptureResult.canceled) {
        console.log("StartBuildScreen => user canceled camera");
        return;
      }

      // Extract the file URI from the first (and only) captured asset
      const capturedImageUri = cameraCaptureResult?.assets?.[0]?.uri;
      if (!capturedImageUri) {
        Alert.alert("Error", "No image was captured. Please try again.");
        return;
      }

      console.log("StartBuildScreen => captured image uri:", capturedImageUri);

      // Add the captured photo URI to the selected list
      addImageUrisToSelectedList([capturedImageUri]);
    } catch (error) {
      console.log("StartBuildScreen => takeSingleLotPhotoWithCamera error:", error);
      Alert.alert("Error", "Could not open camera. Please try again.");
    }
  }

  // ── Removes a single photo from the selected list when the user taps its thumbnail ──
  function removeSelectedLotImageByUri(imageUriToRemove) {
    console.log("StartBuildScreen => removeSelectedLotImageByUri:", imageUriToRemove);
    setSelectedLotImageUriList((previousImageUriList) =>
      previousImageUriList.filter((imageUri) => imageUri !== imageUriToRemove)
    );
  }

  /**
   * Validates the form, compresses photos, uploads them to ImageKit,
   * then sends the build metadata + photo URLs to the backend.
   *
   * Full save flow:
   *   Validate → Compress → Upload to ImageKit → POST to backend → Reset form → Navigate
   */
  async function saveNewBuildProjectToBackend() {
    console.log("StartBuildScreen => saveNewBuildProjectToBackend pressed");

    // ── Validation: trim whitespace and check all required fields ──
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

    // ── Lock the UI: disable Save button and show the "Saving..." spinner ──
    setIsSavingBuildProjectToBackend(true);

    try {
      // ── Step 1: Build the JSON metadata object that describes this new build ──
      // This is the data that will be stored in MongoDB alongside the photo URLs.
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

      // ── Step 2: Compress all selected images to <= 1.6 MB each ──
      // This ensures the total upload payload stays well under 16 MB (8 × 1.6 MB = 12.8 MB max).
      // Images that are already under the limit are returned unchanged (no wasted work).
      let compressedLotImageUriList = selectedLotImageUriList;

      if (selectedLotImageUriList.length > 0) {
        console.log("StartBuildScreen => compressing images before upload...");
        compressedLotImageUriList = await compressImageUriListForUpload({
          imageUriStringList: selectedLotImageUriList,
          maximumBytesAllowedPerImage: MAXIMUM_BYTES_PER_IMAGE,
        });
        console.log("StartBuildScreen => compression complete:", compressedLotImageUriList.length, "images");
      }

      // ── Step 3: Upload compressed images directly to ImageKit from the app ──
      // The uploadImagesToImageKit helper fetches auth params (token, signature, expire)
      // from GET /api/imagekit/auth (Bearer token auto-attached by callBackend),
      // then POSTs each image to ImageKit's upload endpoint.
      // Returns an array of metadata objects: { imageKitFileId, url, thumbnailUrl, name }
      let uploadedPhotoMetadataArray = [];
      if (compressedLotImageUriList.length > 0) {
        console.log("StartBuildScreen => uploading compressed images to ImageKit...");
        uploadedPhotoMetadataArray = await uploadImagesToImageKit(compressedLotImageUriList);
        console.log("StartBuildScreen => ImageKit upload complete:", uploadedPhotoMetadataArray.length, "photos");
      }

      // ── Step 4: Send the build metadata + photo URLs as JSON to the backend ──
      // callBackend (axios) auto-attaches the Authorization: Bearer <token> header.
      // The backend creates a BuildProject + initial BuildStep (LOT_INTAKE) in MongoDB.
      console.log("StartBuildScreen => POST JSON to /api/builds/create");

      const backendResponse = await callBackend.post("/api/builds/create", {
        metadata: buildMetadataPayload,
        photos: uploadedPhotoMetadataArray,
      });

      console.log("StartBuildScreen => backendResponse status:", backendResponse.status);
      console.log("StartBuildScreen => backendResponse data:", backendResponse.data);

      // ── Check for backend-level failure (HTTP 200 but success: false) ──
      if (!backendResponse.data?.success) {
        Alert.alert(
          "Save failed",
          backendResponse.data?.message || "We could not save your build. Please try again."
        );
        return;
      }

      // ── Step 5: Success — reset every form field back to its initial value ──
      // This ensures the next time the user opens "New Build", they start with a clean form.
      setLotAddressTextValue("");
      setLotSizeDimensionsTextValue("");
      setLotPriceTextValue("");
      setLotTerrainTypeValue("flat");
      setDoesLotHaveOldHouseToDemolish(false);
      setSelectedLotImageUriList([]);

      // ── Step 6: Close the modal and navigate to the Active/In-Progress builds tab ──
      closeNewBuildIntakeModal();
      expoRouter.push("/(security)/(private)/(homebuilder)/(active)/inprogress");
    } catch (error) {
      // ── Error handling: show a user-friendly alert for any unexpected failures ──
      console.log("StartBuildScreen => saveNewBuildProjectToBackend error:", error);
      Alert.alert("Error", "Could not save build. Please try again.");
    } finally {
      // ── Always unlock the UI, whether the save succeeded or failed ──
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
                keyboardDismissMode="interactive"
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
                    Photos upload to ImageKit, then metadata saves to your account.
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
