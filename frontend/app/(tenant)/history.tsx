import React, { useMemo, useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getMyHistory, RentRecord } from "@/services/api";
import { useTheme } from "@/contexts/ThemeContext";
import { AppColors } from "@/theme/colors";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function TenantHistoryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [records, setRecords] = useState<RentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyHistory().then((d) => setRecords(d ?? [])).finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment History</Text>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {records.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="history" size={56} color={colors.border} />
              <Text style={styles.emptyText}>No payment history yet</Text>
            </View>
          ) : (
            records.map((r) => (
              <View key={r.id} style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.period}>{MONTHS[r.month - 1]} {r.year}</Text>
                  <Text style={styles.breakdown}>
                    Rent ₹{r.base_rent.toLocaleString("en-IN")} + Elec ₹{r.electricity.toLocaleString("en-IN")}
                  </Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.total}>₹{r.total.toLocaleString("en-IN")}</Text>
                  <View style={[styles.badge, { backgroundColor: r.status === "PAID" ? colors.successBg : colors.warningBg }]}>
                    <Text style={[styles.badgeText, { color: r.status === "PAID" ? colors.success : colors.warningAlt }]}>
                      {r.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (c: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  title: { fontSize: 22, fontWeight: "700", color: c.text },
  content: { padding: 16 },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyText: { color: c.textMuted, fontSize: 15, marginTop: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: c.border,
  },
  rowLeft: { flex: 1 },
  period: { fontSize: 15, fontWeight: "600", color: c.text },
  breakdown: { fontSize: 12, color: c.textSecondary, marginTop: 3 },
  rowRight: { alignItems: "flex-end", gap: 6 },
  total: { fontSize: 16, fontWeight: "700", color: c.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: "700" },
});
