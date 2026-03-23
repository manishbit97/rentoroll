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
import { getProperties, getRooms, getMonthlyRent, Property, MonthlyRentResult } from "@/services/api";

interface Stats {
  totalProperties: number;
  totalRooms: number;
  occupiedRooms: number;
  collected: number;
  pending: number;
}

export default function StatsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const load = useCallback(async () => {
    try {
      const props = await getProperties();
      setProperties(props ?? []);

      let totalRooms = 0;
      let occupiedRooms = 0;
      let collected = 0;
      let pending = 0;

      for (const prop of props ?? []) {
        const rooms = await getRooms(prop.id);
        totalRooms += rooms.length;
        occupiedRooms += rooms.filter((r) => r.is_occupied).length;

        const monthly: MonthlyRentResult[] = await getMonthlyRent(prop.id, month, year);
        for (const r of monthly) {
          if (r.rent_record.status === "PAID") {
            collected += r.rent_record.total;
          } else {
            pending += r.rent_record.total;
          }
        }
      }

      setStats({
        totalProperties: props?.length ?? 0,
        totalRooms,
        occupiedRooms,
        collected,
        pending,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const monthName = new Date(year, month - 1).toLocaleString("default", { month: "long" });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rent Manager</Text>
        <Text style={styles.headerSub}>{monthName} {year}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color="#4f46e5" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
          }
        >
          {/* Stats grid */}
          {stats && (
            <View style={styles.statsGrid}>
              <StatCard
                icon="office-building-outline"
                label="Properties"
                value={stats.totalProperties}
                color="#6366f1"
              />
              <StatCard
                icon="door-open"
                label="Total Rooms"
                value={stats.totalRooms}
                color="#0ea5e9"
              />
              <StatCard
                icon="currency-inr"
                label="Collected"
                value={`₹${stats.collected.toLocaleString("en-IN")}`}
                color="#10b981"
              />
              <StatCard
                icon="clock-alert-outline"
                label="Pending"
                value={`₹${stats.pending.toLocaleString("en-IN")}`}
                color="#f59e0b"
              />
              <StatCard
                icon="account-group-outline"
                label="Occupied"
                value={stats.occupiedRooms}
                color="#8b5cf6"
              />
              <StatCard
                icon="home-remove-outline"
                label="Vacant"
                value={stats.totalRooms - stats.occupiedRooms}
                color="#ec4899"
              />
            </View>
          )}

          {/* Property list */}
          <Text style={styles.sectionTitle}>Properties</Text>
          {properties.map((p) => (
            <View key={p.id} style={styles.propRow}>
              <MaterialCommunityIcons name="office-building-outline" size={20} color="#4f46e5" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.propName}>{p.name}</Text>
                <Text style={styles.propAddr}>{p.address}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: "700", color: "#111827", marginTop: 8 },
  statLabel: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  propRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  propName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  propAddr: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
});
