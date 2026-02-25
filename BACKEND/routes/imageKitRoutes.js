// BACKEND/routes/imageKitRoutes.js

import express from "express";
import { checkAuth } from "../middleware/authMiddleware.js";
import { getImageKitUploadAuth } from "../controllers/imageKitController.js";

const imageKitRouter = express.Router();

console.log('[imageKitRoutes.js] ✅ imageKitRouter created');

// Require auth so only logged-in users can request upload auth
imageKitRouter.get("/auth", (req, res, next) => {
  console.log('[imageKitRoutes.js] ➡️  GET /auth handler entered');
  next();
}, checkAuth, getImageKitUploadAuth);

export default imageKitRouter;