// BACKEND/controllers/buildControllers/buildSteps.js

import BuildProject from "../../models/buildmodels/buildProjectModel.js";
import BuildStep from "../../models/buildmodels/buildProjectStepsModel.js";

/**
 * GET /api/builds/:projectId
 *
 * Returns a single BuildProject + all of its BuildSteps in one response.
 * The frontend uses this to render the build detail page.
 */
export async function getBuildById(req, res) {
  try {
    const authenticatedUserId = req.user?.userId;
    const projectIdParam = req.params.projectId;

    if (!projectIdParam) {
      return res.status(400).json({ success: false, message: "projectId is required" });
    }

    // 1) Fetch the project — must belong to the authenticated user
    const buildProject = await BuildProject.findOne({
      _id: projectIdParam,
      ownerUserId: authenticatedUserId,
    }).lean();

    if (!buildProject) {
      return res.status(404).json({ success: false, message: "Build not found" });
    }

    // 2) Fetch ALL steps for this project, ordered by creation date
    const steps = await BuildStep.find({ projectId: projectIdParam })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      build: buildProject,
      steps,
    });
  } catch (error) {
    console.log("getBuildById error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * GET /api/builds/steps?projectId=xxx
 *
 * Returns all BuildStep documents for a given project.
 */
export async function getBuildStepsByProjectId(req, res) {
  try {
    const authenticatedUserId = req.user?.userId;
    const projectId = req.query.projectId;

    if (!projectId) {
      return res.status(400).json({ success: false, message: "projectId query param is required" });
    }

    // Verify the project belongs to this user
    const buildProject = await BuildProject.findOne({
      _id: projectId,
      ownerUserId: authenticatedUserId,
    }).lean();

    if (!buildProject) {
      return res.status(404).json({ success: false, message: "Build not found" });
    }

    const steps = await BuildStep.find({ projectId })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({ success: true, steps });
  } catch (error) {
    console.log("getBuildStepsByProjectId error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
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
