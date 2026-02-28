// /app/index.jsx
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";

import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../wrappers/providers/ThemeContext";

import {
  selectWidth,
  selectIsTablet,
  selectOrientation,
} from "../reduxToolKit/reduxState/globalState/screenSelectors";

export default function Index() {
  const router = useRouter();
  const { theme } = useTheme();
  const safeAreaInsets = useSafeAreaInsets();

  const screenWidth = useSelector(selectWidth);
  const isTablet = useSelector(selectIsTablet);
  const orientation = useSelector(selectOrientation);

  const isLandscape = orientation === "landscape";
  const isSmallPhone = screenWidth < 380;

  // --- Layout rules (simple + consistent)
  const horizontalPadding = isTablet ? 28 : isSmallPhone ? 16 : 20;

  // Keep content from stretching too wide on iPad / large screens
  const maxContentWidth = isTablet ? (isLandscape ? 900 : 720) : "100%";

  // Typography using numbers for nicer scaling
  const titleFontSize = isTablet ? (isLandscape ? 56 : 52) : isSmallPhone ? 40 : 46;
  const subtitleFontSize = isTablet ? 18 : 16;

  // Cards / spacing
  const sectionGap = isTablet ? 18 : 14;
  const cardPadding = isTablet ? 22 : 18;

  // Stats layout
  const statsPerRow = isTablet ? 3 : 2; // 2 on phones, 3 on tablet
  const statsCardWidth =
    statsPerRow === 3 ? "33.33%" : "50%"; // controlled wrap

  // Features layout
  const featuresTwoColumns = isTablet; // tablet => 2 cols, phone => 1 col
  const featureCardWidth = featuresTwoColumns ? "50%" : "100%";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: safeAreaInsets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            alignSelf: "center",
            width: "100%",
            maxWidth: maxContentWidth,
            paddingHorizontal: horizontalPadding,
            paddingTop: isTablet ? 26 : 22,
            paddingBottom: isTablet ? 32 : 26,
          }}
        >
          {/* Header */}
          <View
            style={{
              marginBottom: isTablet ? 26 : 20,
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text
                style={{
                  color: theme.colors.primary,
                  opacity: 0.7,
                  fontSize: 12,
                  fontWeight: "700",
                  letterSpacing: 1.4,
                }}
              >
                BUILD WITH PRECISION
              </Text>

              <Text
                style={{
                  color: theme.colors.primary,
                  fontSize: titleFontSize,
                  fontWeight: "800",
                  marginTop: 6,
                  lineHeight: titleFontSize + 6,
                }}
                numberOfLines={2}
              >
                City Builder
              </Text>

              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: subtitleFontSize,
                  marginTop: 10,
                  lineHeight: subtitleFontSize + 8,
                }}
              >
                Track every step. Share progress. Sell faster.
              </Text>
            </View>

            {/* Theme toggle */}
            <View style={{ marginTop: 2 }}>
              <ThemeToggle />
            </View>
          </View>

          {/* Stats */}
          {/* <View
            style={{
              marginBottom: isTablet ? 26 : 18,
              flexDirection: "row",
              flexWrap: "wrap",
              marginHorizontal: -6,
              rowGap: 12,
            }}
          >
            <View style={{ width: statsCardWidth, paddingHorizontal: 6 }}>
              <StatCard label="Projects" value="0" />
            </View>

            <View style={{ width: statsCardWidth, paddingHorizontal: 6 }}>
              <StatCard label="Photos" value="0" />
            </View>

            <View
              style={{
                width: isTablet ? statsCardWidth : "100%",
                paddingHorizontal: 6,
              }}
            >
              <StatCard label="Clients" value="0" />
            </View>
          </View> */}

          {/* Main card */}
          <View
            style={{
              backgroundColor: theme.colors.cardBackground,
              borderRadius: 24,
              padding: cardPadding,
              marginBottom: isTablet ? 22 : 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <View
                style={{
                  width: 4,
                  height: 26,
                  borderRadius: 999,
                  backgroundColor: theme.colors.primary,
                  marginRight: 10,
                }}
              />
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: isTablet ? 22 : 20,
                  fontWeight: "800",
                }}
              >
                Why City Builder
              </Text>
            </View>

            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: isTablet ? 15 : 14,
                lineHeight: isTablet ? 22 : 20,
                marginBottom: 14,
              }}
            >
              A friendly progress dashboard for home builders — keep clients
              updated with photos, timelines, and milestones.
            </Text>

            {/* Features grid */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                marginHorizontal: -8,
                rowGap: sectionGap,
              }}
            >
              <View style={{ width: featureCardWidth, paddingHorizontal: 8 }}>
                <Feature
                  icon="📍"
                  title="Track every build step"
                  desc="Foundation → Framing → Plumbing → Drywall → Finish"
                />
              </View>

              <View style={{ width: featureCardWidth, paddingHorizontal: 8 }}>
                <Feature
                  icon="📸"
                  title="Take photos on site"
                  desc="Capture progress at each phase and store it securely."
                />
              </View>

              <View style={{ width: featureCardWidth, paddingHorizontal: 8 }}>
                <Feature
                  icon="👥"
                  title="Share with clients"
                  desc="Private client view for real-time updates without texting."
                />
              </View>

              <View style={{ width: featureCardWidth, paddingHorizontal: 8 }}>
                <Feature
                  icon="🏠"
                  title="Sell the home in-app"
                  desc="Turn builds into listings with full photo history."
                />
              </View>
            </View>
          </View>

          {/* Tip card */}
          <View
            style={{
              borderRadius: 18,
              padding: 14,
              marginBottom: isTablet ? 22 : 16,
              backgroundColor: `${theme.colors.primary}15`,
            }}
          >
            <Text
              style={{
                color: theme.colors.primary,
                fontSize: 13,
                fontWeight: "800",
                opacity: 0.9,
              }}
            >
              💡 Pro Tip
            </Text>
            <Text
              style={{
                color: theme.colors.text,
                marginTop: 6,
                fontSize: isTablet ? 15 : 14,
                lineHeight: isTablet ? 22 : 20,
              }}
            >
              Upload photos at each stage to build a complete timeline. Buyers
              love seeing the journey.
            </Text>
          </View>

          {/* Actions */}
          <View style={{ gap: 12, marginTop: 10 }}>
            <Pressable
              onPress={() => router.push("/(security)/(public)/login")}
              style={{
                backgroundColor: theme.colors.primary,
                borderRadius: 16,
                paddingVertical: isTablet ? 18 : 15,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "black",
                  fontWeight: "800",
                  fontSize: isTablet ? 17 : 15,
                }}
              >
                ✨Build
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(appDemo)/demo")}
              style={{
                borderRadius: 16,
                paddingVertical: isTablet ? 18 : 15,
                alignItems: "center",
                borderWidth: 2,
                borderColor: theme.colors.primary,
                backgroundColor: "transparent",
              }}
            >
              <Text
                style={{
                  color: theme.colors.primary,
                  fontWeight: "800",
                  fontSize: isTablet ? 17 : 15,
                }}
              >
                👀 View Demo Project
              </Text>
            </Pressable>

            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: isTablet ? 13 : 12,
                textAlign: "center",
                marginTop: 8,
                lineHeight: 18,
              }}
            >
              Next: Login • Projects • Photo Upload • Client Sharing
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value }) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.colors.cardBackground,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 14,
        alignItems: "center",
      }}
    >
      <Text style={{ color: theme.colors.primary, fontWeight: "900", fontSize: 26 }}>
        {value}
      </Text>
      <Text style={{ color: theme.colors.textSecondary, marginTop: 4, fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );
}

function Feature({ icon, title, desc }) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        backgroundColor: `${theme.colors.primary}0D`,
        borderRadius: 16,
        padding: 14,
        flexDirection: "row",
        gap: 12,
      }}
    >
      <Text style={{ fontSize: 26 }}>{icon}</Text>

      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.text, fontWeight: "800", fontSize: 15 }}>
          {title}
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            marginTop: 4,
            fontSize: 13,
            lineHeight: 18,
          }}
        >
          {desc}
        </Text>
      </View>
    </View>
  );
}