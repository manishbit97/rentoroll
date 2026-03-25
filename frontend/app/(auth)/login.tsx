import Logo from "@/assets/images/logo.svg";
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
import { router, Link } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { signIn } from "@/services/auth";
import { useTheme } from "@/contexts/ThemeContext";
import { AppColors } from "@/theme/colors";

export default function LoginScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { user } = await signIn(email.trim(), password);
      if (user?.role === "landlord") {
        router.replace("/(landlord)");
      } else {
        router.replace("/(tenant)");
      }
    } catch (e: any) {
      setError(e.message ?? "Incorrect email or password, please try again.");
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
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoBox}>
            <Logo width={30} height={30} />
          </View>
          <Text style={styles.appName}>RentoRoll</Text>
          <Text style={styles.tagline}>Welcome back</Text>
        </View>

        {/* Email */}
        <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
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
            returnKeyType="next"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setError("");
            }}
          />
        </View>

        {/* Password */}
        <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
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
            returnKeyType="done"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setError("");
            }}
            onSubmitEditing={handleLogin}
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

        {/* Forgot password */}
        <TouchableOpacity
          onPress={() => router.push("/(auth)/forgot-password")}
          style={styles.forgotBtn}
        >
          <Text style={styles.link}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Error */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Sign In */}
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Sign In →</Text>
          )}
        </TouchableOpacity>

        {/* OR divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Create account */}
        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity style={styles.createBtn} activeOpacity={0.7}>
            <Text style={styles.createBtnText}>Create Account</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (c: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    themeToggle: {
      position: "absolute",
      top: 52,
      right: 24,
      padding: 8,
      zIndex: 10,
    },
    inner: {
      flex: 1,
      paddingHorizontal: 28,
      justifyContent: "center",
      paddingBottom: 40,
    },
    logoWrap: { alignItems: "center", marginBottom: 40 },
    logoBox: {
      width: 64,
      height: 64,
      borderRadius: 18,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    appName: {
      fontSize: 22,
      fontWeight: "700",
      color: c.text,
      marginBottom: 4,
    },
    tagline: { fontSize: 14, color: c.textSecondary },
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
    inputRowError: { borderColor: c.danger },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: c.inputText },
    eyeBtn: { padding: 4 },
    forgotBtn: { alignSelf: "flex-end", marginBottom: 8 },
    link: { color: c.primary, fontSize: 13, fontWeight: "600" },
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
    divider: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 20,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: c.border },
    dividerText: {
      marginHorizontal: 12,
      fontSize: 12,
      color: c.textMuted,
      fontWeight: "600",
    },
    createBtn: {
      height: 52,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    createBtnText: { color: c.primary, fontSize: 15, fontWeight: "700" },
  });
