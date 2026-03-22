import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { signOut } from "@/services/auth";
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <SettingRow icon="account-outline" label="Account" />
        <SettingRow icon="bell-outline" label="Notifications" />
        <SettingRow icon="shield-lock-outline" label="Security" />
        <SettingRow icon="help-circle-outline" label="Help & Support" />
      </View>

      <TouchableOpacity
        style={styles.signOutRow}
        onPress={() => setSignOutOpen(true)}
      >
        <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

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

function SettingRow({ icon, label }: { icon: any; label: string }) {
  return (
    <TouchableOpacity style={styles.row}>
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color="#4f46e5"
        style={{ marginRight: 14 }}
      />
      <Text style={styles.rowLabel}>{label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
    </TouchableOpacity>
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
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  rowLabel: { flex: 1, fontSize: 15, color: "#111827", fontWeight: "500" },
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
