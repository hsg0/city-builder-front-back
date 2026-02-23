// City-Builder/app/(security)/(public)/resetpassword.jsx
import React, { useEffect, useMemo, useState } from "react";
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
import {
  apiSendResetPasswordEmail,
  apiVerifyResetPasswordOtp,
  apiResetPassword,
  extractErrorMessage,
} from "../../../services/authApi";
import { useTheme } from "../../../wrappers/providers/ThemeContext";

export default function ResetPassword() {
  const expoRouter = useRouter();
  const { theme } = useTheme();
  const safeAreaInsets = useSafeAreaInsets();

  // 1 = request email, 2 = enter otp, 3 = set new password
  const [resetFlowStepNumber, setResetFlowStepNumber] = useState(1);

  const [emailAddress, setEmailAddress] = useState("");
  const [oneTimePasscode, setOneTimePasscode] = useState("");

  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [confirmPasswordValue, setConfirmPasswordValue] = useState("");

  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [errorMessageText, setErrorMessageText] = useState("");
  const [successMessageText, setSuccessMessageText] = useState("");

  // ✅ 30s cooldown for Step 2 buttons (Change email / Resend OTP)
  const resendActionsCooldownTotalSeconds = 10 * 60;
  const [resendActionsSecondsRemaining, setResendActionsSecondsRemaining] =
    useState(resendActionsCooldownTotalSeconds);

  const styles = useMemo(() => {
    const cardBackgroundColor = theme.colors.cardBackground || theme.colors.surface;
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
        backgroundColor: cardBackgroundColor,
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

      successBox: {
        marginTop: 12,
        padding: 12,
        borderRadius: 16,
        backgroundColor: `${SOLID_BLUE}12`,
        borderWidth: 1,
        borderColor: `${SOLID_BLUE}35`,
      },
      successText: { color: theme.colors.text, fontSize: 13, fontWeight: "800" },

      linkRow: {
        marginTop: 18,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      },

      link: { color: theme.colors.primary, fontSize: 13, fontWeight: "900" },

      // ✅ Step 2 helper text under the links
      cooldownHintText: {
        marginTop: 10,
        textAlign: "center",
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: "800",
      },

      footerHint: {
        marginTop: 14,
        textAlign: "center",
        color: theme.colors.textSecondary,
        fontSize: 12,
        lineHeight: 18,
      },
    };
  }, [theme, safeAreaInsets.bottom]);

  const clearInlineMessages = () => {
    setErrorMessageText("");
    setSuccessMessageText("");
  };

  // ✅ Start / restart cooldown whenever we ENTER step 2
  useEffect(() => {
    if (resetFlowStepNumber !== 2) return;

    setResendActionsSecondsRemaining(resendActionsCooldownTotalSeconds);
  }, [resetFlowStepNumber]);

  // ✅ Countdown timer only runs during step 2
  useEffect(() => {
    if (resetFlowStepNumber !== 2) return;
    if (resendActionsSecondsRemaining <= 0) return;

    const countdownIntervalIdentifier = setInterval(() => {
      setResendActionsSecondsRemaining((previousSecondsRemaining) => {
        const nextSecondsRemaining = previousSecondsRemaining - 1;
        return nextSecondsRemaining < 0 ? 0 : nextSecondsRemaining;
      });
    }, 1000);

    return () => clearInterval(countdownIntervalIdentifier);
  }, [resetFlowStepNumber, resendActionsSecondsRemaining]);

  const areResendActionsLocked = resendActionsSecondsRemaining > 0;

  // STEP 1: Request OTP
  const sendOneTimePasscodeToEmail = async () => {
    clearInlineMessages();
    const trimmedEmailAddress = emailAddress.trim().toLowerCase();

    if (!trimmedEmailAddress) {
      setErrorMessageText("Please enter your email.");
      return;
    }

    try {
      setIsSubmittingRequest(true);

      await apiSendResetPasswordEmail(trimmedEmailAddress);

      setSuccessMessageText("OTP sent. Check your email.");
      setResetFlowStepNumber(2);
    } catch (sendOtpRequestError) {
      console.log("sendOneTimePasscodeToEmail error:", sendOtpRequestError);
      setErrorMessageText(
        extractErrorMessage(sendOtpRequestError, "Could not send OTP. Please try again.")
      );
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // STEP 2: Verify OTP
  const verifyOneTimePasscodeFromEmail = async () => {
    clearInlineMessages();

    const trimmedEmailAddress = emailAddress.trim().toLowerCase();
    const trimmedOneTimePasscode = oneTimePasscode.trim();

    if (!trimmedEmailAddress) {
      setErrorMessageText("Missing email. Go back and enter your email.");
      return;
    }

    if (!trimmedOneTimePasscode || trimmedOneTimePasscode.length < 4) {
      setErrorMessageText("Please enter the OTP from your email.");
      return;
    }

    try {
      setIsSubmittingRequest(true);

      // Map frontend variable → backend field name: resetPasswordOTP
      await apiVerifyResetPasswordOtp(trimmedEmailAddress, trimmedOneTimePasscode);

      setSuccessMessageText("OTP verified. Set your new password.");
      setResetFlowStepNumber(3);
    } catch (verifyOtpRequestError) {
      console.log("verifyOneTimePasscodeFromEmail error:", verifyOtpRequestError);
      setErrorMessageText(
        extractErrorMessage(verifyOtpRequestError, "Invalid OTP. Please try again.")
      );
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // STEP 3: Set new password
  const changePasswordUsingVerifiedOneTimePasscode = async () => {
    clearInlineMessages();

    const trimmedEmailAddress = emailAddress.trim().toLowerCase();
    const trimmedOneTimePasscode = oneTimePasscode.trim();

    if (!trimmedEmailAddress || !trimmedOneTimePasscode) {
      setErrorMessageText("Missing email/OTP. Please restart reset flow.");
      setResetFlowStepNumber(1);
      return;
    }

    if (!newPasswordValue || newPasswordValue.length < 6) {
      setErrorMessageText("Password must be at least 6 characters.");
      return;
    }

    if (newPasswordValue !== confirmPasswordValue) {
      setErrorMessageText("Passwords do not match.");
      return;
    }

    try {
      setIsSubmittingRequest(true);

      // Map frontend variables → backend field names
      await apiResetPassword(trimmedEmailAddress, trimmedOneTimePasscode, newPasswordValue);

      setSuccessMessageText("Password updated. Redirecting to login...");
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 650));

      expoRouter.replace("/(security)/(public)/login");
    } catch (changePasswordRequestError) {
      console.log(
        "changePasswordUsingVerifiedOneTimePasscode error:",
        changePasswordRequestError
      );
      setErrorMessageText(
        extractErrorMessage(changePasswordRequestError, "Could not update password. Please try again.")
      );
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const getHeaderCopyForCurrentStep = () => {
    if (resetFlowStepNumber === 1) {
      return {
        eyebrow: "ACCOUNT HELP",
        title: "Reset",
        sub: "Enter your email and we’ll send you an OTP.",
      };
    }

    if (resetFlowStepNumber === 2) {
      return {
        eyebrow: "CHECK YOUR EMAIL",
        title: "OTP",
        sub: "Enter the OTP you received to continue.",
      };
    }

    return {
      eyebrow: "SET NEW PASSWORD",
      title: "New",
      sub: "Create a new password and confirm it.",
      };
  };

  const headerCopyForCurrentStep = getHeaderCopyForCurrentStep();

  const getCardTitleForCurrentStep = () => {
    if (resetFlowStepNumber === 1) return "Send OTP";
    if (resetFlowStepNumber === 2) return "Verify OTP";
    return "Change password";
  };

  const cardTitleForCurrentStep = getCardTitleForCurrentStep();

  const goBackToEmailEntryStep = () => {
    clearInlineMessages();
    setOneTimePasscode("");
    setResetFlowStepNumber(1);
  };

  const resendOneTimePasscodeAndRestartCooldown = async () => {
    // Prevent taps during cooldown
    if (areResendActionsLocked) return;

    clearInlineMessages();

    // Restart cooldown immediately so the buttons "dim" again
    setResendActionsSecondsRemaining(resendActionsCooldownTotalSeconds);

    // Re-send OTP using your existing sender
    await sendOneTimePasscodeToEmail();
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
            <Text style={styles.eyebrow}>{headerCopyForCurrentStep.eyebrow}</Text>
            <Text style={styles.title}>{headerCopyForCurrentStep.title}</Text>
            <Text style={styles.subtitle}>{headerCopyForCurrentStep.sub}</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <View style={styles.accentBar} />
              <Text style={styles.cardTitle}>{cardTitleForCurrentStep}</Text>
            </View>

            {/* STEP 1 */}
            {resetFlowStepNumber === 1 && (
              <>
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
                    editable={!isSubmittingRequest}
                    returnKeyType="done"
                    onSubmitEditing={sendOneTimePasscodeToEmail}
                  />
                </View>

                <Pressable
                  onPress={sendOneTimePasscodeToEmail}
                  disabled={isSubmittingRequest}
                  className="mt-3 w-full rounded-[18px] border-2 border-blue-500 px-4 py-4 items-center justify-center"
                  style={({ pressed }) => ({
                    opacity: isSubmittingRequest ? 0.6 : pressed ? 0.85 : 1,
                  })}
                >
                  {isSubmittingRequest ? (
                    <ActivityIndicator color="#2E78FF" size="small" />
                  ) : (
                    <Text className="text-center text-base font-black text-blue-500">
                      SEND OTP
                    </Text>
                  )}
                </Pressable>
              </>
            )}

            {/* STEP 2 */}
            {resetFlowStepNumber === 2 && (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>OTP</Text>
                  <TextInput
                    value={oneTimePasscode}
                    onChangeText={setOneTimePasscode}
                    placeholder="Enter OTP"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    editable={!isSubmittingRequest}
                    returnKeyType="done"
                    onSubmitEditing={verifyOneTimePasscodeFromEmail}
                  />
                </View>

                <Pressable
                  onPress={verifyOneTimePasscodeFromEmail}
                  disabled={isSubmittingRequest}
                  className="mt-3 w-full rounded-[18px] border-2 border-blue-500 px-4 py-4 items-center justify-center"
                  style={({ pressed }) => ({
                    opacity: isSubmittingRequest ? 0.6 : pressed ? 0.85 : 1,
                  })}
                >
                  {isSubmittingRequest ? (
                    <ActivityIndicator color="#2E78FF" size="small" />
                  ) : (
                    <Text className="text-center text-base font-black text-blue-500">
                      VERIFY OTP
                    </Text>
                  )}
                </Pressable>

                {/* ✅ Change email + Resend OTP locked for 30 seconds */}
                <View style={styles.linkRow}>
                  <Pressable
                    onPress={goBackToEmailEntryStep}
                    disabled={isSubmittingRequest || areResendActionsLocked}
                    style={{
                      opacity: isSubmittingRequest ? 0.45 : areResendActionsLocked ? 0.35 : 1,
                    }}
                  >
                    <Text style={styles.link}>Change email</Text>
                  </Pressable>

                  <Pressable
                    onPress={resendOneTimePasscodeAndRestartCooldown}
                    disabled={isSubmittingRequest || areResendActionsLocked}
                    style={{
                      opacity: isSubmittingRequest ? 0.45 : areResendActionsLocked ? 0.35 : 1,
                    }}
                  >
                    <Text style={styles.link}>
                      {areResendActionsLocked
                        ? `Resend OTP (${resendActionsSecondsRemaining}s)`
                        : "Resend OTP"}
                    </Text>
                  </Pressable>
                </View>

                {areResendActionsLocked && (
                  <Text style={styles.cooldownHintText}>
                    You can resend or change email in {resendActionsSecondsRemaining}s
                  </Text>
                )}
              </>
            )}

            {/* STEP 3 */}
            {resetFlowStepNumber === 3 && (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>NEW PASSWORD</Text>
                  <TextInput
                    value={newPasswordValue}
                    onChangeText={setNewPasswordValue}
                    placeholder="••••••••"
                    placeholderTextColor={theme.colors.textSecondary}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    style={styles.input}
                    editable={!isSubmittingRequest}
                    returnKeyType="next"
                  />
                </View>

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
                    textContentType="password"
                    style={styles.input}
                    editable={!isSubmittingRequest}
                    returnKeyType="done"
                    onSubmitEditing={changePasswordUsingVerifiedOneTimePasscode}
                  />
                </View>

                <Pressable
                  onPress={changePasswordUsingVerifiedOneTimePasscode}
                  disabled={isSubmittingRequest}
                  className="mt-3 w-full rounded-[18px] border-2 border-blue-500 px-4 py-4 items-center justify-center"
                  style={({ pressed }) => ({
                    opacity: isSubmittingRequest ? 0.6 : pressed ? 0.85 : 1,
                  })}
                >
                  {isSubmittingRequest ? (
                    <ActivityIndicator color="#2E78FF" size="small" />
                  ) : (
                    <Text className="text-center text-base font-black text-blue-500">
                      UPDATE PASSWORD
                    </Text>
                  )}
                </Pressable>
              </>
            )}

            {!!errorMessageText && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessageText}</Text>
              </View>
            )}

            {!!successMessageText && (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{successMessageText}</Text>
              </View>
            )}

            {/* Links row always visible at bottom */}
            <View style={styles.linkRow}>
              <Pressable
                onPress={() => expoRouter.push("/(security)/(public)/login")}
                disabled={isSubmittingRequest}
                style={{ opacity: isSubmittingRequest ? 0.5 : 1 }}
              >
                <Text style={styles.link}>Login</Text>
              </Pressable>

              <Pressable
                onPress={() => expoRouter.push("/(security)/(public)/register")}
                disabled={isSubmittingRequest}
                style={{ opacity: isSubmittingRequest ? 0.5 : 1 }}
              >
                <Text style={styles.link}>Create Account</Text>
              </Pressable>
            </View>

            <Text style={styles.footerHint}>
              Tip: Use the latest OTP email. If you request a new one, the old OTP may stop working.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}