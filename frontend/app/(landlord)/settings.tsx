import React, { useState, useEffect } from "react";
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

export default function SettingsScreen() {
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
            <Text style={styles.title}>Settings</Text>
          </View>

          {/* Profile card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <MaterialCommunityIcons
                  name="account"
                  size={28}
                  color="#4f46e5"
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
                    color="#4f46e5"
                  />
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <ActivityIndicator
                color="#4f46e5"
                style={{ marginVertical: 16 }}
              />
            ) : (
              <View style={styles.fields}>
                <Field
                  label="Name"
                  value={name}
                  onChange={setName}
                  editable={editing}
                  icon="account-outline"
                />
                <Field
                  label="Phone"
                  value={phone}
                  onChange={setPhone}
                  editable={editing}
                  icon="phone-outline"
                  keyboardType="phone-pad"
                />
                <Field
                  label="UPI ID"
                  value={upiId}
                  onChange={setUpiId}
                  editable={editing}
                  icon="bank-transfer"
                  placeholder="yourname@upi"
                  hint="Tenants use this to pay you via GPay / PhonePe / Paytm"
                  last
                />
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
            <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
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
  label,
  value,
  onChange,
  editable,
  icon,
  placeholder,
  keyboardType,
  hint,
  last,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  editable: boolean;
  icon: any;
  placeholder?: string;
  keyboardType?: any;
  hint?: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.fieldRow, last && { borderBottomWidth: 0 }]}>
      <MaterialCommunityIcons
        name={icon}
        size={18}
        color="#6b7280"
        style={{ marginRight: 10, marginTop: 1 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {editable ? (
          <TextInput
            style={styles.fieldInput}
            value={value}
            onChangeText={onChange}
            placeholder={placeholder ?? label}
            placeholderTextColor="#9ca3af"
            keyboardType={keyboardType ?? "default"}
            autoCapitalize="none"
          />
        ) : (
          <Text style={[styles.fieldValue, !value && { color: "#9ca3af" }]}>
            {value || `Not set`}
          </Text>
        )}
        {hint && editable && (
          <Text style={styles.fieldHint}>{hint}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: { fontSize: 16, fontWeight: "600", color: "#111827" },
  profileEmail: { fontSize: 13, color: "#6b7280", marginTop: 1 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#eef2ff",
  },
  editBtnText: { fontSize: 13, fontWeight: "600", color: "#4f46e5" },

  fields: {},
  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  fieldLabel: { fontSize: 11, fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  fieldValue: { fontSize: 15, color: "#111827" },
  fieldInput: {
    fontSize: 15,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#f9fafb",
    marginTop: 2,
  },
  fieldHint: { fontSize: 11, color: "#6b7280", marginTop: 4 },

  saveRow: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  saveBtn: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },

  signOutRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
    gap: 12,
  },
  signOutText: { fontSize: 15, fontWeight: "600", color: "#ef4444" },
});
