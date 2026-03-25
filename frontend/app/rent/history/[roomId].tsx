import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getRoomHistory, RentRecord } from "@/services/api";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function RentHistoryScreen() {
  const { roomId, roomName } = useLocalSearchParams<{
    roomId: string;
    roomName: string;
  }>();
  const [records, setRecords] = useState<RentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;
    getRoomHistory(roomId)
      .then((data) => setRecords(data ?? []))
      .finally(() => setLoading(false));
  }, [roomId]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Payment History</Text>
          <Text style={styles.headerSub}>{roomName}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color="#4f46e5" />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {records.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons
                name="history"
                size={56}
                color="#d1d5db"
              />
              <Text style={styles.emptyText}>No payment history yet</Text>
            </View>
          ) : (
            records.map((r) => <HistoryRow key={r.id} record={r} />)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PAID: { bg: "#d1fae5", text: "#10b981" },
  PARTIAL: { bg: "#fef3c7", text: "#d97706" },
  PENDING: { bg: "#fee2e2", text: "#ef4444" },
};

function HistoryRow({ record }: { record: RentRecord }) {
  const isPaid = record.status === "PAID";
  const isPartial = record.status === "PARTIAL";
  const cf = record.carry_forward ?? 0;
  const paidAmount = record.paid_amount ?? 0;
  const badge = STATUS_COLORS[record.status] ?? STATUS_COLORS.PENDING;

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.monthLabel}>
          {MONTHS[record.month - 1]} {record.year}
        </Text>
        <View style={styles.breakdown}>
          <Text style={styles.breakdownItem}>
            Rent ₹{record.base_rent.toLocaleString("en-IN")}
          </Text>
          {record.electricity > 0 && (
            <>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.breakdownItem}>
                Elec ₹{record.electricity.toLocaleString("en-IN")}
              </Text>
            </>
          )}
        </View>
        {cf > 0 && (
          <Text style={styles.cfDebt}>↑ CF +₹{cf.toLocaleString("en-IN")}</Text>
        )}
        {cf < 0 && (
          <Text style={styles.cfCredit}>
            ↓ Credit −₹{Math.abs(cf).toLocaleString("en-IN")}
          </Text>
        )}
        {isPartial && (
          <Text style={styles.partialInfo}>
            Paid ₹{paidAmount.toLocaleString("en-IN")} · Due ₹
            {(record.total - paidAmount).toLocaleString("en-IN")} remaining
          </Text>
        )}
        {record.notes ? <Text style={styles.notes}>{record.notes}</Text> : null}
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.total}>
          ₹{record.total.toLocaleString("en-IN")}
        </Text>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.text }]}>
            {record.status}
          </Text>
        </View>
        {(isPaid || isPartial) && record.paid_date && (
          <Text style={[styles.paidDate, { color: badge.text }]}>
            {new Date(record.paid_date).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
            })}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  headerSub: { fontSize: 12, color: "#6b7280" },
  content: { padding: 16 },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyText: { fontSize: 16, color: "#9ca3af", marginTop: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  rowLeft: { flex: 1 },
  monthLabel: { fontSize: 16, fontWeight: "600", color: "#111827" },
  breakdown: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  breakdownItem: { fontSize: 12, color: "#6b7280" },
  dot: { marginHorizontal: 6, color: "#d1d5db" },
  notes: { fontSize: 12, color: "#9ca3af", marginTop: 4, fontStyle: "italic" },
  rowRight: { alignItems: "flex-end", gap: 6 },
  total: { fontSize: 17, fontWeight: "700", color: "#111827" },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  paidDate: { fontSize: 11, fontWeight: "500" },
  cfDebt: { fontSize: 11, color: "#ef4444", fontWeight: "500", marginTop: 3 },
  cfCredit: { fontSize: 11, color: "#10b981", fontWeight: "500", marginTop: 3 },
  partialInfo: {
    fontSize: 11,
    color: "#d97706",
    fontWeight: "500",
    marginTop: 3,
  },
});
