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
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getProperties, createProperty, Property } from "@/services/api";
import { signOut } from "@/services/auth";
import { router } from "expo-router";
import PropertyCard from "@/components/property/PropertyCard";

export default function PropertiesScreen() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getProperties();
      setProperties(data ?? []);
    } catch (e: any) {
      if (e.message?.includes("unauthorized") || e.message?.includes("expired")) {
        await signOut();
        router.replace("/(auth)/login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleAddProperty = async () => {
    if (!newName.trim()) {
      toast.error("Property name is required.");
      return;
    }
    setSaving(true);
    try {
      const prop = await createProperty(newName.trim(), newAddress.trim());
      setProperties((prev) => [...prev, prop]);
      setModalVisible(false);
      setNewName("");
      setNewAddress("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create property.");
    } finally {
      setSaving(false);
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
        <View>
          <Text style={styles.headerTitle}>Rent Collection</Text>
          <Text style={styles.headerSub}>Your properties</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
          <MaterialCommunityIcons name="logout" size={22} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Properties list */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color="#4f46e5" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
          }
        >
          {properties.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="office-building-outline" size={60} color="#d1d5db" />
              <Text style={styles.emptyText}>No properties yet</Text>
              <Text style={styles.emptySub}>Tap the + button to add your first property</Text>
            </View>
          ) : (
            properties.map((p) => <PropertyCard key={p.id} property={p} />)
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Property Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Property</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.label}>Property Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sunset Apartments"
              placeholderTextColor="#9ca3af"
              value={newName}
              onChangeText={setNewName}
            />

            <Text style={[styles.label, { marginTop: 16 }]}>Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 123 Main St, City"
              placeholderTextColor="#9ca3af"
              value={newAddress}
              onChangeText={setNewAddress}
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleAddProperty}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#111827" },
  headerSub: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  signOutBtn: { padding: 8 },
  list: { padding: 16 },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#374151", marginTop: 16 },
  emptySub: { fontSize: 14, color: "#9ca3af", marginTop: 8, textAlign: "center" },
  fab: {
    position: "absolute",
    bottom: 28,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
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
