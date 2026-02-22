import { useEffect, useRef } from "react";
import { AppState, Pressable, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { usePathname, useRouter } from "expo-router";

import {
  markActive,
  setInactive,
} from "../../reduxToolKit/reduxState/globalState/activitySlice";
import { logout } from "../../reduxToolKit/reduxState/globalState/authSlice";
import {
  selectIsInactive,
  selectTimeoutMs,
} from "../../reduxToolKit/reduxState/globalState/activitySelectors";

// optional: if you want auto-logout
// import { logout } from "../../reduxToolKit/reduxState/globalState/authSlice";

export default function GlobalInactivityWatcher({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const isInactive = useSelector(selectIsInactive);
  const timeoutMs = useSelector(selectTimeoutMs);

  const timerRef = useRef(null);

  const resetTimer = () => {
    console.log("🕒 resetTimer()");
    dispatch(markActive());

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      console.log("⛔ Inactive timeout reached -> setInactive(true)");
      dispatch(setInactive(true));
    }, timeoutMs);
  };

  // 1) Start timer + handle app state changes (background/foreground)
  useEffect(() => {
    console.log("🌍 GlobalInactivityWatcher mounted. timeoutMs:", timeoutMs);

    resetTimer();

    const sub = AppState.addEventListener("change", (nextState) => {
      console.log("📲 AppState changed:", nextState);

      // If app goes background -> lock
      if (nextState !== "active") {
        dispatch(setInactive(true));
      }

      // When coming back active -> restart timer (you can keep locked until user unlocks)
      if (nextState === "active") {
        resetTimer();
      }
    });

    return () => {
      console.log("🧹 GlobalInactivityWatcher unmounted");
      if (timerRef.current) clearTimeout(timerRef.current);
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeoutMs]);

  // 2) When inactive becomes true -> log out and navigate to login
  useEffect(() => {
    console.log("🔐 isInactive changed:", isInactive, "current path:", pathname);

    if (isInactive) {
      dispatch(logout());

      // Prevent infinite loops if already on login
      if (pathname !== "/(security)/login") {
        router.replace("/(security)/login");
      }
    }
  }, [isInactive, pathname]);

  // 3) Capture user touches anywhere to reset timer
  return (
    <Pressable
      style={{ flex: 1 }}
      onPressIn={resetTimer}
      onTouchStart={resetTimer}
    >
      <View style={{ flex: 1 }}>{children}</View>
    </Pressable>
  );
}