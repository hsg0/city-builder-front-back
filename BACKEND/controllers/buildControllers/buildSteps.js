// BACKEND/controllers/buildControllers/buildSteps.js
// ─────────────────────────────────────────────────────────────────────
// Placeholder stubs for build-step CRUD.
// These will be fully implemented once the step management UI is built.
// ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/builds/steps?projectId=xxx
 */
export async function getBuildStepsByProjectId(req, res) {
  return res.status(501).json({ success: false, message: "Not implemented yet" });
}

/**
 * POST /api/builds/steps/add
 */
export async function addBuildStepToProject(req, res) {
  return res.status(501).json({ success: false, message: "Not implemented yet" });
}

/**
 * PATCH /api/builds/steps/update
 */
export async function updateBuildStepByStepId(req, res) {
  return res.status(501).json({ success: false, message: "Not implemented yet" });
}

/**
 * POST /api/builds/steps/photos/upload
 */
export async function uploadPhotosToBuildStepByStepId(req, res) {
  return res.status(501).json({ success: false, message: "Not implemented yet" });
}
