import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { forgotPassword } from "@/services/api";
import { useTheme } from "@/contexts/ThemeContext";
import { AppColors } from "@/theme/colors";

export default function ForgotPasswordScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      router.push({
        pathname: "/(auth)/reset-password",
        params: { email: email.trim().toLowerCase() },
      });
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Theme toggle */}
      <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
        <MaterialCommunityIcons
          name={isDark ? "weather-sunny" : "weather-night"}
          size={20}
          color={colors.textMuted}
        />
      </TouchableOpacity>

      <View style={styles.inner}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>

        {/* Icon */}
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name="lock-reset" size={32} color={colors.primary} />
        </View>

        <Text style={styles.title}>Forgot password?</Text>
        <Text style={styles.subtitle}>
          Enter your registered email and we'll send you a 6-digit OTP to reset your password.
        </Text>

        <Text style={styles.label}>Email address</Text>
        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          placeholder="name@example.com"
          placeholderTextColor={colors.inputPlaceholder}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="done"
          value={email}
          onChangeText={(v) => { setEmail(v); setError(""); }}
          onSubmitEditing={handleSubmit}
        />

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Send OTP</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  themeToggle: { position: "absolute", top: 52, right: 24, padding: 8, zIndex: 10 },
  inner: { flex: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },
  back: { marginBottom: 32 },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: c.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: { fontSize: 26, fontWeight: "700", color: c.text, marginBottom: 10 },
  subtitle: {
    fontSize: 15,
    color: c.textSecondary,
    lineHeight: 22,
    marginBottom: 32,
  },
  label: { fontSize: 14, fontWeight: "500", color: c.text, marginBottom: 6 },
  input: {
    height: 50,
    backgroundColor: c.inputBg,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: c.inputText,
    borderWidth: 1,
    borderColor: c.inputBorder,
    marginBottom: 16,
  },
  inputError: { borderColor: c.danger },
  errorBanner: {
    backgroundColor: c.dangerBgAlt,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: c.dangerBorder,
  },
  errorText: { color: c.danger, fontSize: 14, fontWeight: "500" },
  btn: {
    height: 50,
    backgroundColor: c.primary,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  backLink: { alignItems: "center", marginTop: 24 },
  backLinkText: { color: c.primary, fontSize: 14, fontWeight: "600" },
});
