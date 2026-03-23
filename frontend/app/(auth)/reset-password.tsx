import React, { useState, useRef } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { resetPassword } from "@/services/api";
import { toast } from "sonner-native";

const COLORS = {
  primary: "#4f46e5",
  bg: "#ffffff",
  inputBg: "#f3f4f6",
  border: "#e5e7eb",
  text: "#111827",
  muted: "#6b7280",
  error: "#ef4444",
};

// 6-box OTP input
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<TextInput>(null);
  const digits = value.padEnd(6, " ").split("").slice(0, 6);

  return (
    <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()}>
      <View style={otp.row}>
        {digits.map((d, i) => (
          <View
            key={i}
            style={[otp.box, value.length === i && otp.boxActive]}
          >
            <Text style={otp.digit}>{d.trim()}</Text>
          </View>
        ))}
      </View>
      <TextInput
        ref={inputRef}
        style={otp.hidden}
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, "").slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
      />
    </TouchableOpacity>
  );
}

const otp = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, marginBottom: 24 },
  box: {
    width: 46,
    height: 54,
    borderRadius: 10,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  boxActive: { borderColor: COLORS.primary, borderWidth: 2 },
  digit: { fontSize: 22, fontWeight: "700", color: COLORS.text },
  hidden: { position: "absolute", opacity: 0, height: 0 },
});

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (code.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await resetPassword(email, code, newPassword);
      toast.success("Password reset! Please sign in.");
      router.replace("/(auth)/login");
    } catch (e: any) {
      setError(e.message ?? "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.iconBox}>
          <MaterialCommunityIcons name="shield-key-outline" size={32} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit OTP to{" "}
          <Text style={{ fontWeight: "600", color: COLORS.text }}>{email}</Text>.
          {"\n"}Enter it below along with your new password.
        </Text>

        {/* OTP boxes */}
        <Text style={styles.label}>One-time password</Text>
        <OtpInput value={code} onChange={setCode} />

        {/* New password */}
        <Text style={styles.label}>New password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.passwordInput, error ? styles.inputError : null]}
            placeholder="Min. 6 characters"
            placeholderTextColor={COLORS.muted}
            secureTextEntry={!showPassword}
            returnKeyType="done"
            value={newPassword}
            onChangeText={(v) => { setNewPassword(v); setError(""); }}
            onSubmitEditing={handleReset}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((p) => !p)}
            style={styles.eyeBtn}
          >
            <MaterialCommunityIcons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={COLORS.muted}
            />
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.btn, (loading || code.length !== 6) && styles.btnDisabled]}
          onPress={handleReset}
          disabled={loading || code.length !== 6}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Reset Password</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace("/(auth)/forgot-password")}
          style={styles.resendLink}
        >
          <Text style={styles.resendText}>Didn't receive it? </Text>
          <Text style={styles.resendAction}>Resend OTP</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  inner: { flex: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },
  back: { marginBottom: 32 },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: { fontSize: 26, fontWeight: "700", color: COLORS.text, marginBottom: 10 },
  subtitle: { fontSize: 15, color: COLORS.muted, lineHeight: 22, marginBottom: 32 },
  label: { fontSize: 14, fontWeight: "500", color: COLORS.text, marginBottom: 10 },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  eyeBtn: { paddingHorizontal: 14 },
  inputError: { borderColor: COLORS.error },
  errorBanner: {
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: { color: COLORS.error, fontSize: 14, fontWeight: "500" },
  btn: {
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  resendLink: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  resendText: { color: COLORS.muted, fontSize: 14 },
  resendAction: { color: COLORS.primary, fontSize: 14, fontWeight: "600" },
});
