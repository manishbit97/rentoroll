import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
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
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { toast } from "sonner-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  Property,
} from "@/services/api";
import { signOut } from "@/services/auth";
import { router } from "expo-router";
import PropertyCard from "@/components/property/PropertyCard";
import { useTheme } from "@/contexts/ThemeContext";
import { AppColors } from "@/theme/colors";
import Logo from "@/assets/images/logo.svg";

export default function PropertiesScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add modal
  const [addVisible, setAddVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit modal
  const [editVisible, setEditVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Property | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getProperties();
      setProperties(data ?? []);
    } catch (e: any) {
      if (
        e.message?.includes("unauthorized") ||
        e.message?.includes("expired")
      ) {
        await signOut();
        router.replace("/(auth)/login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // ── Add ──────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newName.trim()) {
      toast.error("Property name is required.");
      return;
    }
    setSaving(true);
    try {
      const prop = await createProperty(newName.trim(), newAddress.trim());
      setProperties((prev) => [...prev, prop]);
      setAddVisible(false);
      setNewName("");
      setNewAddress("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create property.");
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const openEdit = (property: Property) => {
    setEditTarget(property);
    setEditName(property.name);
    setEditAddress(property.address ?? "");
    setEditVisible(true);
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    if (!editName.trim()) {
      toast.error("Property name is required.");
      return;
    }
    setUpdating(true);
    try {
      await updateProperty(editTarget.id, editName.trim(), editAddress.trim());
      setProperties((prev) =>
        prev.map((p) =>
          p.id === editTarget.id
            ? { ...p, name: editName.trim(), address: editAddress.trim() }
            : p,
        ),
      );
      setEditVisible(false);
      toast.success("Property updated!");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update property.");
    } finally {
      setUpdating(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (property: Property) => {
    try {
      await deleteProperty(property.id);
      setProperties((prev) => prev.filter((p) => p.id !== property.id));
      toast.success("Property deleted.");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to delete property.");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={[styles.logoWrap, { backgroundColor: colors.primary }]}>
            <Logo width={18} height={18} />
          </View>
          <Text style={styles.logoText}>RentoRoll</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn}>
            <MaterialCommunityIcons
              name={isDark ? "weather-sunny" : "weather-night"}
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignOut} style={styles.iconBtn}>
            <MaterialCommunityIcons
              name="logout"
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Properties list */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} />
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
          {/* Portfolio summary card */}
          {properties.length > 0 && (
            <PortfolioCard count={properties.length} isDark={isDark} />
          )}

          {/* Section header */}
          <Text style={styles.sectionHeader}>PROPERTIES</Text>

          {properties.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons
                name="office-building-outline"
                size={60}
                color={colors.border}
              />
              <Text style={styles.emptyText}>No properties yet</Text>
              <Text style={styles.emptySub}>
                Tap the + button to add your first property
              </Text>
            </View>
          ) : (
            properties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setAddVisible(true)}>
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal
        visible={addVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalSafe]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Property</Text>
            <TouchableOpacity
              onPress={() => {
                setAddVisible(false);
                setNewName("");
                setNewAddress("");
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
            <Text style={styles.label}>Property Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sunset Apartments"
              placeholderTextColor={colors.inputPlaceholder}
              value={newName}
              onChangeText={setNewName}
            />
            <Text style={[styles.label, { marginTop: 16 }]}>Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 123 Main St, City"
              placeholderTextColor={colors.inputPlaceholder}
              value={newAddress}
              onChangeText={setNewAddress}
            />
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleAdd}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Add Property</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={editVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalSafe]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Property</Text>
            <TouchableOpacity onPress={() => setEditVisible(false)}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.label}>Property Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sunset Apartments"
              placeholderTextColor={colors.inputPlaceholder}
              value={editName}
              onChangeText={setEditName}
            />
            <Text style={[styles.label, { marginTop: 16 }]}>Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 123 Main St, City"
              placeholderTextColor={colors.inputPlaceholder}
              value={editAddress}
              onChangeText={setEditAddress}
            />
            <TouchableOpacity
              style={[styles.saveBtn, updating && { opacity: 0.6 }]}
              onPress={handleUpdate}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
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
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 16,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    logoWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    logoText: {
      fontSize: 20,
      fontWeight: "800",
      color: c.text,
      letterSpacing: -0.5,
    },
    iconBtn: { padding: 8 },
    list: { padding: 16 },
    sectionHeader: {
      fontSize: 11,
      fontWeight: "700",
      color: c.textMuted,
      letterSpacing: 1,
      marginBottom: 10,
    },
    empty: { alignItems: "center", paddingTop: 80 },
    emptyText: {
      fontSize: 18,
      fontWeight: "600",
      color: c.textBody,
      marginTop: 16,
    },
    emptySub: {
      fontSize: 14,
      color: c.textMuted,
      marginTop: 8,
      textAlign: "center",
    },
    fab: {
      position: "absolute",
      bottom: 28,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 6,
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

// ── Aurora Portfolio Card ─────────────────────────────────────────────────────

function PortfolioCard({ count, isDark }: { count: number; isDark: boolean }) {
  const a1 = useRef(new Animated.Value(0.3)).current;
  const a2 = useRef(new Animated.Value(0.8)).current;
  const a3 = useRef(new Animated.Value(0.2)).current;
  const a4 = useRef(new Animated.Value(0.6)).current;
  const a5 = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    // lo is the minimum opacity — never reaching 0 prevents flicker at loop boundaries
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
    wave(a1, 0.2, 6000).start();
    wave(a2, 0.25, 8500).start();
    wave(a3, 0.2, 5000).start();
    wave(a4, 0.2, 9500).start();
    wave(a5, 0.25, 7200).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a1, a2, a3, a4, a5]);

  const teal = isDark ? "rgba(0,210,230,0.22)" : "rgba(0,195,215,0.14)";
  const violet = isDark ? "rgba(130,90,255,0.18)" : "rgba(120,85,255,0.10)";
  const mint = isDark ? "rgba(60,215,170,0.20)" : "rgba(70,210,175,0.12)";
  const rose = isDark ? "rgba(255,179,227,0.18)" : "rgba(255,179,227,0.12)";
  const pink = isDark ? "rgba(255,179,227,0.28)" : "rgba(255,179,227,0.22)";
  const bg = isDark ? "#081525" : "#e8f5ff";
  const labelC = isDark ? "rgba(150,200,255,0.75)" : "rgba(30,80,160,0.55)";
  const countC = isDark ? "#daeeff" : "#0d2b5e";
  const subC = isDark ? "rgba(150,200,255,0.6)" : "rgba(30,80,160,0.45)";

  const borderColors = isDark
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

  return (
    <LinearGradient
      colors={borderColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={pcStyles.borderWrap}
    >
      <View style={[pcStyles.inner, { backgroundColor: bg }]}>
        {/* Teal sweep left→right */}
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: a1 }]}>
          <LinearGradient
            colors={["transparent", teal, "transparent"]}
            start={{ x: 0, y: 0.35 }}
            end={{ x: 1, y: 0.65 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
        {/* Violet diagonal */}
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: a2 }]}>
          <LinearGradient
            colors={[violet, "transparent", violet]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
        {/* Mint sweep right→left */}
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: a3 }]}>
          <LinearGradient
            colors={["transparent", mint, "transparent"]}
            start={{ x: 1, y: 0.2 }}
            end={{ x: 0, y: 0.8 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
        {/* Rose blush top */}
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: a4 }]}>
          <LinearGradient
            colors={[rose, "transparent"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
        {/* Pink (#ffb3e3) diagonal sweep bottom-left→top-right */}
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: a5 }]}>
          <LinearGradient
            colors={["transparent", pink, "transparent"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
        {/* Content */}
        <View style={pcStyles.content}>
          <Text style={[pcStyles.label, { color: labelC }]}>MY PORTFOLIO</Text>
          <Text style={[pcStyles.count, { color: countC }]}>{count}</Text>
          <Text style={[pcStyles.sub, { color: subC }]}>
            {count === 1 ? "Property" : "Properties"}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const pcStyles = StyleSheet.create({
  borderWrap: {
    padding: 1.5,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "rgba(100,69,255,0.6)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 6,
  },
  inner: {
    borderRadius: 18.5,
    overflow: "hidden",
    minHeight: 110,
  },
  content: {
    padding: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  count: {
    fontSize: 42,
    fontWeight: "800",
    lineHeight: 50,
  },
  sub: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 2,
  },
});
