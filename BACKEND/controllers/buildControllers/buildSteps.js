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
 *
 * Body: { projectId, title, stepNumber, stepType?, startDate?, endDate?, cost?, notes?, photos? }
 * - title is required
 * - everything else is optional
 */
export async function addBuildStepToProject(req, res) {
  try {
    const authenticatedUserId = req.user?.userId;
    const {
      projectId,
      title,
      stepNumber,
      stepType,
      startDate,
      endDate,
      cost,
      notes,
      photos,
    } = req.body;

    // ── Validate required fields ──
    if (!projectId) {
      return res.status(400).json({ success: false, message: "projectId is required" });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "title is required" });
    }

    // ── Verify the project exists and belongs to this user ──
    const buildProject = await BuildProject.findOne({
      _id: projectId,
      ownerUserId: authenticatedUserId,
    }).lean();

    if (!buildProject) {
      return res.status(404).json({ success: false, message: "Build project not found" });
    }

    // ── Parse cost safely ──
    let parsedCost = 0;
    if (cost !== undefined && cost !== null && cost !== "") {
      parsedCost = parseFloat(cost);
      if (isNaN(parsedCost)) parsedCost = 0;
    }

    // ── Create the step document ──
    const newStep = await BuildStep.create({
      projectId,
      ownerUserId: authenticatedUserId,
      title: title.trim(),
      stepNumber: stepNumber || 1,
      stepType: stepType || "GENERAL",
      dateStart: startDate || "",
      dateEnd: endDate || "",
      costAmount: parsedCost,
      notes: notes || "",
      photos: Array.isArray(photos) ? photos : [],
    });

    console.log("[addBuildStepToProject] Created step:", newStep._id, "for project:", projectId);

    return res.status(201).json({
      success: true,
      message: "Step added successfully",
      step: newStep,
    });
  } catch (error) {
    console.log("addBuildStepToProject error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * PATCH /api/builds/steps/update
 *
 * Body: { stepId, projectId, title?, dateStart?, dateEnd?, cost?,
 *         costCurrency?, notes?, photos?, status? }
 *
 * - stepId   — required (the step to update)
 * - projectId — required (ownership check)
 * - everything else is optional — only provided fields are updated
 *
 * Photos strategy:
 *   The client sends the FULL array of photos the user wants to keep/display.
 *   Old photos removed by the user are simply omitted — they remain on
 *   ImageKit (orphaned, but that's fine). New photos are already uploaded
 *   to ImageKit by the frontend before this call.
 *   Each photo object MUST contain `imageKitFileId` and `url`.
 *   The backend sanitizes, validates, and caps the array at 8.
 */
const MAXIMUM_STEP_PHOTOS = 8;

export async function updateBuildStepByStepId(req, res) {
  try {
    const authenticatedUserId = req.user?.userId;
    const {
      stepId,
      projectId,
      title,
      dateStart,
      dateEnd,
      cost,
      costCurrency,
      notes,
      photos,
      status,
    } = req.body;

    // ── Validate required identifiers ──
    if (!stepId) {
      return res.status(400).json({ success: false, message: "stepId is required" });
    }
    if (!projectId) {
      return res.status(400).json({ success: false, message: "projectId is required" });
    }

    // ── Verify the project belongs to the authenticated user ──
    const buildProject = await BuildProject.findOne({
      _id: projectId,
      ownerUserId: authenticatedUserId,
    }).lean();

    if (!buildProject) {
      return res.status(404).json({ success: false, message: "Build project not found" });
    }

    // ── Verify the step exists and belongs to this project ──
    const existingStep = await BuildStep.findOne({
      _id: stepId,
      projectId,
    });

    if (!existingStep) {
      return res.status(404).json({ success: false, message: "Step not found" });
    }

    // ── Build the update object — only set fields that were provided ──
    const updates = {};

    // -- Title --
    if (title !== undefined && title !== null) {
      const trimmed = String(title).trim();
      if (!trimmed) {
        return res.status(400).json({ success: false, message: "title cannot be empty" });
      }
      updates.title = trimmed;
    }

    // -- Dates --
    if (dateStart !== undefined) updates.dateStart = String(dateStart || "").trim();
    if (dateEnd !== undefined)   updates.dateEnd   = String(dateEnd || "").trim();

    // -- Cost --
    if (cost !== undefined && cost !== null) {
      let parsedCost = parseFloat(cost);
      if (isNaN(parsedCost) || parsedCost < 0) parsedCost = 0;
      updates.costAmount = parsedCost;
    }

    // -- Cost currency (optional, e.g. "USD") --
    if (costCurrency !== undefined) {
      updates.costCurrency = String(costCurrency || "").trim().toUpperCase();
    }

    // -- Notes --
    if (notes !== undefined) updates.notes = String(notes || "").trim();

    // -- Status --
    if (status !== undefined) {
      const allowed = ["planned", "in_progress", "completed"];
      if (allowed.includes(status)) {
        updates.status = status;
      }
    }

    // -- Photos (sanitize, validate, cap at 8) --
    if (photos !== undefined) {
      if (!Array.isArray(photos)) {
        return res.status(400).json({
          success: false,
          message: "photos must be an array",
        });
      }

      // Sanitize: keep only objects with the two required fields
      const sanitized = photos
        .filter(
          (p) =>
            p &&
            typeof p === "object" &&
            typeof p.imageKitFileId === "string" &&
            p.imageKitFileId.trim() !== "" &&
            typeof p.url === "string" &&
            p.url.trim() !== ""
        )
        .map((p) => ({
          imageKitFileId: p.imageKitFileId.trim(),
          url: p.url.trim(),
          thumbnailUrl: typeof p.thumbnailUrl === "string" ? p.thumbnailUrl.trim() : p.url.trim(),
          name: typeof p.name === "string" ? p.name.trim() : "",
          expiresAt: p.expiresAt || null,
        }));

      // Hard cap — never store more than MAXIMUM_STEP_PHOTOS
      updates.photos = sanitized.slice(0, MAXIMUM_STEP_PHOTOS);

      console.log(
        `[updateBuildStepByStepId] Photos: ${photos.length} received → ${sanitized.length} valid → ${updates.photos.length} kept (max ${MAXIMUM_STEP_PHOTOS})`
      );
    }

    // ── Apply update + bump revisionNumber ──
    const updatedStep = await BuildStep.findByIdAndUpdate(
      stepId,
      {
        $set: updates,
        $inc: { revisionNumber: 1 },
      },
      { new: true, runValidators: true }
    ).lean();

    console.log(
      "[updateBuildStepByStepId] ✅ Updated step:", stepId,
      "| fields:", Object.keys(updates).join(", "),
      "| revision:", updatedStep.revisionNumber
    );

    return res.status(200).json({
      success: true,
      message: "Step updated successfully",
      step: updatedStep,
    });
  } catch (error) {
    console.log("updateBuildStepByStepId error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * POST /api/builds/steps/photos/upload
 */
export async function uploadPhotosToBuildStepByStepId(req, res) {
  return res.status(501).json({ success: false, message: "Not implemented yet" });
}
