import React, { useMemo } from "react";
import {
  Text,
  View,
  Pressable,
  ScrollView,
  Platform,
  Image,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../wrappers/providers/ThemeContext";

const LOGO_SOURCE = require("../../../assets/images/City-Builder-assets/image.png");

export default function Dashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const isSmall = screenWidth < 360;
  const isLarge = screenWidth >= 430;

  const styles = useMemo(() => {
    const horizontalPadding = isSmall ? 14 : isLarge ? 20 : 16;
    const cardBg = theme.colors.surface;
    const ACCENT_BUYER = theme.colors.primary;
    const ACCENT_BUILDER = theme.colors.success;

    return {
      screen: { flex: 1, backgroundColor: theme.colors.background },

      container: {
        flexGrow: 1,
        paddingHorizontal: horizontalPadding,
        paddingTop: 14,
        paddingBottom: 30,
        alignSelf: "center",
        width: "100%",
        maxWidth: 520,
      },

      // ── Header ──
      brandRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 10,
      },
      brandLogo: {
        width: isSmall ? 38 : isLarge ? 50 : 44,
        height: isSmall ? 38 : isLarge ? 50 : 44,
        borderRadius: isSmall ? 13 : isLarge ? 17 : 15,
      },
      brandName: {
        color: theme.colors.text,
        fontSize: isSmall ? 20 : isLarge ? 24 : 22,
        fontWeight: "900",
        letterSpacing: 0.3,
      },
      brandTagline: {
        color: theme.colors.primary,
        fontSize: isSmall ? 24 : isLarge ? 32 : 28,
        fontWeight: "900",
        marginTop: 2,
        lineHeight: isSmall ? 28 : 34,
      },
      subtitle: {
        color: theme.colors.textSecondary,
        fontSize: isSmall ? 13 : 14,
        lineHeight: 20,
        marginBottom: isSmall ? 8 : 12,
      },

      // ── Card ──
      card: {
        backgroundColor: cardBg,
        borderRadius: 24,
        padding: isSmall ? 14 : 18,
        marginTop: 14,
        borderWidth: 1,
        borderColor: `${theme.colors.border}55`,
        ...Platform.select({
          ios: {
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
          },
          android: { elevation: 4 },
        }),
      },
      cardHeaderRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
      },
      iconBadgeBuyer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: ACCENT_BUYER,
        backgroundColor: `${ACCENT_BUYER}14`,
        alignItems: "center",
        justifyContent: "center",
      },
      iconBadgeBuilder: {
        width: 44,
        height: 44,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: ACCENT_BUILDER,
        backgroundColor: `${ACCENT_BUILDER}14`,
        alignItems: "center",
        justifyContent: "center",
      },
      cardTitle: {
        color: theme.colors.text,
        fontSize: isSmall ? 16 : 17,
        fontWeight: "900",
        marginBottom: 4,
      },
      cardDesc: {
        color: theme.colors.textSecondary,
        fontSize: isSmall ? 12.5 : 13,
        lineHeight: 18,
      },

      // ── Bullets ──
      bulletList: { marginTop: 12, gap: 8 },
      bulletText: {
        flex: 1,
        color: theme.colors.text,
        fontSize: isSmall ? 12.5 : 13,
        lineHeight: 18,
      },

      // ── Buttons ──
      primaryButton: {
        marginTop: 14,
        height: isSmall ? 46 : 48,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        backgroundColor: ACCENT_BUYER,
      },
      primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "900",
      },
      secondaryButton: {
        marginTop: 14,
        height: isSmall ? 46 : 48,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        borderWidth: 1.5,
        borderColor: ACCENT_BUILDER,
        backgroundColor: "transparent",
      },
      secondaryButtonText: {
        color: ACCENT_BUILDER,
        fontSize: 14,
        fontWeight: "900",
      },

      // ── Footer ──
      footerNote: {
        marginTop: 18,
        fontSize: 12.5,
        lineHeight: 18,
        textAlign: "center",
        color: theme.colors.textSecondary,
      },
      debugText: {
        marginTop: 10,
        fontSize: 11,
        textAlign: "center",
        color: theme.colors.textSecondary,
        opacity: 0.6,
      },

      // ── Accent colors for inline usage ──
      accentBuyer: ACCENT_BUYER,
      accentBuilder: ACCENT_BUILDER,
    };
  }, [theme, isSmall, isLarge]);

  function navigateToBuyerDashboard() {
    router.push("/(security)/(private)/(homebuyer)/buyer");
  }

  function navigateToBuilderDashboard() {
    router.push("/(security)/(private)/(homebuilder)/builder");
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.brandRow}>
          <Image
            source={LOGO_SOURCE}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.brandName}>City Builder</Text>
            {/* <Text style={styles.brandTagline}>Choose</Text> */}
          </View>
        </View>

        <Text style={styles.subtitle}>
          Pick the mode that matches what you're doing. You can switch later.
        </Text>

        {/* ── Buyer Card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconBadgeBuyer}>
              <Ionicons name="home-outline" size={22} color={styles.accentBuyer} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Home Buyer</Text>
              <Text style={styles.cardDesc}>
                Track home upkeep and store what's behind the walls.
              </Text>
            </View>
          </View>

          <View style={styles.bulletList}>
            <BulletItem
              icon="checkmark-circle-outline"
              color={styles.accentBuyer}
              text="Maintenance log for roof, plumbing, HVAC, appliances"
              textStyle={styles.bulletText}
            />
            <BulletItem
              icon="checkmark-circle-outline"
              color={styles.accentBuyer}
              text="Save manuals, receipts, warranties, and contacts"
              textStyle={styles.bulletText}
            />
          </View>

          <Pressable
            onPress={navigateToBuyerDashboard}
            style={({ pressed }) => [
              styles.primaryButton,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.primaryButtonText}>Continue as Buyer</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* ── Builder Card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconBadgeBuilder}>
              <Ionicons name="hammer-outline" size={22} color={styles.accentBuilder} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Home Builder</Text>
              <Text style={styles.cardDesc}>
                Track build progress and share updates with clients.
              </Text>
            </View>
          </View>

          <View style={styles.bulletList}>
            <BulletItem
              icon="checkmark-circle-outline"
              color={styles.accentBuilder}
              text="Timeline from permits → foundation → framing → finish"
              textStyle={styles.bulletText}
            />
            <BulletItem
              icon="checkmark-circle-outline"
              color={styles.accentBuilder}
              text="Photos, inspections, milestones, and client sharing"
              textStyle={styles.bulletText}
            />
          </View>

          <Pressable
            onPress={navigateToBuilderDashboard}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && { backgroundColor: `${styles.accentBuilder}14` },
            ]}
          >
            <Text style={styles.secondaryButtonText}>Continue as Builder</Text>
            <Ionicons name="arrow-forward" size={16} color={styles.accentBuilder} />
          </Pressable>
        </View>

        <Text style={styles.footerNote}>
          Tip: Buyer is for homeowners. Builder is for contractors managing client builds.
        </Text>

        <Text style={styles.debugText}>
          Screen: {Math.round(screenWidth)} × {Math.round(screenHeight)}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function BulletItem({ icon, color, text, textStyle }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={textStyle}>{text}</Text>
    </View>
  );
}
