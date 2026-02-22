import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { selectIsLoggedIn } from "../../reduxToolKit/reduxState/globalState/authSelectors";
// If you don’t have authSelectors yet, I’ll show you below.

export default function PrivacyOverlayWatcher({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const isLoggedIn = useSelector(selectIsLoggedIn);

  const lastNonOverlayPathRef = useRef("/");

  useEffect(() => {
    // Remember last “real” screen so we can return after overlay
    if (pathname && pathname !== "/(security)/overlay") {
      lastNonOverlayPathRef.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      // When app is backgrounding / app switcher → show overlay
      if (nextState === "inactive" || nextState === "background") {
        if (pathname !== "/(security)/overlay") {
          router.replace("/(security)/overlay");
        }
        return;
      }

      // Coming back to foreground
      if (nextState === "active") {
        // If user is logged out, do NOT return back (go to login)
        if (!isLoggedIn) {
          router.replace("/(security)/(public)/login");
          return;
        }

        // If logged in, return to last screen
        const lastPath = lastNonOverlayPathRef.current || "/";
        if (pathname === "/(security)/overlay") {
          router.replace(lastPath);
        }
      }
    });

    return () => subscription.remove();
  }, [router, pathname, isLoggedIn]);

  return children;
}