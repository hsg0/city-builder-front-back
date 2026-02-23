import express from "express";
import { checkAuth } from "../../middleware/authMiddleware.js";
import {
  register,
  login,
  logout,

  // Email verification
  sendEmailVerificationOtp,
  confirmEmailVerificationOtp,

  // Reset password 3-step flow
  sendResetPasswordEmail,
  verifyResetPasswordOtp,
  resetPassword,

  // Auth checks / user info
  isUserAuthenticated,
  getUserInfoAfterAuthentication,

  // Expo push token
  saveExpoPushToken,
  removeExpoPushToken,
} from "../../controllers/authcontrollers/auth.js";

const authRouter = express.Router();

// ✅ Basic auth
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);

// ✅ Reset password 3-step flow (public — no auth needed)
authRouter.post("/send-reset-password-email", sendResetPasswordEmail);
authRouter.post("/verify-reset-password-otp", verifyResetPasswordOtp);
authRouter.post("/reset-password", resetPassword);

// ✅ Email verification (requires being logged in)
authRouter.post("/send-email-verification-otp", checkAuth, sendEmailVerificationOtp);
authRouter.post("/confirm-email-verification-otp", checkAuth, confirmEmailVerificationOtp);

// ✅ User info (requires being logged in)
authRouter.get("/get-user-info", checkAuth, getUserInfoAfterAuthentication);
authRouter.get("/authenticated-user-info", checkAuth, isUserAuthenticated);

// ✅ Expo push token (requires being logged in)
authRouter.post("/expo-push-token", checkAuth, saveExpoPushToken);
authRouter.delete("/expo-push-token", checkAuth, removeExpoPushToken);

export default authRouter;