import RoomCard from "@/components/rooms/RoomCard";
import { useTheme } from "@/contexts/ThemeContext";
import {
  createRoom,
  getMonthlyRent,
  getProperty,
  MonthlyRentResult,
  Property,
} from "@/services/api";
import { AppColors } from "@/theme/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type FilterTab = "all" | "paid" | "pending" | "overdue";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "pending", label: "Pending" },
  { key: "overdue", label: "Overdue" },
];

export default function PropertyDetailScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { id } = useLocalSearchParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [results, setResults] = useState<MonthlyRentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [addModal, setAddModal] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [baseRent, setBaseRent] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Aurora stats bar animation ──────────────────────────────────────────────
  const sa1 = useRef(new Animated.Value(0.3)).current;
  const sa2 = useRef(new Animated.Value(0.8)).current;
  const sa3 = useRef(new Animated.Value(0.2)).current;
  const sa4 = useRef(new Animated.Value(0.6)).current;
  const sa5 = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const wave = (val: Animated.Value, lo: number, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 1,
            duration: dur,
            useNativeDriver: false,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(val, {
            toValue: lo,
            duration: dur,
            useNativeDriver: false,
            easing: Easing.inOut(Easing.ease),
          }),
        ]),
      );
    wave(sa1, 0.2, 6000).start();
    wave(sa2, 0.25, 8500).start();
    wave(sa3, 0.2, 5000).start();
    wave(sa4, 0.2, 9500).start();
    wave(sa5, 0.25, 7200).start();
  }, [sa1, sa2, sa3, sa4, sa5]);

  const sTeal = isDark ? "rgba(0,210,230,0.22)" : "rgba(0,195,215,0.14)";
  const sViolet = isDark ? "rgba(130,90,255,0.18)" : "rgba(120,85,255,0.10)";
  const sMint = isDark ? "rgba(60,215,170,0.20)" : "rgba(70,210,175,0.12)";
  const sRose = isDark ? "rgba(255,179,227,0.18)" : "rgba(255,179,227,0.12)";
  const sPink = isDark ? "rgba(255,179,227,0.28)" : "rgba(255,179,227,0.22)";
  const sBg = isDark ? "#081525" : "#e8f5ff";
  const sBorder = isDark
    ? ([
        "rgba(100,69,255,0.4)",
        "rgba(255,179,227,0.35)",
        "rgba(122,210,255,0.4)",
      ] as const)
    : ([
        "rgba(87,53,255,0.35)",
        "rgba(255,179,227,0.4)",
        "rgba(96,170,255,0.35)",
      ] as const);
  // ───────────────────────────────────────────────────────────────────────────

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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const shiftMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    if (m < 1) {
      m = 12;
      y -= 1;
    }
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
      (filter === "pending" && r.rent_record?.status === "PENDING") ||
      (filter === "overdue" && r.rent_record?.status === "PARTIAL");
    return matchSearch && matchFilter;
  });

  // Stats
  const totalUnits = results.length;
  const paidCount = results.filter(
    (r) => r.rent_record?.status === "PAID",
  ).length;
  const totalCollected = results.reduce(
    (sum, r) =>
      sum +
      (r.rent_record?.status === "PAID"
        ? r.rent_record.total
        : (r.rent_record?.paid_amount ?? 0)),
    0,
  );

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
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 12 }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {property?.name ?? "Loading..."}
          </Text>
          <Text style={styles.headerSub}>
            {property?.address || "Property Overview"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setAddModal(true)}>
          <MaterialCommunityIcons
            name="plus-circle-outline"
            size={26}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Month selector */}
      <View style={styles.monthChip}>
        <TouchableOpacity
          onPress={() => shiftMonth(-1)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <View style={styles.monthChipCenter}>
          <MaterialCommunityIcons
            name="calendar-month"
            size={18}
            color={colors.primary}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.monthLabel}>
            {MONTHS[month - 1]} {year}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => shiftMonth(1)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Stats bar — aurora */}
      {!loading && (
        <LinearGradient
          colors={sBorder}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsBorderWrap}
        >
          <View style={[styles.statsInner, { backgroundColor: sBg }]}>
            <Animated.View
              style={[StyleSheet.absoluteFillObject, { opacity: sa1 }]}
            >
              <LinearGradient
                colors={["transparent", sTeal, "transparent"]}
                start={{ x: 0, y: 0.35 }}
                end={{ x: 1, y: 0.65 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
            <Animated.View
              style={[StyleSheet.absoluteFillObject, { opacity: sa2 }]}
            >
              <LinearGradient
                colors={[sViolet, "transparent", sViolet]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
            <Animated.View
              style={[StyleSheet.absoluteFillObject, { opacity: sa3 }]}
            >
              <LinearGradient
                colors={["transparent", sMint, "transparent"]}
                start={{ x: 1, y: 0.2 }}
                end={{ x: 0, y: 0.8 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
            <Animated.View
              style={[StyleSheet.absoluteFillObject, { opacity: sa4 }]}
            >
              <LinearGradient
                colors={[sRose, "transparent"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
            <Animated.View
              style={[StyleSheet.absoluteFillObject, { opacity: sa5 }]}
            >
              <LinearGradient
                colors={["transparent", sPink, "transparent"]}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalUnits}</Text>
                <Text style={styles.statLabel}>Units</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {paidCount}
                </Text>
                <Text style={styles.statLabel}>Paid</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  ₹{totalCollected.toLocaleString("en-IN")}
                </Text>
                <Text style={styles.statLabel}>Collected</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      )}

      {/* Search */}
      <View style={styles.searchBar}>
        <MaterialCommunityIcons
          name="magnify"
          size={18}
          color={colors.inputPlaceholder}
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by flat or tenant..."
          placeholderTextColor={colors.inputPlaceholder}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabs}
      >
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, filter === t.key && styles.tabActive]}
            onPress={() => setFilter(t.key)}
          >
            <Text
              style={[styles.tabText, filter === t.key && styles.tabTextActive]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Room list */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
        >
          {filtered.length === 0 ? (
            <Text style={styles.empty}>No rooms found</Text>
          ) : (
            filtered.map((item) => (
              <RoomCard
                key={item.room.id}
                item={item}
                propertyId={id!}
                month={month}
                year={year}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Add Room Modal */}
      <Modal
        visible={addModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Room</Text>
            <TouchableOpacity onPress={() => setAddModal(false)}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.label}>Room Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Flat 101"
              placeholderTextColor={colors.inputPlaceholder}
              value={roomName}
              onChangeText={setRoomName}
            />
            <Text style={[styles.label, { marginTop: 16 }]}>
              Monthly Base Rent (₹) *
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 8000"
              placeholderTextColor={colors.inputPlaceholder}
              keyboardType="numeric"
              value={baseRent}
              onChangeText={setBaseRent}
            />
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleAddRoom}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Add Room</Text>
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
    monthChip: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: c.surface,
      borderRadius: 24,
      marginHorizontal: 16,
      marginVertical: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: c.border,
    },
    monthChipCenter: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
    },
    monthLabel: { fontSize: 15, fontWeight: "700", color: c.text },
    statsBorderWrap: {
      padding: 1.5,
      borderRadius: 18,
      marginHorizontal: 14,
      marginTop: 8,
      marginBottom: 8,
      shadowColor: "rgba(100,69,255,0.6)",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 1,
      shadowRadius: 18,
      elevation: 6,
    },
    statsInner: {
      borderRadius: 16.5,
      overflow: "hidden",
    },
    statsRow: {
      flexDirection: "row",
      paddingVertical: 14,
    },
    statItem: { flex: 1, alignItems: "center" },
    statValue: { fontSize: 18, fontWeight: "700", color: c.text },
    statLabel: {
      fontSize: 11,
      color: c.textSecondary,
      marginTop: 2,
      fontWeight: "600",
    },
    statDivider: { width: 1, backgroundColor: "rgba(150,130,255,0.2)" },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surface,
      marginHorizontal: 14,
      marginTop: 12,
      marginBottom: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    searchInput: { flex: 1, fontSize: 14, color: c.inputText },
    tabsScroll: { maxHeight: 52 },
    tabs: {
      flexDirection: "row",
      paddingHorizontal: 14,
      paddingVertical: 8,
      gap: 8,
    },
    tab: {
      paddingHorizontal: 18,
      paddingBottom: 18,
      paddingTop: 7,
      borderRadius: 20,
      backgroundColor: c.primaryMuted,
    },
    tabActive: { backgroundColor: c.primary },
    tabText: { fontSize: 13, fontWeight: "600", color: c.textSecondary },
    tabTextActive: { color: "#fff" },
    list: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 24 },
    empty: {
      textAlign: "center",
      color: c.textMuted,
      marginTop: 40,
      fontSize: 15,
    },
    modalSafe: { flex: 1, backgroundColor: c.surface },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    modalTitle: { fontSize: 20, fontWeight: "700", color: c.text },
    modalBody: { padding: 20 },
    label: {
      fontSize: 14,
      fontWeight: "500",
      color: c.textBody,
      marginBottom: 6,
    },
    input: {
      height: 50,
      backgroundColor: c.inputBg,
      borderRadius: 10,
      paddingHorizontal: 16,
      fontSize: 16,
      color: c.inputText,
      borderWidth: 1,
      borderColor: c.inputBorder,
    },
    saveBtn: {
      height: 50,
      backgroundColor: c.primary,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 28,
    },
    saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  });
