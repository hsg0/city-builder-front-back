import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { selectIsLoggedIn } from "../../reduxToolKit/reduxState/globalState/authSelectors";

export default function PrivacyOverlayWatcher({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoggedIn = useSelector(selectIsLoggedIn);

  const lastNonOverlayPathRef = useRef("/");

  // Track whether THIS watcher actually navigated to overlay
  const overlayWasShownByWatcherRef = useRef(false);

  useEffect(() => {
    // Remember last “real” screen so we can return after overlay
    if (pathname && pathname !== "/(security)/overlay") {
      lastNonOverlayPathRef.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      console.log("PrivacyOverlayWatcher => AppState:", nextState, "pathname:", pathname);

      // Only show overlay when app goes to background.
      // Do NOT trigger on "inactive" — iOS permission prompts fire "inactive".
      if (nextState === "background") {
        if (pathname !== "/(security)/overlay") {
          console.log("PrivacyOverlayWatcher => navigating to overlay");
          overlayWasShownByWatcherRef.current = true;
          router.replace("/(security)/overlay");
        }
        return;
      }

      // Coming back to foreground
      if (nextState === "active") {
        // If user is logged out, go to login
        if (!isLoggedIn) {
          console.log("PrivacyOverlayWatcher => not logged in, going to login");
          overlayWasShownByWatcherRef.current = false;
          router.replace("/(security)/(public)/login");
          return;
        }

        // If we showed overlay, always restore (don't rely on pathname being updated)
        if (overlayWasShownByWatcherRef.current) {
          const lastPath = lastNonOverlayPathRef.current || "/";
          console.log("PrivacyOverlayWatcher => restoring to:", lastPath);
          overlayWasShownByWatcherRef.current = false;
          router.replace(lastPath);
        }
      }
    });

    return () => subscription.remove();
  }, [router, pathname, isLoggedIn]);

  return children;
}