import PaymentTimeline from "@/components/PaymentTimeline";
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
import InitialsAvatar from "@/components/ui/InitialsAvatar";
import { useTheme } from "@/contexts/ThemeContext";
import {
  applyAdvance,
  applyRentIncrease,
  assignTenant,
  clearVacatingDate,
  getMonthlyRent,
  markAsPaid,
  MonthlyRentResult,
  removeTenant,
  saveRentRecord,
  searchTenant,
  setVacatingDate,
  TenantSearchResult,
  updateAdvance,
} from "@/services/api";
import { AppColors } from "@/theme/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { TextInput as PaperInput } from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

function shortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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

  // ── Advance / deposit state ────────────────────────────────────────
  const [advanceEdit, setAdvanceEdit] = useState("0");
  const [savingAdvance, setSavingAdvance] = useState(false);
  const [isEditingDeposit, setIsEditingDeposit] = useState(false);
  const [applyAdvanceDialogOpen, setApplyAdvanceDialogOpen] = useState(false);
  const [applyingAdvance, setApplyingAdvance] = useState(false);

  // ── Vacating date state ────────────────────────────────────────────
  const [showVacatingPicker, setShowVacatingPicker] = useState(false);
  const [vacatingPickerDate, setVacatingPickerDate] = useState(new Date());
  const [clearingVacating, setClearingVacating] = useState(false);

  // ── Payment method selector ───────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<
    "Bank" | "Cash" | "UPI" | null
  >(null);

  // ── Rent increase modal ────────────────────────────────────────────
  const [increaseModalOpen, setIncreaseModalOpen] = useState(false);
  const [newBaseRent, setNewBaseRent] = useState("");
  const [increaseFromMonth, setIncreaseFromMonth] = useState(
    now.getMonth() + 1,
  );
  const [increaseFromYear, setIncreaseFromYear] = useState(now.getFullYear());
  const [applyingIncrease, setApplyingIncrease] = useState(false);

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
        setAdvanceEdit(String(found.advance_amount ?? 0));
        setNewBaseRent(String(found.room.base_rent));
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
      const notesWithMethod = paymentMethod
        ? `${notes}${notes ? " " : ""}[${paymentMethod}]`
        : notes;
      await saveRentRecord({
        room_id: roomId!,
        property_id: propertyId!,
        month,
        year,
        base_rent: parseFloat(baseRent),
        electricity: parseFloat(electricity) || 0,
        notes: notesWithMethod,
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
    // Pre-fill with existing paid_amount when correcting so landlord
    // can see what was last recorded and update from there
    const prefill =
      paidAmount > 0 ? paidAmount : (rentResult.rent_record.total ?? total);
    setPayAmount(String(prefill));
    setPayDialogOpen(true);
  };

  const handleMarkPaid = async () => {
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount < 0) {
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
        toast.success(
          `Payment of ₹${amount.toLocaleString("en-IN")} recorded.`,
        );
      } else {
        const remaining = due - amount;
        toast.success(
          `₹${amount.toLocaleString("en-IN")} recorded. ₹${remaining.toLocaleString("en-IN")} carries to next month.`,
        );
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
  const advanceAmount = rentResult?.advance_amount ?? 0;
  const advanceAdjusted = rentResult?.advance_adjusted ?? false;
  const vacatingDate = rentResult?.vacating_date ?? null;
  const vacatingSetBy = rentResult?.vacating_set_by ?? null;

  const handleSaveAdvance = async () => {
    const amount = parseFloat(advanceEdit);
    if (isNaN(amount) || amount < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSavingAdvance(true);
    try {
      await updateAdvance(roomId!, amount);
      toast.success("Security deposit updated.");
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingAdvance(false);
    }
  };

  const handleApplyAdvance = async () => {
    if (!rentResult?.rent_record?.id) return;
    setApplyAdvanceDialogOpen(false);
    setApplyingAdvance(true);
    try {
      const result = await applyAdvance(rentResult.rent_record.id);
      if (result.refund > 0) {
        toast.success(
          `Advance applied. ₹${result.refund.toLocaleString("en-IN")} refund due to tenant.`,
        );
      } else if (result.shortfall > 0) {
        toast.success(
          `Advance applied. ₹${result.shortfall.toLocaleString("en-IN")} still owed.`,
        );
      } else {
        toast.success("Advance applied. Balance fully settled.");
      }
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setApplyingAdvance(false);
    }
  };

  const handleSetVacatingDate = async (date: Date) => {
    try {
      await setVacatingDate(roomId!, date.toISOString().split("T")[0]);
      toast.success("Move-out date set.");
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleClearVacatingDate = async () => {
    setClearingVacating(true);
    try {
      await clearVacatingDate(roomId!);
      toast.success("Move-out date cancelled.");
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setClearingVacating(false);
    }
  };

  const handleApplyRentIncrease = async () => {
    const rent = parseFloat(newBaseRent);
    if (isNaN(rent) || rent <= 0) {
      toast.error("Enter a valid rent amount.");
      return;
    }
    setApplyingIncrease(true);
    try {
      const result = await applyRentIncrease(
        roomId!,
        rent,
        increaseFromMonth,
        increaseFromYear,
      );
      setIncreaseModalOpen(false);
      toast.success(
        `Rent updated. ${result.updated_count} record(s) repriced.`,
      );
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setApplyingIncrease(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.text}
          />
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
          <View style={styles.partialBadge}>
            <Text style={styles.partialBadgeText}>PARTIAL</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Add Tenant button — only shown when vacant */}
        {!hasTenant && (
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
              <InitialsAvatar name={rentResult?.tenant_name ?? "?"} size={36} />
              <View>
                <Text style={styles.tenantName}>{rentResult?.tenant_name}</Text>
                {rentResult?.tenant_email ? (
                  <Text style={styles.tenantEmail}>{rentResult.tenant_email}</Text>
                ) : null}
                <Text style={styles.tenantBadge}>Active Lease</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noTenant}>No tenant assigned</Text>
          )}

          {hasTenant && (
            <>
              {/* Security Deposit row */}
              <View style={styles.depositRow}>
                <Text style={styles.depositLabel}>Security Deposit</Text>
                {advanceAdjusted ? (
                  <View style={styles.appliedBadge}>
                    <Text style={styles.appliedBadgeText}>Applied</Text>
                  </View>
                ) : isEditingDeposit ? (
                  <PaperInput
                    mode="outlined"
                    keyboardType="numeric"
                    value={advanceEdit}
                    onChangeText={setAdvanceEdit}
                    onBlur={() => { setIsEditingDeposit(false); handleSaveAdvance(); }}
                    autoFocus
                    dense
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    textColor={colors.text}
                    style={{ width: 120, height: 40, backgroundColor: colors.surface }}
                    right={savingAdvance ? <PaperInput.Icon icon="loading" /> : undefined}
                  />
                ) : (
                  <View style={styles.depositEditRow}>
                    <Text style={styles.depositValue}>₹{parseFloat(advanceEdit || "0").toLocaleString("en-IN")}</Text>
                    <TouchableOpacity onPress={() => setIsEditingDeposit(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Vacating date */}
              {vacatingDate ? (
                <View style={styles.vacatingBanner}>
                  <MaterialCommunityIcons
                    name="calendar-remove"
                    size={15}
                    color={colors.warning}
                  />
                  <Text style={styles.vacatingBannerText}>
                    Moving out: {shortDate(vacatingDate)} (set by{" "}
                    {vacatingSetBy === "tenant" ? "Tenant" : "You"})
                  </Text>
                  <TouchableOpacity
                    onPress={handleClearVacatingDate}
                    disabled={clearingVacating}
                  >
                    <Text style={styles.vacatingCancelLink}>
                      {clearingVacating ? "…" : "Cancel"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.setMoveoutBtn}>
                  <Text style={styles.setMoveoutText}>Set notice period(exit)</Text>
                  <MaterialCommunityIcons
                    name="pencil"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <TouchableOpacity
                    style={StyleSheet.absoluteFillObject}
                    onPress={() => setShowVacatingPicker(true)}
                  />
                </View>
              )}

              <DatePickerModal
                locale="en"
                mode="single"
                visible={showVacatingPicker}
                onDismiss={() => setShowVacatingPicker(false)}
                date={vacatingPickerDate}
                validRange={{ startDate: new Date(Date.now() + 86400000) }}
                onConfirm={({ date }) => {
                  setShowVacatingPicker(false);
                  if (date) {
                    setVacatingPickerDate(date);
                    handleSetVacatingDate(date);
                  }
                }}
              />
            </>
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
          {/* Total payable header */}
          <Text style={styles.totalLabel}>TOTAL PAYABLE</Text>
          <Text style={styles.totalAmount}>
            ₹{recordTotal.toLocaleString("en-IN")}
          </Text>

          {/* Paid / Remaining status cards */}
          {paidAmount > 0 && (
            <View style={styles.paidStatusCard}>
              <MaterialCommunityIcons
                name="check-circle"
                size={18}
                color={colors.success}
              />
              <Text style={styles.paidStatusLabel}>Paid Amount</Text>
              <Text style={styles.paidStatusValue}>
                ₹{paidAmount.toLocaleString("en-IN")}
              </Text>
            </View>
          )}
          {isPartial && (
            <View style={styles.dueStatusCard}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={18}
                color={colors.danger}
              />
              <Text style={styles.dueStatusLabel}>Remaining Due</Text>
              <Text style={styles.dueStatusValue}>
                +₹{(recordTotal - paidAmount).toLocaleString("en-IN")}
              </Text>
            </View>
          )}

          {/* Section label */}
          <Text style={styles.breakdownSectionLabel}>RENT BREAKDOWN</Text>

          {/* Base Rent item */}
          <View style={styles.breakdownItem}>
            <View
              style={[
                styles.itemIconCircle,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <MaterialCommunityIcons
                name="home"
                size={16}
                color={colors.primary}
              />
            </View>
            <Text style={styles.itemLabel}>Base Rent</Text>
            <View style={styles.itemRight}>
              <View style={styles.itemInputBox}>
                <Text style={styles.itemRupee}>₹</Text>
                <TextInput
                  style={styles.itemInput}
                  keyboardType="numeric"
                  value={baseRent}
                  onChangeText={setBaseRent}
                  placeholderTextColor={colors.inputPlaceholder}
                  placeholder="0"
                  underlineColorAndroid="transparent"
                />
              </View>
              <MaterialCommunityIcons
                name="pencil"
                size={14}
                color={colors.primary}
              />
            </View>
          </View>

          {/* Electricity item */}
          <View style={styles.breakdownItem}>
            <View
              style={[
                styles.itemIconCircle,
                { backgroundColor: colors.successBg },
              ]}
            >
              <MaterialCommunityIcons
                name="flash"
                size={16}
                color={colors.success}
              />
            </View>
            <Text style={styles.itemLabel}>Electricity</Text>
            <View style={styles.itemRight}>
              <View style={styles.itemInputBox}>
                <Text style={styles.itemRupee}>₹</Text>
                <TextInput
                  style={styles.itemInput}
                  keyboardType="numeric"
                  value={electricity}
                  onChangeText={setElectricity}
                  placeholderTextColor={colors.inputPlaceholder}
                  placeholder="0"
                  underlineColorAndroid="transparent"
                />
              </View>
              <MaterialCommunityIcons
                name="pencil"
                size={14}
                color={colors.primary}
              />
            </View>
          </View>

          {/* Carry forward banner */}
          {cf !== 0 && (
            <View style={styles.cfBanner}>
              <MaterialCommunityIcons
                name={cf > 0 ? "arrow-up" : "arrow-down"}
                size={15}
                color={cf > 0 ? colors.danger : colors.success}
              />
              <Text style={styles.cfBannerLabel}>
                {cf > 0 ? "Carried from prev month" : "Credit from prev month"}
              </Text>
              <Text
                style={[
                  styles.cfBannerValue,
                  { color: cf > 0 ? colors.danger : colors.success },
                ]}
              >
                {cf > 0 ? "+" : "−"}₹{Math.abs(cf).toLocaleString("en-IN")}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.updateRentLink}
            onPress={() => setIncreaseModalOpen(true)}
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.updateRentLinkText}>
              Update base rent from month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Additional Details</Text>
          <PaperInput
            mode="outlined"
            label="Notes"
            placeholder="Any additional notes..."
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            textColor={colors.text}
            style={{ backgroundColor: colors.surface }}
          />
        </View>

        {/* Payment section — always visible so payments can be recorded or corrected */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isPaid
              ? "Update Payment"
              : isPartial
                ? "Record Payment"
                : "Record Payment"}
          </Text>
          <Text style={styles.fieldLabel}>Payment Date</Text>
          <TouchableOpacity
            style={styles.datePickerBtn}
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialCommunityIcons name="calendar" size={18} color={colors.primary} />
            <Text style={styles.datePickerText}>{paidDate.toDateString()}</Text>
          </TouchableOpacity>

          <DatePickerModal
            locale="en"
            mode="single"
            visible={showDatePicker}
            onDismiss={() => setShowDatePicker(false)}
            date={paidDate}
            validRange={{ endDate: new Date() }}
            onConfirm={({ date }) => {
              setShowDatePicker(false);
              if (date) setPaidDate(date);
            }}
          />

          {/* Payment method selector */}
          <Text style={[styles.fieldLabel, { marginBottom: 8 }]}>
            How was it paid?
          </Text>
          <View style={styles.methodRow}>
            {(["Bank", "Cash", "UPI"] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.methodBtn,
                  paymentMethod === m && styles.methodBtnActive,
                ]}
                onPress={() => setPaymentMethod(paymentMethod === m ? null : m)}
              >
                <Text
                  style={[
                    styles.methodBtnText,
                    paymentMethod === m && styles.methodBtnTextActive,
                  ]}
                >
                  {m === "Bank"
                    ? "🏦 Bank"
                    : m === "Cash"
                      ? "💵 Cash"
                      : "📱 UPI"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {advanceAmount > 0 && !advanceAdjusted && !isPaid && (
            <TouchableOpacity
              style={[
                styles.applyAdvanceBtn,
                applyingAdvance && { opacity: 0.6 },
              ]}
              onPress={() => setApplyAdvanceDialogOpen(true)}
              disabled={applyingAdvance}
            >
              {applyingAdvance ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="bank-transfer"
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.applyAdvanceBtnText}>
                    Apply Advance (₹{advanceAmount.toLocaleString("en-IN")})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.paidBtn,
              isPaid && styles.paidBtnUpdate,
              markingPaid && { opacity: 0.6 },
            ]}
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
            <PaymentTimeline
              entries={rentResult!.rent_record!.payment_history!}
              showEmail
            />
          </View>
        )}

        {/* No-record banner for past months */}
        {isPastMonth && !rentResult?.rent_record && (
          <View style={styles.noRecordBanner}>
            <MaterialCommunityIcons
              name="information-outline"
              size={18}
              color={colors.textSecondary}
            />
            <Text style={styles.noRecordText}>
              No record exists for {MONTHS[month - 1]} {year}. Fill in the
              details above and tap Save to create one.
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

        {/* Remove Tenant — low-intent, bottom of page */}
        {hasTenant && (
          <TouchableOpacity
            style={styles.removeTenantLink}
            onPress={() => setRemoveDialogOpen(true)}
          >
            <MaterialCommunityIcons
              name="account-remove-outline"
              size={15}
              color={colors.textMuted}
            />
            <Text style={styles.removeTenantLinkText}>
              Remove tenant from this flat
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ── Assign Tenant Modal ──────────────────────────────────────── */}
      <Modal
        visible={assignModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
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
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.modalHint}>
              Enter the tenant's registered email address to find and assign
              them to {roomName}.
            </Text>

            {/* Email search */}
            <View style={styles.searchRow}>
              <PaperInput
                mode="outlined"
                label="Tenant Email"
                placeholder="tenant@example.com"
                style={{ flex: 1, backgroundColor: colors.surface }}
                autoCapitalize="none"
                keyboardType="email-address"
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                textColor={colors.text}
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
                  color={colors.danger}
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
                  color={colors.success}
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
            <AlertDialogTitle>
              {paidAmount > 0 ? "Correct Payment" : "Record Payment"}
            </AlertDialogTitle>
          </AlertDialogHeader>

          {/* "Replaces, not adds" warning — shown only when correcting */}
          {paidAmount > 0 && (
            <View style={styles.payWarn}>
              <MaterialCommunityIcons
                name="information-outline"
                size={15}
                color={colors.warningText}
                style={{ marginTop: 1 }}
              />
              <Text style={styles.payWarnText}>
                This <Text style={{ fontWeight: "700" }}>replaces</Text> the
                previously recorded{" "}
                <Text style={{ fontWeight: "700" }}>
                  ₹{paidAmount.toLocaleString("en-IN")}
                </Text>{" "}
                — it does not add to it. Enter the{" "}
                <Text style={{ fontWeight: "700" }}>total</Text> received so
                far.
              </Text>
            </View>
          )}

          {/* Total due reference row */}
          <View style={styles.payMeta}>
            <Text style={styles.payMetaLabel}>Total due</Text>
            <Text style={styles.payMetaValue}>
              ₹{recordTotal.toLocaleString("en-IN")}
            </Text>
          </View>

          {/* Amount input */}
          <PaperInput
            mode="outlined"
            label="Total received (₹)"
            keyboardType="numeric"
            value={payAmount}
            onChangeText={setPayAmount}
            selectTextOnFocus
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            textColor={colors.text}
            style={{ backgroundColor: colors.surface }}
          />

          {/* Live outcome preview */}
          {(() => {
            const entered = parseFloat(payAmount);
            if (isNaN(entered) || entered < 0) return null;
            if (entered === 0 && paidAmount === 0) return null;
            const diff = entered - recordTotal;
            let icon: any, color: string, msg: string;
            if (diff >= 0) {
              icon = "check-circle-outline";
              color = colors.success;
              msg =
                diff > 0
                  ? `Fully paid + ₹${diff.toLocaleString("en-IN")} credit rolls to next month`
                  : "Marks this month as fully paid";
            } else {
              icon = "arrow-right-circle-outline";
              color = colors.warningAlt;
              msg = `₹${Math.abs(diff).toLocaleString("en-IN")} shortfall carries to next month`;
            }
            return (
              <View style={styles.payPreview}>
                <MaterialCommunityIcons name={icon} size={15} color={color} />
                <Text style={[styles.payPreviewText, { color }]}>{msg}</Text>
              </View>
            );
          })()}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onPress={handleMarkPaid}>
              Confirm
            </AlertDialogAction>
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

      {/* ── Apply Advance Dialog ──────────────────────────────────────── */}
      <AlertDialog
        open={applyAdvanceDialogOpen}
        onOpenChange={setApplyAdvanceDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply Security Deposit</AlertDialogTitle>
            <AlertDialogDescription>
              Apply ₹{advanceAmount.toLocaleString("en-IN")} advance toward this
              month's rent? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onPress={handleApplyAdvance}>
              Apply
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Rent Increase Modal ───────────────────────────────────────── */}
      <Modal
        visible={increaseModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Base Rent</Text>
            <TouchableOpacity onPress={() => setIncreaseModalOpen(false)}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.modalHint}>
              Update the base rent for this flat. Changes apply to all unpaid
              records from the selected month onwards.
            </Text>
            <PaperInput
              mode="outlined"
              label="New Base Rent (₹)"
              placeholder="e.g. 12000"
              keyboardType="numeric"
              value={newBaseRent}
              onChangeText={setNewBaseRent}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
              style={{ backgroundColor: colors.surface }}
            />
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
              Effective From Month
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <PaperInput
                mode="outlined"
                label="Month (1–12)"
                style={{ flex: 1, backgroundColor: colors.surface }}
                keyboardType="numeric"
                value={String(increaseFromMonth)}
                onChangeText={(v) => {
                  const n = parseInt(v);
                  if (!isNaN(n) && n >= 1 && n <= 12) setIncreaseFromMonth(n);
                }}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                textColor={colors.text}
              />
              <PaperInput
                mode="outlined"
                label="Year"
                style={{ flex: 1, backgroundColor: colors.surface }}
                keyboardType="numeric"
                value={String(increaseFromYear)}
                onChangeText={(v) => {
                  const n = parseInt(v);
                  if (!isNaN(n) && n >= 2000) setIncreaseFromYear(n);
                }}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                textColor={colors.text}
              />
            </View>
            <View style={styles.payWarn}>
              <MaterialCommunityIcons
                name="information-outline"
                size={15}
                color={colors.warningText}
                style={{ marginTop: 1 }}
              />
              <Text style={styles.payWarnText}>
                Paid records will not be changed. Only pending/partial records
                from {MONTHS[increaseFromMonth - 1]} {increaseFromYear} onwards
                will be updated.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.assignBtn, applyingIncrease && { opacity: 0.6 }]}
              onPress={handleApplyRentIncrease}
              disabled={applyingIncrease}
            >
              {applyingIncrease ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.assignBtnText}>Confirm Rent Update</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
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
    paidBadge: {
      backgroundColor: c.successBg,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    paidBadgeText: { fontSize: 12, fontWeight: "700", color: c.success },
    partialBadge: {
      backgroundColor: c.warningBg,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    partialBadgeText: { fontSize: 12, fontWeight: "700", color: c.warning },
    content: { padding: 16, gap: 14, paddingBottom: 40 },
    addTenantBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primary,
      borderRadius: 10,
      padding: 14,
      gap: 8,
    },
    addTenantText: { color: "#fff", fontSize: 15, fontWeight: "600" },
    removeTenantLink: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 16,
      marginTop: 4,
    },
    removeTenantLinkText: { fontSize: 13, color: c.textMuted },
    card: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    cardTitle: {
      fontSize: 11,
      fontWeight: "700",
      color: c.textMuted,
      letterSpacing: 1,
      marginBottom: 14,
      textTransform: "uppercase",
    },
    tenantRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 14,
    },
    tenantName: { fontSize: 15, color: c.text, fontWeight: "700" },
    tenantEmail: { fontSize: 12, color: c.textSecondary, marginTop: 1 },
    tenantBadge: {
      fontSize: 11,
      fontWeight: "600",
      color: c.success,
      marginTop: 1,
    },
    noTenant: { color: c.textMuted, fontSize: 14, marginBottom: 14 },
    // ── Total payable header ──
    totalLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: c.textMuted,
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    totalAmount: {
      fontSize: 34,
      fontWeight: "800",
      color: c.text,
      marginBottom: 14,
    },
    // ── Payment status cards ──
    paidStatusCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: c.successBg,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: c.successBorder,
    },
    paidStatusLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: c.success,
    },
    paidStatusValue: { fontSize: 15, fontWeight: "700", color: c.success },
    dueStatusCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: c.dangerBg,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: c.dangerBorder,
    },
    dueStatusLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: c.danger,
    },
    dueStatusValue: { fontSize: 15, fontWeight: "700", color: c.danger },
    // ── Breakdown section ──
    breakdownSectionLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: c.textMuted,
      letterSpacing: 1,
      textTransform: "uppercase",
      marginTop: 8,
      marginBottom: 10,
    },
    breakdownItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: c.surfaceAlt,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: c.borderLight,
    },
    itemIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    itemLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: c.text },
    itemRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexShrink: 0,
    },
    itemInputBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.inputBg,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.inputBorder,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    itemRupee: { fontSize: 13, color: c.textSecondary, marginRight: 2 },
    itemInput: {
      fontSize: 15,
      fontWeight: "700",
      color: c.inputText,
      width: 80,
      textAlign: "right",
      paddingVertical: 6,
      // @ts-ignore - web only, silently ignored on native
      outline: "none",
    },
    // ── CF banner ──
    cfBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderTopWidth: 1,
      borderTopColor: c.borderLight,
      marginTop: 2,
    },
    cfBannerLabel: { flex: 1, fontSize: 13, color: c.textSecondary },
    cfBannerValue: { fontSize: 14, fontWeight: "700" },
    methodRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 14,
    },
    methodBtn: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: c.border,
      alignItems: "center",
      backgroundColor: c.surface,
    },
    methodBtnActive: {
      borderColor: c.primary,
      backgroundColor: c.primaryLight,
    },
    methodBtnText: { fontSize: 12, fontWeight: "600", color: c.textSecondary },
    methodBtnTextActive: { color: c.primary },
    fieldLabel: {
      fontSize: 13,
      fontWeight: "500",
      color: c.textSecondary,
      marginBottom: 6,
    },
    readonlyField: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    readonlyText: { color: c.textBody, fontSize: 15 },
    input: {
      backgroundColor: c.inputBg,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: c.inputText,
      borderWidth: 1,
      borderColor: c.inputBorder,
    },
    datePickerBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: c.inputBg,
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: c.inputBorder,
      marginBottom: 14,
    },
    datePickerText: { fontSize: 15, color: c.textBody, fontWeight: "500" },
    paidBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: c.success,
      borderRadius: 10,
      padding: 14,
    },
    paidBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
    paidInfo: { fontSize: 15, color: c.success, fontWeight: "500" },
    saveBtn: {
      backgroundColor: c.primary,
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
      borderBottomColor: c.border,
    },
    modalTitle: { fontSize: 20, fontWeight: "700", color: c.text },
    modalBody: { padding: 20, gap: 16 },
    modalHint: { fontSize: 14, color: c.textSecondary, lineHeight: 20 },
    searchRow: { flexDirection: "row", gap: 10 },
    searchBtn: {
      width: 48,
      height: 48,
      borderRadius: 10,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: c.dangerBgAlt,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: c.dangerBorder,
    },
    errorText: { color: c.danger, fontSize: 14, fontWeight: "500" },
    tenantCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: c.successBg,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: c.successBorder,
    },
    tenantCardAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    tenantCardName: { fontSize: 15, fontWeight: "600", color: c.text },
    tenantCardEmail: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
    assignBtn: {
      backgroundColor: c.primary,
      borderRadius: 10,
      padding: 16,
      alignItems: "center",
    },
    assignBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
    // ── Payment input inside dialog ──
    payInput: {
      backgroundColor: c.inputBg,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 18,
      fontWeight: "600",
      color: c.inputText,
      borderWidth: 1,
      borderColor: c.inputBorder,
      marginTop: 16,
      marginBottom: 4,
    },
    // ── Update payment button variant ──
    paidBtnUpdate: { backgroundColor: c.blueAlt },
    // ── Payment dialog extras ──
    payWarn: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      backgroundColor: c.warningBg,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: c.warningBorder,
      marginBottom: 12,
    },
    payWarnText: {
      flex: 1,
      fontSize: 13,
      color: c.warningText,
      lineHeight: 18,
    },
    payMeta: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    payMetaLabel: { fontSize: 13, color: c.textSecondary },
    payMetaValue: { fontSize: 14, fontWeight: "700", color: c.textBody },
    payPreview: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 8,
      marginBottom: 4,
    },
    payPreviewText: { fontSize: 13, fontWeight: "600" },
    // ── Deposit row ──
    depositPaperRow: { marginBottom: 10 },
    depositRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    depositLabel: { fontSize: 13, color: c.textSecondary, fontWeight: "500" },
    appliedBadge: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    appliedBadgeText: { fontSize: 12, color: c.textMuted, fontWeight: "600" },
    depositEditRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    depositValue: { fontSize: 14, fontWeight: "600", color: c.text },
    depositRupee: { fontSize: 14, color: c.textBody, lineHeight: 22 },
    depositInput: {
      fontSize: 14,
      fontWeight: "600",
      color: c.text,
      width: 70,
      textAlign: "right",
      paddingVertical: 2,
      paddingHorizontal: 0,
    },
    // ── Vacating date ──
    vacatingBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: c.warningBg,
      borderRadius: 8,
      padding: 10,
      borderWidth: 1,
      borderColor: c.warningBorder,
      marginBottom: 12,
    },
    vacatingBannerText: { flex: 1, fontSize: 13, color: c.warningText },
    vacatingCancelLink: { fontSize: 13, color: c.primary, fontWeight: "600" },
    setMoveoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 12,
    },
    setMoveoutText: { fontSize: 13, color: c.textSecondary },
    // ── Update rent link ──
    updateRentLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 12,
    },
    updateRentLinkText: { fontSize: 13, color: c.textSecondary },
    // ── Apply advance button ──
    applyAdvanceBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: c.warningAlt,
      borderRadius: 10,
      padding: 14,
      marginBottom: 12,
    },
    applyAdvanceBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
    // ── No record banner ──
    noRecordBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: c.inputBg,
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    noRecordText: {
      flex: 1,
      fontSize: 13,
      color: c.textSecondary,
      lineHeight: 19,
    },
  });
