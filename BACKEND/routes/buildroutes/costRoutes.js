// BACKEND/routes/buildroutes/costRoutes.js

import express from "express";
import { checkAuth } from "../../middleware/authMiddleware.js";

import { getCompletedBuildsCostOverview } from "../../controllers/buildControllers/costController.js";

const costRouter = express.Router();

/**
 * GET /api/costs/overview
 * Returns cost overview for all completed builds (aggregated totals, last step photos)
 */
costRouter.get("/overview", checkAuth, getCompletedBuildsCostOverview);

export default costRouter;
