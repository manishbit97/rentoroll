import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getMyRent, RentRecord } from "@/services/api";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function TenantHomeScreen() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [records, setRecords] = useState<RentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getMyRent(month, year);
      setRecords(data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totalDue = records.reduce((sum, r) => r.status === "PENDING" ? sum + r.total : sum, 0);
  const totalPaid = records.reduce((sum, r) => r.status === "PAID" ? sum + r.total : sum, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Rent</Text>
        <Text style={styles.headerSub}>{MONTHS[month - 1]} {year}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color="#4f46e5" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        >
          {/* Summary cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { borderLeftColor: "#f59e0b" }]}>
              <Text style={styles.summaryLabel}>Amount Due</Text>
              <Text style={[styles.summaryAmount, { color: "#f59e0b" }]}>
                ₹{totalDue.toLocaleString("en-IN")}
              </Text>
            </View>
            <View style={[styles.summaryCard, { borderLeftColor: "#10b981" }]}>
              <Text style={styles.summaryLabel}>Paid This Month</Text>
              <Text style={[styles.summaryAmount, { color: "#10b981" }]}>
                ₹{totalPaid.toLocaleString("en-IN")}
              </Text>
            </View>
          </View>

          {/* Records */}
          {records.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="home-clock-outline" size={56} color="#d1d5db" />
              <Text style={styles.emptyText}>No rent records for this month</Text>
            </View>
          ) : (
            records.map((r) => <RentCard key={r.id} record={r} />)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function RentCard({ record }: { record: RentRecord }) {
  const isPaid = record.status === "PAID";
  return (
    <View style={[styles.card, isPaid && styles.cardPaid]}>
      <View style={styles.cardRow}>
        <View style={styles.cardIcon}>
          <MaterialCommunityIcons
            name={isPaid ? "check-circle" : "clock-alert-outline"}
            size={26}
            color={isPaid ? "#10b981" : "#f59e0b"}
          />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardPeriod}>
            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][record.month - 1]} {record.year}
          </Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownText}>Rent ₹{record.base_rent.toLocaleString("en-IN")}</Text>
            <Text style={styles.breakdownDot}>+</Text>
            <Text style={styles.breakdownText}>Electricity ₹{record.electricity.toLocaleString("en-IN")}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.cardTotal}>₹{record.total.toLocaleString("en-IN")}</Text>
          <View style={[styles.badge, { backgroundColor: isPaid ? "#d1fae5" : "#fef3c7" }]}>
            <Text style={[styles.badgeText, { color: isPaid ? "#10b981" : "#f59e0b" }]}>
              {record.status}
            </Text>
          </View>
        </View>
      </View>
      {isPaid && record.paid_date && (
        <Text style={styles.paidOn}>
          Paid on {new Date(record.paid_date).toDateString()}
        </Text>
      )}
      {record.notes ? <Text style={styles.cardNotes}>{record.notes}</Text> : null}
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
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#111827" },
  headerSub: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  content: { padding: 16 },
  summaryRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryLabel: { fontSize: 12, color: "#6b7280", marginBottom: 4 },
  summaryAmount: { fontSize: 20, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 15, color: "#9ca3af", marginTop: 16, textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardPaid: { borderColor: "#a7f3d0" },
  cardRow: { flexDirection: "row", alignItems: "center" },
  cardIcon: { marginRight: 12 },
  cardBody: { flex: 1 },
  cardPeriod: { fontSize: 15, fontWeight: "600", color: "#111827" },
  breakdownRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  breakdownText: { fontSize: 12, color: "#6b7280" },
  breakdownDot: { marginHorizontal: 6, color: "#d1d5db" },
  cardRight: { alignItems: "flex-end", gap: 6 },
  cardTotal: { fontSize: 18, fontWeight: "700", color: "#111827" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  paidOn: { fontSize: 12, color: "#10b981", marginTop: 10, fontWeight: "500" },
  cardNotes: { fontSize: 12, color: "#9ca3af", marginTop: 6, fontStyle: "italic" },
});
