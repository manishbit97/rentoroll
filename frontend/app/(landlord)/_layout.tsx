import { TabBarMaterialIcon } from "@/components/navigation/TabBarIcon";
import { useTheme } from "@/contexts/ThemeContext";
import { Tabs } from "expo-router";

export default function LandlordLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopWidth: 1,
          borderTopColor: colors.tabBarBorder,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <TabBarMaterialIcon name="home" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color }) => (
            <TabBarMaterialIcon name="chart-bar" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <TabBarMaterialIcon name="account-circle" color={color} size={22} />
          ),
        }}
      />
    </Tabs>
  );
}
