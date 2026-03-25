import Logo from "@/assets/images/logo.svg";
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { router, Link } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { signUp } from "@/services/auth";
import { Role } from "@/services/api";
import { useTheme } from "@/contexts/ThemeContext";
import { AppColors } from "@/theme/colors";

export default function SignupScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [role, setRole] = useState<Role>("tenant");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPass, setShowPass] = useState(false);
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
      const { user } = await signUp(
        name.trim(),
        email.trim(),
        password,
        role,
        phone.trim() || undefined,
      );
      if (user?.role === "landlord") {
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
      style={{ flex: 1, backgroundColor: colors.background }}
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

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoBox}>
            <Logo width={28} height={28} />
          </View>
          <Text style={styles.appName}>RentoRoll</Text>
          <Text style={styles.tagline}>Create your account</Text>
        </View>

        {/* Role toggle */}
        <View style={styles.roleToggle}>
          <TouchableOpacity
            style={[styles.roleBtn, role === "tenant" && styles.roleBtnActive]}
            onPress={() => setRole("tenant")}
          >
            <Text
              style={[
                styles.roleBtnText,
                role === "tenant" && styles.roleBtnTextActive,
              ]}
            >
              Tenant
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.roleBtn,
              role === "landlord" && styles.roleBtnActive,
            ]}
            onPress={() => setRole("landlord")}
          >
            <Text
              style={[
                styles.roleBtnText,
                role === "landlord" && styles.roleBtnTextActive,
              ]}
            >
              Landlord
            </Text>
          </TouchableOpacity>
        </View>

        {/* Full Name */}
        <View style={styles.inputRow}>
          <MaterialCommunityIcons
            name="account-outline"
            size={18}
            color={colors.inputPlaceholder}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor={colors.inputPlaceholder}
            value={name}
            onChangeText={(v) => {
              setName(v);
              setError("");
            }}
          />
        </View>

        {/* Email */}
        <View style={styles.inputRow}>
          <MaterialCommunityIcons
            name="email-outline"
            size={18}
            color={colors.inputPlaceholder}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={colors.inputPlaceholder}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setError("");
            }}
          />
        </View>

        {/* Phone */}
        <View style={styles.inputRow}>
          <MaterialCommunityIcons
            name="phone-outline"
            size={18}
            color={colors.inputPlaceholder}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone (optional)"
            placeholderTextColor={colors.inputPlaceholder}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {/* Password */}
        <View style={styles.inputRow}>
          <MaterialCommunityIcons
            name="lock-outline"
            size={18}
            color={colors.inputPlaceholder}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.inputPlaceholder}
            secureTextEntry={!showPass}
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setError("");
            }}
          />
          <TouchableOpacity
            onPress={() => setShowPass((p) => !p)}
            style={styles.eyeBtn}
          >
            <MaterialCommunityIcons
              name={showPass ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={colors.inputPlaceholder}
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputRow}>
          <MaterialCommunityIcons
            name="lock-check-outline"
            size={18}
            color={colors.inputPlaceholder}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            placeholderTextColor={colors.inputPlaceholder}
            secureTextEntry={!showPass}
            value={confirmPassword}
            onChangeText={(v) => {
              setConfirmPassword(v);
              setError("");
            }}
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
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Create Account →</Text>
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

const createStyles = (c: AppColors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 28,
      paddingTop: 60,
      paddingBottom: 40,
      backgroundColor: c.background,
    },
    themeToggle: {
      position: "absolute",
      top: 52,
      right: 24,
      padding: 8,
      zIndex: 10,
    },
    logoWrap: { alignItems: "center", marginBottom: 32 },
    logoBox: {
      width: 60,
      height: 60,
      borderRadius: 16,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    appName: {
      fontSize: 20,
      fontWeight: "700",
      color: c.text,
      marginBottom: 2,
    },
    tagline: { fontSize: 13, color: c.textSecondary },
    roleToggle: {
      flexDirection: "row",
      backgroundColor: c.primaryMuted,
      borderRadius: 12,
      padding: 4,
      marginBottom: 20,
    },
    roleBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 10,
    },
    roleBtnActive: { backgroundColor: c.primary },
    roleBtnText: { fontSize: 14, fontWeight: "600", color: c.textSecondary },
    roleBtnTextActive: { color: "#fff" },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 12,
      paddingHorizontal: 14,
      height: 52,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: c.inputText },
    eyeBtn: { padding: 4 },
    errorBanner: {
      backgroundColor: c.dangerBgAlt,
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.dangerBorder,
    },
    errorText: { color: c.danger, fontSize: 13, fontWeight: "500" },
    btn: {
      height: 52,
      backgroundColor: c.primary,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 4,
    },
    btnDisabled: { opacity: 0.6 },
    btnText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 24,
    },
    footerText: { color: c.textSecondary, fontSize: 14 },
    link: { color: c.primary, fontSize: 14, fontWeight: "600" },
  });
