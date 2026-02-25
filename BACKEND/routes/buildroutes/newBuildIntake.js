// BACKEND/routes/buildroutes/newBuildIntake.js

import express from "express";
import { checkAuth } from "../../middleware/authMiddleware.js";

import {
  createNewBuild,
  getActiveBuilds,
  getBuildStepsByProjectId,
  addBuildStepToProject,
  updateBuildStepByStepId,
  uploadPhotosToBuildStepByStepId,
} from "../../controllers/buildControllers/newBuildIntake.js";

const homeBuilderRouter = express.Router();

/**
 * Create new build (Step Type: LOT_INTAKE)
 * Expects JSON body: { metadata, photos }
 *   - metadata: { lotAddress, lotSizeDimensions, lotPrice, lotTerrainType, hasOldHouseToDemolish }
 *   - photos: [{ imageKitFileId, url, thumbnailUrl, name }]  (already uploaded to ImageKit)
 */
homeBuilderRouter.post("/create", checkAuth, createNewBuild);

/**
 * Get active builds list for the logged-in user
 */
homeBuilderRouter.get("/active", checkAuth, getActiveBuilds);

/**
 * Get all steps for a build project
 * Use query param:
 * - /steps?projectId=xxxx
 */
homeBuilderRouter.get("/steps", checkAuth, getBuildStepsByProjectId);

/**
 * Add a new step to a build project
 * Expects JSON body:
 * - projectId
 * - stepType
 * - title (optional)
 * - data (object, optional)
 */
homeBuilderRouter.post("/steps/add", checkAuth, addBuildStepToProject);

/**
 * Update a specific step
 * Expects JSON body:
 * - stepId
 * - fields to update (status, notes, costAmount, data, etc.)
 */
homeBuilderRouter.patch("/steps/update", checkAuth, updateBuildStepByStepId);

/**
 * Upload photos to a specific step
 * Expects multipart/form-data:
 * - stepId (string) in req.body
 * - stepPhotos (0..8 files)
 */
homeBuilderRouter.post(
  "/steps/photos/upload",
  checkAuth,
  uploadPhotosToBuildStepByStepId
);

export default homeBuilderRouter;

