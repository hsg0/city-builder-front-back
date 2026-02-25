// PrivacyOverlayWatcher
//
// Renders a full-screen privacy overlay ON TOP of the app when it goes to
// background.  This is done with a simple View + absolute positioning —
// **no navigation is involved**, which avoids the expo-router crash that
// occurs when you router.replace() across nested navigator boundaries.
//
// The overlay is hidden again as soon as AppState returns to "active".

import { useEffect, useState } from "react";
import { AppState, View, Image, StyleSheet } from "react-native";
import { useTheme } from "../../wrappers/providers/ThemeContext";

import splashImage from "../../assets/images/City-Builder-assets/image.png";

export default function PrivacyOverlayWatcher({ children }) {
  const { theme } = useTheme();
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      console.log("PrivacyOverlayWatcher => AppState:", nextState);

      // Show overlay only when the app is fully backgrounded.
      // "inactive" is deliberately ignored — iOS permission dialogs fire
      // "inactive" and we don't want to flash an overlay for those.
      if (nextState === "background") {
        setShowOverlay(true);
        return;
      }

      if (nextState === "active") {
        setShowOverlay(false);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.wrapper}>
      {children}

      {showOverlay && (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.overlay,
            { backgroundColor: theme.colors.background },
          ]}
          pointerEvents="none"
        >
          <Image
            source={splashImage}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  overlay: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    elevation: 9999, // Android
  },
  logo: { width: 140, height: 140 },
});