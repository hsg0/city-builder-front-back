// City-Builder/app/(security)/(public)/register.jsx
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
import { apiRegister, extractErrorMessage } from "../../../services/authApi";
import { useTheme } from "../../../wrappers/providers/ThemeContext";

export default function Register() {
  const expoRouter = useRouter();
  const { theme } = useTheme();
  const safeAreaInsets = useSafeAreaInsets();

  const [fullName, setFullName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [confirmPasswordValue, setConfirmPasswordValue] = useState("");

  const [isSubmittingRegistration, setIsSubmittingRegistration] = useState(false);
  const [errorMessageText, setErrorMessageText] = useState("");

  const styles = useMemo(() => {
    const cardBackground = theme.colors.cardBackground || theme.colors.surface;
    const bottomTabsSpace = safeAreaInsets.bottom + 95;

    const SOLID_BLUE = "#2E78FF";
    const FIELD_RADIUS = 18;
    const FIELD_PY = 16;
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

      errorBox: {
        marginTop: 12,
        padding: 12,
        borderRadius: 16,
        backgroundColor: `${theme.colors.error}12`,
        borderWidth: 1,
        borderColor: `${theme.colors.error}35`,
      },
      errorText: { color: theme.colors.error, fontSize: 13, fontWeight: "800" },

      linkRow: {
        marginTop: 18,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      },
      link: { color: theme.colors.primary, fontSize: 13, fontWeight: "900" },

      // used only for activity indicator color consistency
      SOLID_BLUE,
    };
  }, [theme, safeAreaInsets.bottom]);

  const onRegisterPress = async () => {
    setErrorMessageText("");

    const trimmedFullName = fullName.trim();
    const trimmedEmailAddress = emailAddress.trim().toLowerCase();

    if (!trimmedFullName || !trimmedEmailAddress || !passwordValue || !confirmPasswordValue) {
      setErrorMessageText("Please fill in all fields.");
      return;
    }

    if (passwordValue.length < 6) {
      setErrorMessageText("Password must be at least 6 characters.");
      return;
    }

    if (passwordValue !== confirmPasswordValue) {
      setErrorMessageText("Passwords do not match.");
      return;
    }

    try {
      setIsSubmittingRegistration(true);

      await apiRegister(trimmedFullName, trimmedEmailAddress, passwordValue);

      // After successful registration, send them to login
      expoRouter.replace("/(security)/(public)/login");
    } catch (registrationRequestError) {
      console.log("onRegisterPress error:", registrationRequestError);
      setErrorMessageText(
        extractErrorMessage(registrationRequestError, "Register failed. Please try again.")
      );
    } finally {
      setIsSubmittingRegistration(false);
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
            <Text style={styles.eyebrow}>WELCOME</Text>
            <Text style={styles.title}>Register</Text>
            <Text style={styles.subtitle}>
              Create your account to manage projects, upload progress photos, and share updates with clients.
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <View style={styles.accentBar} />
              <Text style={styles.cardTitle}>Create account</Text>
            </View>

            {/* ✅ Name (above Email) */}
            <View style={styles.field}>
              <Text style={styles.label}>NAME</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your name"
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="name"
                style={styles.input}
                editable={!isSubmittingRegistration}
                returnKeyType="next"
              />
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                value={emailAddress}
                onChangeText={setEmailAddress}
                placeholder="you@example.com"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                style={styles.input}
                editable={!isSubmittingRegistration}
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                value={passwordValue}
                onChangeText={setPasswordValue}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                style={styles.input}
                editable={!isSubmittingRegistration}
                returnKeyType="next"
              />
            </View>

            {/* Confirm Password */}
            <View style={styles.field}>
              <Text style={styles.label}>CONFIRM PASSWORD</Text>
              <TextInput
                value={confirmPasswordValue}
                onChangeText={setConfirmPasswordValue}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                style={styles.input}
                editable={!isSubmittingRegistration}
                returnKeyType="done"
                onSubmitEditing={onRegisterPress}
              />
            </View>

            {/* ✅ REGISTER button (same style as your Login button) */}
            <Pressable
              onPress={onRegisterPress}
              disabled={isSubmittingRegistration}
              className="mt-3 w-full rounded-[18px] border-2 border-blue-500 px-4 py-4 items-center justify-center"
              style={({ pressed }) => ({
                opacity: isSubmittingRegistration ? 0.6 : pressed ? 0.85 : 1,
              })}
            >
              {isSubmittingRegistration ? (
                <ActivityIndicator color={styles.SOLID_BLUE} size="small" />
              ) : (
                <Text className="text-center text-base font-black text-blue-500">
                  REGISTER
                </Text>
              )}
            </Pressable>

            {!!errorMessageText && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessageText}</Text>
              </View>
            )}

            {/* Links row */}
            <View style={styles.linkRow}>
              <Pressable
                onPress={() => expoRouter.push("/(security)/(public)/login")}
                disabled={isSubmittingRegistration}
              >
                <Text style={styles.link}>Login</Text>
              </Pressable>

              <Pressable
                onPress={() => expoRouter.push("/(security)/(public)/resetpassword")}
                disabled={isSubmittingRegistration}
              >
                <Text style={styles.link}>Reset password</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}