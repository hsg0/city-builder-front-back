// BACKEND/controllers/buildControllers/costController.js
//
// ✅ Cost overview — returns each completed build with:
//    - address, lot dimensions
//    - build start date + completion date
//    - total cost (sum of all step costAmounts)
//    - last step photos (for carousel display)
//    - step count

import BuildProject from "../../models/buildmodels/buildProjectModel.js";
import BuildStep from "../../models/buildmodels/buildProjectStepsModel.js";

/**
 * GET /api/costs/overview
 *
 * Returns a cost overview of all completed builds for the authenticated user.
 * Each build includes aggregated total cost, last step photos, and summary info.
 */
export async function getCompletedBuildsCostOverview(requestObject, responseObject) {
  try {
    const authenticatedUserId = requestObject.user?.userId;

    // 1) Fetch all completed projects for this user
    const completedBuilds = await BuildProject.find({
      ownerUserId: authenticatedUserId,
      status: "completed",
    })
      .sort({ updatedAt: -1 })
      .lean();

    if (completedBuilds.length === 0) {
      return responseObject.status(200).json({
        success: true,
        builds: [],
      });
    }

    // 2) Collect all project IDs for a single bulk step query
    const projectIdList = completedBuilds.map((b) => b._id);

    // 3) Fetch ALL steps for ALL completed projects in one query
    const allSteps = await BuildStep.find({
      projectId: { $in: projectIdList },
    })
      .sort({ createdAt: 1 })
      .lean();

    // 4) Group steps by projectId
    const stepsByProjectId = {};
    for (const step of allSteps) {
      const pid = String(step.projectId);
      if (!stepsByProjectId[pid]) stepsByProjectId[pid] = [];
      stepsByProjectId[pid].push(step);
    }

    // 5) Build the overview for each completed project
    const buildsOverview = completedBuilds.map((build) => {
      const pid = String(build._id);
      const steps = stepsByProjectId[pid] || [];

      // Total cost = sum of all step costAmounts
      const totalCost = steps.reduce((sum, s) => {
        return sum + (s.costAmount > 0 ? s.costAmount : 0);
      }, 0);

      // Last step = the most recent step (last by createdAt, already sorted)
      const lastStep = steps.length > 0 ? steps[steps.length - 1] : null;

      // Photos from the last step for the carousel
      const lastStepPhotos = lastStep
        ? (Array.isArray(lastStep.photos) ? lastStep.photos : []).map((p) => ({
            url: p.url || "",
            thumbnailUrl: p.thumbnailUrl || "",
            name: p.name || "",
          }))
        : [];

      // Also gather LOT_INTAKE photos (first step) as a fallback
      const lotIntakeStep = steps.find((s) => s.stepType === "LOT_INTAKE");
      const lotPhotos = lotIntakeStep
        ? (Array.isArray(lotIntakeStep.photos) ? lotIntakeStep.photos : []).map(
            (p) => ({
              url: p.url || "",
              thumbnailUrl: p.thumbnailUrl || "",
              name: p.name || "",
            })
          )
        : [];

      return {
        _id: build._id,
        address: build.summary?.lotAddress || "",
        lotDimensions: build.summary?.lotSizeDimensions || "",
        lotPrice: build.summary?.lotPrice || 0,
        startDate: build.homeBuildIntakeStartedAt || null,
        completedDate: build.updatedAt || null,
        totalCost,
        stepCount: steps.length,
        lastStepTitle: lastStep ? lastStep.title || "" : "",
        lastStepPhotos,
        lotPhotos,
      };
    });

    return responseObject.status(200).json({
      success: true,
      builds: buildsOverview,
    });
  } catch (error) {
    console.log("getCompletedBuildsCostOverview error:", error);
    return responseObject
      .status(500)
      .json({ success: false, message: "Server error" });
  }
}
