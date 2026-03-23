import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getMyHistory, RentRecord } from "@/services/api";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function TenantHistoryScreen() {
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
        <ActivityIndicator style={{ marginTop: 60 }} color="#4f46e5" />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {records.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="history" size={56} color="#d1d5db" />
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
                  <View style={[styles.badge, { backgroundColor: r.status === "PAID" ? "#d1fae5" : "#fef3c7" }]}>
                    <Text style={[styles.badgeText, { color: r.status === "PAID" ? "#10b981" : "#f59e0b" }]}>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  content: { padding: 16 },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyText: { color: "#9ca3af", fontSize: 15, marginTop: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  rowLeft: { flex: 1 },
  period: { fontSize: 15, fontWeight: "600", color: "#111827" },
  breakdown: { fontSize: 12, color: "#6b7280", marginTop: 3 },
  rowRight: { alignItems: "flex-end", gap: 6 },
  total: { fontSize: 16, fontWeight: "700", color: "#111827" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: "700" },
});
