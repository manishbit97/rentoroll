import {
  assignTenant,
  getMonthlyRent,
  markAsPaid,
  MonthlyRentResult,
  removeTenant,
  saveRentRecord,
  searchTenant,
  TenantSearchResult,
} from "@/services/api";
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
import { toast } from "sonner-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function RentEntryScreen() {
  const params = useLocalSearchParams<{
    roomId: string;
    propertyId: string;
    roomName: string;
    month: string;
    year: string;
  }>();
  const { roomId, propertyId, roomName } = params;

  const now = new Date();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const year = params.year ? parseInt(params.year) : now.getFullYear();
  const isPastMonth =
    year < now.getFullYear() ||
    (year === now.getFullYear() && month < now.getMonth() + 1);

  const [rentResult, setRentResult] = useState<MonthlyRentResult | null>(null);
  const [loading, setLoading] = useState(true);

  const [baseRent, setBaseRent] = useState("");
  const [electricity, setElectricity] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paidDate, setPaidDate] = useState(new Date());
  const [markingPaid, setMarkingPaid] = useState(false);

  // ── Assign tenant modal ────────────────────────────────────────────
  const [assignModal, setAssignModal] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundTenant, setFoundTenant] = useState<TenantSearchResult | null>(
    null,
  );
  const [searchError, setSearchError] = useState("");
  const [assigning, setAssigning] = useState(false);

  // ── Remove tenant dialog ───────────────────────────────────────────
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  // ── Payment amount dialog ──────────────────────────────────────────
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");

  const loadData = useCallback(async () => {
    if (!propertyId || !roomId) return;
    setLoading(true);
    try {
      const results = await getMonthlyRent(propertyId, month, year);
      const found = results.find((r) => r.room.id === roomId);
      if (found) {
        setRentResult(found);
        setBaseRent(
          String(found.rent_record?.base_rent ?? found.room.base_rent),
        );
        setElectricity(String(found.rent_record?.electricity ?? ""));
        setNotes(found.rent_record?.notes ?? "");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [propertyId, roomId, month, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const total = (parseFloat(baseRent) || 0) + (parseFloat(electricity) || 0);

  // ── Handlers ───────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!baseRent || parseFloat(baseRent) <= 0) {
      toast.error("Enter a valid base rent.");
      return;
    }
    setSaving(true);
    try {
      await saveRentRecord({
        room_id: roomId!,
        property_id: propertyId!,
        month,
        year,
        base_rent: parseFloat(baseRent),
        electricity: parseFloat(electricity) || 0,
        notes,
      });
      toast.success("Rent record updated.");
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const openPayDialog = () => {
    if (!rentResult?.rent_record?.id) {
      toast.info("Please save the rent record before marking as paid.");
      return;
    }
    const due = rentResult.rent_record.total ?? total;
    setPayAmount(String(due));
    setPayDialogOpen(true);
  };

  const handleMarkPaid = async () => {
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    setPayDialogOpen(false);
    setMarkingPaid(true);
    try {
      await markAsPaid(
        rentResult!.rent_record!.id,
        paidDate.toISOString().split("T")[0],
        amount,
      );
      const due = rentResult!.rent_record!.total ?? total;
      if (amount >= due) {
        toast.success(`Payment of ₹${amount.toLocaleString("en-IN")} recorded.`);
      } else {
        const remaining = due - amount;
        toast.success(`₹${amount.toLocaleString("en-IN")} recorded. ₹${remaining.toLocaleString("en-IN")} carries to next month.`);
      }
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setMarkingPaid(false);
    }
  };

  const handleSearchTenant = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setFoundTenant(null);
    setSearchError("");
    try {
      const tenant = await searchTenant(searchEmail.trim());
      setFoundTenant(tenant);
    } catch (e: any) {
      setSearchError(e.message ?? "Tenant not found.");
    } finally {
      setSearching(false);
    }
  };

  const handleAssignTenant = async () => {
    if (!foundTenant) return;
    setAssigning(true);
    try {
      await assignTenant(roomId!, foundTenant.id);
      setAssignModal(false);
      setSearchEmail("");
      setFoundTenant(null);
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAssigning(false);
    }
  };

  const doRemoveTenant = async () => {
    try {
      await removeTenant(roomId!);
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const status = rentResult?.rent_record?.status;
  const isPaid = status === "PAID";
  const isPartial = status === "PARTIAL";
  const hasTenant = !!rentResult?.tenant_name;
  const cf = rentResult?.rent_record?.carry_forward ?? 0;
  const paidAmount = rentResult?.rent_record?.paid_amount ?? 0;
  const recordTotal = rentResult?.rent_record?.total ?? total;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ marginTop: 80 }} color="#4f46e5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Flat Management</Text>
          <Text style={styles.headerSub}>
            {roomName} · {MONTHS[month - 1]} {year}
          </Text>
        </View>
        {isPaid && (
          <View style={styles.paidBadge}>
            <Text style={styles.paidBadgeText}>PAID</Text>
          </View>
        )}
        {isPartial && (
          <View style={[styles.paidBadge, { backgroundColor: "#fef3c7" }]}>
            <Text style={[styles.paidBadgeText, { color: "#d97706" }]}>PARTIAL</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Tenant assignment button — toggles between Add / Remove */}
        {hasTenant ? (
          <TouchableOpacity
            style={styles.removeTenantBtn}
            onPress={() => setRemoveDialogOpen(true)}
          >
            <MaterialCommunityIcons
              name="account-remove-outline"
              size={18}
              color="#ef4444"
            />
            <Text style={styles.removeTenantText}>Remove Tenant</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.addTenantBtn}
            onPress={() => setAssignModal(true)}
          >
            <MaterialCommunityIcons
              name="account-plus-outline"
              size={18}
              color="#fff"
            />
            <Text style={styles.addTenantText}>Add Tenant</Text>
          </TouchableOpacity>
        )}

        {/* Occupancy Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Occupancy Details</Text>
          {hasTenant ? (
            <View style={styles.tenantRow}>
              <View style={styles.tenantAvatar}>
                <MaterialCommunityIcons name="account" size={18} color="#fff" />
              </View>
              <Text style={styles.tenantName}>{rentResult?.tenant_name}</Text>
            </View>
          ) : (
            <Text style={styles.noTenant}>
              No tenant assigned — tap "Add Tenant" above
            </Text>
          )}

          <Text style={styles.fieldLabel}>Rent Collection Period</Text>
          <View style={styles.readonlyField}>
            <Text style={styles.readonlyText}>
              {MONTHS[month - 1]} {year}
            </Text>
          </View>
        </View>

        {/* Rent Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rent Breakdown</Text>

          <Text style={styles.fieldLabel}>Base Rent (₹) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 8000"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            value={baseRent}
            onChangeText={setBaseRent}
          />

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
            Electricity Bill (₹)
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 1200"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            value={electricity}
            onChangeText={setElectricity}
          />

          {cf > 0 && (
            <View style={styles.cfRow}>
              <Text style={styles.cfLabel}>↑ Carried from prev month</Text>
              <Text style={styles.cfDebt}>+₹{cf.toLocaleString("en-IN")}</Text>
            </View>
          )}
          {cf < 0 && (
            <View style={styles.cfRow}>
              <Text style={styles.cfLabel}>↓ Credit from prev month</Text>
              <Text style={styles.cfCredit}>−₹{Math.abs(cf).toLocaleString("en-IN")}</Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Due</Text>
            <Text style={styles.totalAmount}>
              ₹{recordTotal.toLocaleString("en-IN")}
            </Text>
          </View>

          {isPartial && (
            <>
              <View style={styles.partialRow}>
                <Text style={styles.partialLabel}>Paid so far</Text>
                <Text style={styles.partialPaid}>₹{paidAmount.toLocaleString("en-IN")}</Text>
              </View>
              <View style={styles.partialRow}>
                <Text style={styles.partialLabel}>Remaining</Text>
                <Text style={styles.partialRemaining}>
                  ₹{(recordTotal - paidAmount).toLocaleString("en-IN")}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Additional Details</Text>
          <Text style={styles.fieldLabel}>Notes</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Any additional notes..."
            placeholderTextColor="#9ca3af"
            multiline
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Payment section — always visible so payments can be recorded or corrected */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isPaid ? "Update Payment" : isPartial ? "Record Payment" : "Record Payment"}
          </Text>
          <Text style={styles.fieldLabel}>Payment Date</Text>
          <TouchableOpacity
            style={styles.datePickerBtn}
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialCommunityIcons name="calendar" size={18} color="#4f46e5" />
            <Text style={styles.datePickerText}>{paidDate.toDateString()}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={paidDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={new Date()}
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) setPaidDate(date);
              }}
            />
          )}

          <TouchableOpacity
            style={[styles.paidBtn, isPaid && styles.paidBtnUpdate, markingPaid && { opacity: 0.6 }]}
            onPress={openPayDialog}
            disabled={markingPaid}
          >
            {markingPaid ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name={isPaid ? "pencil-outline" : "check-circle-outline"}
                  size={18}
                  color="#fff"
                />
                <Text style={styles.paidBtnText}>
                  {isPaid ? "Correct Payment" : "Record Payment"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Payment audit log */}
        {(rentResult?.rent_record?.payment_history?.length ?? 0) > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Log</Text>
            {rentResult!.rent_record!.payment_history!.map((entry, i) => (
              <View key={i} style={styles.logRow}>
                <View style={styles.logLeft}>
                  <Text style={styles.logAction}>
                    {entry.action === "PAYMENT_UPDATED" ? "CORRECTED" : "RECORDED"}
                  </Text>
                  <Text style={styles.logDate}>
                    {new Date(entry.at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </Text>
                  <Text style={styles.logEmail} numberOfLines={1}>{entry.by_email}</Text>
                </View>
                <View style={styles.logRight}>
                  <Text style={styles.logAmount}>₹{entry.amount.toLocaleString("en-IN")}</Text>
                  {entry.prev_amount != null && entry.prev_amount > 0 && (
                    <Text style={styles.logPrev}>was ₹{entry.prev_amount.toLocaleString("en-IN")}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* No-record banner for past months */}
        {isPastMonth && !rentResult?.rent_record && (
          <View style={styles.noRecordBanner}>
            <MaterialCommunityIcons name="information-outline" size={18} color="#6b7280" />
            <Text style={styles.noRecordText}>
              No record exists for {MONTHS[month - 1]} {year}. Fill in the details above and tap Save to create one.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Update</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ── Assign Tenant Modal ──────────────────────────────────────── */}
      <Modal
        visible={assignModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Tenant</Text>
            <TouchableOpacity
              onPress={() => {
                setAssignModal(false);
                setSearchEmail("");
                setFoundTenant(null);
                setSearchError("");
              }}
            >
              <MaterialCommunityIcons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.modalHint}>
              Enter the tenant's registered email address to find and assign
              them to {roomName}.
            </Text>

            {/* Email search */}
            <Text style={styles.fieldLabel}>Tenant Email</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="tenant@example.com"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                keyboardType="email-address"
                value={searchEmail}
                onChangeText={(v) => {
                  setSearchEmail(v);
                  setFoundTenant(null);
                  setSearchError("");
                }}
                onSubmitEditing={handleSearchTenant}
                returnKeyType="search"
              />
              <TouchableOpacity
                style={[styles.searchBtn, searching && { opacity: 0.6 }]}
                onPress={handleSearchTenant}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <MaterialCommunityIcons
                    name="magnify"
                    size={20}
                    color="#fff"
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Error */}
            {searchError ? (
              <View style={styles.errorBanner}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={16}
                  color="#ef4444"
                />
                <Text style={styles.errorText}>{searchError}</Text>
              </View>
            ) : null}

            {/* Found tenant preview */}
            {foundTenant && (
              <View style={styles.tenantCard}>
                <View style={styles.tenantCardAvatar}>
                  <MaterialCommunityIcons
                    name="account"
                    size={24}
                    color="#fff"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tenantCardName}>{foundTenant.name}</Text>
                  <Text style={styles.tenantCardEmail}>
                    {foundTenant.email}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={22}
                  color="#10b981"
                />
              </View>
            )}

            {/* Confirm assign */}
            {foundTenant && (
              <TouchableOpacity
                style={[styles.assignBtn, assigning && { opacity: 0.6 }]}
                onPress={handleAssignTenant}
                disabled={assigning}
              >
                {assigning ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.assignBtnText}>
                    Assign {foundTenant.name} to {roomName}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* ── Payment Amount Dialog ─────────────────────────────────────── */}
      <AlertDialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Record Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Total due: ₹{recordTotal.toLocaleString("en-IN")}. Enter the
              amount received. Any shortfall carries to next month; any excess
              becomes a credit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <TextInput
            style={styles.payInput}
            keyboardType="numeric"
            value={payAmount}
            onChangeText={setPayAmount}
            placeholder="Amount received (₹)"
            placeholderTextColor="#9ca3af"
            selectTextOnFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onPress={handleMarkPaid}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Remove Tenant Dialog ─────────────────────────────────────── */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {rentResult?.tenant_name} from this flat?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction destructive onPress={doRemoveTenant}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SafeAreaView>
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
  paidBadge: {
    backgroundColor: "#d1fae5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidBadgeText: { fontSize: 12, fontWeight: "700", color: "#10b981" },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  addTenantBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  addTenantText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  removeTenantBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  removeTenantText: { color: "#ef4444", fontSize: 15, fontWeight: "600" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
  },
  tenantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  tenantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
  },
  tenantName: { fontSize: 15, color: "#374151", fontWeight: "600" },
  noTenant: { color: "#9ca3af", fontSize: 14, marginBottom: 14 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6b7280",
    marginBottom: 6,
  },
  readonlyField: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  readonlyText: { color: "#374151", fontSize: 15 },
  input: {
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  totalLabel: { fontSize: 15, fontWeight: "600", color: "#374151" },
  totalAmount: { fontSize: 22, fontWeight: "700", color: "#4f46e5" },
  datePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 14,
  },
  datePickerText: { fontSize: 15, color: "#374151", fontWeight: "500" },
  paidBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10b981",
    borderRadius: 10,
    padding: 14,
  },
  paidBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  paidInfo: { fontSize: 15, color: "#10b981", fontWeight: "500" },
  saveBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  // ── Modal styles ──
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
  modalBody: { padding: 20, gap: 16 },
  modalHint: { fontSize: 14, color: "#6b7280", lineHeight: 20 },
  searchRow: { flexDirection: "row", gap: 10 },
  searchBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: { color: "#ef4444", fontSize: 14, fontWeight: "500" },
  tenantCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  tenantCardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
  },
  tenantCardName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  tenantCardEmail: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  assignBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  assignBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  // ── Carry-forward rows ──
  cfRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  cfLabel: { fontSize: 13, color: "#6b7280" },
  cfDebt: { fontSize: 14, fontWeight: "600", color: "#ef4444" },
  cfCredit: { fontSize: 14, fontWeight: "600", color: "#10b981" },
  // ── Partial payment rows ──
  partialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  partialLabel: { fontSize: 13, color: "#6b7280" },
  partialPaid: { fontSize: 14, fontWeight: "600", color: "#10b981" },
  partialRemaining: { fontSize: 14, fontWeight: "600", color: "#f59e0b" },
  // ── Payment input inside dialog ──
  payInput: {
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 16,
    marginBottom: 4,
  },
  // ── Update payment button variant ──
  paidBtnUpdate: { backgroundColor: "#6366f1" },
  // ── Payment audit log ──
  logRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  logLeft: { flex: 1, gap: 2 },
  logAction: { fontSize: 11, fontWeight: "700", color: "#6366f1", letterSpacing: 0.5 },
  logDate: { fontSize: 12, color: "#374151", fontWeight: "500" },
  logEmail: { fontSize: 11, color: "#9ca3af" },
  logRight: { alignItems: "flex-end", gap: 2 },
  logAmount: { fontSize: 14, fontWeight: "700", color: "#111827" },
  logPrev: { fontSize: 11, color: "#9ca3af", textDecorationLine: "line-through" },
  // ── No record banner ──
  noRecordBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  noRecordText: { flex: 1, fontSize: 13, color: "#6b7280", lineHeight: 19 },
});
