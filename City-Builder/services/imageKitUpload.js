// City-Builder/services/imageKitUpload.js
// ─────────────────────────────────────────────────────────────────────
// Direct-to-ImageKit upload from the mobile app.
//
// Flow:
//   1. Fetch auth params (token, signature, expire) from our backend
//      via GET /api/imagekit/auth  (requires Bearer token — callBackend handles it).
//   2. For each image, POST multipart/form-data directly to ImageKit's
//      upload endpoint (https://upload.imagekit.io/api/v1/files/upload).
//   3. Return an array of metadata objects ready to save in MongoDB.
// ─────────────────────────────────────────────────────────────────────
import callBackend from "./callBackend";

const IMAGEKIT_UPLOAD_URL = process.env.EXPO_PUBLIC_IMAGEKIT_UPLOAD_URL || "https://upload.imagekit.io/api/v1/files/upload";
const MAXIMUM_LOT_PHOTOS_ALLOWED = Number(process.env.EXPO_PUBLIC_MAXIMUM_LOT_PHOTOS_ALLOWED) || 8;

/**
 * Infer MIME type from a local file URI.
 */
function inferMimeType(uri) {
  const lower = String(uri || "").toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic")) return "image/heic";
  return "image/jpeg";
}

/**
 * Infer a filename from a local file URI.
 */
function inferFileName(uri, index) {
  const str = String(uri || "");
  const lastSlash = str.lastIndexOf("/");
  const raw = lastSlash >= 0 ? str.slice(lastSlash + 1) : "";
  if (raw && raw.includes(".")) return raw;
  return `lot-photo-${index + 1}.jpg`;
}

/**
 * Fetch ImageKit auth parameters from our backend.
 * Returns: { token, expire, signature }
 */
async function fetchImageKitAuthParams() {
  console.log('[imageKitUpload] 🔑 fetchImageKitAuthParams => calling GET /api/imagekit/auth...');
  try {
    const response = await callBackend.get("/api/imagekit/auth");
    console.log('[imageKitUpload] 🔑 fetchImageKitAuthParams => response status:', response.status);
    console.log('[imageKitUpload] 🔑 fetchImageKitAuthParams => response data:', JSON.stringify(response.data));
    const { token, expire, signature } = response.data;

    if (!token || !signature) {
      console.log('[imageKitUpload] ❌ auth params missing! token:', !!token, 'signature:', !!signature);
      throw new Error("ImageKit auth params missing from backend response");
    }

    console.log('[imageKitUpload] ✅ auth params received (token length:', token?.length, ')');
    return { token, expire, signature };
  } catch (error) {
    console.log('[imageKitUpload] ❌ fetchImageKitAuthParams error:', error?.message);
    console.log('[imageKitUpload] ❌ error response status:', error?.response?.status);
    console.log('[imageKitUpload] ❌ error response data:', JSON.stringify(error?.response?.data));
    throw error;
  }
}

/**
 * Upload a single image to ImageKit.
 *
 * IMPORTANT: ImageKit auth tokens are **single-use**.  Each upload must
 * have its own fresh { token, expire, signature } set.  We fetch new
 * auth params inside this function so callers don't have to manage it.
 *
 * @param {string}  uri       - Local file URI (e.g. file:///…)
 * @param {number}  index     - Index in the batch (for fallback naming)
 * @param {string}  folder    - ImageKit folder path to upload into
 * @param {string}  publicKey - ImageKit public key
 * @returns {object} { imageKitFileId, url, thumbnailUrl, name }
 */
async function uploadSingleImage(uri, index, folder, publicKey) {
  const fileName = inferFileName(uri, index);
  const mimeType = inferMimeType(uri);

  // ── Fetch a FRESH single-use auth token for THIS upload ──
  console.log(`[imageKitUpload] 🔑 Fetching fresh auth token for image ${index + 1} (${fileName})...`);
  const authParams = await fetchImageKitAuthParams();

  const formData = new FormData();
  formData.append("file", { uri, name: fileName, type: mimeType });
  formData.append("fileName", fileName);
  formData.append("folder", folder);
  formData.append("publicKey", publicKey);
  formData.append("token", authParams.token);
  formData.append("expire", String(authParams.expire));
  formData.append("signature", authParams.signature);

  console.log(`[imageKitUpload] ⬆️  Uploading image ${index + 1}: ${fileName} (token: ${authParams.token.slice(0, 8)}…)`);

  const response = await fetch(IMAGEKIT_UPLOAD_URL, {
    method: "POST",
    body: formData,
    // Do NOT set Content-Type — RN sets it with the correct multipart boundary.
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.warn(`[imageKitUpload] ❌ Upload failed for ${fileName}:`, errorText);
    throw new Error(`ImageKit upload failed (${response.status})`);
  }

  const data = await response.json();
  console.log(`[imageKitUpload] ✅ Image ${index + 1} uploaded: ${data.url}`);

  return {
    imageKitFileId: data.fileId,
    url: data.url,
    thumbnailUrl: data.thumbnailUrl || data.url,
    name: data.name || fileName,
  };
}

/**
 * Upload an array of local image URIs to ImageKit.
 *
 * @param {string[]} imageUriList - Array of local file URIs (max 8)
 * @param {object}   options
 * @param {string}   options.folder    - ImageKit folder, default "/lot-photos"
 * @param {string}   options.publicKey - ImageKit public key (from env or config)
 * @returns {Promise<Array<{ imageKitFileId, url, thumbnailUrl, name }>>}
 */
export async function uploadImagesToImageKit(imageUriList, options = {}) {
  const {
    folder = "/lot-photos",
    publicKey = process.env.EXPO_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
  } = options;

  if (!imageUriList || imageUriList.length === 0) {
    console.log("[imageKitUpload] No images to upload");
    return [];
  }

  const trimmedList = imageUriList.slice(0, MAXIMUM_LOT_PHOTOS_ALLOWED);

  // ── Upload images ONE AT A TIME (sequentially) ──
  // ImageKit auth tokens are single-use: each upload needs its own fresh
  // token from GET /api/imagekit/auth.  Uploading in parallel would fire
  // all token requests at once and they could collide.  Sequential upload
  // is safer and still fast enough for ≤ 8 images.
  console.log(`[imageKitUpload] Uploading ${trimmedList.length} image(s) sequentially...`);

  const results = [];
  for (let i = 0; i < trimmedList.length; i++) {
    const result = await uploadSingleImage(trimmedList[i], i, folder, publicKey);
    results.push(result);
  }

  console.log(`[imageKitUpload] ✅ All ${results.length} image(s) uploaded successfully`);

  return results;
}
