import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Property } from "@/services/api";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  property: Property;
  roomCount?: number;
}

export default function PropertyCard({ property, roomCount }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/property/${property.id}`)}
    >
      <View style={styles.iconBox}>
        <MaterialCommunityIcons name="office-building-outline" size={26} color="#4f46e5" />
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>{property.name}</Text>
        <Text style={styles.address} numberOfLines={1}>
          {property.address || "No address set"}
        </Text>
        {roomCount !== undefined && (
          <Text style={styles.rooms}>{roomCount} room{roomCount !== 1 ? "s" : ""}</Text>
        )}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color="#9ca3af" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  body: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: "#111827" },
  address: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  rooms: {
    fontSize: 12,
    color: "#4f46e5",
    fontWeight: "500",
    marginTop: 4,
  },
});
