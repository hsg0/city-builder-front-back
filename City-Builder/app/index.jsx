// /app/index.jsx
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../wrappers/providers/ThemeContext";
import { useSelector } from "react-redux";
import { selectIsInactive } from "../reduxToolKit/reduxState/globalState/activitySelectors";
import {
  selectHeight,
  selectWidth,
  selectBreakpoint,
  selectOrientation,
  selectIsTablet,
} from "../reduxToolKit/reduxState/globalState/screenSelectors";

export default function Index() {
  const router = useRouter();
  const { theme } = useTheme();
  
  // Get screen dimensions from Redux
  const height = useSelector(selectHeight);
  const width = useSelector(selectWidth);
  const isTablet = useSelector(selectIsTablet);
  const orientation = useSelector(selectOrientation);
  
  // Calculate responsive values
  const isPortrait = orientation === "portrait";
  const isMobile = width < 768;
  const containerPadding = isMobile ? 16 : 24;
  const titleSize = isTablet ? "text-6xl" : "text-5xl";
  const subtitleSize = isTablet ? "text-lg" : "text-base";
  const sectionSpacing = isTablet ? "mb-12" : "mb-8";
  const cardPadding = isTablet ? "p-8" : "p-6";

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View className="flex-1" style={{ paddingHorizontal: containerPadding, paddingTop: 24, paddingBottom: 32 }}>
        {/* Header with gradient effect */}
        <View className={`flex-row items-start justify-between ${sectionSpacing}`}>
          <View className="flex-1 pr-4">
            <Text className="text-sm font-semibold opacity-60" style={{ color: theme.colors.primary }}>
              BUILD WITH PRECISION
            </Text>
            <Text
              className={`font-bold mt-2 ${titleSize}`}
              style={{ color: theme.colors.primary }}
            >
              City Builder
            </Text>

            <Text
              className={`mt-3 leading-6 font-500 ${subtitleSize}`}
              style={{ color: theme.colors.textSecondary }}
            >
              Track every step. Share progress. Sell faster.
            </Text>
          </View>

          {/* Top-right theme toggle */}
          <View className="mt-1">
            <ThemeToggle />
          </View>
        </View>

        {/* Stats bar */}
        <View className={`flex-row justify-between gap-3 ${sectionSpacing}`} style={{ flexWrap: isMobile ? "wrap" : "nowrap" }}>
          <StatCard label="Projects" value="0" isTablet={isTablet} />
          <StatCard label="Photos" value="0" isTablet={isTablet} />
          <StatCard label="Clients" value="0" isTablet={isTablet} />
        </View>

        {/* What it does - Enhanced */}
        <View className={`rounded-3xl ${cardPadding} ${sectionSpacing}`} style={{ backgroundColor: theme.colors.cardBackground }}>
          <View className="mb-4 flex-row items-center">
            <View className="w-1 h-6 rounded-full mr-3" style={{ backgroundColor: theme.colors.primary }} />
            <Text className={`font-bold ${isTablet ? "text-2xl" : "text-xl"}`} style={{ color: theme.colors.text }}>
              Why City Builder
            </Text>
          </View>

          <View className={`gap-4 mt-4 ${isTablet ? "flex-row flex-wrap" : ""}`}>
            <Feature
              icon="📍"
              title="Track every build step"
              desc="Foundation → Framing → Plumbing → Drywall → Finish"
              isTablet={isTablet}
            />
            <Feature
              icon="📸"
              title="Take photos on site"
              desc="Capture progress at each phase and store in secure database"
              isTablet={isTablet}
            />
            <Feature
              icon="👥"
              title="Share with clients"
              desc="Private client view for real-time updates without texts"
              isTablet={isTablet}
            />
            <Feature
              icon="🏠"
              title="Sell the home in-app"
              desc="Convert completed projects into listings with full history"
              isTablet={isTablet}
            />
          </View>
        </View>

        {/* Quick stats section */}
        <View className={`rounded-2xl p-4 ${sectionSpacing}`} style={{ backgroundColor: `${theme.colors.primary}15` }}>
          <Text className="text-sm font-semibold opacity-75" style={{ color: theme.colors.primary }}>
            💡 Pro Tip
          </Text>
          <Text className={`mt-2 leading-5 ${subtitleSize}`} style={{ color: theme.colors.text }}>
            Upload photos at each stage to build a complete timeline. Buyers love seeing the journey.
          </Text>
        </View>

        {/* Primary actions */}
        <View className="gap-3 mt-auto">
          <Pressable
            onPress={() => console.log("Start a new build pressed")}
            className="rounded-2xl items-center active:opacity-75"
            style={{ 
              backgroundColor: theme.colors.primary,
              paddingVertical: isTablet ? 20 : 16
            }}
          >
            <Text className={`text-black font-bold ${isTablet ? "text-lg" : "text-base"}`}>
              ✨ Start a New Build
            </Text>
          </Pressable>

          <Pressable
            onPress={() => console.log("View demo project pressed")}
            className="rounded-2xl items-center active:opacity-75"
            style={{
              backgroundColor: "transparent",
              borderWidth: 2,
              borderColor: theme.colors.primary,
              paddingVertical: isTablet ? 20 : 16
            }}
          >
            <Text className={`font-semibold ${isTablet ? "text-lg" : "text-base"}`} style={{ color: theme.colors.primary }}>
              👀 View Demo Project
            </Text>
          </Pressable>

          <Text className={`text-center leading-5 ${isTablet ? "text-sm" : "text-xs"}`} style={{ color: theme.colors.textSecondary, marginTop: 16 }}>
            Next: Login • Projects • Photo Upload • Client Sharing
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, isTablet }) {
  const { theme } = useTheme();
  return (
    <View
      className={`flex-1 rounded-2xl items-center ${isTablet ? "p-6" : "p-4"}`}
      style={{ backgroundColor: theme.colors.cardBackground }}
    >
      <Text className={`font-bold ${isTablet ? "text-3xl" : "text-2xl"}`} style={{ color: theme.colors.primary }}>
        {value}
      </Text>
      <Text className={`mt-1 ${isTablet ? "text-sm" : "text-xs"}`} style={{ color: theme.colors.textSecondary }}>
        {label}
      </Text>
    </View>
  );
}

function Feature({ icon, title, desc, isTablet }) {
  const { theme } = useTheme();
  return (
    <View className={`flex-row gap-3 ${isTablet ? "w-1/2 pr-4 mb-4" : ""}`}>
      <Text className={`${isTablet ? "text-3xl" : "text-2xl"}`}>{icon}</Text>
      <View className="flex-1">
        <Text className={`font-semibold ${isTablet ? "text-lg" : "text-base"}`} style={{ color: theme.colors.text }}>
          {title}
        </Text>
        <Text className={`mt-1 leading-5 ${isTablet ? "text-sm" : "text-xs"}`} style={{ color: theme.colors.textSecondary }}>
          {desc}
        </Text>
      </View>
    </View>
  );
}
