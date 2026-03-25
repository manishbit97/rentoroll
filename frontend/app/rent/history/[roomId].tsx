import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getRoomHistory, RentRecord } from "@/services/api";
import { useTheme } from "@/contexts/ThemeContext";
import { AppColors } from "@/theme/colors";

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

type UpcomingMonth = { month: number; year: number };

function getUpcomingMonths(records: RentRecord[], count = 2): UpcomingMonth[] {
  const now = new Date();
  let m = now.getMonth() + 1;
  let y = now.getFullYear();
  if (records.length > 0) {
    const latest = records[0]; // DESC sorted
    if (latest.year > y || (latest.year === y && latest.month >= m)) {
      m = latest.month + 1;
      y = latest.year;
      if (m > 12) { m = 1; y += 1; }
    }
  }
  const result: UpcomingMonth[] = [];
  for (let i = 0; i < count; i++) {
    result.push({ month: m, year: y });
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return result;
}

export default function RentHistoryScreen() {
  const { roomId, roomName } = useLocalSearchParams<{
    roomId: string;
    roomName: string;
  }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [records, setRecords] = useState<RentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;
    getRoomHistory(roomId)
      .then((data) => setRecords(data ?? []))
      .finally(() => setLoading(false));
  }, [roomId]);

  // Summary stats
  const totalCollected = records.reduce((s, r) => s + (r.paid_amount ?? 0), 0);
  const totalOutstanding = records
    .filter((r) => r.status !== "PAID")
    .reduce((s, r) => s + (r.total - (r.paid_amount ?? 0)), 0);

  // Year groups (DESC)
  const years = useMemo(
    () => [...new Set(records.map((r) => r.year))].sort((a, b) => b - a),
    [records]
  );

  // Upcoming months
  const upcoming = useMemo(() => getUpcomingMonths(records, 2), [records]);

  const navigateToMonth = (month: number, year: number, propertyId?: string) => {
    router.push({
      pathname: `/rent/${roomId}`,
      params: {
        roomName: roomName ?? "",
        month: String(month),
        year: String(year),
        ...(propertyId ? { propertyId } : {}),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>{roomName || "Room"}</Text>
          <Text style={styles.headerSub}>Payment Overview</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Summary strip */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryValue}>{records.length}</Text>
              <Text style={styles.summaryLabel}>Months</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                ₹{totalCollected.toLocaleString("en-IN")}
              </Text>
              <Text style={styles.summaryLabel}>Collected</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text
                style={[
                  styles.summaryValue,
                  { color: totalOutstanding > 0 ? colors.danger : colors.textMuted },
                ]}
              >
                ₹{totalOutstanding.toLocaleString("en-IN")}
              </Text>
              <Text style={styles.summaryLabel}>Outstanding</Text>
            </View>
          </View>

          {/* Upcoming months */}
          {upcoming.length > 0 && (
            <>
              <Text style={styles.yearHeader}>Upcoming</Text>
              {upcoming.map((u) => (
                <TouchableOpacity
                  key={`upcoming-${u.year}-${u.month}`}
                  style={styles.row}
                  activeOpacity={0.7}
                  onPress={() => navigateToMonth(u.month, u.year)}
                >
                  <View style={styles.rowLeft}>
                    <Text style={styles.monthLabel}>
                      {MONTHS[u.month - 1]} {u.year}
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    <View style={[styles.badge, { backgroundColor: colors.surfaceAlt }]}>
                      <Text style={[styles.badgeText, { color: colors.textMuted }]}>
                        UPCOMING
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Year-grouped records */}
          {records.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="history" size={56} color={colors.border} />
              <Text style={styles.emptyText}>No payment history yet</Text>
            </View>
          ) : (
            years.map((year) => (
              <View key={year}>
                <Text style={styles.yearHeader}>{year}</Text>
                {records
                  .filter((r) => r.year === year)
                  .map((r) => (
                    <HistoryRow
                      key={r.id}
                      record={r}
                      colors={colors}
                      styles={styles}
                      onPress={() =>
                        navigateToMonth(r.month, r.year, r.property_id)
                      }
                    />
                  ))}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function HistoryRow({
  record,
  colors,
  styles,
  onPress,
}: {
  record: RentRecord;
  colors: AppColors;
  styles: ReturnType<typeof createStyles>;
  onPress: () => void;
}) {
  const isPaid = record.status === "PAID";
  const isPartial = record.status === "PARTIAL";
  const cf = record.carry_forward ?? 0;
  const paidAmount = record.paid_amount ?? 0;

  const badgeBg = isPaid
    ? colors.successBg
    : isPartial
      ? colors.warningBg
      : colors.dangerBg;
  const badgeText = isPaid
    ? colors.success
    : isPartial
      ? colors.warning
      : colors.danger;

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.75} onPress={onPress}>
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
          <Text style={styles.cfDebt}>
            ↑ CF +₹{cf.toLocaleString("en-IN")}
          </Text>
        )}
        {cf < 0 && (
          <Text style={styles.cfCredit}>
            ↓ Credit −₹{Math.abs(cf).toLocaleString("en-IN")}
          </Text>
        )}
      </View>
      <View style={styles.rowRight}>
        <View style={[styles.badge, { backgroundColor: badgeBg, marginBottom: 8 }]}>
          <Text style={[styles.badgeText, { color: badgeText }]}>{record.status}</Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Total</Text>
          <Text style={styles.amountValue}>₹{record.total.toLocaleString("en-IN")}</Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Paid</Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.amountValue, { color: colors.success }]}>
              ₹{paidAmount.toLocaleString("en-IN")}
            </Text>
            {(isPaid || isPartial) && record.paid_date && (
              <Text style={styles.amountDate}>
                (on{" "}
                {new Date(record.paid_date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                })}
                )
              </Text>
            )}
          </View>
        </View>
        {isPartial && (
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Due</Text>
            <Text style={[styles.amountValue, { color: colors.danger }]}>
              ₹{(record.total - paidAmount).toLocaleString("en-IN")}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (c: AppColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerTitle: { fontSize: 18, fontWeight: "700", color: c.text },
    headerSub: { fontSize: 12, color: c.textSecondary },
    content: { padding: 16, paddingBottom: 40 },
    summaryCard: {
      flexDirection: "row",
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    summaryCol: { flex: 1, alignItems: "center" },
    summaryValue: {
      fontSize: 18,
      fontWeight: "700",
      color: c.text,
      marginBottom: 3,
    },
    summaryLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: c.textMuted,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    summaryDivider: { width: 1, backgroundColor: c.borderLight, marginHorizontal: 4 },
    yearHeader: {
      fontSize: 13,
      fontWeight: "700",
      color: c.textMuted,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: 10,
      marginTop: 4,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    rowLeft: { flex: 1 },
    rowRight: { alignItems: "flex-end", gap: 4 },
    monthLabel: { fontSize: 15, fontWeight: "600", color: c.text },
    badge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    badgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },
    breakdown: { flexDirection: "row", alignItems: "center", marginTop: 6 },
    breakdownItem: { fontSize: 12, color: c.textSecondary },
    dot: { marginHorizontal: 6, color: c.border },
    amountRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 2 },
    amountLabel: { fontSize: 11, color: c.textMuted, fontWeight: "500", marginTop: 1 },
    amountValue: { fontSize: 12, fontWeight: "700", color: c.text },
    amountDate: { fontSize: 10, color: c.textMuted, fontWeight: "400", marginTop: 1 },
    cfDebt: {
      fontSize: 11,
      color: c.danger,
      fontWeight: "500",
      marginTop: 4,
    },
    cfCredit: {
      fontSize: 11,
      color: c.success,
      fontWeight: "500",
      marginTop: 4,
    },
    empty: { alignItems: "center", paddingTop: 80 },
    emptyText: { fontSize: 16, color: c.textMuted, marginTop: 16 },
  });
