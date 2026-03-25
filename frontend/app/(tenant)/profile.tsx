import React, { useMemo, useState } from "react";
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
import { useTheme } from "@/contexts/ThemeContext";
import { AppColors } from "@/theme/colors";

export default function TenantProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [signOutOpen, setSignOutOpen] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account" size={40} color="#fff" />
        </View>
        <Text style={styles.role}>Tenant Account</Text>
      </View>

      <View style={styles.section}>
        <RowItem icon="account-outline" label="Edit Profile" colors={colors} />
        <RowItem icon="bell-outline" label="Notifications" colors={colors} />
        <RowItem
          icon="help-circle-outline"
          label="Help & Support"
          colors={colors}
        />
      </View>

      <TouchableOpacity
        style={styles.signOutRow}
        onPress={() => setSignOutOpen(true)}
      >
        <MaterialCommunityIcons name="logout" size={20} color={colors.danger} />
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

function RowItem({
  icon,
  label,
  colors,
}: {
  icon: any;
  label: string;
  colors: AppColors;
}) {
  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
      }}
    >
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={colors.primary}
        style={{ marginRight: 14 }}
      />
      <Text
        style={{ flex: 1, fontSize: 15, color: colors.text, fontWeight: "500" }}
      >
        {label}
      </Text>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={colors.textMuted}
      />
    </TouchableOpacity>
  );
}

const createStyles = (c: AppColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    title: { fontSize: 22, fontWeight: "700", color: c.text },
    avatarSection: { alignItems: "center", paddingVertical: 28 },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    role: { fontSize: 14, color: c.textSecondary, fontWeight: "500" },
    section: {
      backgroundColor: c.surface,
      borderRadius: 12,
      margin: 16,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden",
    },
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
