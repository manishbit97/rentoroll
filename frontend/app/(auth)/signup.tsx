import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { router, Link } from "expo-router";
import { signUp } from "@/services/auth";
import { Role } from "@/services/api";

const COLORS = {
  primary: "#4f46e5",
  bg: "#ffffff",
  inputBg: "#f3f4f6",
  border: "#e5e7eb",
  text: "#111827",
  muted: "#6b7280",
  error: "#ef4444",
  tabActive: "#4f46e5",
  tabInactive: "#9ca3af",
};

export default function SignupScreen() {
  const [role, setRole] = useState<Role>("tenant");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Name, email and password are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { user } = await signUp(name.trim(), email.trim(), password, role, phone.trim() || undefined);
      if (user.role === "landlord") {
        router.replace("/(landlord)");
      } else {
        router.replace("/(tenant)");
      }
    } catch (e: any) {
      setError(e.message ?? "Sign up failed, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.logoRow}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>R</Text>
          </View>
          <Text style={styles.appName}>RentoRoll</Text>
        </View>

        <Text style={styles.title}>Create your account</Text>

        {/* Role toggle */}
        <View style={styles.roleToggle}>
          <TouchableOpacity
            style={[styles.roleBtn, role === "tenant" && styles.roleBtnActive]}
            onPress={() => setRole("tenant")}
          >
            <Text style={[styles.roleBtnText, role === "tenant" && styles.roleBtnTextActive]}>
              Tenant
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, role === "landlord" && styles.roleBtnActive]}
            onPress={() => setRole("landlord")}
          >
            <Text style={[styles.roleBtnText, role === "landlord" && styles.roleBtnTextActive]}>
              Landlord
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fields */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor={COLORS.muted}
            value={name}
            onChangeText={(v) => { setName(v); setError(""); }}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email address"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(v) => { setEmail(v); setError(""); }}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone (optional, for rent notifications)</Text>
          <TextInput
            style={styles.input}
            placeholder="+91 9876543210"
            placeholderTextColor={COLORS.muted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor={COLORS.muted}
            secureTextEntry
            value={password}
            onChangeText={(v) => { setPassword(v); setError(""); }}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm your password"
            placeholderTextColor={COLORS.muted}
            secureTextEntry
            value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); setError(""); }}
          />
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSignup}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Log In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: COLORS.bg,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  logoText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  appName: { fontSize: 22, fontWeight: "700", color: COLORS.text },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 20,
  },
  roleToggle: {
    flexDirection: "row",
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  roleBtnActive: { backgroundColor: COLORS.primary },
  roleBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.muted },
  roleBtnTextActive: { color: "#fff" },
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    height: 50,
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
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
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: { color: COLORS.muted, fontSize: 14 },
  link: { color: COLORS.primary, fontSize: 14, fontWeight: "600" },
});
