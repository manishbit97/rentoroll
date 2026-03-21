import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { toast } from "sonner-native";
import { useFocusEffect, useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getMonthlyRent,
  getProperty,
  createRoom,
  MonthlyRentResult,
  Property,
} from "@/services/api";
import RoomCard from "@/components/rooms/RoomCard";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [results, setResults] = useState<MonthlyRentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "paid" | "pending">("all");
  const [search, setSearch] = useState("");

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [addModal, setAddModal] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [baseRent, setBaseRent] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [prop, monthly] = await Promise.all([
        getProperty(id),
        getMonthlyRent(id, month, year),
      ]);
      setProperty(prop);
      setResults(monthly ?? []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, month, year]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const shiftMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y += 1; }
    if (m < 1) { m = 12; y -= 1; }
    setMonth(m);
    setYear(y);
    setLoading(true);
  };

  const filtered = results.filter((r) => {
    const matchSearch =
      !search ||
      r.room.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.tenant_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "paid" && r.rent_record?.status === "PAID") ||
      (filter === "pending" && r.rent_record?.status === "PENDING");
    return matchSearch && matchFilter;
  });

  const handleAddRoom = async () => {
    if (!roomName.trim() || !baseRent) {
      toast.error("Room name and base rent are required.");
      return;
    }
    const rent = parseFloat(baseRent);
    if (isNaN(rent) || rent <= 0) {
      toast.error("Enter a valid rent amount.");
      return;
    }
    setSaving(true);
    try {
      await createRoom(id!, roomName.trim(), rent);
      setAddModal(false);
      setRoomName("");
      setBaseRent("");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{property?.name ?? "Loading..."}</Text>
          <Text style={styles.headerSub}>Flats Overview</Text>
        </View>
        <TouchableOpacity onPress={() => setAddModal(true)}>
          <MaterialCommunityIcons name="plus-circle-outline" size={26} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      {/* Month selector */}
      <View style={styles.monthBar}>
        <TouchableOpacity onPress={() => shiftMonth(-1)}>
          <MaterialCommunityIcons name="chevron-left" size={26} color="#4f46e5" />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {MONTHS[month - 1]} {year}
        </Text>
        <TouchableOpacity onPress={() => shiftMonth(1)}>
          <MaterialCommunityIcons name="chevron-right" size={26} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by flat or tenant..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter tabs */}
      <View style={styles.tabs}>
        {(["all", "paid", "pending"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, filter === t && styles.tabActive]}
            onPress={() => setFilter(t)}
          >
            <Text style={[styles.tabText, filter === t && styles.tabTextActive]}>
              {t === "all" ? "All Flats" : t === "paid" ? "Rent Paid" : "Rent Due"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Room list */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#4f46e5" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
          }
        >
          {filtered.length === 0 ? (
            <Text style={styles.empty}>No rooms found</Text>
          ) : (
            filtered.map((item) => (
              <RoomCard key={item.room.id} item={item} propertyId={id!} month={month} year={year} />
            ))
          )}
        </ScrollView>
      )}

      {/* Add Room Modal */}
      <Modal visible={addModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Room</Text>
            <TouchableOpacity onPress={() => setAddModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.label}>Room Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Flat 101"
              placeholderTextColor="#9ca3af"
              value={roomName}
              onChangeText={setRoomName}
            />
            <Text style={[styles.label, { marginTop: 16 }]}>Monthly Base Rent (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 8000"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={baseRent}
              onChangeText={setBaseRent}
            />
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleAddRoom}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Add Room</Text>}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
  monthBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  monthLabel: { fontSize: 16, fontWeight: "600", color: "#111827" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    margin: 14,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#111827" },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 14,
    marginBottom: 8,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  tabActive: { backgroundColor: "#4f46e5" },
  tabText: { fontSize: 13, fontWeight: "500", color: "#6b7280" },
  tabTextActive: { color: "#fff" },
  list: { paddingHorizontal: 14, paddingBottom: 24 },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 40, fontSize: 15 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
  modalBody: { padding: 20 },
  label: { fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 6 },
  input: {
    height: 50,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  saveBtn: {
    height: 50,
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
