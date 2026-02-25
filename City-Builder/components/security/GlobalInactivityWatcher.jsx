// components/security/GlobalInactivityWatcher.jsx
import { useEffect, useRef, useCallback } from "react";
import { AppState, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { usePathname, useRouter } from "expo-router";

import { markActive } from "../../reduxToolKit/reduxState/globalState/activitySlice";
import { logout } from "../../reduxToolKit/reduxState/globalState/authSlice";
import { selectTimeoutMs } from "../../reduxToolKit/reduxState/globalState/activitySelectors";

export default function GlobalInactivityWatcher({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const timeoutMs = useSelector(selectTimeoutMs);

  const inactivityTimerRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // ── Use a ref for pathname so the timer callback never holds a stale value ──
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const startInactivityTimer = useCallback(() => {
    clearInactivityTimer();

    inactivityTimerRef.current = setTimeout(() => {
      dispatch(logout());
      // Read current pathname from ref — always fresh
      if (pathnameRef.current !== "/login") {
        router.replace("/(security)/(public)/login");
      }
    }, timeoutMs);
  }, [clearInactivityTimer, dispatch, router, timeoutMs]);
  // ↑ pathname removed from deps — read from pathnameRef inside the timer

  const resetInactivityTimer = useCallback(() => {
    // Only track inactivity while app is active
    if (appStateRef.current !== "active") return;

    dispatch(markActive());
    startInactivityTimer();
  }, [dispatch, startInactivityTimer]);

  useEffect(() => {
    // Start timer on mount
    startInactivityTimer();

    const subscription = AppState.addEventListener("change", (nextState) => {
      appStateRef.current = nextState;

      // If app leaves active state, pause timer (do NOT logout)
      if (nextState !== "active") {
        clearInactivityTimer();
        return;
      }

      // App became active again -> restart timer
      startInactivityTimer();
    });

    return () => {
      clearInactivityTimer();
      subscription.remove();
    };
  }, [clearInactivityTimer, startInactivityTimer]);

  // ✅ Does NOT block ScrollView drag gestures
  return (
    <View
      style={{ flex: 1 }}
      onTouchStartCapture={resetInactivityTimer}
      onTouchMoveCapture={resetInactivityTimer}
    >
      {children}
    </View>
  );
}