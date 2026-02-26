// City-Builder/services/authApi.js
import axios from "axios";

const BASE_URL = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/auth`;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ── Helper: extract readable error message from axios response ──
const extractErrorMessage = (error, fallback = "Something went wrong.") => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return fallback;
};

// ── Public auth endpoints ──────────────────────────────────────

export const apiLogin = async (email, password) => {
  const response = await api.post("/login", { email, password });
  return response.data; // { success, message, token, user }
};

export const apiRegister = async (name, email, password) => {
  const response = await api.post("/register", { name, email, password });
  return response.data; // { success, message, user }
};

export const apiSendResetPasswordEmail = async (email) => {
  const response = await api.post("/send-reset-password-email", { email });
  return response.data; // { success, message }
};

export const apiVerifyResetPasswordOtp = async (email, resetPasswordOTP) => {
  const response = await api.post("/verify-reset-password-otp", {
    email,
    resetPasswordOTP,
  });
  return response.data; // { success, message }
};

export const apiResetPassword = async (email, resetPasswordOTP, newPassword) => {
  const response = await api.post("/reset-password", {
    email,
    resetPasswordOTP,
    newPassword,
  });
  return response.data; // { success, message }
};

// ── Authenticated endpoints (pass token in header) ─────────────

export const apiGetUserInfo = async (token) => {
  const response = await api.get("/get-user-info", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const apiLogout = async (token) => {
  const response = await api.post(
    "/logout",
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const apiSaveExpoPushToken = async (token, expoPushToken) => {
  const response = await api.post(
    "/expo-push-token",
    { expoPushToken },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const apiRemoveExpoPushToken = async (token) => {
  const response = await api.delete("/expo-push-token", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export { extractErrorMessage };
export default api;
