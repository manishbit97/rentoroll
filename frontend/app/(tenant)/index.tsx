import PaymentTimeline from "@/components/PaymentTimeline";
import { useTheme } from "@/contexts/ThemeContext";
import { clearMyVacatingDate, getMyRent, RentRecord, setMyVacatingDate } from "@/services/api";
import { AppColors } from "@/theme/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import Logo from "@/assets/images/logo.svg";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function TenantHomeScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={styles.logoRow}>
            <View style={[styles.logoWrap, { backgroundColor: colors.primary }]}>
              <Logo width={18} height={18} />
            </View>
            <Text style={styles.logoText}>RentoRoll</Text>
          </View>
          <TouchableOpacity onPress={toggleTheme} style={{ padding: 4 }}>
            <MaterialCommunityIcons
              name={isDark ? "weather-sunny" : "weather-night"}
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTHS[month - 1]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={[styles.navBtn, isCurrentMonth && styles.navBtnDisabled]} disabled={isCurrentMonth}>
            <MaterialCommunityIcons name="chevron-right" size={22} color={isCurrentMonth ? colors.border : colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        >
          {/* Total due banner */}
          {totalDue > 0 && (
            <View style={styles.dueBanner}>
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.warningText} />
              <Text style={styles.dueBannerText}>Total due this month: <Text style={{ fontWeight: "800" }}>{fmt(totalDue)}</Text></Text>
            </View>
          )}

          {records.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="home-outline" size={56} color={colors.border} />
              <Text style={styles.emptyText}>No rent records for {SHORT_MONTHS[month - 1]} {year}</Text>
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const due = Math.max(0, r.total - r.paid_amount);
  const isPaid = r.status === "PAID";
  const isPartial = r.status === "PARTIAL";

  const [showVacatingPicker, setShowVacatingPicker] = useState(false);
  const [vacatingPickerDate, setVacatingPickerDate] = useState(new Date());
  const [clearingVacating, setClearingVacating] = useState(false);

  const statusColor = isPaid ? colors.success : isPartial ? colors.warningAlt : colors.danger;
  const statusBg = isPaid ? colors.successBg : isPartial ? colors.warningBg : colors.dangerBg;
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
    <View style={styles.card}>
      {/* Top row — tap to expand */}
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7} style={styles.topRow}>
        <View style={styles.topLeft}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <View>
            <Text style={styles.roomName}>{r.room_name || "Room"}</Text>
            <Text style={styles.propName}>{r.property_name || ""}</Text>
          </View>
        </View>
        <View style={styles.topRight}>
          <Text style={[styles.totalAmt, { color: isPaid ? colors.success : colors.text }]}>{fmt(r.total)}</Text>
          <View style={[styles.badge, { backgroundColor: statusBg }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Breakdown — always visible */}
      <View style={styles.breakdown}>
        <BreakdownRow label="Base Rent" value={r.base_rent} />
        {r.electricity > 0 && <BreakdownRow label="Electricity" value={r.electricity} />}
        {r.carry_forward !== 0 && (
          <BreakdownRow
            label={r.carry_forward > 0 ? "Carried Forward (Dues)" : "Carried Forward (Credit)"}
            value={r.carry_forward}
            color={r.carry_forward > 0 ? colors.danger : colors.success}
          />
        )}
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{fmt(r.total)}</Text>
        </View>
        {r.paid_amount > 0 && (
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.success }]}>Paid</Text>
            <Text style={[styles.totalValue, { color: colors.success }]}>− {fmt(r.paid_amount)}</Text>
          </View>
        )}
        {due > 0 && (
          <View style={[styles.totalRow, styles.dueRow]}>
            <Text style={styles.dueLabel}>Balance Due</Text>
            <Text style={styles.dueValue}>{fmt(due)}</Text>
          </View>
        )}
        {(r.advance_amount ?? 0) > 0 && !r.advance_adjusted && (
          <View style={styles.advanceInfo}>
            <MaterialCommunityIcons name="shield-check-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.advanceInfoText}>Advance on file: {fmt(r.advance_amount!)}</Text>
          </View>
        )}
        {r.vacating_date && (
          <View style={styles.vacatingInfo}>
            <MaterialCommunityIcons name="calendar-remove" size={14} color={colors.warning} />
            <Text style={styles.vacatingInfoText}>
              Moving out:{" "}
              {new Date(r.vacating_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </Text>
          </View>
        )}
      </View>

      {/* Expandable section */}
      {expanded && (
        <View style={styles.expanded}>
          {r.payment_history && r.payment_history.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment History</Text>
              <PaymentTimeline entries={r.payment_history} />
            </View>
          )}

          {r.notes ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{r.notes}</Text>
            </View>
          ) : null}

          {r.vacating_date ? (
            <View style={[styles.section, styles.vacatingSection]}>
              <MaterialCommunityIcons name="calendar-remove" size={16} color={colors.warning} />
              <Text style={styles.vacatingText}>
                Move-out notice sent:{" "}
                {new Date(r.vacating_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </Text>
              <TouchableOpacity onPress={handleClearVacatingDate} disabled={clearingVacating}>
                <Text style={styles.vacatingCancelLink}>{clearingVacating ? "…" : "Cancel"}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.section}>
              <TouchableOpacity onPress={() => setShowVacatingPicker(true)} style={styles.moveoutLink}>
                <MaterialCommunityIcons name="calendar-plus" size={14} color={colors.textMuted} />
                <Text style={styles.moveoutLinkText}>Moving out? Let your landlord know</Text>
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

          {!isPaid && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pay Rent</Text>
              {r.landlord_upi ? (
                <>
                  <View style={styles.upiRow}>
                    <MaterialCommunityIcons name="contactless-payment" size={18} color={colors.textSecondary} />
                    <Text style={styles.upiId}>{r.landlord_upi}</Text>
                    <TouchableOpacity onPress={copyUpi} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <MaterialCommunityIcons name="content-copy" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.upiBtn} onPress={openUpi} activeOpacity={0.85}>
                    <MaterialCommunityIcons name="bank-transfer" size={20} color="#fff" />
                    <Text style={styles.upiBtnText}>Pay via UPI</Text>
                  </TouchableOpacity>
                  <Text style={styles.upiHint}>Opens GPay / PhonePe / Paytm. Enter amount on the UPI app.</Text>
                </>
              ) : (
                <Text style={styles.noUpi}>Landlord hasn't set a UPI ID yet.</Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Expand toggle */}
      <TouchableOpacity onPress={onToggle} style={styles.expandBtn}>
        <MaterialCommunityIcons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.textMuted} />
        <Text style={styles.expandText}>{expanded ? "Less" : "Details & Pay"}</Text>
      </TouchableOpacity>
    </View>
  );
}

function BreakdownRow({ label, value, color }: { label: string; value: number; color?: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.bRow}>
      <Text style={styles.bLabel}>{label}</Text>
      <Text style={[styles.bValue, color ? { color } : null]}>
        {value < 0 ? `− ₹${Math.abs(value).toLocaleString("en-IN")}` : fmt(value)}
      </Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const createStyles = (c: AppColors) => StyleSheet.create({
  // Screen
  safe: { flex: 1, backgroundColor: c.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    gap: 10,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: 20, fontWeight: "800", color: c.text, letterSpacing: -0.5 },
  monthNav: { flexDirection: "row", alignItems: "center", gap: 12 },
  navBtn: { padding: 4 },
  navBtnDisabled: { opacity: 0.3 },
  monthLabel: { fontSize: 15, fontWeight: "600", color: c.text, minWidth: 130, textAlign: "center" },
  content: { padding: 16, gap: 12 },
  dueBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: c.warningBg,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: c.warningBorder,
  },
  dueBannerText: { fontSize: 14, color: c.warningText },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 15, color: c.textMuted, marginTop: 16, textAlign: "center" },
  // Card
  card: {
    backgroundColor: c.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
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
  roomName: { fontSize: 16, fontWeight: "700", color: c.text },
  propName: { fontSize: 12, color: c.textMuted, marginTop: 1 },
  topRight: { alignItems: "flex-end", gap: 4 },
  totalAmt: { fontSize: 18, fontWeight: "800" },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  breakdown: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: c.borderLight,
    paddingTop: 12,
    gap: 6,
  },
  bRow: { flexDirection: "row", justifyContent: "space-between" },
  bLabel: { fontSize: 13, color: c.textSecondary },
  bValue: { fontSize: 13, fontWeight: "600", color: c.text },
  divider: { height: 1, backgroundColor: c.border, marginVertical: 4 },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { fontSize: 14, fontWeight: "600", color: c.textBody },
  totalValue: { fontSize: 14, fontWeight: "700", color: c.text },
  dueRow: { backgroundColor: c.dangerBgAlt, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, marginTop: 4 },
  dueLabel: { fontSize: 14, fontWeight: "700", color: c.danger },
  dueValue: { fontSize: 14, fontWeight: "800", color: c.danger },
  expanded: { borderTopWidth: 1, borderTopColor: c.borderLight },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: c.borderLight },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: c.textMuted, letterSpacing: 0.8, marginBottom: 10, textTransform: "uppercase" },
  notesText: { fontSize: 14, color: c.textSecondary, fontStyle: "italic", lineHeight: 20 },
  upiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: c.surfaceAlt,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 12,
  },
  upiId: { flex: 1, fontSize: 15, fontWeight: "600", color: c.text },
  upiBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: c.primary,
    borderRadius: 10,
    paddingVertical: 14,
  },
  upiBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  upiHint: { fontSize: 12, color: c.textMuted, textAlign: "center", marginTop: 8 },
  noUpi: { fontSize: 14, color: c.textMuted, fontStyle: "italic" },
  expandBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: c.borderLight,
  },
  expandText: { fontSize: 13, color: c.textMuted, fontWeight: "500" },
  advanceInfo: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  advanceInfoText: { fontSize: 12, color: c.textSecondary },
  vacatingInfo: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  vacatingInfoText: { fontSize: 12, color: c.warning, fontWeight: "500" },
  vacatingSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: c.warningBg,
    borderRadius: 0,
    flexWrap: "wrap",
  },
  vacatingText: { flex: 1, fontSize: 13, color: c.warningText },
  vacatingCancelLink: { fontSize: 13, color: c.primary, fontWeight: "600" },
  moveoutLink: { flexDirection: "row", alignItems: "center", gap: 6 },
  moveoutLinkText: { fontSize: 13, color: c.textMuted },
});
