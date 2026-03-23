import { TabBarAntIcon, TabBarMaterialIcon } from "@/components/navigation/TabBarIcon";
import { Tabs } from "expo-router";

export default function LandlordLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#4f46e5",
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 0,
          borderTopColor: "#e5e7eb",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Properties",
          tabBarIcon: ({ color }) => (
            <TabBarAntIcon name="home" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <TabBarMaterialIcon name="chart-bar" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <TabBarAntIcon name="setting" color={color} size={22} />
          ),
        }}
      />
    </Tabs>
  );
}
