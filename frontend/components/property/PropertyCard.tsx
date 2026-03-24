import React, { useMemo } from "react";
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
import InitialsAvatar from "@/components/ui/InitialsAvatar";
import { useTheme } from "@/contexts/ThemeContext";
import { AppColors } from "@/theme/colors";

interface Props {
  property: Property;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
}

export default function PropertyCard({ property, onEdit, onDelete }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
      {/* Top row */}
      <View style={styles.topRow}>
        <InitialsAvatar name={property.name} size={44} />
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {property.name}
          </Text>
          <View style={styles.addressRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={12} color={colors.textMuted} />
            <Text style={styles.address} numberOfLines={1}>
              {property.address || "No address set"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleOptions}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialCommunityIcons name="dots-vertical" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Footer arrow */}
      <View style={styles.footer}>
        <Text style={styles.footerLink}>View rooms</Text>
        <MaterialCommunityIcons name="chevron-right" size={16} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (c: AppColors) => StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  body: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700", color: c.text, marginBottom: 3 },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  address: { fontSize: 12, color: c.textMuted, flex: 1 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: c.borderLight,
    paddingTop: 10,
  },
  footerLink: { flex: 1, fontSize: 13, fontWeight: "600", color: c.primary },
});
