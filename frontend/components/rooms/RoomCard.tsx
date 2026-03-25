import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MonthlyRentResult } from "@/services/api";
import InitialsAvatar from "@/components/ui/InitialsAvatar";
import { useTheme } from "@/contexts/ThemeContext";
import { AppColors } from "@/theme/colors";

interface Props {
  item: MonthlyRentResult;
  propertyId: string;
  month: number;
  year: number;
}

export default function RoomCard({ item, propertyId, month, year }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { room, rent_record, tenant_name } = item;
  const isOccupied = !!tenant_name || room.is_occupied;
  const status = rent_record?.status;
  const isPaid = status === "PAID";
  const isPartial = status === "PARTIAL";

  const statusColor = isPaid
    ? colors.success
    : isPartial
      ? colors.warning
      : status === "PENDING"
        ? colors.danger
        : colors.textMuted;
  const statusBg = isPaid
    ? colors.successBg
    : isPartial
      ? colors.warningBg
      : status === "PENDING"
        ? colors.dangerBg
        : colors.surfaceAlt;
  const statusLabel = isPaid
    ? "PAID"
    : isPartial
      ? "PARTIAL"
      : status === "PENDING"
        ? "PENDING"
        : "—";

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() =>
        router.push({
          pathname: `/rent/${room.id}`,
          params: {
            propertyId,
            roomName: room.name,
            month: String(month),
            year: String(year),
          },
        })
      }
    >
      {/* Top row */}
      <View style={styles.topRow}>
        {isOccupied && tenant_name ? (
          <InitialsAvatar name={tenant_name} size={42} />
        ) : (
          <View style={styles.vacantIcon}>
            <MaterialCommunityIcons
              name="home-outline"
              size={20}
              color={colors.textMuted}
            />
          </View>
        )}

        <View style={styles.nameBlock}>
          <Text style={styles.roomName} numberOfLines={1}>
            {room.name}
          </Text>
          <Text style={styles.tenantName} numberOfLines={1}>
            {isOccupied ? tenant_name || "Tenant assigned" : "Vacant"}
          </Text>
          {item.vacating_date && (
            <View style={styles.vacatingChip}>
              <MaterialCommunityIcons
                name="calendar-remove"
                size={11}
                color={colors.warning}
              />
              <Text style={styles.vacatingChipText}>
                Moving out{" "}
                {new Date(item.vacating_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <View style={[styles.badge, { backgroundColor: statusBg }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() =>
              router.push({
                pathname: `/rent/history/${room.id}`,
                params: { roomName: room.name },
              })
            }
          >
            <MaterialCommunityIcons
              name="history"
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3-column breakdown */}
      {rent_record ? (
        <View style={styles.breakdown}>
          <View style={styles.colGroup}>
            <Text style={styles.colLabel}>RENT</Text>
            <Text style={styles.colValue}>
              ₹{rent_record.base_rent.toLocaleString("en-IN")}
            </Text>
          </View>
          <View style={styles.colDivider} />
          <View style={styles.colGroup}>
            <Text style={styles.colLabel}>UTILITIES</Text>
            <Text
              style={[
                styles.colValue,
                rent_record.electricity > 0 && { color: colors.blue },
              ]}
            >
              {rent_record.electricity > 0
                ? `₹${rent_record.electricity.toLocaleString("en-IN")}`
                : "—"}
            </Text>
          </View>
          <View style={styles.colDivider} />
          <View style={styles.colGroup}>
            <Text style={styles.colLabel}>TOTAL</Text>
            <Text style={[styles.colValue, styles.totalValue]}>
              ₹{rent_record.total.toLocaleString("en-IN")}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={styles.noRecord}>No record for this month</Text>
      )}

      {/* Carry-forward chip */}
      {rent_record && rent_record.carry_forward !== 0 && (
        <View style={styles.cfRow}>
          <MaterialCommunityIcons
            name={
              rent_record.carry_forward > 0
                ? "arrow-up-circle-outline"
                : "arrow-down-circle-outline"
            }
            size={13}
            color={
              rent_record.carry_forward > 0 ? colors.danger : colors.success
            }
          />
          <Text
            style={[
              styles.cfText,
              {
                color:
                  rent_record.carry_forward > 0
                    ? colors.danger
                    : colors.success,
              },
            ]}
          >
            {rent_record.carry_forward > 0
              ? `+₹${rent_record.carry_forward.toLocaleString("en-IN")} carried`
              : `−₹${Math.abs(rent_record.carry_forward).toLocaleString("en-IN")} credit`}
          </Text>
        </View>
      )}

      {/* Partial paid/due */}
      {isPartial && rent_record && (
        <View style={styles.partialRow}>
          <Text style={styles.partialPaid}>
            Paid ₹{(rent_record.paid_amount ?? 0).toLocaleString("en-IN")}
          </Text>
          <Text style={styles.partialDue}>
            Due ₹
            {(
              rent_record.total - (rent_record.paid_amount ?? 0)
            ).toLocaleString("en-IN")}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (c: AppColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      gap: 10,
    },
    vacantIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: c.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
    },
    nameBlock: { flex: 1 },
    roomName: { fontSize: 15, fontWeight: "700", color: c.text },
    tenantName: { fontSize: 12, color: c.textSecondary, marginTop: 1 },
    vacatingChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      marginTop: 3,
    },
    vacatingChipText: { fontSize: 11, color: c.warning, fontWeight: "500" },
    actions: { alignItems: "flex-end", gap: 6 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    badgeText: { fontSize: 11, fontWeight: "700" },
    historyBtn: { padding: 2 },
    breakdown: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: c.borderLight,
      paddingTop: 10,
    },
    colGroup: { flex: 1, alignItems: "center" },
    colLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: c.textMuted,
      letterSpacing: 0.5,
      marginBottom: 3,
    },
    colValue: { fontSize: 14, fontWeight: "700", color: c.textBody },
    totalValue: { color: c.primary },
    colDivider: {
      width: 1,
      backgroundColor: c.borderLight,
      marginHorizontal: 4,
    },
    cfRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 6,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: c.borderLight,
    },
    cfText: { fontSize: 11, fontWeight: "600" },
    partialRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 6,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: c.borderLight,
    },
    partialPaid: { fontSize: 12, color: c.success, fontWeight: "600" },
    partialDue: { fontSize: 12, color: c.warningAlt, fontWeight: "600" },
    noRecord: {
      fontSize: 12,
      color: c.textMuted,
      fontStyle: "italic",
      marginTop: 6,
      borderTopWidth: 1,
      borderTopColor: c.borderLight,
      paddingTop: 8,
    },
  });
