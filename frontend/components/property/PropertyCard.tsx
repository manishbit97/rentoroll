import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActionSheetIOS,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Property } from "@/services/api";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  property: Property;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
}

export default function PropertyCard({ property, onEdit, onDelete }: Props) {
  const handleOptions = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Edit Name / Address", "Delete Property"],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
          title: property.name,
        },
        (index) => {
          if (index === 1) onEdit(property);
          if (index === 2) {
            Alert.alert(
              "Delete Property",
              `Delete "${property.name}"? This cannot be undone.`,
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => onDelete(property) },
              ]
            );
          }
        }
      );
    } else {
      Alert.alert(property.name, "What do you want to do?", [
        { text: "Edit", onPress: () => onEdit(property) },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            Alert.alert(
              "Delete Property",
              `Delete "${property.name}"? This cannot be undone.`,
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => onDelete(property) },
              ]
            ),
        },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

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
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">{property.name}</Text>
        <Text style={styles.address} numberOfLines={1}>
          {property.address || "No address set"}
        </Text>
      </View>
      <TouchableOpacity
        onPress={handleOptions}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <MaterialCommunityIcons name="dots-vertical" size={22} color="#9ca3af" />
      </TouchableOpacity>
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
});
