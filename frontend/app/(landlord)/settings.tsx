import Logo from "@/assets/images/logo.svg";
import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { signOut } from "@/services/auth";
import { getProfile, updateProfile, UserProfile } from "@/services/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTheme } from "@/contexts/ThemeContext";
import { AppColors } from "@/theme/colors";

export default function SettingsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [signOutOpen, setSignOutOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [upiId, setUpiId] = useState("");

  useEffect(() => {
    getProfile()
      .then((p) => {
        setProfile(p);
        setName(p.name ?? "");
        setPhone(p.phone ?? "");
        setUpiId(p.upi_id ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateProfile({
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        upi_id: upiId.trim(),
      });
      setProfile(updated);
      setName(updated.name ?? "");
      setPhone(updated.phone ?? "");
      setUpiId(updated.upi_id ?? "");
      setEditing(false);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (profile) {
      setName(profile.name ?? "");
      setPhone(profile.phone ?? "");
      setUpiId(profile.upi_id ?? "");
    }
    setEditing(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <View style={[styles.logoWrap, { backgroundColor: colors.primary }]}>
                <Logo width={18} height={18} />
              </View>
              <Text style={styles.logoText}>RentoRoll</Text>
            </View>
          </View>

          {/* Profile card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <MaterialCommunityIcons
                  name="account"
                  size={28}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>
                  {profile?.name ?? "—"}
                </Text>
                <Text style={styles.profileEmail}>
                  {profile?.email ?? ""}
                </Text>
              </View>
              {!editing && (
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => setEditing(true)}
                  disabled={loading}
                >
                  <MaterialCommunityIcons
                    name="pencil-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <ActivityIndicator
                color={colors.primary}
                style={{ marginVertical: 16 }}
              />
            ) : (
              <View>
                <Field label="Name" value={name} onChange={setName} editable={editing} icon="account-outline" colors={colors} />
                <Field label="Phone" value={phone} onChange={setPhone} editable={editing} icon="phone-outline" keyboardType="phone-pad" colors={colors} />
                <Field label="UPI ID" value={upiId} onChange={setUpiId} editable={editing} icon="bank-transfer" placeholder="yourname@upi" hint="Tenants use this to pay you via GPay / PhonePe / Paytm" last colors={colors} />
              </View>
            )}

            {editing && (
              <View style={styles.saveRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleCancel}
                  disabled={saving}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Sign out */}
          <TouchableOpacity
            style={styles.signOutRow}
            onPress={() => setSignOutOpen(true)}
          >
            <MaterialCommunityIcons name="logout" size={20} color={colors.danger} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              destructive
              onPress={async () => {
                await signOut();
                router.replace("/(auth)/login");
              }}
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SafeAreaView>
  );
}

function Field({
  label, value, onChange, editable, icon, placeholder, keyboardType, hint, last, colors,
}: {
  label: string; value: string; onChange: (v: string) => void; editable: boolean;
  icon: any; placeholder?: string; keyboardType?: any; hint?: string; last?: boolean;
  colors: AppColors;
}) {
  return (
    <View style={[{
      flexDirection: "row", alignItems: "flex-start",
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.borderLight,
    }]}>
      <MaterialCommunityIcons name={icon} size={18} color={colors.textSecondary} style={{ marginRight: 10, marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{label}</Text>
        {editable ? (
          <TextInput
            style={{
              fontSize: 15, color: colors.inputText,
              borderWidth: 1, borderColor: colors.inputBorder,
              borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
              backgroundColor: colors.inputBg, marginTop: 2,
            }}
            value={value}
            onChangeText={onChange}
            placeholder={placeholder ?? label}
            placeholderTextColor={colors.inputPlaceholder}
            keyboardType={keyboardType ?? "default"}
            autoCapitalize="none"
          />
        ) : (
          <Text style={[{ fontSize: 15, color: colors.text }, !value && { color: colors.textMuted }]}>
            {value || `Not set`}
          </Text>
        )}
        {hint && editable && (
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>{hint}</Text>
        )}
      </View>
    </View>
  );
}

const createStyles = (c: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: 20, fontWeight: "800", color: c.text, letterSpacing: -0.5 },
  card: {
    backgroundColor: c.surface,
    borderRadius: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: c.border,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: c.borderLight,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: c.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: { fontSize: 16, fontWeight: "600", color: c.text },
  profileEmail: { fontSize: 13, color: c.textSecondary, marginTop: 1 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: c.primaryLight,
  },
  editBtnText: { fontSize: 13, fontWeight: "600", color: c.primary },
  saveRow: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: c.borderLight,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: c.textBody },
  saveBtn: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: c.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  signOutRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: c.dangerBorder,
    gap: 12,
  },
  signOutText: { fontSize: 15, fontWeight: "600", color: c.danger },
});
