import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MonthlyRentResult } from "@/services/api";

interface Props {
  item: MonthlyRentResult;
  propertyId: string;
  month: number;
  year: number;
}

export default function RoomCard({ item, propertyId, month, year }: Props) {
  const { room, rent_record, tenant_name } = item;
  const isOccupied = !!tenant_name || room.is_occupied;
  const status = rent_record?.status;
  const isPaid = status === "PAID";
  const isPartial = status === "PARTIAL";

  const statusColor = isPaid
    ? "#10b981"
    : isPartial
    ? "#d97706"
    : status === "PENDING"
    ? "#ef4444"
    : "#9ca3af";
  const statusBg = isPaid
    ? "#d1fae5"
    : isPartial
    ? "#fef3c7"
    : status === "PENDING"
    ? "#fee2e2"
    : "#f3f4f6";
  const statusLabel = isPaid ? "PAID" : isPartial ? "PARTIAL" : status === "PENDING" ? "PENDING" : "—";

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() =>
        router.push({
          pathname: `/rent/${room.id}`,
          params: { propertyId, roomName: room.name, month: String(month), year: String(year) },
        })
      }
    >
      {/* Top row: icon + name/tenant + status badge + history */}
      <View style={styles.topRow}>
        <View style={[styles.iconBox, !isOccupied && styles.iconBoxVacant]}>
          <MaterialCommunityIcons
            name={isOccupied ? "home-account" : "home-outline"}
            size={22}
            color={isOccupied ? "#4f46e5" : "#9ca3af"}
          />
        </View>
        <View style={styles.nameBlock}>
          <Text style={styles.roomName}>{room.name}</Text>
          <Text style={styles.tenantName} numberOfLines={1}>
            {isOccupied ? tenant_name || "Tenant assigned" : "Vacant"}
          </Text>
        </View>
        <View style={styles.actions}>
          <View style={[styles.badge, { backgroundColor: statusBg }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() =>
              router.push({ pathname: `/rent/history/${room.id}`, params: { roomName: room.name } })
            }
          >
            <MaterialCommunityIcons name="history" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Breakdown */}
      {rent_record ? (
        <View style={styles.breakdown}>
          <View style={styles.bRow}>
            <Text style={styles.bLabel}>Rent</Text>
            <Text style={styles.bValue}>₹{rent_record.base_rent.toLocaleString("en-IN")}</Text>
          </View>

          {rent_record.electricity > 0 && (
            <View style={styles.bRow}>
              <Text style={styles.bLabel}>Elec</Text>
              <Text style={[styles.bValue, { color: "#2563eb" }]}>
                ₹{rent_record.electricity.toLocaleString("en-IN")}
              </Text>
            </View>
          )}

          {rent_record.carry_forward > 0 && (
            <View style={styles.bRow}>
              <Text style={styles.bLabel}>CF</Text>
              <Text style={[styles.bValue, { color: "#ef4444" }]}>
                +₹{rent_record.carry_forward.toLocaleString("en-IN")}
              </Text>
            </View>
          )}
          {rent_record.carry_forward < 0 && (
            <View style={styles.bRow}>
              <Text style={styles.bLabel}>CF</Text>
              <Text style={[styles.bValue, { color: "#10b981" }]}>
                −₹{Math.abs(rent_record.carry_forward).toLocaleString("en-IN")}
              </Text>
            </View>
          )}

          <View style={[styles.bRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{rent_record.total.toLocaleString("en-IN")}</Text>
          </View>

          {isPartial && (
            <>
              <View style={styles.bRow}>
                <Text style={styles.bLabel}>Paid</Text>
                <Text style={[styles.bValue, { color: "#10b981" }]}>
                  ₹{(rent_record.paid_amount ?? 0).toLocaleString("en-IN")}
                </Text>
              </View>
              <View style={styles.bRow}>
                <Text style={styles.bLabel}>Due</Text>
                <Text style={[styles.bValue, { color: "#f59e0b" }]}>
                  ₹{(rent_record.total - (rent_record.paid_amount ?? 0)).toLocaleString("en-IN")}
                </Text>
              </View>
            </>
          )}
        </View>
      ) : (
        <Text style={styles.noRecord}>No record for this month</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  iconBoxVacant: { backgroundColor: "#f3f4f6" },
  nameBlock: { flex: 1 },
  roomName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  tenantName: { fontSize: 12, color: "#6b7280", marginTop: 1 },
  actions: { alignItems: "flex-end", gap: 6 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  historyBtn: { padding: 2 },
  breakdown: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 8,
    gap: 4,
  },
  bRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bLabel: { fontSize: 12, color: "#6b7280" },
  bValue: { fontSize: 12, fontWeight: "600", color: "#374151" },
  totalRow: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  totalLabel: { fontSize: 13, fontWeight: "700", color: "#374151" },
  totalValue: { fontSize: 14, fontWeight: "700", color: "#4f46e5" },
  noRecord: {
    fontSize: 12,
    color: "#9ca3af",
    fontStyle: "italic",
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 8,
  },
});
