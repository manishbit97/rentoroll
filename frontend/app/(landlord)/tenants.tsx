import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getLandlordTenants, LandlordTenant } from "@/services/api";
import { useTheme } from "@/contexts/ThemeContext";
import { AppColors } from "@/theme/colors";
import InitialsAvatar from "@/components/ui/InitialsAvatar";

interface TenantGroup {
  property_id: string;
  property_name: string;
  tenants: LandlordTenant[];
}

function groupByProperty(tenants: LandlordTenant[]): TenantGroup[] {
  const map = new Map<string, TenantGroup>();
  for (const t of tenants) {
    if (!map.has(t.property_id)) {
      map.set(t.property_id, {
        property_id: t.property_id,
        property_name: t.property_name,
        tenants: [],
      });
    }
    map.get(t.property_id)!.tenants.push(t);
  }
  return Array.from(map.values());
}

export default function TenantsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [tenants, setTenants] = useState<LandlordTenant[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getLandlordTenants()
        .then((data) => setTenants(data ?? []))
        .finally(() => setLoading(false));
    }, []),
  );

  const groups = useMemo(() => groupByProperty(tenants), [tenants]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tenants</Text>
        {!loading && (
          <View style={styles.countChip}>
            <Text style={styles.countChipText}>{tenants.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} />
      ) : groups.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={64}
            color={colors.border}
          />
          <Text style={styles.emptyTitle}>No tenants yet</Text>
          <Text style={styles.emptyText}>
            Assign tenants to rooms from the property detail page
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {groups.map((g) => (
            <View key={g.property_id}>
              <View style={styles.propertyHeader}>
                <Text style={styles.propertyName}>
                  {g.property_name.toUpperCase()}
                </Text>
                <View style={styles.propertyCountChip}>
                  <Text style={styles.propertyCountText}>
                    {g.tenants.length}
                  </Text>
                </View>
              </View>

              {g.tenants.map((t) => (
                <TouchableOpacity
                  key={t.room_id}
                  style={styles.card}
                  activeOpacity={0.75}
                  onPress={() =>
                    router.push({
                      pathname: "/rent/history/[roomId]",
                      params: { roomId: t.room_id, roomName: t.room_name },
                    })
                  }
                >
                  <InitialsAvatar name={t.tenant_name} size={44} />
                  <View style={styles.cardBody}>
                    <Text style={styles.tenantName} numberOfLines={1}>
                      {t.tenant_name}
                    </Text>
                    <Text style={styles.tenantEmail} numberOfLines={1}>
                      {t.tenant_email}
                    </Text>
                    <View style={styles.roomRow}>
                      <MaterialCommunityIcons
                        name="door"
                        size={12}
                        color={colors.textMuted}
                      />
                      <Text style={styles.roomInfo}>
                        {t.room_name} · ₹{t.base_rent.toLocaleString("en-IN")}
                        /mo
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
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
      paddingVertical: 16,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      gap: 10,
    },
    headerTitle: { fontSize: 22, fontWeight: "700", color: c.text },
    countChip: {
      backgroundColor: c.primaryMuted,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    countChipText: { fontSize: 13, fontWeight: "700", color: c.primary },
    content: { padding: 16, paddingBottom: 40 },
    propertyHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 8,
      marginBottom: 10,
    },
    propertyName: {
      fontSize: 11,
      fontWeight: "700",
      color: c.textMuted,
      letterSpacing: 1,
    },
    propertyCountChip: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    propertyCountText: { fontSize: 11, fontWeight: "600", color: c.textMuted },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      gap: 12,
    },
    cardBody: { flex: 1 },
    tenantName: { fontSize: 15, fontWeight: "700", color: c.text },
    tenantEmail: { fontSize: 12, color: c.textSecondary, marginTop: 1 },
    roomRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 4,
    },
    roomInfo: { fontSize: 12, color: c.textMuted, fontWeight: "500" },
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: c.text,
      marginTop: 8,
    },
    emptyText: { fontSize: 14, color: c.textMuted, textAlign: "center" },
  });
