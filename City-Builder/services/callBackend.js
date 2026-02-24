// City-Builder/services/callBackend.js
// ─────────────────────────────────────────────────────────────────────
// Central axios instance for ALL backend API calls.
// Auth token is automatically attached from SecureStore on every request.
// ─────────────────────────────────────────────────────────────────────
import axios from "axios";
import { getToken } from "./secureStore";

// ── Base URL (ngrok tunnel → backend) ──────────────────────────────
const BASE_URL = "https://edf0-192-157-102-137.ngrok-free.app";

const callBackend = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach auth token automatically ───────────
callBackend.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn("[callBackend] Could not retrieve token:", err?.message);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: normalise errors ─────────────────────────
callBackend.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log concise info for debugging
    if (__DEV__) {
      const status = error?.response?.status;
      const msg = error?.response?.data?.message || error?.message;
      console.warn(`[callBackend] ${error?.config?.method?.toUpperCase()} ${error?.config?.url} → ${status ?? "NETWORK"}: ${msg}`);
    }
    return Promise.reject(error);
  }
);

// ── Helper: extract a readable error message from any axios error ──
export const extractErrorMessage = (error, fallback = "Something went wrong.") => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return fallback;
};

export default callBackend;
