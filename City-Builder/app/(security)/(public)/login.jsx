// City-Builder/app/(security)/(public)/login.jsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import { authSuccess } from "../../../reduxToolKit/reduxState/globalState/authSlice";
import { apiLogin, extractErrorMessage } from "../../../services/authApi";
import { useTheme } from "../../../wrappers/providers/ThemeContext";

export default function Login() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const safeAreaInsets = useSafeAreaInsets();

  const [email, setEmail] = useState("hsg_001@yahoo.com");
  const [password, setPassword] = useState("123456");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const styles = useMemo(() => {
    const cardBackground = theme.colors.cardBackground || theme.colors.surface;
    const bottomTabsSpace = safeAreaInsets.bottom + 95;

    // put near the top of styles useMemo (inside)
    const SOLID_BLUE = "#2E78FF"; // close to your screenshot blue
    const FIELD_RADIUS = 18; // rounded pill feel
    const FIELD_PY = 16; // makes it tall like your screenshot
    const FIELD_PX = 16;

    return {
      screen: { flex: 1, backgroundColor: theme.colors.background },

      container: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: bottomTabsSpace,
        alignSelf: "center",
        width: "100%",
        maxWidth: 520,
      },

      header: { marginBottom: 14 },
      eyebrow: {
        color: theme.colors.primary,
        opacity: 0.75,
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 1.3,
      },
      title: {
        color: theme.colors.primary,
        fontSize: 44,
        fontWeight: "900",
        marginTop: 6,
        lineHeight: 48,
      },
      subtitle: {
        color: theme.colors.textSecondary,
        marginTop: 10,
        fontSize: 15,
        lineHeight: 22,
      },

      card: {
        backgroundColor: cardBackground,
        borderRadius: 24,
        padding: 18,
        marginTop: 10,
        borderWidth: 1,
        borderColor: `${theme.colors.border}55`,
        ...Platform.select({
          ios: {
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
          },
          android: { elevation: 6 },
        }),
      },

      cardTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
      },
      accentBar: {
        width: 4,
        height: 22,
        borderRadius: 999,
        backgroundColor: theme.colors.primary,
        marginRight: 10,
      },
      cardTitle: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: "900",
      },

      field: { marginTop: 12 },
      label: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 0.5,
      },

      // ✅ INPUT (same sizing)
      input: {
        marginTop: 8,
        width: "100%",
        borderRadius: FIELD_RADIUS,
        paddingHorizontal: FIELD_PX,
        paddingVertical: FIELD_PY,
        fontSize: 15,
        color: theme.colors.text,
        backgroundColor: `${theme.colors.primary}0D`,
        borderWidth: 1,
        borderColor: `${theme.colors.primary}22`,
      },

      // ✅ LOGIN BUTTON (same sizing as input, but solid blue)
      loginButton: {
        marginTop: 12,
        width: "100%",
        borderRadius: FIELD_RADIUS,
        paddingHorizontal: FIELD_PX,
        paddingVertical: FIELD_PY,
        backgroundColor: SOLID_BLUE,
        alignItems: "center",
        justifyContent: "center",
      },

      loginButtonText: {
        color: "black", // like your screenshot
        fontSize: 15,
        fontWeight: "900",
      },

      errorBox: {
        marginTop: 12,
        padding: 12,
        borderRadius: 16,
        backgroundColor: `${theme.colors.error}12`,
        borderWidth: 1,
        borderColor: `${theme.colors.error}35`,
      },
      errorText: { color: theme.colors.error, fontSize: 13, fontWeight: "800" },

      // ✅ Links row moved LOWER
      linkRow: {
        marginTop: 18, // pushed further down
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      },

      link: { color: theme.colors.primary, fontSize: 13, fontWeight: "900" },

      footerHint: {
        marginTop: 14,
        textAlign: "center",
        color: theme.colors.textSecondary,
        fontSize: 12,
        lineHeight: 18,
      },
    };
  }, [theme, safeAreaInsets.bottom]);

  const onLoginPress = async () => {
    setErrorMessage("");

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    try {
      setIsSubmitting(true);

      const data = await apiLogin(trimmedEmail, password);

      // Store user + token in Redux
      dispatch(authSuccess({ user: data.user, token: data.token }));

      router.replace("/(security)/(private)/dashboard");
    } catch (error) {
      setErrorMessage(extractErrorMessage(error, "Login failed. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.eyebrow}>WELCOME BACK</Text>
            <Text style={styles.title}>Login</Text>
            <Text style={styles.subtitle}>
              Sign in to manage projects, upload progress photos, and share
              updates with clients.
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <View style={styles.accentBar} />
              <Text style={styles.cardTitle}>Your account</Text>
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                style={styles.input}
                editable={!isSubmitting}
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                style={styles.input}
                editable={!isSubmitting}
                returnKeyType="done"
                onSubmitEditing={onLoginPress}
              />
            </View>

            {/* ✅ BLUE OUTLINE Login button directly under password */}
            <Pressable
              onPress={onLoginPress}
              disabled={isSubmitting}
              className="mt-3 w-full rounded-[18px] border-2 border-blue-500 px-4 py-4 items-center justify-center"
              style={({ pressed }) => ({
                opacity: isSubmitting ? 0.6 : pressed ? 0.85 : 1,
              })}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#2E78FF" size="small" />
              ) : (
                <Text className="text-center text-base font-black text-blue-500">LOGIN</Text>
              )}
            </Pressable>

            {!!errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* ✅ Links row: Forgot left, Create Account right */}
            <View style={styles.linkRow}>
              <Pressable
                onPress={() => router.push("/(security)/(public)/resetpassword")}
                disabled={isSubmitting}
              >
                <Text style={styles.link}>Forgot password?</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/(security)/(public)/register")}
                disabled={isSubmitting}
              >
                <Text style={styles.link}>Create Account</Text>
              </Pressable>
            </View>

            <Text style={styles.footerHint}>
              Tip: Keep your project timeline updated — clients love seeing
              progress in real time.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}