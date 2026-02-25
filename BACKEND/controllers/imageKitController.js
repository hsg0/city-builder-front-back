// BACKEND/controllers/imageKitController.js

import imageKit from "../config/imageKit.js";

/**
 * GET /api/imagekit/auth
 * Returns ImageKit upload authentication parameters:
 * { token, expire, signature }
 *
 * Use this on the frontend to upload directly to ImageKit.
 */
export async function getImageKitUploadAuth(requestObject, responseObject) {
  console.log('[imageKitController] ➡️  getImageKitUploadAuth called');
  console.log('[imageKitController] 👤 user:', requestObject.user);
  try {
    // ImageKit SDK gives correct params
    const authenticationParameters = imageKit.getAuthenticationParameters();
    console.log('[imageKitController] ✅ auth params generated:', JSON.stringify(authenticationParameters));

    return responseObject.status(200).json({
      success: true,
      ...authenticationParameters,
    });
  } catch (error) {
    console.log('[imageKitController] ❌ getImageKitUploadAuth error:', error);
    return responseObject.status(500).json({
      success: false,
      message: "Could not generate ImageKit auth parameters",
    });
  }
}