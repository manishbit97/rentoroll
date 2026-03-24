import Logo from "@/assets/images/logo.svg";
import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getProperties, getRooms, getMonthlyRent, Property, MonthlyRentResult } from "@/services/api";
import { useTheme } from "@/contexts/ThemeContext";
import { AppColors } from "@/theme/colors";

interface Stats {
  totalProperties: number;
  totalRooms: number;
  occupiedRooms: number;
  paidCount: number;
  collected: number;
  pending: number;
}

export default function StatsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
      let paidCount = 0;

      for (const prop of props ?? []) {
        const rooms = await getRooms(prop.id);
        totalRooms += rooms.length;
        occupiedRooms += rooms.filter((r) => r.is_occupied).length;

        const monthly: MonthlyRentResult[] = await getMonthlyRent(prop.id, month, year);
        for (const r of monthly) {
          if (r.rent_record?.status === "PAID") {
            collected += r.rent_record.total;
            paidCount++;
          } else if (r.rent_record) {
            pending += r.rent_record.total - (r.rent_record.paid_amount ?? 0);
          }
        }
      }

      setStats({
        totalProperties: props?.length ?? 0,
        totalRooms,
        occupiedRooms,
        paidCount,
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
        <View style={styles.logoRow}>
          <View style={[styles.logoWrap, { backgroundColor: colors.primary }]}>
            <Logo width={18} height={18} />
          </View>
          <Text style={styles.logoText}>RentoRoll</Text>
        </View>
        <Text style={styles.headerSub}>{monthName} {year}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
          }
        >
          {/* Monthly Overview gradient card */}
          {stats && (
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.overviewCard}
            >
              <Text style={styles.overviewLabel}>MONTHLY OVERVIEW</Text>
              <Text style={styles.overviewAmount}>
                ₹{stats.collected.toLocaleString("en-IN")}
              </Text>
              <Text style={styles.overviewSub}>
                {stats.paidCount} of {stats.totalRooms} units paid · ₹{stats.pending.toLocaleString("en-IN")} pending
              </Text>
            </LinearGradient>
          )}

          {/* Stats grid */}
          {stats && (
            <View style={styles.statsGrid}>
              <StatCard icon="office-building-outline" label="Properties" value={stats.totalProperties} color={colors.blueAlt} />
              <StatCard icon="door-open" label="Total Rooms" value={stats.totalRooms} color={colors.blue} />
              <StatCard icon="currency-inr" label="Collected" value={`₹${stats.collected.toLocaleString("en-IN")}`} color={colors.success} />
              <StatCard icon="clock-alert-outline" label="Pending" value={`₹${stats.pending.toLocaleString("en-IN")}`} color={colors.warning} />
              <StatCard icon="account-group-outline" label="Occupied" value={stats.occupiedRooms} color={colors.primary} />
              <StatCard icon="home-remove-outline" label="Vacant" value={stats.totalRooms - stats.occupiedRooms} color={colors.danger} />
            </View>
          )}

          {/* Property list */}
          <Text style={styles.sectionTitle}>PROPERTIES</Text>
          {properties.map((p) => (
            <View key={p.id} style={styles.propRow}>
              <View style={styles.propIcon}>
                <MaterialCommunityIcons name="office-building-outline" size={18} color={colors.primary} />
              </View>
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const createStyles = (c: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: 20, fontWeight: "800", color: c.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
  content: { padding: 16, paddingBottom: 32 },
  overviewCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1,
    marginBottom: 6,
  },
  overviewAmount: { fontSize: 32, fontWeight: "800", color: "#fff" },
  overviewSub: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 4 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: "47%",
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: "700", color: c.text, marginTop: 8 },
  statLabel: { fontSize: 12, color: c.textSecondary, marginTop: 4 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: c.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  propRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: c.border,
  },
  propIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: c.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  propName: { fontSize: 15, fontWeight: "600", color: c.text },
  propAddr: { fontSize: 12, color: c.textMuted, marginTop: 2 },
});
