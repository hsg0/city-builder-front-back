// City-Builder/services/compressImages.js
// ─────────────────────────────────────────────────────────────────────
// Shared image compression utilities.
//
// Converts any image format (HEIC, PNG, WebP, JPEG, etc.) to JPEG and
// iteratively compresses until each image is ≤ the target byte limit.
//
// Used by:  startbuild.jsx (lot photos),  [selectABuild]/index.jsx (step photos)
// ─────────────────────────────────────────────────────────────────────
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";

/** Default target: 1.6 MB per image (8 images × 1.6 MB = 12.8 MB < 16 MB) */
export const MAXIMUM_BYTES_PER_IMAGE = 1.6 * 1024 * 1024;

/**
 * Reads the file at the given URI and returns its size in bytes.
 * Returns 0 if the file does not exist or the size cannot be determined.
 */
export async function getFileSizeInBytes(fileUriStringValue) {
  const fileSystemInfoResult = await FileSystem.getInfoAsync(
    fileUriStringValue,
    { size: true }
  );
  return Number(fileSystemInfoResult?.size || 0);
}

/**
 * Compress + resize a single image until it is ≤ maxBytes.
 * Output is always JPEG (handles HEIC / PNG / WebP input automatically).
 *
 * Strategy:
 * 1) Start at width 1600 px, JPEG quality 0.82
 * 2) Reduce JPEG quality by 0.12 per pass (floor 0.45)
 * 3) If quality is floored, reduce width by 15 % (floor 900 px), bump quality to 0.78
 * 4) Up to 8 attempts; returns best-effort result if limit is not met
 */
export async function compressImageToMaxBytes({
  originalImageUriStringValue,
  maximumBytesAllowed = MAXIMUM_BYTES_PER_IMAGE,
}) {
  // Early exit if already under limit
  const originalSizeBytes = await getFileSizeInBytes(
    originalImageUriStringValue
  );
  if (originalSizeBytes > 0 && originalSizeBytes <= maximumBytesAllowed) {
    console.log(
      "compressImageToMaxBytes => already under limit:",
      originalSizeBytes,
      "bytes"
    );
    return originalImageUriStringValue;
  }

  let currentUriStringValue = originalImageUriStringValue;
  let currentTargetWidth = 1600;
  let currentJpegQuality = 0.82;
  const minimumTargetWidth = 900;
  const minimumJpegQuality = 0.45;

  for (let attemptIndex = 0; attemptIndex < 8; attemptIndex += 1) {
    const manipulationActions = [{ resize: { width: currentTargetWidth } }];

    const manipulationResult = await ImageManipulator.manipulateAsync(
      currentUriStringValue,
      manipulationActions,
      {
        compress: currentJpegQuality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    const nextUriStringValue = manipulationResult?.uri;
    if (!nextUriStringValue) return currentUriStringValue;

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

    if (nextSizeBytes > 0 && nextSizeBytes <= maximumBytesAllowed) {
      return nextUriStringValue;
    }

    if (currentJpegQuality > minimumJpegQuality) {
      currentJpegQuality = Math.max(
        minimumJpegQuality,
        currentJpegQuality - 0.12
      );
    } else if (currentTargetWidth > minimumTargetWidth) {
      currentTargetWidth = Math.max(
        minimumTargetWidth,
        Math.floor(currentTargetWidth * 0.85)
      );
      currentJpegQuality = 0.78;
    } else {
      return nextUriStringValue;
    }

    currentUriStringValue = nextUriStringValue;
  }

  return currentUriStringValue;
}

/**
 * Compress a list of image URIs to ≤ maximumBytesAllowedPerImage each.
 * Uses concurrency of 2 to balance speed vs. phone memory.
 *
 * @param {string[]} imageUriStringList         - Local file URIs
 * @param {number}   maximumBytesAllowedPerImage - Target per image (default 1.6 MB)
 * @returns {Promise<string[]>} Compressed image URIs (same order as input)
 */
export async function compressImageUriListForUpload({
  imageUriStringList,
  maximumBytesAllowedPerImage = MAXIMUM_BYTES_PER_IMAGE,
}) {
  if (!imageUriStringList || imageUriStringList.length === 0) return [];

  const compressedImageUriResultList = [];
  const maximumConcurrentWorkers = 2;
  let currentImageIndex = 0;

  async function compressionWorkerTask() {
    while (currentImageIndex < imageUriStringList.length) {
      const imageIndexToProcess = currentImageIndex;
      currentImageIndex += 1;

      const originalImageUriStringValue =
        imageUriStringList[imageIndexToProcess];

      const compressedImageUriStringValue = await compressImageToMaxBytes({
        originalImageUriStringValue,
        maximumBytesAllowed: maximumBytesAllowedPerImage,
      });

      compressedImageUriResultList[imageIndexToProcess] =
        compressedImageUriStringValue;
    }
  }

  const compressionWorkerTaskList = Array.from(
    {
      length: Math.min(
        maximumConcurrentWorkers,
        imageUriStringList.length
      ),
    },
    () => compressionWorkerTask()
  );

  await Promise.all(compressionWorkerTaskList);

  return compressedImageUriResultList.filter(Boolean);
}
