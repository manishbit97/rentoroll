import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Alert,
  Clipboard,
  Platform,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { toast } from "sonner-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { clearMyVacatingDate, getMyRent, RentRecord, setMyVacatingDate } from "@/services/api";
import PaymentTimeline from "@/components/PaymentTimeline";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const SHORT_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function TenantHomeScreen() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [records, setRecords] = useState<RentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

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
  }, [month, year]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    const isCurrentOrFuture = year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
    if (isCurrentOrFuture) return;
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  const totalDue = records.reduce((s, r) => s + Math.max(0, r.total - r.paid_amount), 0);

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>My Rent</Text>
        <View style={s.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={s.navBtn}>
            <MaterialCommunityIcons name="chevron-left" size={22} color="#4f46e5" />
          </TouchableOpacity>
          <Text style={s.monthLabel}>{MONTHS[month - 1]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={[s.navBtn, isCurrentMonth && s.navBtnDisabled]} disabled={isCurrentMonth}>
            <MaterialCommunityIcons name="chevron-right" size={22} color={isCurrentMonth ? "#d1d5db" : "#4f46e5"} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color="#4f46e5" />
      ) : (
        <ScrollView
          contentContainerStyle={s.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        >
          {/* Total due banner */}
          {totalDue > 0 && (
            <View style={s.dueBanner}>
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#b45309" />
              <Text style={s.dueBannerText}>Total due this month: <Text style={{ fontWeight: "800" }}>{fmt(totalDue)}</Text></Text>
            </View>
          )}

          {records.length === 0 ? (
            <View style={s.empty}>
              <MaterialCommunityIcons name="home-clock-outline" size={56} color="#d1d5db" />
              <Text style={s.emptyText}>No rent records for {SHORT_MONTHS[month - 1]} {year}</Text>
            </View>
          ) : (
            records.map((r) => (
              <RentCard
                key={r.id}
                record={r}
                expanded={expanded === r.id}
                onToggle={() => setExpanded(expanded === r.id ? null : r.id)}
                onReload={load}
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Rent Card ────────────────────────────────────────────────────────────────
function RentCard({ record: r, expanded, onToggle, onReload }: {
  record: RentRecord;
  expanded: boolean;
  onToggle: () => void;
  onReload: () => void;
}) {
  const due = Math.max(0, r.total - r.paid_amount);
  const isPaid = r.status === "PAID";
  const isPartial = r.status === "PARTIAL";

  const [showVacatingPicker, setShowVacatingPicker] = useState(false);
  const [vacatingPickerDate, setVacatingPickerDate] = useState(new Date());
  const [clearingVacating, setClearingVacating] = useState(false);

  const statusColor = isPaid ? "#10b981" : isPartial ? "#f59e0b" : "#ef4444";
  const statusBg = isPaid ? "#d1fae5" : isPartial ? "#fef3c7" : "#fee2e2";
  const statusLabel = isPaid ? "PAID" : isPartial ? "PARTIAL" : "PENDING";

  const openUpi = () => {
    if (!r.landlord_upi) {
      Alert.alert("UPI not set", "Landlord hasn't added a UPI ID yet.");
      return;
    }
    const url = `upi://pay?pa=${encodeURIComponent(r.landlord_upi)}&pn=${encodeURIComponent(r.landlord_name ?? "Landlord")}&cu=INR`;
    Linking.openURL(url).catch(() =>
      Alert.alert("No UPI app found", "Please install a UPI app like GPay, PhonePe, or Paytm.")
    );
  };

  const copyUpi = () => {
    if (!r.landlord_upi) return;
    Clipboard.setString(r.landlord_upi);
    toast.success("UPI ID copied!");
  };

  const handleSetVacatingDate = async (date: Date) => {
    try {
      await setMyVacatingDate(date.toISOString().split("T")[0]);
      toast.success("Move-out date sent to landlord.");
      onReload();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleClearVacatingDate = async () => {
    setClearingVacating(true);
    try {
      await clearMyVacatingDate();
      toast.success("Move-out notice cancelled.");
      onReload();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setClearingVacating(false);
    }
  };

  return (
    <View style={c.card}>
      {/* Top row — tap to expand */}
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7} style={c.topRow}>
        <View style={c.topLeft}>
          <View style={[c.statusDot, { backgroundColor: statusColor }]} />
          <View>
            <Text style={c.roomName}>{r.room_name || "Room"}</Text>
            <Text style={c.propName}>{r.property_name || ""}</Text>
          </View>
        </View>
        <View style={c.topRight}>
          <Text style={[c.totalAmt, { color: isPaid ? "#10b981" : "#111827" }]}>{fmt(r.total)}</Text>
          <View style={[c.badge, { backgroundColor: statusBg }]}>
            <Text style={[c.badgeText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Breakdown — always visible */}
      <View style={c.breakdown}>
        <BreakdownRow label="Base Rent" value={r.base_rent} />
        {r.electricity > 0 && <BreakdownRow label="Electricity" value={r.electricity} />}
        {r.carry_forward !== 0 && (
          <BreakdownRow
            label={r.carry_forward > 0 ? "Carried Forward (Dues)" : "Carried Forward (Credit)"}
            value={r.carry_forward}
            color={r.carry_forward > 0 ? "#ef4444" : "#10b981"}
          />
        )}
        <View style={c.divider} />
        <View style={c.totalRow}>
          <Text style={c.totalLabel}>Total</Text>
          <Text style={c.totalValue}>{fmt(r.total)}</Text>
        </View>
        {r.paid_amount > 0 && (
          <View style={c.totalRow}>
            <Text style={[c.totalLabel, { color: "#10b981" }]}>Paid</Text>
            <Text style={[c.totalValue, { color: "#10b981" }]}>− {fmt(r.paid_amount)}</Text>
          </View>
        )}
        {due > 0 && (
          <View style={[c.totalRow, c.dueRow]}>
            <Text style={c.dueLabel}>Balance Due</Text>
            <Text style={c.dueValue}>{fmt(due)}</Text>
          </View>
        )}
        {(r.advance_amount ?? 0) > 0 && !r.advance_adjusted && (
          <View style={c.advanceInfo}>
            <MaterialCommunityIcons name="shield-check-outline" size={14} color="#6b7280" />
            <Text style={c.advanceInfoText}>Advance on file: {fmt(r.advance_amount!)}</Text>
          </View>
        )}
        {r.vacating_date && (
          <View style={c.vacatingInfo}>
            <MaterialCommunityIcons name="calendar-remove" size={14} color="#d97706" />
            <Text style={c.vacatingInfoText}>
              Moving out:{" "}
              {new Date(r.vacating_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </Text>
          </View>
        )}
      </View>

      {/* Expandable section */}
      {expanded && (
        <View style={c.expanded}>
          {/* Payment history */}
          {r.payment_history && r.payment_history.length > 0 && (
            <View style={c.section}>
              <Text style={c.sectionTitle}>Payment History</Text>
              <PaymentTimeline entries={r.payment_history} />
            </View>
          )}

          {/* Notes */}
          {r.notes ? (
            <View style={c.section}>
              <Text style={c.sectionTitle}>Notes</Text>
              <Text style={c.notesText}>{r.notes}</Text>
            </View>
          ) : null}

          {/* Vacating notice */}
          {r.vacating_date ? (
            <View style={[c.section, c.vacatingSection]}>
              <MaterialCommunityIcons name="calendar-remove" size={16} color="#d97706" />
              <Text style={c.vacatingText}>
                Move-out notice sent:{" "}
                {new Date(r.vacating_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </Text>
              <TouchableOpacity onPress={handleClearVacatingDate} disabled={clearingVacating}>
                <Text style={c.vacatingCancelLink}>{clearingVacating ? "…" : "Cancel"}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={c.section}>
              <TouchableOpacity onPress={() => setShowVacatingPicker(true)} style={c.moveoutLink}>
                <MaterialCommunityIcons name="calendar-plus" size={14} color="#9ca3af" />
                <Text style={c.moveoutLinkText}>Moving out? Let your landlord know</Text>
              </TouchableOpacity>
              {showVacatingPicker && (
                <DateTimePicker
                  value={vacatingPickerDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  minimumDate={new Date(Date.now() + 86400000)}
                  onChange={(_, date) => {
                    setShowVacatingPicker(false);
                    if (date) {
                      setVacatingPickerDate(date);
                      handleSetVacatingDate(date);
                    }
                  }}
                />
              )}
            </View>
          )}

          {/* UPI Pay */}
          {!isPaid && (
            <View style={c.section}>
              <Text style={c.sectionTitle}>Pay Rent</Text>
              {r.landlord_upi ? (
                <>
                  <View style={c.upiRow}>
                    <MaterialCommunityIcons name="contactless-payment" size={18} color="#6b7280" />
                    <Text style={c.upiId}>{r.landlord_upi}</Text>
                    <TouchableOpacity onPress={copyUpi} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <MaterialCommunityIcons name="content-copy" size={18} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={c.upiBtn} onPress={openUpi} activeOpacity={0.85}>
                    <MaterialCommunityIcons name="bank-transfer" size={20} color="#fff" />
                    <Text style={c.upiBtnText}>Pay via UPI</Text>
                  </TouchableOpacity>
                  <Text style={c.upiHint}>Opens GPay / PhonePe / Paytm. Enter amount on the UPI app.</Text>
                </>
              ) : (
                <Text style={c.noUpi}>Landlord hasn't set a UPI ID yet.</Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Expand toggle */}
      <TouchableOpacity onPress={onToggle} style={c.expandBtn}>
        <MaterialCommunityIcons name={expanded ? "chevron-up" : "chevron-down"} size={18} color="#9ca3af" />
        <Text style={c.expandText}>{expanded ? "Less" : "Details & Pay"}</Text>
      </TouchableOpacity>
    </View>
  );
}

function BreakdownRow({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={c.bRow}>
      <Text style={c.bLabel}>{label}</Text>
      <Text style={[c.bValue, color ? { color } : null]}>
        {value < 0 ? `− ₹${Math.abs(value).toLocaleString("en-IN")}` : fmt(value)}
      </Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#111827" },
  monthNav: { flexDirection: "row", alignItems: "center", gap: 12 },
  navBtn: { padding: 4 },
  navBtnDisabled: { opacity: 0.3 },
  monthLabel: { fontSize: 15, fontWeight: "600", color: "#111827", minWidth: 130, textAlign: "center" },
  content: { padding: 16, gap: 12 },
  dueBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fffbeb",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  dueBannerText: { fontSize: 14, color: "#92400e" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 15, color: "#9ca3af", marginTop: 16, textAlign: "center" },
});

const c = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  roomName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  propName: { fontSize: 12, color: "#9ca3af", marginTop: 1 },
  topRight: { alignItems: "flex-end", gap: 4 },
  totalAmt: { fontSize: 18, fontWeight: "800" },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  breakdown: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 12,
    gap: 6,
  },
  bRow: { flexDirection: "row", justifyContent: "space-between" },
  bLabel: { fontSize: 13, color: "#6b7280" },
  bValue: { fontSize: 13, fontWeight: "600", color: "#111827" },
  divider: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 4 },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { fontSize: 14, fontWeight: "600", color: "#374151" },
  totalValue: { fontSize: 14, fontWeight: "700", color: "#111827" },
  dueRow: { backgroundColor: "#fef2f2", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, marginTop: 4 },
  dueLabel: { fontSize: 14, fontWeight: "700", color: "#ef4444" },
  dueValue: { fontSize: 14, fontWeight: "800", color: "#ef4444" },
  expanded: { borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.8, marginBottom: 10, textTransform: "uppercase" },
  notesText: { fontSize: 14, color: "#6b7280", fontStyle: "italic", lineHeight: 20 },
  upiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  upiId: { flex: 1, fontSize: 15, fontWeight: "600", color: "#111827" },
  upiBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    paddingVertical: 14,
  },
  upiBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  upiHint: { fontSize: 12, color: "#9ca3af", textAlign: "center", marginTop: 8 },
  noUpi: { fontSize: 14, color: "#9ca3af", fontStyle: "italic" },
  expandBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  expandText: { fontSize: 13, color: "#9ca3af", fontWeight: "500" },
  advanceInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  advanceInfoText: { fontSize: 12, color: "#6b7280" },
  vacatingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  vacatingInfoText: { fontSize: 12, color: "#d97706", fontWeight: "500" },
  vacatingSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fffbeb",
    borderRadius: 0,
    flexWrap: "wrap",
  },
  vacatingText: { flex: 1, fontSize: 13, color: "#92400e" },
  vacatingCancelLink: { fontSize: 13, color: "#4f46e5", fontWeight: "600" },
  moveoutLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  moveoutLinkText: { fontSize: 13, color: "#9ca3af" },
});
